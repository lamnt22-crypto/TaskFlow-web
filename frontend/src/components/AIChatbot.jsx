import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { getChatHistory } from '../services/aiService';
import { PriorityBadge } from './Badge';
import HolographicOrb3D from './HolographicOrb3D';
import { triggerHaptic } from '../utils/haptics';
import { sounds } from '../utils/soundEffects';

const parseMessageContent = (content) => {
  if (!content) return { text: '', data: null };
  const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
  const match = content.match(jsonRegex);
  
  if (match) {
    try {
      const jsonData = JSON.parse(match[1]);
      const textContent = content.replace(jsonRegex, '').trim();
      return { text: textContent, data: jsonData };
    } catch (e) {
      return { text: content, data: null };
    }
  }
  return { text: content, data: null };
};

const TaskBreakdownCard = ({ data }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [isCreated, setIsCreated] = useState(false);

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      await api.post('/tasks', { title: data.taskTitle, subtasks: data.subtasks });
      setIsCreated(true);
    } catch (error) {
      console.error(error);
      alert('Có lỗi xảy ra khi tạo công việc!');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="mt-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800/50">
      <h4 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-2">{data.taskTitle}</h4>
      <ul className="space-y-1.5 mb-3">
        {data.subtasks?.map((st, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-indigo-800 dark:text-indigo-200">
            <svg className="w-4 h-4 mt-0.5 text-indigo-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{st.title}</span>
          </li>
        ))}
      </ul>
      <button 
        onClick={handleCreate}
        disabled={isCreating || isCreated}
        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
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
        categoryId: task.categoryId
      };
      if (task.estimatedTime) {
        payload.description = `⏳ Ước lượng thời gian: ${task.estimatedTime}`;
      }
      await api.post('/tasks', payload);
      setIsCreated(true);
    } catch (error) {
      console.error(error);
      alert('Có lỗi xảy ra khi tạo công việc!');
    } finally {
      setIsCreating(false);
    }
  };

  const formattedDate = task.dueDate ? new Date(task.dueDate).toLocaleString('vi-VN', {
    weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  }) : 'Không có ngày hạn';

  return (
    <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800/50">
      <h4 className="font-semibold text-emerald-900 dark:text-emerald-100 mb-2">{task.title}</h4>
      <div className="flex flex-wrap gap-2 mb-3">
        {task.priority && <PriorityBadge priority={task.priority} />}
        {task.categoryName && (
          <span className="flex items-center px-2.5 py-1 rounded-md bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-xs font-semibold">
            #{task.categoryName}
          </span>
        )}
        {task.estimatedTime && (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-xs font-semibold">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {task.estimatedTime}
          </span>
        )}
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          {formattedDate}
        </span>
      </div>
      <button 
        onClick={handleCreate}
        disabled={isCreating || isCreated}
        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
      >
        {isCreating ? 'Đang tạo...' : isCreated ? 'Đã tạo thành công! ✓' : 'Tạo Công Việc Này'}
      </button>
    </div>
  );
};

const AIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      
      // Load history once when opened
      if (!isHistoryLoaded) {
        setIsLoading(true);
        getChatHistory()
          .then(data => {
            if (data.length > 0) {
              setMessages(data);
            } else {
              setMessages([{ role: 'assistant', content: 'Xin chào! Mình là TaskFlow AI, bạn cần mình giúp gì để quản lý công việc hôm nay?' }]);
            }
            setIsHistoryLoaded(true);
          })
          .catch(err => {
            console.error(err);
            if (messages.length === 0) {
                setMessages([{ role: 'assistant', content: 'Xin chào! Mình là TaskFlow AI, bạn cần mình giúp gì để quản lý công việc hôm nay?' }]);
            }
          })
          .finally(() => {
            setIsLoading(false);
          });
      }
    }
  }, [messages, isOpen, isHistoryLoaded]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await api.post('/ai/chat', { message: userMessage });
      setMessages(prev => [...prev, { role: 'assistant', content: response.data.reply }]);
    } catch (error) {
      console.error(error);
      const errorMsg = error.response?.data?.message || 'Xin lỗi, hiện tại mình đang bận, bạn thử lại sau nhé!';
      setMessages(prev => [...prev, { role: 'assistant', content: errorMsg }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* 3D Holographic Floating Quantum Orb Launcher */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: isOpen ? 0 : 1 }}
        className="fixed bottom-24 right-4 lg:bottom-6 lg:right-6 z-40 flex items-center gap-3"
      >
        {/* Tooltip on hover */}
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
          {/* 3D Quantum Orb */}
          <HolographicOrb3D size="sm" isThinking={isLoading} />
        </motion.button>
      </motion.div>

      {/* Futuristic Spatial Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.88 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.88 }}
            transition={{ type: "spring", damping: 25, stiffness: 320 }}
            className="fixed bottom-24 lg:bottom-6 right-3 sm:right-6 w-[calc(100vw-1.5rem)] sm:w-[420px] bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-2xl rounded-3xl shadow-[0_25px_60px_-15px_rgba(99,102,241,0.35)] border border-cyan-500/30 dark:border-white/15 z-50 overflow-hidden flex flex-col h-[500px] sm:h-[560px] max-h-[calc(100vh-8.5rem)] lg:max-h-[85vh]"
          >
            {/* Holographic Header */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950/90 to-purple-950/90 p-4 border-b border-white/10 flex items-center justify-between relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-400 via-indigo-400 to-fuchsia-400" />
              
              <div className="flex items-center gap-3 relative z-10">
                <HolographicOrb3D size="sm" isThinking={isLoading} />
                <div>
                  <h3 className="text-white font-extrabold text-sm tracking-tight flex items-center gap-1.5">
                    TaskFlow AI Copilot
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold uppercase tracking-wider">Hologram</span>
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                    <span className="text-slate-400 text-xs">Sẵn sàng phản hồi siêu tốc</span>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => {
                  triggerHaptic('light');
                  setIsOpen(false);
                }}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer relative z-10"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-800/50">
              {messages.map((msg, index) => {
                const { text, data } = msg.role === 'assistant' ? parseMessageContent(msg.content) : { text: msg.content, data: null };
                
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={index} 
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-indigo-500 text-white rounded-br-none' 
                        : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-bl-none shadow-sm border border-slate-100 dark:border-slate-600'
                    }`}>
                      <div>{text}</div>
                      {data && data.type === 'task_breakdown' && (
                        <TaskBreakdownCard data={data} />
                      )}
                      {data && data.type === 'create_single_task' && (
                        <SingleTaskCard data={data} />
                      )}
                    </div>
                  </motion.div>
                );
              })}
              {isLoading && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-white dark:bg-slate-700 p-3 rounded-2xl rounded-bl-none shadow-sm border border-slate-100 dark:border-slate-600 flex gap-1.5 items-center">
                    <div className="w-2 h-2 bg-slate-300 dark:bg-slate-500 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-slate-300 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <div className="w-2 h-2 bg-slate-300 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex gap-2">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Nhắn tin với AI..."
                className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm"
              />
              <button 
                type="submit"
                disabled={isLoading || !input.trim()}
                className="w-10 h-10 bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-full flex items-center justify-center transition-colors"
              >
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIChatbot;
