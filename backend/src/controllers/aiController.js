const { GoogleGenAI } = require('@google/genai');
const { query, withTransaction } = require('../config/database');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const xlsx = require('xlsx');

const apiKey = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : 'dummy-key';
const ai = new GoogleGenAI({ apiKey });

const PREFERRED_MODELS = Array.from(
  new Set(
    [
      process.env.GEMINI_MODEL ? process.env.GEMINI_MODEL.trim() : null,
      'gemini-3.6-flash',
      'gemini-3.8-flash',
    ].filter(Boolean),
  ),
);

const FAST_CHAT_CONFIG = {
  thinkingConfig: { thinkingLevel: 'LOW' },
};

/**
 * Try preferred Gemini models in order if a model returns 404/503/unavailable error.
 */
async function withModelFallback(fn) {
  let lastErr = null;
  for (const model of PREFERRED_MODELS) {
    try {
      return await fn(model);
    } catch (err) {
      lastErr = err;
      const msg = String(err?.message || '').toLowerCase();
      const isRetryableModelIssue =
        msg.includes('404') ||
        msg.includes('503') ||
        msg.includes('not found') ||
        msg.includes('not supported') ||
        msg.includes('high demand') ||
        msg.includes('unavailable');
      if (!isRetryableModelIssue) {
        throw err;
      }
      console.warn(`⚠️ Model "${model}" unavailable (${err?.message?.slice(0, 80)}), trying next candidate...`);
    }
  }
  throw lastErr;
}

/**
 * Call Gemini with low-latency thinkingLevel config, safely falling back if an alternate model rejects thinkingConfig.
 */
async function withFastChatFallback(fn) {
  try {
    return await withModelFallback((model) => fn(model, FAST_CHAT_CONFIG));
  } catch (err) {
    const msg = String(err?.message || '').toLowerCase();
    if (msg.includes('thinking') || msg.includes('invalid_argument') || msg.includes('400')) {
      return await withModelFallback((model) => fn(model, undefined));
    }
    throw err;
  }
}

/**
 * Build a concise session title from the user's first message.
 */
function deriveSessionTitle(message, isVi = true) {
  const cleaned = String(message || '').replace(/\s+/g, ' ').trim();
  if (!cleaned) return isVi ? 'Cuộc trò chuyện mới' : 'New Conversation';
  if (cleaned.length <= 52) return cleaned;
  return `${cleaned.slice(0, 49)}...`;
}

/**
 * Ensure any legacy chatmessages without session_id belong to a default session.
 */
async function migrateLegacyMessagesIfNeeded(userId) {
  const orphanCheck = await query(
    'SELECT COUNT(*)::int AS cnt FROM chatmessages WHERE user_id = $1 AND session_id IS NULL',
    [userId],
  );
  if ((orphanCheck.rows[0]?.cnt || 0) === 0) return;

  const sessionRes = await query(
    'INSERT INTO chat_sessions (user_id, title) VALUES ($1, $2) RETURNING id',
    [userId, 'Lịch sử trò chuyện cũ'],
  );
  const legacySessionId = sessionRes.rows[0].id;

  await query(
    'UPDATE chatmessages SET session_id = $1 WHERE user_id = $2 AND session_id IS NULL',
    [legacySessionId, userId],
  );
}

/**
 * Strip <<SUGGESTIONS>>...<</SUGGESTIONS>> block and return { cleanReply, suggestions }.
 */
