import React, { useEffect, useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

const KeyboardShortcutsManager = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const location = useLocation();
  const { i18n } = useTranslation();
  const isVi = i18n.language === 'vi';

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        document.activeElement.tagName === 'INPUT' ||
        document.activeElement.tagName === 'TEXTAREA' ||
        document.activeElement.tagName === 'SELECT' ||
        document.activeElement.isContentEditable
      ) {
        return;
      }

      // 'C': Create Task
      if (!e.ctrlKey && !e.metaKey && !e.altKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        const createRoutes = ['/dashboard', '/my-tasks', '/kanban', '/calendar'];
        if (createRoutes.includes(location.pathname)) {
          window.dispatchEvent(new CustomEvent('openCreateTaskModal'));
        } else {
          navigate('/my-tasks?new=1');
        }
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

    const handleOpenShortcuts = () => setIsOpen(true);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('openShortcutsModal', handleOpenShortcuts);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('openShortcutsModal', handleOpenShortcuts);
    };
  }, [navigate, location.pathname, toggleTheme]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 w-full max-w-md overflow-hidden"
          >
            <div className="bg-slate-50 dark:bg-slate-800/80 px-6 py-4 flex justify-between items-center border-b border-slate-200 dark:border-white/10">
              <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                ⌨️ {isVi ? 'Phím tắt thông minh' : 'Keyboard Shortcuts'}
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-500 hover:text-slate-800 dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors"
                aria-label="Close shortcuts"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-3.5">
              {[
                {
                  label: isVi ? 'Mở tìm kiếm & lệnh nhanh' : 'Open Command Palette',
                  keys: ['Ctrl / ⌘', 'K'],
                },
                {
                  label: isVi ? 'Tạo công việc mới' : 'Create new task',
                  keys: ['C'],
                },
                {
                  label: isVi ? 'Bật / Tắt chế độ Tối' : 'Toggle Dark Mode',
                  keys: ['D'],
                },
                {
                  label: isVi ? 'Mở bảng hướng dẫn phím tắt' : 'Open shortcuts help',
                  keys: ['?'],
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center py-2 border-b last:border-b-0 border-slate-100 dark:border-white/5"
                >
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{item.label}</span>
                  <div className="flex items-center gap-1">
                    {item.keys.map((k, i) => (
                      <React.Fragment key={i}>
                        {i > 0 && <span className="text-slate-400 font-bold text-xs">+</span>}
                        <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-mono font-bold text-slate-700 dark:text-slate-300 shadow-xs">
                          {k}
                        </kbd>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default KeyboardShortcutsManager;
