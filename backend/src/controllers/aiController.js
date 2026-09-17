const { GoogleGenAI } = require('@google/genai');
const { sql, poolPromise } = require('../config/database');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const xlsx = require('xlsx');

// Use environment variable for API key
const apiKey = process.env.GEMINI_API_KEY || 'dummy-key';
const ai = new GoogleGenAI({ apiKey });

exports.breakdownTask = async (req, res) => {
    try {
        const { taskId, taskTitle, taskDescription } = req.body;
        const userId = req.user.id;

        if (!taskId || !taskTitle) {
            return res.status(400).json({ message: 'Task ID and Title are required' });
        }

        // 1. Verify task belongs to user
        const pool = await poolPromise;
        const checkResult = await pool.request()
            .input('taskId', sql.Int, taskId)
            .input('userId', sql.Int, userId)
            .query('SELECT id FROM Tasks WHERE id = @taskId AND user_id = @userId');

        if (checkResult.recordset.length === 0) {
            return res.status(404).json({ message: 'Task not found or access denied' });
        }

        // 2. Prepare AI prompt
        const prompt = `You are a smart productivity assistant. I have a large task: "${taskTitle}". 
Description: "${taskDescription || 'No description'}".
Please break this down into 5 to 7 logical, actionable subtasks.
Respond ONLY in valid JSON format. It must be an array of objects. 
Each object should have exactly two keys: "title" (string, max 200 chars) and "estimated_time" (string, e.g., "30 minutes", "1 hour"). Do not wrap with \`\`\`json or any markdown formatting.`;

        // 3. Call AI
        let subtasks = [];
        try {
            const result = await ai.models.generateContent({
                model: 'gemini-3.6-flash',
                contents: prompt
            });
            const text = result.text;
            // Clean markdown if AI still outputs it
            const cleanedText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
            subtasks = JSON.parse(cleanedText);
        } catch (aiError) {
            console.error('AI Generation Error:', aiError);
            return res.status(500).json({ message: 'Failed to generate subtasks with AI' });
        }

        // 4. Save to Database
        const transaction = new sql.Transaction(pool);
        await transaction.begin();
        try {
            for (const subtask of subtasks) {
                await transaction.request()
                    .input('taskId', sql.Int, taskId)
                    .input('title', sql.NVarChar(255), subtask.title)
                    .input('estimatedTime', sql.NVarChar(100), subtask.estimated_time || null)
                    .query('INSERT INTO Subtasks (task_id, title, estimated_time) VALUES (@taskId, @title, @estimatedTime)');
            }
            await transaction.commit();
        } catch (dbError) {
            await transaction.rollback();
            throw dbError;
        }

        // 5. Fetch updated subtasks
        const subtasksResult = await pool.request()
            .input('taskId', sql.Int, taskId)
            .query('SELECT * FROM Subtasks WHERE task_id = @taskId ORDER BY created_at ASC');

        res.status(200).json(subtasksResult.recordset);

    } catch (error) {
        console.error('Error in breakdownTask:', error);
        res.status(500).json({ message: 'Server error during task breakdown' });
    }
};