function extractReplyAndSuggestions(rawText, userMessage = '') {
  const text = String(rawText || '').trim();
  const tagStart = text.indexOf('<<SUGGESTIONS>>');

  let cleanReply = text;
  let suggestions = [];

  if (tagStart !== -1) {
    cleanReply = text.slice(0, tagStart).trim();
    const afterStart = text.slice(tagStart + '<<SUGGESTIONS>>'.length);
    const tagEnd = afterStart.indexOf('<</SUGGESTIONS>>');
    const jsonChunk = (tagEnd !== -1 ? afterStart.slice(0, tagEnd) : afterStart)
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    try {
      const startBracket = jsonChunk.indexOf('[');
      const endBracket = jsonChunk.lastIndexOf(']');
      if (startBracket !== -1 && endBracket !== -1) {
        const parsed = JSON.parse(jsonChunk.slice(startBracket, endBracket + 1));
        if (Array.isArray(parsed)) {
          suggestions = parsed
            .map((item) => String(item || '').trim())
            .filter(Boolean)
            .slice(0, 3);
        }
      }
    } catch (_) {
      // Fall back cleanly below
    }
  }

  if (suggestions.length < 2) {
    const looksEnglish =
      /[a-zA-Z]/.test(userMessage) &&
      !/[àáảãạăắằẳẵặâấầẩẫậđèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵ]/i.test(
        `${userMessage} ${cleanReply}`,
      );

    suggestions = looksEnglish
      ? [
          'Turn this into actionable TaskFlow tasks',
          'Go deeper into step 1 with concrete examples',
          'Summarize the key takeaways & potential risks',
        ]
      : [
          'Chuyển kế hoạch này thành danh sách Task để thực hiện',
          'Phân tích sâu hơn bước đầu tiên và cách làm cụ thể',
          'Tóm tắt những rủi ro cần tránh & mẹo tối ưu thời gian',
        ];
  }

  return { cleanReply, suggestions };
}

/**
 * Build prompt + fetch workspace & conversation context in parallel.
 */
