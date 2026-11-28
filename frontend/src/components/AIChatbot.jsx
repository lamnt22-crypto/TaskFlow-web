import React, { useState, useRef, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import api from '../services/api';
import {
  getChatSessions,
  createChatSession,
  deleteChatSession,
  getChatHistory,
  clearAllChatHistory,
  streamChatMessage,
  sendChatMessage,
} from '../services/aiService';
import { AuthContext } from '../context/AuthContext';
import { resolveAvatarUrl } from '../utils/avatarUrl';
import { PriorityBadge } from './Badge';
import HolographicOrb3D from './HolographicOrb3D';
import MarkdownMessage from './MarkdownMessage';
import { triggerHaptic } from '../utils/haptics';
import { sounds } from '../utils/soundEffects';

const parseMessageContent = (content) => {
  if (!content) return { text: '', data: null };
  const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
  const match = content.match(jsonRegex);

  if (match) {
    try {
      const jsonData = JSON.parse(match[1]);
      if (
        jsonData?.type === 'task_breakdown' ||
        jsonData?.type === 'create_single_task' ||
        jsonData?.type === 'create_plan_batch'
      ) {
        const textContent = content.replace(jsonRegex, '').trim();
        return { text: textContent, data: jsonData };
      }
    } catch (_) {
      return { text: content, data: null };
    }
  }
  return { text: content, data: null };
};

const AssistantAvatar = ({ isThinking = false }) => (
  <div className="relative w-8 h-8 rounded-full shrink-0 flex items-center justify-center bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/30 ring-2 ring-cyan-400/30">
    {isThinking && (
      <span className="absolute inset-0 rounded-full bg-cyan-400/50 animate-ping pointer-events-none" />
    )}
    <svg className="w-4 h-4 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
    </svg>
  </div>
);

const UserAvatar = ({ user }) => {
  const [imgError, setImgError] = useState(false);
  const avatarSrc = resolveAvatarUrl(user?.avatar_url);
  const initial = user?.username?.charAt(0)?.toUpperCase() || 'U';

  useEffect(() => {
    setImgError(false);
  }, [user?.avatar_url]);

  if (avatarSrc && !imgError) {
    return (
      <img
        src={avatarSrc}
        alt={user?.username || 'User'}
        onError={() => setImgError(true)}
        className="w-8 h-8 rounded-full object-cover shrink-0 ring-2 ring-indigo-400/40 shadow-sm"
      />
    );
  }

  return (
    <div className="w-8 h-8 rounded-full shrink-0 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white text-xs font-extrabold flex items-center justify-center shadow-sm ring-2 ring-indigo-400/30">
      {initial}
    </div>
  );
};

const TaskBreakdownCard = ({ data }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [isCreated, setIsCreated] = useState(false);

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      await api.post('/tasks', { title: data.taskTitle, subtasks: data.subtasks });
      setIsCreated(true);
      toast.success('Đã tạo công việc kèm subtasks!');
      window.dispatchEvent(new CustomEvent('tasksUpdated'));
    } catch (error) {
      console.error(error);
      toast.error('Có lỗi xảy ra khi tạo công việc!');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="mt-3 p-3.5 bg-indigo-50/90 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-500/30">
      <h4 className="font-bold text-indigo-950 dark:text-indigo-100 mb-2 text-sm">{data.taskTitle}</h4>
      <ul className="space-y-1.5 mb-3">
        {data.subtasks?.map((st, i) => (
          <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-indigo-900 dark:text-indigo-200">
            <svg className="w-4 h-4 mt-0.5 text-indigo-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{st.title}</span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={handleCreate}
        disabled={isCreating || isCreated}
        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-emerald-600/80 disabled:cursor-not-allowed text-white rounded-lg text-xs sm:text-sm font-bold transition-colors cursor-pointer"
      >
        {isCreating ? 'Đang tạo...' : isCreated ? 'Đã tạo thành công! ✓' : 'Tạo Công Việc Này'}
      </button>
    </div>
  );
};

const SingleTaskCard = ({ data }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [isCreated, setIsCreated] = useState(false);
  const { task } = data;

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      const payload = {
        title: task.title,
        priority: task.priority || 'MEDIUM',
        dueDate: task.dueDate,
        categoryId: task.categoryId,
      };
      if (task.estimatedTime) {
        payload.description = `⏳ Ước lượng thời gian: ${task.estimatedTime}`;
      }
      await api.post('/tasks', payload);
      setIsCreated(true);
      toast.success('Đã thêm vào danh sách công việc!');
      window.dispatchEvent(new CustomEvent('tasksUpdated'));
    } catch (error) {
      console.error(error);
      toast.error('Có lỗi xảy ra khi tạo công việc!');
    } finally {
      setIsCreating(false);
    }
  };

  const formattedDate = task.dueDate
    ? new Date(task.dueDate).toLocaleString('vi-VN', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Không có ngày hạn';

  return (
    <div className="mt-3 p-3.5 bg-emerald-50/90 dark:bg-emerald-950/35 rounded-xl border border-emerald-200 dark:border-emerald-500/30">
      <h4 className="font-bold text-emerald-950 dark:text-emerald-100 mb-2 text-sm">{task.title}</h4>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {task.priority && <PriorityBadge priority={task.priority} />}
        {task.categoryName && (
          <span className="flex items-center px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-[11px] font-semibold">
            #{task.categoryName}
          </span>
        )}
        {task.estimatedTime && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-[11px] font-semibold">
            ⏱️ {task.estimatedTime}
          </span>
        )}
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold">
          📅 {formattedDate}
        </span>
      </div>
      <button
        type="button"
        onClick={handleCreate}
        disabled={isCreating || isCreated}
        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-700/70 disabled:cursor-not-allowed text-white rounded-lg text-xs sm:text-sm font-bold transition-colors cursor-pointer"
      >
        {isCreating ? 'Đang tạo...' : isCreated ? 'Đã tạo thành công! ✓' : 'Tạo Công Việc Này'}
      </button>
    </div>
  );
};

const PlanBatchCard = ({ data }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [isCreated, setIsCreated] = useState(false);
  const items = Array.isArray(data.tasks) ? data.tasks : [];

  const handleImportAll = async () => {
    if (items.length === 0) return;
    setIsCreating(true);
    try {
      await Promise.all(
        items.map((item) =>
          api.post('/tasks', {
            title: item.title,
            priority: item.priority || 'MEDIUM',
            dueDate: item.dueDate || null,
            description: item.description || null,
          }),
        ),
      );
      setIsCreated(true);
      toast.success(`Đã thêm ${items.length} công việc từ kế hoạch vào TaskFlow!`);
      window.dispatchEvent(new CustomEvent('tasksUpdated'));
    } catch (error) {
      console.error(error);
      toast.error('Không thể thêm toàn bộ kế hoạch.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="mt-3 p-3.5 bg-cyan-50/90 dark:bg-cyan-950/35 rounded-xl border border-cyan-200 dark:border-cyan-500/30">
      <div className="flex items-center justify-between gap-2 mb-2">
        <h4 className="font-bold text-cyan-950 dark:text-cyan-100 text-sm">
          🗓️ {data.planTitle || 'Kế hoạch hành động'}
        </h4>
        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-700 dark:text-cyan-300">
          {items.length} tasks
        </span>
      </div>
      <ul className="space-y-1.5 mb-3 max-h-40 overflow-y-auto custom-scrollbar">
        {items.map((item, idx) => (
          <li key={idx} className="text-xs text-slate-700 dark:text-slate-200 flex items-start gap-2">
            <span className="font-bold text-cyan-600 dark:text-cyan-400 shrink-0">{idx + 1}.</span>
            <span className="flex-1">{item.title}</span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={handleImportAll}
        disabled={isCreating || isCreated || items.length === 0}
        className="w-full py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 disabled:opacity-70 text-white rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer"
      >
        {isCreating
          ? 'Đang thêm kế hoạch...'
          : isCreated
            ? `Đã lưu ${items.length} công việc ✓`
            : `Lưu ${items.length} công việc vào TaskFlow`}
      </button>
    </div>
  );
};

const AIChatbot = () => {
  const { user, isAuthenticated } = useContext(AuthContext);
  const { i18n } = useTranslation();
  const isVi = i18n.language === 'vi';

  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const abortControllerRef = useRef(null);
  const hasBootstrappedRef = useRef(false);

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Load sessions & latest history when opened for the first time
  useEffect(() => {
    if (!isOpen || !isAuthenticated || hasBootstrappedRef.current) return;
    hasBootstrappedRef.current = true;

    const loadInitial = async () => {
      setIsLoadingHistory(true);
      try {
        const sessionList = await getChatSessions();
        const list = Array.isArray(sessionList) ? sessionList : [];
        setSessions(list);

        if (list.length > 0) {
          const latestId = list[0].id;
          setActiveSessionId(latestId);
          const msgs = await getChatHistory(latestId);
          setMessages(Array.isArray(msgs) ? msgs : []);
        } else {
          setMessages([]);
        }
      } catch (err) {
        console.error('Failed to bootstrap AI Copilot:', err);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadInitial();
  }, [isOpen, isAuthenticated]);

  // Reset state if user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      hasBootstrappedRef.current = false;
      setIsOpen(false);
      setSessions([]);
      setMessages([]);
      setActiveSessionId(null);
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;

  const refreshSessions = async () => {
    try {
      const list = await getChatSessions();
      if (Array.isArray(list)) setSessions(list);
    } catch (_) {}
  };

  const handleSelectSession = async (sessionId) => {
    if (isStreaming) return;
    setActiveSessionId(sessionId);
    setShowHistoryDrawer(false);
    setIsLoadingHistory(true);
    try {
      const msgs = await getChatHistory(sessionId);
      setMessages(Array.isArray(msgs) ? msgs : []);
    } catch (_) {
      toast.error(isVi ? 'Không thể tải hội thoại' : 'Failed to load conversation');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleNewConversation = async () => {
    if (isStreaming) return;
    triggerHaptic('light');
    setActiveSessionId(null);
    setMessages([]);
    setShowHistoryDrawer(false);
    setConfirmClearAll(false);
    setTimeout(() => inputRef.current?.focus(), 60);
  };

  const handleDeleteSession = async (sessionId, e) => {
    e.stopPropagation();
    try {
      await deleteChatSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (activeSessionId === sessionId) {
        setActiveSessionId(null);
        setMessages([]);
      }
      toast.success(isVi ? 'Đã xóa cuộc hội thoại' : 'Conversation deleted');
    } catch (_) {
      toast.error(isVi ? 'Không thể xóa hội thoại' : 'Failed to delete conversation');
    }
  };

  const handleClearAllHistory = async () => {
    try {
      await clearAllChatHistory();
      setSessions([]);
      setActiveSessionId(null);
      setMessages([]);
      setConfirmClearAll(false);
      setShowHistoryDrawer(false);
      toast.success(isVi ? 'Đã xóa toàn bộ lịch sử chat' : 'All chat history cleared');
    } catch (_) {
      toast.error(isVi ? 'Không thể xóa lịch sử' : 'Failed to clear history');
    }
  };

  const handleStopStreaming = () => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
  };

  const sendPrompt = async (promptText) => {
    const userMessage = String(promptText || '').trim();
    if (!userMessage || isStreaming) return;

    setInput('');
    setConfirmClearAll(false);

    const tempUserId = `user-${Date.now()}`;
    const tempBotId = `bot-${Date.now()}`;

    setMessages((prev) => [
      ...prev,
      { id: tempUserId, role: 'user', content: userMessage, created_at: new Date().toISOString() },
      { id: tempBotId, role: 'assistant', content: '', suggestions: [], isStreaming: true, created_at: new Date().toISOString() },
    ]);

    setIsStreaming(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    let resolvedSessionId = activeSessionId;

    try {
      await streamChatMessage({
        message: userMessage,
        sessionId: activeSessionId,
        signal: controller.signal,
        onMeta: (meta) => {
          if (meta?.sessionId) {
            resolvedSessionId = meta.sessionId;
            setActiveSessionId(meta.sessionId);
          }
        },
        onDelta: ({ text }) => {
          if (!text) return;
          setMessages((prev) =>
            prev.map((m) => (m.id === tempBotId ? { ...m, content: (m.content || '') + text } : m)),
          );
        },
        onDone: (payload) => {
          if (payload?.sessionId) {
            resolvedSessionId = payload.sessionId;
            setActiveSessionId(payload.sessionId);
          }
          setMessages((prev) =>
            prev.map((m) =>
              m.id === tempBotId
                ? {
                    ...m,
                    content: payload?.reply ?? m.content,
                    suggestions: Array.isArray(payload?.suggestions) ? payload.suggestions : [],
                    latencyMs: payload?.latencyMs,
                    isStreaming: false,
                  }
                : m,
            ),
          );
          refreshSessions();
        },
        onError: async () => {
          // Handled in catch fallback below if empty
        },
      });
    } catch (streamErr) {
      if (streamErr.name === 'AbortError') {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempBotId ? { ...m, isStreaming: false } : m)),
        );
        return;
      }

      // Fallback to non-streaming POST /ai/chat
      try {
        const res = await sendChatMessage(userMessage, resolvedSessionId);
        if (res?.sessionId) setActiveSessionId(res.sessionId);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempBotId
              ? {
                  ...m,
                  content: res.reply,
                  suggestions: Array.isArray(res.suggestions) ? res.suggestions : [],
                  latencyMs: res.latencyMs,
                  isStreaming: false,
                }
              : m,
          ),
        );
        refreshSessions();
      } catch (fallbackErr) {
        const errMsg =
          fallbackErr?.response?.data?.message ||
          streamErr?.message ||
          (isVi ? 'Xin lỗi, hiện tại mình đang bận, bạn thử lại sau nhé!' : 'Sorry, AI is busy right now. Please try again.');
        setMessages((prev) =>
          prev.map((m) => (m.id === tempBotId ? { ...m, content: errMsg, isStreaming: false } : m)),
        );
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendPrompt(input);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendPrompt(input);
    }
  };

  const handleCopyMessage = (msgId, text) => {
    navigator.clipboard?.writeText(text);
    setCopiedMsgId(msgId);
    setTimeout(() => setCopiedMsgId(null), 1600);
  };

  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error(isVi ? 'Trình duyệt không hỗ trợ ghi âm.' : 'Voice input is not supported.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = isVi ? 'vi-VN' : 'en-US';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        transcript += event.results[i][0].transcript;
      }
      setInput(transcript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const starterPrompts = isVi
    ? [
        {
          icon: '🗓️',
          title: 'Lập kế hoạch chi tiết',
          prompt: 'Giúp tôi lập kế hoạch chi tiết 7 ngày để đạt mục tiêu quan trọng nhất tuần này',
        },
        {
          icon: '🔥',
          title: 'Việc ưu tiên hôm nay',
          prompt: 'Hôm nay tôi có những công việc nào cần làm gấp và nên bắt đầu từ đâu?',
        },
        {
          icon: '💡',
          title: 'Hỏi đáp & Tư vấn tự do',
          prompt: 'Gợi ý cho tôi phương pháp học tập và ghi nhớ sâu hiệu quả nhất',
        },
      ]
    : [
        {
          icon: '🗓️',
          title: 'Build a detailed plan',
          prompt: 'Help me build a detailed 7-day action plan for my top goal this week',
        },
        {
          icon: '🔥',
          title: "Today's priorities",
          prompt: 'What urgent tasks do I have today and what should I tackle first?',
        },
        {
          icon: '💡',
          title: 'Ask anything & Brainstorm',
          prompt: 'Suggest the most effective deep focus and learning workflow',
        },
      ];

  const windowClass = isExpanded
    ? 'fixed inset-2 sm:inset-auto sm:bottom-6 sm:right-6 sm:w-[min(920px,92vw)] sm:h-[min(85dvh,780px)] z-50'
    : 'fixed bottom-24 lg:bottom-6 right-3 sm:right-6 w-[calc(100vw-1.5rem)] sm:w-[440px] h-[520px] sm:h-[600px] max-h-[calc(100dvh-7.5rem)] lg:max-h-[85dvh] z-50';

  const latestAssistantIndex = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant') return i;
    }
    return -1;
  })();

  const renderHistoryList = () => (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-slate-200 dark:border-white/10">
        <button
          type="button"
          onClick={handleNewConversation}
          className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          <span>{isVi ? 'Cuộc hội thoại mới' : 'New Conversation'}</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
        {sessions.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-8 px-3">
            {isVi ? 'Chưa có lịch sử trò chuyện.' : 'No conversation history yet.'}
          </p>
        ) : (
          sessions.map((sess) => {
            const isActive = sess.id === activeSessionId;
            return (
              <div
                key={sess.id}
                onClick={() => handleSelectSession(sess.id)}
                className={`group flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-200 border border-indigo-500/30'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold truncate">{sess.title}</p>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">
                    {sess.message_count || 0} {isVi ? 'tin nhắn' : 'msgs'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => handleDeleteSession(sess.id, e)}
                  title={isVi ? 'Xóa cuộc trò chuyện' : 'Delete conversation'}
                  className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all shrink-0"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            );
          })
        )}
      </div>

      {sessions.length > 0 && (
        <div className="p-3 border-t border-slate-200 dark:border-white/10">
          {!confirmClearAll ? (
            <button
              type="button"
              onClick={() => setConfirmClearAll(true)}
              className="w-full py-2 px-3 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
            >
              🗑️ {isVi ? 'Xóa toàn bộ lịch sử' : 'Clear all history'}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClearAllHistory}
                className="flex-1 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 cursor-pointer"
              >
                {isVi ? 'Xác nhận xóa' : 'Confirm'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmClearAll(false)}
                className="flex-1 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
              >
                {isVi ? 'Hủy' : 'Cancel'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* 3D Holographic Floating Quantum Orb Launcher */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: isOpen ? 0 : 1 }}
        className="fixed bottom-24 right-4 lg:bottom-6 lg:right-6 z-40 flex items-center gap-3"
      >
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          whileHover={{ opacity: 1, x: 0 }}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/90 text-white text-xs font-bold border border-cyan-500/30 backdrop-blur-md shadow-lg pointer-events-none"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          <span>TaskFlow Copilot AI</span>
        </motion.div>

        <motion.button
          onClick={() => {
            triggerHaptic('medium');
            sounds.playHologramPulse();
            setIsOpen(true);
          }}
          whileHover={{ scale: 1.12, rotate: 5 }}
          whileTap={{ scale: 0.92 }}
          className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center cursor-pointer group focus:outline-none"
          title="Trò chuyện cùng TaskFlow AI"
          aria-label="Mở trợ lý AI"
        >
          <HolographicOrb3D size="sm" isThinking={isStreaming} />
        </motion.button>
      </motion.div>

      {/* Futuristic Spatial Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            layout
            initial={{ opacity: 0, y: 24, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.92 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className={`${windowClass} bg-white dark:bg-slate-950 backdrop-blur-2xl rounded-3xl shadow-[0_25px_70px_-15px_rgba(79,70,229,0.4)] border border-indigo-200/80 dark:border-cyan-500/30 overflow-hidden flex flex-col`}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 px-3.5 sm:px-4 py-3 border-b border-white/10 flex items-center justify-between gap-2 relative shrink-0">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-400 via-indigo-400 to-fuchsia-400" />

              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  type="button"
                  onClick={() => setShowHistoryDrawer((prev) => !prev)}
                  title={isVi ? 'Lịch sử trò chuyện' : 'Chat history'}
                  className={`p-2 rounded-xl transition-colors cursor-pointer relative ${
                    showHistoryDrawer
                      ? 'bg-white/20 text-white'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {sessions.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-cyan-500 text-[9px] font-black text-slate-950 flex items-center justify-center">
                      {sessions.length}
                    </span>
                  )}
                </button>

                <AssistantAvatar isThinking={isStreaming} />

                <div className="min-w-0">
                  <h3 className="text-white font-extrabold text-xs sm:text-sm tracking-tight flex items-center gap-1.5 truncate">
                    <span className="truncate">TaskFlow AI Copilot</span>
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${isStreaming ? 'bg-cyan-400 animate-ping' : 'bg-emerald-400'}`} />
                    <span className="text-slate-300 text-[11px] truncate">
                      {isStreaming
                        ? isVi
                          ? 'Đang phản hồi...'
                          : 'Thinking & streaming...'
                        : isVi
                          ? 'Sẵn sàng hỗ trợ 24/7'
                          : 'Ready to help 24/7'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {/* New Chat */}
                <button
                  type="button"
                  onClick={handleNewConversation}
                  title={isVi ? 'Cuộc hội thoại mới' : 'New chat'}
                  className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>

                {/* Expand / Shrink */}
                <button
                  type="button"
                  onClick={() => setIsExpanded((prev) => !prev)}
                  title={isExpanded ? (isVi ? 'Thu nhỏ' : 'Compact') : isVi ? 'Phóng to' : 'Expand'}
                  className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  {isExpanded ? (
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                  )}
                </button>

                {/* Close */}
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setIsOpen(false);
                  }}
                  title={isVi ? 'Đóng' : 'Close'}
                  className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Body: Optional Docked Sidebar (Expanded Desktop) + Slide-Over Drawer + Messages */}
            <div className="flex-1 flex min-h-0 relative overflow-hidden bg-slate-50 dark:bg-slate-900/70">
              {/* Docked Sidebar when Expanded on Desktop */}
              {isExpanded && (
                <div className="hidden md:flex w-64 shrink-0 border-r border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950/80 flex-col">
                  {renderHistoryList()}
                </div>
              )}

              {/* Slide-over History Drawer (Compact mode or Mobile/Tablet) */}
              <AnimatePresence>
                {showHistoryDrawer && (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setShowHistoryDrawer(false)}
                      className={`absolute inset-0 bg-slate-950/40 backdrop-blur-[1px] z-20 ${isExpanded ? 'md:hidden' : ''}`}
                    />
                    <motion.div
                      initial={{ x: '-100%' }}
                      animate={{ x: 0 }}
                      exit={{ x: '-100%' }}
                      transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                      className={`absolute inset-y-0 left-0 w-64 max-w-[82%] bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-white/10 shadow-2xl z-30 ${isExpanded ? 'md:hidden' : ''}`}
                    >
                      {renderHistoryList()}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>

              {/* Main Conversation Column */}
              <div className="flex-1 flex flex-col min-w-0 h-full">
                <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-4 custom-scrollbar">
                  {isLoadingHistory ? (
                    <div className="flex flex-col gap-3 py-8">
                      <div className="h-12 w-3/4 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
                      <div className="h-10 w-1/2 ml-auto rounded-2xl bg-indigo-200/50 dark:bg-indigo-900/40 animate-pulse" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center px-3 py-6">
                      <AssistantAvatar />
                      <h4 className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg mt-3 mb-1">
                        {isVi ? `Chào ${user?.username || 'bạn'}! Mình là TaskFlow AI` : `Hi ${user?.username || 'there'}! I'm TaskFlow AI`}
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mb-5 leading-relaxed">
                        {isVi
                          ? 'Hỏi mình bất cứ điều gì: lập kế hoạch chi tiết, phân rã công việc, kiểm tra deadline, hoặc trao đổi ý tưởng tự do.'
                          : 'Ask me anything: build action plans, manage your TaskFlow tasks, or brainstorm freely.'}
                      </p>
                      <div className="grid grid-cols-1 gap-2 w-full max-w-md">
                        {starterPrompts.map((item, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => sendPrompt(item.prompt)}
                            className="text-left p-3 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-white/10 hover:border-indigo-400 dark:hover:border-cyan-400/50 transition-all shadow-xs flex items-center gap-3 group cursor-pointer"
                          >
                            <span className="text-lg shrink-0">{item.icon}</span>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-cyan-300">
                                {item.title}
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                {item.prompt}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    messages.map((msg, index) => {
                      const isUser = msg.role === 'user';
                      const { text, data } = !isUser
                        ? parseMessageContent(msg.content)
                        : { text: msg.content, data: null };
                      const isLatestAssistant = index === latestAssistantIndex;
                      const suggestions = Array.isArray(msg.suggestions) ? msg.suggestions : [];

                      return (
                        <motion.div
                          key={msg.id || index}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex items-start gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                        >
                          {!isUser && <AssistantAvatar isThinking={!!msg.isStreaming} />}

                          <div className={`flex flex-col max-w-[84%] sm:max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
                            <div className="flex items-center gap-2 mb-1 px-1">
                              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                                {isUser ? user?.username || (isVi ? 'Bạn' : 'You') : 'TaskFlow AI Copilot'}
                              </span>
                              {!isUser && msg.latencyMs && (
                                <span className="text-[10px] font-mono text-slate-400">
                                  {(msg.latencyMs / 1000).toFixed(1)}s
                                </span>
                              )}
                            </div>

                            <div
                              className={`group relative px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-2xl shadow-xs ${
                                isUser
                                  ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-tr-sm'
                                  : 'bg-white dark:bg-slate-800/95 text-slate-800 dark:text-slate-100 rounded-tl-sm border border-slate-200/80 dark:border-white/10'
                              }`}
                            >
                              {isUser ? (
                                <p className="text-[13.5px] sm:text-sm leading-relaxed whitespace-pre-wrap break-words">
                                  {text}
                                </p>
                              ) : msg.isStreaming && !text ? (
                                <div className="flex items-center gap-1.5 py-1.5 px-1">
                                  <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" />
                                  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                                  <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                                </div>
                              ) : (
                                <>
                                  <MarkdownMessage content={text} />
                                  {data && data.type === 'task_breakdown' && <TaskBreakdownCard data={data} />}
                                  {data && data.type === 'create_single_task' && <SingleTaskCard data={data} />}
                                  {data && data.type === 'create_plan_batch' && <PlanBatchCard data={data} />}

                                  {!msg.isStreaming && text && (
                                    <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-white/5 flex justify-end">
                                      <button
                                        type="button"
                                        onClick={() => handleCopyMessage(msg.id || index, text)}
                                        className="text-[10px] font-semibold text-slate-400 hover:text-indigo-600 dark:hover:text-cyan-300 transition-colors cursor-pointer"
                                      >
                                        {copiedMsgId === (msg.id || index)
                                          ? '✓ Đã sao chép'
                                          : isVi
                                            ? 'Sao chép'
                                            : 'Copy'}
                                      </button>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>

                            {/* 2-3 Follow-Up Goal-Aligned Suggestions */}
                            {!isUser && !msg.isStreaming && isLatestAssistant && suggestions.length > 0 && (
                              <div className="mt-2.5 flex flex-col gap-1.5 w-full">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-cyan-400 px-1">
                                  ✨ {isVi ? 'Gợi ý tiếp theo' : 'Suggested follow-ups'}
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                  {suggestions.slice(0, 3).map((sug, sIdx) => (
                                    <button
                                      key={sIdx}
                                      type="button"
                                      onClick={() => sendPrompt(sug)}
                                      className="text-left text-xs font-medium px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800/90 border border-indigo-200/80 dark:border-cyan-500/30 text-indigo-700 dark:text-cyan-200 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                                    >
                                      <span>{sug}</span>
                                      <span className="text-[10px] opacity-70">→</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {isUser && <UserAvatar user={user} />}
                        </motion.div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Bar */}
                <form
                  onSubmit={handleSubmit}
                  className="p-3 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-white/10 flex items-end gap-2 shrink-0"
                >
                  <button
                    type="button"
                    onClick={handleVoiceInput}
                    disabled={isStreaming}
                    title={isVi ? 'Nhập bằng giọng nói' : 'Voice input'}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                      isListening
                        ? 'bg-rose-500/20 text-rose-500 animate-pulse'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-cyan-300'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </button>

                  <textarea
                    ref={inputRef}
                    rows={1}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      isListening
                        ? isVi
                          ? 'Đang nghe...'
                          : 'Listening...'
                        : isVi
                          ? 'Hỏi bất cứ điều gì hoặc nhờ lập kế hoạch...'
                          : 'Ask anything or build a plan...'
                    }
                    className="flex-1 bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200/70 dark:border-white/10 rounded-2xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-sm resize-none max-h-28"
                  />

                  {isStreaming ? (
                    <button
                      type="button"
                      onClick={handleStopStreaming}
                      title={isVi ? 'Dừng trả lời' : 'Stop generating'}
                      className="w-10 h-10 bg-rose-600 hover:bg-rose-700 text-white rounded-xl flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <rect x="6" y="6" width="12" height="12" rx="2" />
                      </svg>
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={!input.trim()}
                      title={isVi ? 'Gửi tin nhắn' : 'Send message'}
                      className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center shrink-0 transition-all cursor-pointer shadow-sm"
                    >
                      <svg className="w-4 h-4 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </button>
                  )}
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIChatbot;
