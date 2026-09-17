import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { getChatHistory } from '../services/aiService';
import { PriorityBadge } from './Badge';

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
      {/* Floating Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        initial={{ scale: 0 }}
        animate={{ scale: isOpen ? 0 : 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-purple-500/30 z-50 overflow-hidden"
      >
        <svg className="w-7 h-7 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
        <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-6 right-6 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden flex flex-col h-[500px] max-h-[80vh]"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <span className="text-xl">✨</span>
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm">TaskFlow AI</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-white/80 text-xs">Online</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white p-1"
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