async function buildCopilotContext(userId, sessionId, message) {
  const [categoriesResult, recentTasksResult, historyResult] = await Promise.all([
    query('SELECT id, name FROM categories WHERE user_id = $1', [userId]),
    query(
      `
        SELECT id, title, description, status, priority, due_date, updated_at
        FROM tasks
        WHERE user_id = $1
        ORDER BY CASE WHEN status != 'COMPLETED' THEN 0 ELSE 1 END ASC, updated_at DESC
        LIMIT 35
      `,
      [userId],
    ),
    sessionId
      ? query(
          `
            SELECT role, content
            FROM chatmessages
            WHERE user_id = $1 AND session_id = $2
            ORDER BY created_at DESC
            LIMIT 12
          `,
          [userId, sessionId],
        )
      : Promise.resolve({ rows: [] }),
  ]);

  const categories = categoriesResult.rows;
  let categoriesContext = "User's Available Categories:\n";
  if (categories.length > 0) {
    categories.forEach((cat) => {
      categoriesContext += `- ID: ${cat.id}, Name: "${cat.name}"\n`;
    });
  } else {
    categoriesContext += 'None.\n';
  }

  const recentTasks = recentTasksResult.rows;
  let tasksContext = "User's TaskFlow Tasks Snapshot (real data):\n";
  if (recentTasks.length > 0) {
    recentTasks.forEach((t) => {
      const due = t.due_date ? new Date(t.due_date).toLocaleString('vi-VN') : 'Không có hạn';
      let line = `- [${t.id}] "${t.title}" | Status: ${t.status} | Priority: ${t.priority} | Due: ${due}`;
      if (t.description) {
        line += ` | Desc: ${t.description.slice(0, 350)}${t.description.length > 350 ? '...' : ''}`;
      }
      tasksContext += line + '\n';
    });
  } else {
    tasksContext += 'Không có công việc nào.\n';
  }

  const history = [...historyResult.rows].reverse();
  let conversationContext = '';
  if (history.length > 0) {
    conversationContext = 'Recent Conversation History:\n';
    history.forEach((msg) => {
      const snippet = msg.content.length > 900 ? msg.content.slice(0, 900) + '...' : msg.content;
      conversationContext += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${snippet}\n`;
    });
  }

  const today = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

  const prompt = `You are **TaskFlow AI Copilot** — a top-tier, empathetic, intelligent AI assistant built into the TaskFlow workspace.
Reply naturally in the user's language (default to Vietnamese if the user writes in Vietnamese or mixes terms).

Capabilities & Behavior Rules:
1. **Open-Ended Q&A & Deep Planning:** The user can ask you ANYTHING — project planning, learning roadmaps, coding, writing, brainstorming, study methods, career advice, or productivity strategy. Give direct, well-structured, insightful Markdown answers (use clear headings ###, bold key points, numbered steps or bullet points). Do NOT truncate helpful explanations arbitrarily — adapt length to complexity while staying crisp and actionable.
2. **TaskFlow Workspace Awareness:** When asked about the user's tasks, priorities, overdue items, or task summaries, answer strictly and accurately using the real "User's TaskFlow Tasks Snapshot" below. Never invent tasks that are not in the snapshot.
3. **Interactive Task Creation Cards (ONLY when the user explicitly wants to create/save tasks or break a task down into TaskFlow):**
   - For creating a single task/reminder, append at the end of your text (BEFORE <<SUGGESTIONS>>):
\`\`\`json
{
  "type": "create_single_task",
  "task": {
    "title": "Task title",
    "priority": "HIGH",
    "dueDate": "2026-11-28T15:00:00.000Z",
    "categoryId": 1,
    "categoryName": "Work",
    "estimatedTime": "45 phút"
  }
}
\`\`\`
   - For breaking down 1 complex task with subtasks, append:
\`\`\`json
{
  "type": "task_breakdown",
  "taskTitle": "Main task title",
  "subtasks": [
    { "title": "Subtask 1" },
    { "title": "Subtask 2" }
  ]
}
\`\`\`
   - For converting a multi-step roadmap/plan into multiple TaskFlow tasks when requested, append:
\`\`\`json
{
  "type": "create_plan_batch",
  "planTitle": "Plan name",
  "tasks": [
    { "title": "Step 1 task", "priority": "HIGH", "dueDate": null, "description": "Short actionable note" }
  ]
}
\`\`\`
   (Priority must be one of LOW, MEDIUM, HIGH, URGENT. Pick categoryId/categoryName from Available Categories or null.)

4. **MANDATORY Follow-Up Suggestions:**
   At the VERY END of EVERY response (even general questions!), output 2 to 3 smart, contextual follow-up prompts tailored specifically to the user's goal and advancing the next logical step. Wrap them EXACTLY in this format:
<<SUGGESTIONS>>["Gợi ý 1 ngắn gọn", "Gợi ý 2 sát mục tiêu", "Gợi ý 3 mở rộng thực tế"]<</SUGGESTIONS>>
   Keep each suggestion concise (under 65 characters) and in the same language as your response.

Current Date/Time: ${today}
${categoriesContext}
${tasksContext}
${conversationContext}
Current User Message: "${message}"`;

  return prompt;
}

/**
 * Resolve existing user session or create a new one cleanly.
 */
async function resolveOrCreateSession(userId, requestedSessionId, message) {
  if (requestedSessionId) {
    const existing = await query(
      'SELECT id, title FROM chat_sessions WHERE id = $1 AND user_id = $2',
      [requestedSessionId, userId],
    );
    if (existing.rows.length > 0) {
      let title = existing.rows[0].title;
      if (title === 'Cuộc trò chuyện mới' || title === 'New Conversation') {
        const nextTitle = deriveSessionTitle(message);
        await query('UPDATE chat_sessions SET title = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [
          nextTitle,
          existing.rows[0].id,
        ]);
        title = nextTitle;
      } else {
        await query('UPDATE chat_sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = $1', [
          existing.rows[0].id,
        ]);
      }
      return { sessionId: existing.rows[0].id, sessionTitle: title };
    }
  }

  const newTitle = deriveSessionTitle(message);
  const created = await query(
    'INSERT INTO chat_sessions (user_id, title) VALUES ($1, $2) RETURNING id, title',
    [userId, newTitle],
  );
  return { sessionId: created.rows[0].id, sessionTitle: created.rows[0].title };
}

exports.getSessions = async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    await migrateLegacyMessagesIfNeeded(userId);

    const result = await query(
      `
        SELECT
          s.id,
          s.title,
          s.created_at,
          s.updated_at,
          COUNT(m.id)::int AS message_count,
          (
            SELECT content
            FROM chatmessages lm
            WHERE lm.session_id = s.id AND lm.user_id = $1
            ORDER BY lm.created_at DESC
            LIMIT 1
          ) AS last_message
        FROM chat_sessions s
        LEFT JOIN chatmessages m ON m.session_id = s.id
        WHERE s.user_id = $1
        GROUP BY s.id
        ORDER BY s.updated_at DESC
      `,
      [userId],
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching chat sessions:', error);
    res.status(500).json({ message: 'Server error fetching chat sessions' });
  }
};

exports.createSession = async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const title = req.body?.title?.trim() || 'Cuộc trò chuyện mới';
    const result = await query(
      'INSERT INTO chat_sessions (user_id, title) VALUES ($1, $2) RETURNING id, title, created_at, updated_at',
      [userId, title],
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating chat session:', error);
    res.status(500).json({ message: 'Server error creating chat session' });
  }
};

exports.deleteSession = async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const sessionId = parseInt(req.params.sessionId, 10);
    if (isNaN(sessionId)) {
      return res.status(400).json({ message: 'Invalid session ID' });
    }

    const result = await query(
      'DELETE FROM chat_sessions WHERE id = $1 AND user_id = $2 RETURNING id',
      [sessionId, userId],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Chat session not found' });
    }

    res.status(200).json({ success: true, deletedSessionId: sessionId });
  } catch (error) {
    console.error('Error deleting chat session:', error);
    res.status(500).json({ message: 'Server error deleting chat session' });
  }
};

