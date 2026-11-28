import api, { getAuthToken, setAuthToken } from './api';

export const breakdownTask = async (taskId, taskTitle, taskDescription) => {
  const response = await api.post('/ai/breakdown', { taskId, taskTitle, taskDescription });
  return response.data;
};

export const prioritizeTasks = async () => {
  const response = await api.get('/ai/prioritize');
  return response.data;
};

export const getChatSessions = async () => {
  const response = await api.get('/ai/sessions');
  return response.data;
};

export const createChatSession = async (title) => {
  const response = await api.post('/ai/sessions', { title });
  return response.data;
};

export const deleteChatSession = async (sessionId) => {
  const response = await api.delete(`/ai/sessions/${sessionId}`);
  return response.data;
};

export const getChatHistory = async (sessionId = null) => {
  const response = await api.get('/ai/chat', {
    params: sessionId ? { sessionId } : {},
  });
  return response.data;
};

export const clearAllChatHistory = async () => {
  const response = await api.delete('/ai/chat');
  return response.data;
};

export const sendChatMessage = async (message, sessionId = null) => {
  const response = await api.post('/ai/chat', { message, sessionId });
  return response.data;
};

/**
 * Stream chat response over Server-Sent Events (SSE) for instant token-by-token UX.
 * Automatically refreshes JWT once if 401 occurs and falls back gracefully.
 */
export const streamChatMessage = async ({
  message,
  sessionId = null,
  signal,
  onMeta,
  onDelta,
  onDone,
  onError,
}) => {
  const baseURL = (api.defaults.baseURL || import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
  const endpoint = `${baseURL}/ai/chat/stream`;

  const openStream = async (token) => {
    return fetch(endpoint, {
      method: 'POST',
      credentials: 'include',
      signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ message, sessionId }),
    });
  };

  let token = getAuthToken();
  let response = await openStream(token);

  if (response.status === 401) {
    try {
      const refreshRes = await api.post('/auth/refresh-token');
      token = refreshRes.data?.accessToken;
      if (token) {
        setAuthToken(token);
        localStorage.setItem('accessToken', token);
        response = await openStream(token);
      }
    } catch (_) {
      // Let error handling below report auth issue
    }
  }

  if (!response.ok || !response.body) {
    const errText = await response.text().catch(() => '');
    let msg = 'Không thể kết nối AI Copilot';
    try {
      const parsed = JSON.parse(errText);
      if (parsed?.message) msg = parsed.message;
    } catch (_) {}
    throw new Error(msg);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let currentEvent = 'message';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const rawLine of lines) {
      const line = rawLine.trimEnd();
      if (!line) {
        currentEvent = 'message';
        continue;
      }
      if (line.startsWith('event:')) {
        currentEvent = line.slice(6).trim();
      } else if (line.startsWith('data:')) {
        const dataStr = line.slice(5).trim();
        if (!dataStr) continue;
        try {
          const payload = JSON.parse(dataStr);
          if (currentEvent === 'meta') onMeta && onMeta(payload);
          else if (currentEvent === 'delta') onDelta && onDelta(payload);
          else if (currentEvent === 'done') onDone && onDone(payload);
          else if (currentEvent === 'error') onError && onError(payload);
        } catch (_) {
          // Ignore partial/malformed SSE chunk
        }
      }
    }
  }
};

export const summarizeTask = async (taskId) => {
  const response = await api.post('/ai/summarize', { taskId });
  return response.data;
};

export const generatePlan = async (goal, audience, durationDays) => {
  const response = await api.post('/ai/generate-plan', { goal, audience, durationDays });
  return response.data;
};

export const generatePlanFromFile = async (formData) => {
  try {
    const response = await api.post('/ai/generate-plan-from-file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error generating AI plan from file:', error);
    return { success: false, error: error.response?.data?.message || 'Failed to generate plan from file' };
  }
};

export const parseTaskFromText = async (text) => {
  const response = await api.post('/ai/parse-task', { text });
  return response.data;
};
