import React, { useEffect, useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

const KeyboardShortcutsManager = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if user is typing in an input or textarea
      if (
        document.activeElement.tagName === 'INPUT' || 
        document.activeElement.tagName === 'TEXTAREA' ||
        document.activeElement.isContentEditable
      ) {
        // Exception: Ctrl+K should still work to focus the search bar, 
        // but typically Ctrl+K is used to focus search FROM ANYWHERE.
        if (e.ctrlKey && e.key.toLowerCase() === 'k') {
          e.preventDefault();
          if (location.pathname !== '/my-tasks') {
            navigate('/my-tasks');
            setTimeout(() => {
              const searchInput = document.getElementById('global-search-input');
              if (searchInput) searchInput.focus();
            }, 300);
          } else {
            const searchInput = document.getElementById('global-search-input');
            if (searchInput) searchInput.focus();
          }
        }
        return;
      }

      // Ctrl + K: Search
      if (e.ctrlKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (location.pathname !== '/my-tasks') {
          navigate('/my-tasks');
          setTimeout(() => {
            const searchInput = document.getElementById('global-search-input');
            if (searchInput) searchInput.focus();
          }, 300);
        } else {
          const searchInput = document.getElementById('global-search-input');
          if (searchInput) searchInput.focus();
        }
      }

      // 'C': Create Task
      if (!e.ctrlKey && !e.metaKey && !e.altKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        // Fire custom event so that MyTasks/Dashboard can listen and open Create Modal
        window.dispatchEvent(new CustomEvent('openCreateTaskModal'));
      }

      // 'D': Toggle Dark Mode
      if (!e.ctrlKey && !e.metaKey && !e.altKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        toggleTheme();
      }

      // '?' or '/': Open Shortcuts Help
      if (!e.ctrlKey && !e.metaKey && !e.altKey && (e.key === '?' || e.key === '/')) {
        e.preventDefault();
        setIsOpen(true);
      }
      
      // Escape to close
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, location.pathname, toggleTheme]);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-24 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-lg border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-full font-semibold text-xs flex items-center gap-1.5 hover:scale-105 transition-transform z-50 hover:bg-slate-50 dark:hover:bg-slate-700"
        title="Keyboard Shortcuts"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        Note
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 dark:bg-slate-900/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden"
            >
              <div className="bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-800 px-6 py-4 flex justify-between items-center border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  ⌨️ Phím tắt thông minh
                </h2>
                <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-slate-800 dark:hover:text-white p-1 rounded-md">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Tìm kiếm công việc</span>
                  <div className="flex gap-1">
                    <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs font-mono font-bold text-slate-700 dark:text-slate-300 shadow-sm">Ctrl</kbd>
                    <span className="text-slate-400 font-bold">+</span>
                    <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs font-mono font-bold text-slate-700 dark:text-slate-300 shadow-sm">K</kbd>
                  </div>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Tạo công việc mới</span>
                  <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs font-mono font-bold text-slate-700 dark:text-slate-300 shadow-sm">C</kbd>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Bật/Tắt Dark Mode</span>
                  <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs font-mono font-bold text-slate-700 dark:text-slate-300 shadow-sm">D</kbd>
                </div>

                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Mở bảng hướng dẫn này</span>
                  <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs font-mono font-bold text-slate-700 dark:text-slate-300 shadow-sm">?</kbd>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default KeyboardShortcutsManager;