exports.clearAllChatHistory = async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    await withTransaction(async (client) => {
      await client.query('DELETE FROM chatmessages WHERE user_id = $1', [userId]);
      await client.query('DELETE FROM chat_sessions WHERE user_id = $1', [userId]);
    });
    res.status(200).json({ success: true, message: 'All chat history cleared' });
  } catch (error) {
    console.error('Error clearing chat history:', error);
    res.status(500).json({ message: 'Server error clearing chat history' });
  }
};

exports.getChatHistory = async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    await migrateLegacyMessagesIfNeeded(userId);

    let sessionId = req.query.sessionId ? parseInt(req.query.sessionId, 10) : null;
    if (!sessionId) {
      const latest = await query(
        'SELECT id FROM chat_sessions WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1',
        [userId],
      );
      if (latest.rows.length === 0) {
        return res.status(200).json([]);
      }
      sessionId = latest.rows[0].id;
    }

    const result = await query(
      `
        SELECT id, session_id, role, content, suggestions, created_at
        FROM chatmessages
        WHERE user_id = $1 AND session_id = $2
        ORDER BY created_at ASC
      `,
      [userId, sessionId],
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ message: 'Server error fetching chat history' });
  }
};

exports.chat = async (req, res) => {
  const startedAt = Date.now();
  try {
    const { message, sessionId: requestedSessionId } = req.body;
    const userId = req.user.id || req.user.userId;

    if (!message || !String(message).trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const { sessionId, sessionTitle } = await resolveOrCreateSession(
      userId,
      requestedSessionId ? parseInt(requestedSessionId, 10) : null,
      message,
    );

    const prompt = await buildCopilotContext(userId, sessionId, message);

    let rawText = '';
    try {
      const result = await withFastChatFallback((model, config) =>
        ai.models.generateContent({ model, contents: prompt, ...(config ? { config } : {}) }),
      );
      rawText = result.text || '';
    } catch (aiError) {
      console.error('AI Chat Error:', aiError);
      const errMsg =
        aiError.message && aiError.message.includes('API key')
          ? 'Lỗi: GEMINI_API_KEY không hợp lệ hoặc đã hết hạn. Vui lòng kiểm tra cấu hình!'
          : 'Không thể kết nối AI lúc này. Vui lòng thử lại sau.';
      return res.status(500).json({ message: errMsg });
    }

    const { cleanReply, suggestions } = extractReplyAndSuggestions(rawText, message);

    await withTransaction(async (client) => {
      await client.query(
        'INSERT INTO chatmessages (user_id, session_id, role, content) VALUES ($1, $2, $3, $4)',
        [userId, sessionId, 'user', message],
      );
      await client.query(
        'INSERT INTO chatmessages (user_id, session_id, role, content, suggestions) VALUES ($1, $2, $3, $4, $5)',
        [userId, sessionId, 'assistant', cleanReply, JSON.stringify(suggestions)],
      );
    });

    res.status(200).json({
      reply: cleanReply,
      suggestions,
      sessionId,
      sessionTitle,
      latencyMs: Date.now() - startedAt,
    });
  } catch (error) {
    console.error('Error in chat:', error);
    res.status(500).json({ message: 'Server error during AI chat' });
  }
};

exports.chatStream = async (req, res) => {
  const startedAt = Date.now();
  try {
    const { message, sessionId: requestedSessionId } = req.body;
    const userId = req.user.id || req.user.userId;

    if (!message || !String(message).trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    if (res.flushHeaders) res.flushHeaders();

    const sendEvent = (event, payload) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`);
    };

    const { sessionId, sessionTitle } = await resolveOrCreateSession(
      userId,
      requestedSessionId ? parseInt(requestedSessionId, 10) : null,
      message,
    );

    sendEvent('meta', { sessionId, sessionTitle });

    const prompt = await buildCopilotContext(userId, sessionId, message);

    let fullRaw = '';
    let emittedLength = 0;
    let foundSuggestionMarker = false;
    const MARKER = '<<SUGGESTIONS>>';
    const HOLDBACK = MARKER.length + 4;

    try {
      const stream = await withFastChatFallback((model, config) =>
        ai.models.generateContentStream({ model, contents: prompt, ...(config ? { config } : {}) }),
      );

      for await (const chunk of stream) {
        const piece = chunk?.text || '';
        if (!piece) continue;
        fullRaw += piece;

        if (!foundSuggestionMarker) {
          const markerIdx = fullRaw.indexOf(MARKER);
          if (markerIdx !== -1) {
            foundSuggestionMarker = true;
            const remainingClean = fullRaw.slice(emittedLength, markerIdx);
            if (remainingClean) {
              sendEvent('delta', { text: remainingClean });
              emittedLength = markerIdx;
            }
          } else {
            const safeEnd = Math.max(emittedLength, fullRaw.length - HOLDBACK);
            if (safeEnd > emittedLength) {
              const safeChunk = fullRaw.slice(emittedLength, safeEnd);
              sendEvent('delta', { text: safeChunk });
              emittedLength = safeEnd;
            }
          }
        }
      }

      if (!foundSuggestionMarker && fullRaw.length > emittedLength) {
        const tail = fullRaw.slice(emittedLength);
        if (tail) sendEvent('delta', { text: tail });
      }
    } catch (aiError) {
      console.error('AI Chat Stream Error:', aiError);
      sendEvent('error', {
        message: 'Không thể nhận phản hồi từ AI lúc này. Vui lòng thử lại.',
      });
      return res.end();
    }

    const { cleanReply, suggestions } = extractReplyAndSuggestions(fullRaw, message);

    await withTransaction(async (client) => {
      await client.query(
        'INSERT INTO chatmessages (user_id, session_id, role, content) VALUES ($1, $2, $3, $4)',
        [userId, sessionId, 'user', message],
      );
      await client.query(
        'INSERT INTO chatmessages (user_id, session_id, role, content, suggestions) VALUES ($1, $2, $3, $4, $5)',
        [userId, sessionId, 'assistant', cleanReply, JSON.stringify(suggestions)],
      );
    });

    sendEvent('done', {
      reply: cleanReply,
      suggestions,
      sessionId,
      sessionTitle,
      latencyMs: Date.now() - startedAt,
    });
    res.end();
  } catch (error) {
    console.error('Error in chatStream:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Server error during AI chat stream' });
    } else {
      res.write(`event: error\ndata: ${JSON.stringify({ message: 'Stream interrupted' })}\n\n`);
      res.end();
    }
  }
};

exports.breakdownTask = async (req, res) => {
  try {
    const { taskId, taskTitle, taskDescription } = req.body;
    const userId = req.user.userId || req.user.id;

    if (!taskId || !taskTitle) {
      return res.status(400).json({ message: 'Task ID and Title are required' });
    }

    const checkResult = await query('SELECT id FROM tasks WHERE id = $1 AND user_id = $2', [
      taskId,
      userId,
    ]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Task not found or access denied' });
    }

    const prompt = `You are a smart productivity assistant. I have a large task: "${taskTitle}". 
Description: "${taskDescription || 'No description'}".
Please break this down into 5 to 7 logical, actionable subtasks.
Respond ONLY in valid JSON format. It must be an array of objects. 
Each object should have exactly two keys: "title" (string, max 200 chars) and "estimated_time" (string, e.g., "30 minutes", "1 hour"). Do not wrap with \`\`\`json or any markdown formatting.`;

    let subtasks = [];
    try {
      const result = await withModelFallback((model) =>
        ai.models.generateContent({ model, contents: prompt }),
      );
      const cleanedText = (result.text || '').replace(/```json/gi, '').replace(/```/g, '').trim();
      subtasks = JSON.parse(cleanedText);
    } catch (aiError) {
      console.error('AI Generation Error:', aiError);
      return res.status(500).json({ message: 'Failed to generate subtasks with AI' });
    }

    await withTransaction(async (client) => {
      for (const subtask of subtasks) {
        await client.query(
          'INSERT INTO subtasks (task_id, title, estimated_time) VALUES ($1, $2, $3)',
          [taskId, subtask.title, subtask.estimated_time || null],
        );
      }
    });

    const subtasksResult = await query(
      'SELECT * FROM subtasks WHERE task_id = $1 ORDER BY created_at ASC',
      [taskId],
    );

    res.status(200).json(subtasksResult.rows);
  } catch (error) {
    console.error('Error in breakdownTask:', error);
    res.status(500).json({ message: 'Server error during task breakdown' });
  }
};

exports.prioritizeTasks = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;

    const tasksResult = await query(
      "SELECT id, title, priority, due_date, status FROM tasks WHERE user_id = $1 AND status != 'COMPLETED'",
      [userId],
    );

    const tasks = tasksResult.rows;

    if (tasks.length === 0) {
      return res.status(200).json({
        recommendation:
          'Bạn không có công việc nào đang chờ. Thật tuyệt vời! Hãy tận hưởng thời gian nghỉ ngơi nhé.',
      });
    }

    const prompt = `You are an empathetic, smart virtual assistant speaking in Vietnamese.
The user has the following pending tasks:
${JSON.stringify(tasks, null, 2)}
Based on the due dates (dueDate), priorities (LOW/MEDIUM/HIGH/URGENT), and the number of tasks, analyze and recommend ONE specific task they should focus on first today.
Your tone should be encouraging, professional, and friendly. Start directly with the recommendation, for example: "Hôm nay bạn nên ưu tiên làm việc [Tên việc] trước nhé, vì...". Do not use markdown formatting. Keep it concise (2-3 sentences max).`;

    let recommendation = '';
    try {
      const result = await withModelFallback((model) =>
        ai.models.generateContent({ model, contents: prompt }),
      );
      recommendation = (result.text || '').trim();
    } catch (aiError) {
      console.error('AI Generation Error:', aiError);
      return res.status(500).json({ message: 'Failed to generate recommendation with AI' });
    }

    res.status(200).json({ recommendation });
  } catch (error) {
    console.error('Error in prioritizeTasks:', error);
    res.status(500).json({ message: 'Server error during task prioritization' });
  }
};