exports.prioritizeTasks = async (req, res) => {
    try {
        const userId = req.user.id;

        // 1. Fetch pending tasks
        const pool = await poolPromise;
        const tasksResult = await pool.request()
            .input('userId', sql.Int, userId)
            .query("SELECT id, title, priority, due_date, status FROM Tasks WHERE user_id = @userId AND status != 'COMPLETED'");

        const tasks = tasksResult.recordset;

        if (tasks.length === 0) {
            return res.status(200).json({ recommendation: "Bạn không có công việc nào đang chờ. Thật tuyệt vời! Hãy tận hưởng thời gian nghỉ ngơi nhé." });
        }

        // 2. Prepare AI prompt
        const prompt = `You are an empathetic, smart virtual assistant speaking in Vietnamese.
The user has the following pending tasks:
${JSON.stringify(tasks, null, 2)}
Based on the due dates (dueDate), priorities (LOW/MEDIUM/HIGH/URGENT), and the number of tasks, analyze and recommend ONE specific task they should focus on first today.
Your tone should be encouraging, professional, and friendly. Start directly with the recommendation, for example: "Hôm nay bạn nên ưu tiên làm việc [Tên việc] trước nhé, vì...". Do not use markdown formatting. Keep it concise (2-3 sentences max).`;

        // 3. Call AI
        let recommendation = "";
        try {
            const result = await ai.models.generateContent({
                model: 'gemini-3.6-flash',
                contents: prompt
            });
            recommendation = result.text.trim();
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

exports.chat = async (req, res) => {
    try {
        const { message } = req.body;
        const userId = req.user.id || req.user.userId;
        
        if (!message) {
            return res.status(400).json({ message: 'Message is required' });
        }

        const pool = await poolPromise;

        // Fetch user categories
        const categoriesResult = await pool.request()
            .input('userId', sql.Int, userId)
            .query('SELECT id, name FROM Categories WHERE user_id = @userId');
        const categories = categoriesResult.recordset;
        
        let categoriesContext = "User's Available Categories (Tags):\n";
        if (categories.length > 0) {
            categories.forEach(cat => {
                categoriesContext += `- ID: ${cat.id}, Name: "${cat.name}"\n`;
            });
        } else {
            categoriesContext += "None.\n";
        }

        // Fetch recent Tasks (Pending and Completed) to answer user queries about their tasks and summarize long descriptions
        const recentTasksResult = await pool.request()
            .input('userId', sql.Int, userId)
            .query(`
                SELECT TOP 50 id, title, description, status, priority, due_date, updated_at 
                FROM Tasks 
                WHERE user_id = @userId 
                ORDER BY CASE WHEN status != 'COMPLETED' THEN 0 ELSE 1 END ASC, updated_at DESC
            `);
        const recentTasks = recentTasksResult.recordset;
        let userWorkHabitsContext = "User's Tasks Snapshot (For context to answer queries like what is pending, what is completed, and to SUMMARIZE tasks if asked):\n";
        if (recentTasks.length > 0) {
            recentTasks.forEach(t => {
                const due = t.due_date ? new Date(t.due_date).toLocaleString('vi-VN') : 'Không có hạn';
                let taskInfo = `- Task [${t.id}]: "${t.title}", Trạng thái (Status): ${t.status}, Mức độ ưu tiên (Priority): ${t.priority}, Hạn chót (Due): ${due}`;
                if (t.description) {
                    taskInfo += `\n  Mô tả (Description): ${t.description.substring(0, 800)}${t.description.length > 800 ? '...' : ''}`;
                }
                userWorkHabitsContext += taskInfo + '\n';
            });
        } else {
            userWorkHabitsContext += "Không có công việc nào.\n";
        }

        // Fetch last 10 messages for context
        const historyResult = await pool.request()
            .input('userId', sql.Int, userId)
            .query(`
                SELECT TOP 10 role, content 
                FROM ChatMessages 
                WHERE user_id = @userId 
                ORDER BY created_at DESC
            `);
            
        // History is returned DESC, so reverse to ASC for context
        const history = historyResult.recordset.reverse();
        
        let conversationContext = "Previous conversation context:\n";
        history.forEach(msg => {
            conversationContext += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
        });

        const today = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
        const prompt = `You are an empathetic, smart productivity virtual assistant named TaskFlow AI speaking in Vietnamese. 
You are integrated directly into the TaskFlow application.
TaskFlow's main features include:
1. Dashboard: Tổng quan công việc, thống kê tiến độ.
2. Quản lý công việc: Tạo, sửa, xóa task, gán trạng thái (TODO, IN PROGRESS, COMPLETED) và mức độ ưu tiên (LOW, MEDIUM, HIGH, URGENT).
3. Phân loại (Category): Gắn thẻ màu sắc cho công việc.
4. Lịch (Calendar): Xem công việc theo ngày/tháng trực quan.
5. Pomodoro Timer: Tích hợp đồng hồ cà chua để tập trung làm việc hiệu quả.
6. AI Assistant: Tự động chia nhỏ công việc lớn thành các subtasks.

Current Date and Time: ${today}
${categoriesContext}
${userWorkHabitsContext}

${history.length > 0 ? conversationContext : ''}
Current User Message: "${message}"

If the user asks questions about their tasks (e.g., "Hôm nay tôi có những việc gì gấp chưa làm?", "Công việc X đã được xử lý chưa?"), use the "User's Tasks Snapshot" provided above to answer them accurately in natural language. If the task is not in the snapshot, politely inform them that you cannot find it.

If the user asks you to summarize a task (e.g., "Tóm tắt công việc X", "Tóm tắt mô tả của task Y"), find the task in the "User's Tasks Snapshot" and summarize its description into 3-4 key bullet points so the user can quickly grasp the main ideas. If the task has no description, inform them.

If the user asks to plan a complex task, or break down a task into multiple steps, you MUST propose a list of subtasks. To do this, include a special JSON block at the end of your response formatted EXACTLY like this:
\`\`\`json
{
  "type": "task_breakdown",
  "taskTitle": "Tên công việc chính",
  "subtasks": [
    { "title": "Subtask 1" },
    { "title": "Subtask 2" }
  ]
}
\`\`\`

If the user asks to create a SINGLE specific task or set a reminder (e.g., "Nhắc tôi họp team lúc 3h", "Tạo task nộp báo cáo ưu tiên cao"), output a special JSON block at the end of your response formatted EXACTLY like this:
\`\`\`json
{
  "type": "create_single_task",
  "task": {
    "title": "Họp team",
    "priority": "HIGH", 
    "dueDate": "2023-10-25T15:00:00.000Z",
    "categoryId": 1,
    "categoryName": "Marketing",
    "estimatedTime": "45 phút"
  }
}
\`\`\`
Note for create_single_task: priority must be ONE OF: LOW, MEDIUM, HIGH, URGENT. dueDate must be a valid ISO Date string (calculate it based on Current Date and Time) or null if not specified. categoryId and categoryName MUST be picked from the "User's Available Categories" provided above based on context (e.g., if the task is a bug fix, pick the Bug category). If no category matches, or if the user has no categories, set both to null. estimatedTime MUST be a short string estimating how long the task will take (e.g., "30 phút", "1.5 giờ"); if unable to estimate, set to null.
Also provide a helpful, friendly, and concise text response explaining what you did or answering the user's question. Keep the text under 150 words.`;

        let reply = "";
        try {
            const result = await ai.models.generateContent({
                model: 'gemini-3.6-flash',
                contents: prompt
            });
            reply = result.text.trim();
        } catch (aiError) {
            console.error('AI Chat Error:', aiError);
            let errMsg = 'Failed to generate chat response';
            if (aiError.message && (aiError.message.includes('404 Not Found') || aiError.message.includes('API key'))) {
                errMsg = 'Lỗi: GEMINI_API_KEY trong file .env không hợp lệ hoặc đã hết hạn. Vui lòng cập nhật API Key mới!';
            }
            return res.status(500).json({ message: errMsg });
        }

        // Save User Message to DB
        await pool.request()
            .input('userId', sql.Int, userId)
            .input('role', sql.NVarChar(50), 'user')
            .input('content', sql.NVarChar(sql.MAX), message)
            .query('INSERT INTO ChatMessages (user_id, role, content) VALUES (@userId, @role, @content)');
            
        // Save Assistant Message to DB
        await pool.request()
            .input('userId', sql.Int, userId)
            .input('role', sql.NVarChar(50), 'assistant')
            .input('content', sql.NVarChar(sql.MAX), reply)
            .query('INSERT INTO ChatMessages (user_id, role, content) VALUES (@userId, @role, @content)');

        res.status(200).json({ reply });

    } catch (error) {
        console.error('Error in chat:', error);
        res.status(500).json({ message: 'Server error during AI chat' });
    }
};

exports.getChatHistory = async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;
        const pool = await poolPromise;
        const result = await pool.request()
            .input('userId', sql.Int, userId)
            .query(`
                SELECT role, content, created_at 
                FROM ChatMessages 
                WHERE user_id = @userId 
                ORDER BY created_at ASC
            `);
            
        res.status(200).json(result.recordset);
    } catch (error) {
        console.error('Error fetching chat history:', error);
        res.status(500).json({ message: 'Server error fetching chat history' });
    }
};

exports.summarizeTask = async (req, res) => {
    try {
        const { taskId } = req.body;
        const userId = req.user.id || req.user.userId;

        if (!taskId) {
            return res.status(400).json({ message: 'Task ID is required' });
        }

        const pool = await poolPromise;
        const checkResult = await pool.request()
            .input('taskId', sql.Int, taskId)
            .input('userId', sql.Int, userId)
            .query('SELECT title, description FROM Tasks WHERE id = @taskId AND user_id = @userId');

        if (checkResult.recordset.length === 0) {
            return res.status(404).json({ message: 'Task not found or access denied' });
        }

        const task = checkResult.recordset[0];
        if (!task.description) {
            return res.status(400).json({ message: 'Task has no description to summarize' });
        }

        const prompt = `You are an AI assistant. The user wants a quick summary of a task.
Task Title: "${task.title}"
Task Description: "${task.description}"

Please summarize the description into 3-4 key bullet points so the user can quickly grasp the main ideas without reading the whole text. 
Write the summary in Vietnamese. Keep it concise, professional, and focus only on the most important points. Do not include introductory text like "Here is the summary". Use bullet points (-).`;

        let summary = "";
        try {
            const result = await ai.models.generateContent({
                model: 'gemini-3.6-flash',
                contents: prompt
            });
            summary = result.text.trim();
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
            const result = await ai.models.generateContent({
                model: 'gemini-3.6-flash',
                contents: prompt
            });
            const text = result.text;
            let cleanedText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
            const startIdx = cleanedText.indexOf('[');
            const endIdx = cleanedText.lastIndexOf(']');
            if (startIdx !== -1 && endIdx !== -1) {
                cleanedText = cleanedText.substring(startIdx, endIdx + 1);
            }
            plan = JSON.parse(cleanedText);
        } catch (aiError) {
            console.error('AI Generation Error:', aiError);
            return res.status(500).json({ message: 'Failed to generate plan with AI. It might have returned invalid JSON.' });
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
                return res.status(400).json({ message: 'Unsupported file format. Please upload PDF, Word (docx), or Excel.' });
            }
        } catch (err) {
            console.error('Error parsing file:', err);
            return res.status(500).json({ message: 'Failed to extract text from the file.' });
        }

        if (!extractedText || extractedText.trim().length === 0) {
            return res.status(400).json({ message: 'Could not extract any text from the file or the file is empty.' });
        }

        // Limit extracted text to avoid token limits (e.g., max ~15000 characters)
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
            const result = await ai.models.generateContent({
                model: 'gemini-3.6-flash',
                contents: prompt
            });
            const text = result.text;
            let cleanedText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
            const startIdx = cleanedText.indexOf('[');
            const endIdx = cleanedText.lastIndexOf(']');
            if (startIdx !== -1 && endIdx !== -1) {
                cleanedText = cleanedText.substring(startIdx, endIdx + 1);
            }
            plan = JSON.parse(cleanedText);
        } catch (aiError) {
            console.error('AI Generation Error:', aiError);
            return res.status(500).json({ message: 'Failed to generate plan from file with AI. It might have returned invalid JSON or the file text was too complex.' });
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

        const result = await ai.models.generateContent({
            model: 'gemini-3.6-flash',
            contents: prompt
        });

        const responseText = result.text;
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
