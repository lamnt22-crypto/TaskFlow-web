import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { breakdownTask } from '../services/aiService';
import api from '../services/api';

const SubtaskList = ({ taskId, taskTitle, taskDescription, initialSubtasks = [] }) => {
  const [subtasks, setSubtasks] = useState(initialSubtasks);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  const handleBreakdown = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const result = await breakdownTask(taskId, taskTitle, taskDescription);
      setSubtasks(result);
    } catch (err) {
      console.error(err);
      setError('Lỗi khi nhờ AI phân tích công việc. Vui lòng thử lại.');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleSubtask = async (subtaskId, currentStatus) => {
    try {
      // Optimistic update
      setSubtasks(prev => prev.map(s => s.id === subtaskId ? { ...s, is_completed: !currentStatus } : s));
      // Call api direct here for simplicity
      await api.put(`/tasks/subtasks/${subtaskId}`, { is_completed: !currentStatus });
    } catch (err) {
      // Revert on error
      setSubtasks(prev => prev.map(s => s.id === subtaskId ? { ...s, is_completed: currentStatus } : s));
    }
  };

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
          Các bước thực hiện (Subtasks)
        </h3>
        {subtasks.length === 0 && !isGenerating && (
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleBreakdown}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all"
          >
            ✨ Nhờ AI Chia Nhỏ
          </motion.button>
        )}
      </div>

      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

      <AnimatePresence>
        {isGenerating && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-indigo-100 dark:border-indigo-900/30 flex flex-col items-center justify-center gap-3 overflow-hidden mb-4"
          >
            <div className="w-8 h-8 relative">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                className="absolute inset-0 rounded-full border-2 border-transparent border-t-indigo-600"
              />
              <motion.div 
                animate={{ rotate: -360 }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                className="absolute inset-1 rounded-full border-2 border-transparent border-t-purple-500"
              />
            </div>
            <p className="text-indigo-600 dark:text-indigo-400 font-medium animate-pulse">AI đang phân tích và chia nhỏ công việc...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {subtasks.length > 0 && (
        <div className="space-y-3">
          {subtasks.map((subtask, index) => (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              key={subtask.id}
              className={`flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer ${subtask.is_completed ? 'bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700 opacity-70' : 'bg-white dark:bg-slate-800 border-indigo-100 dark:border-indigo-900/30 shadow-sm hover:shadow-md'}`}
              onClick={() => toggleSubtask(subtask.id, subtask.is_completed)}
            >
              <div className="mt-1">
                <div className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-colors ${subtask.is_completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 dark:border-slate-600 text-transparent'}`}>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </div>
              </div>
              <div className="flex-1">
                <h4 className={`font-medium ${subtask.is_completed ? 'text-slate-500 line-through' : 'text-slate-800 dark:text-slate-200'}`}>
                  {subtask.title}
                </h4>
                {subtask.estimated_time && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {subtask.estimated_time}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SubtaskList;