exports.summarizeTask = async (req, res) => {
  try {
    const { taskId } = req.body;
    const userId = req.user.id || req.user.userId;

    if (!taskId) {
      return res.status(400).json({ message: 'Task ID is required' });
    }

    const checkResult = await query(
      'SELECT title, description FROM tasks WHERE id = $1 AND user_id = $2',
      [taskId, userId],
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Task not found or access denied' });
    }

    const task = checkResult.rows[0];
    if (!task.description) {
      return res.status(400).json({ message: 'Task has no description to summarize' });
    }

    const prompt = `You are an AI assistant. The user wants a quick summary of a task.
Task Title: "${task.title}"
Task Description: "${task.description}"

Please summarize the description into 3-4 key bullet points so the user can quickly grasp the main ideas without reading the whole text. 
Write the summary in Vietnamese. Keep it concise, professional, and focus only on the most important points. Do not include introductory text like "Here is the summary". Use bullet points (-).`;

    let summary = '';
    try {
      const result = await withModelFallback((model) =>
        ai.models.generateContent({ model, contents: prompt }),
      );
      summary = (result.text || '').trim();
    } catch (aiError) {
      console.error('AI Generation Error:', aiError);
      return res.status(500).json({ message: 'Failed to generate summary with AI' });
    }

    res.status(200).json({ summary });
  } catch (error) {
    console.error('Error in summarizeTask:', error);
    res.status(500).json({ message: 'Server error during task summarization' });
  }
};

exports.generatePlan = async (req, res) => {
  try {
    const { goal, audience, durationDays } = req.body;

    if (!goal) {
      return res.status(400).json({ message: 'Goal is required' });
    }

    const prompt = `You are an expert project manager and planner. 
The user wants to create a specific, actionable plan.
Goal (Mục tiêu): "${goal}"
Target Audience (Đối tượng mục tiêu): "${audience || 'General'}"
Duration (Thời gian): ${durationDays || 7} days

Please create a detailed timeline of tasks to achieve this goal, personalized for the target audience.
Distribute the tasks logically over the ${durationDays || 7} days.
For each task, provide:
1. title: A concise, actionable title (string, max 150 chars).
2. description: A brief description of how to execute this task specifically for the given audience (string).
3. day_offset: An integer indicating which day of the plan this task should be done on (e.g., 1 for Day 1, 2 for Day 2).
4. priority: One of 'LOW', 'MEDIUM', 'HIGH', or 'URGENT'.

Respond ONLY in valid JSON format. It must be an array of objects. Do not wrap with \`\`\`json or any markdown formatting.`;

    let plan = [];
    try {
      const result = await withModelFallback((model) =>
        ai.models.generateContent({ model, contents: prompt }),
      );
      let cleanedText = (result.text || '').replace(/```json/gi, '').replace(/```/g, '').trim();
      const startIdx = cleanedText.indexOf('[');
      const endIdx = cleanedText.lastIndexOf(']');
      if (startIdx !== -1 && endIdx !== -1) {
        cleanedText = cleanedText.substring(startIdx, endIdx + 1);
      }
      plan = JSON.parse(cleanedText);
    } catch (aiError) {
      console.error('AI Generation Error:', aiError);
      return res.status(500).json({
        message: 'Failed to generate plan with AI. It might have returned invalid JSON.',
      });
    }

    res.status(200).json(plan);
  } catch (error) {
    console.error('Error in generatePlan:', error);
    res.status(500).json({ message: 'Server error during plan generation' });
  }
};

exports.generatePlanFromFile = async (req, res) => {
  try {
    const file = req.file;
    const { goal, audience, durationDays } = req.body;

    if (!file) {
      return res.status(400).json({ message: 'File is required' });
    }

    let extractedText = '';
    const mimeType = file.mimetype;
    const extension = file.originalname.split('.').pop().toLowerCase();

    try {
      if (mimeType === 'application/pdf' || extension === 'pdf') {
        const data = await pdfParse(file.buffer);
        extractedText = data.text;
      } else if (
        mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        extension === 'docx'
      ) {
        const result = await mammoth.extractRawText({ buffer: file.buffer });
        extractedText = result.value;
      } else if (
        mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        mimeType === 'application/vnd.ms-excel' ||
        ['xls', 'xlsx'].includes(extension)
      ) {
        const workbook = xlsx.read(file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        extractedText = xlsx.utils.sheet_to_txt(sheet);
      } else {
        return res
          .status(400)
          .json({ message: 'Unsupported file format. Please upload PDF, Word (docx), or Excel.' });
      }
    } catch (err) {
      console.error('Error parsing file:', err);
      return res.status(500).json({ message: 'Failed to extract text from the file.' });
    }

    if (!extractedText || extractedText.trim().length === 0) {
      return res
        .status(400)
        .json({ message: 'Could not extract any text from the file or the file is empty.' });
    }

    if (extractedText.length > 15000) {
      extractedText = extractedText.substring(0, 15000) + '... (truncated)';
    }

    const prompt = `You are an expert project manager and planner. 
The user has provided a document containing context for a plan they want to create.
Document Content (Text extracted from file):
"""
${extractedText}
"""

Additional User Instructions:
Goal / Context (Mục tiêu bổ sung): "${goal || 'Dựa vào nội dung tài liệu'}"
Target Audience (Đối tượng mục tiêu): "${audience || 'General'}"
Duration (Thời gian): ${durationDays || 7} days

Please create a detailed timeline of tasks to achieve the project/goal described in the document, personalized for the target audience.
Distribute the tasks logically over the ${durationDays || 7} days.
For each task, provide:
1. title: A concise, actionable title (string, max 150 chars).
2. description: A brief description of how to execute this task based on the document (string).
3. day_offset: An integer indicating which day of the plan this task should be done on (e.g., 1 for Day 1, 2 for Day 2).
4. priority: One of 'LOW', 'MEDIUM', 'HIGH', or 'URGENT'.

Respond ONLY in valid JSON format. It must be an array of objects. Do not wrap with \`\`\`json or any markdown formatting.`;

    let plan = [];
    try {
      const result = await withModelFallback((model) =>
        ai.models.generateContent({ model, contents: prompt }),
      );
      let cleanedText = (result.text || '').replace(/```json/gi, '').replace(/```/g, '').trim();
      const startIdx = cleanedText.indexOf('[');
      const endIdx = cleanedText.lastIndexOf(']');
      if (startIdx !== -1 && endIdx !== -1) {
        cleanedText = cleanedText.substring(startIdx, endIdx + 1);
      }
      plan = JSON.parse(cleanedText);
    } catch (aiError) {
      console.error('AI Generation Error:', aiError);
      return res.status(500).json({
        message:
          'Failed to generate plan from file with AI. It might have returned invalid JSON or the file text was too complex.',
      });
    }

    res.status(200).json(plan);
  } catch (error) {
    console.error('Error in generatePlanFromFile:', error);
    res.status(500).json({ message: 'Server error during file plan generation' });
  }
};

exports.parseTaskFromText = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'Text is required' });

    const prompt = `You are a smart task parser. Extract task details from the following user speech text: "${text}".
Respond ONLY with a valid JSON object (no markdown) containing:
- title (string, max 150 chars, translated to English if necessary for standard logic, but keep original if it makes sense)
- priority (string, exactly one of: 'LOW', 'MEDIUM', 'HIGH', 'URGENT'. Default is 'MEDIUM' if not specified)
- dueDate (string in ISO 8601 format like "2026-09-18T15:00:00Z" or null if not mentioned. Today is ${new Date().toISOString()})`;

    const result = await withModelFallback((model) =>
      ai.models.generateContent({ model, contents: prompt }),
    );

    const responseText = result.text || '';
    let cleanedText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const startIdx = cleanedText.indexOf('{');
    const endIdx = cleanedText.lastIndexOf('}');

    if (startIdx !== -1 && endIdx !== -1) {
      cleanedText = cleanedText.substring(startIdx, endIdx + 1);
    }

    const parsedTask = JSON.parse(cleanedText);
    res.status(200).json(parsedTask);
  } catch (error) {
    console.error('Error in parseTaskFromText:', error);
    res.status(500).json({ message: 'Failed to parse task from text' });
  }
};
