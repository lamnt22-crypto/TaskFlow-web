import React, { useState, useEffect, useContext, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ThemeContext } from '../context/ThemeContext';
import { getTasks } from '../services/taskService';

const CommandPalette = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);
  const { t, i18n } = useTranslation();
  const isVi = i18n.language === 'vi';

  // Open on Ctrl+K / Cmd+K or custom event
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    const handleOpenEvent = () => setIsOpen(true);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('openCommandPalette', handleOpenEvent);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('openCommandPalette', handleOpenEvent);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setSelectedIndex(0);
      return;
    }
    setTimeout(() => inputRef.current?.focus(), 40);

    let active = true;
    setLoadingTasks(true);
    getTasks()
      .then((res) => {
        if (active && res?.success) {
          setTasks(Array.isArray(res.data) ? res.data : []);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingTasks(false);
      });

    return () => {
      active = false;
    };
  }, [isOpen]);

  const quickActions = useMemo(
    () => [
      {
        id: 'create-task',
        group: isVi ? 'Thao tác nhanh' : 'Quick Actions',
        title: isVi ? 'Tạo công việc mới' : 'Create new task',
        shortcut: 'C',
        icon: '➕',
        action: () => {
          setIsOpen(false);
          const createRoutes = ['/dashboard', '/my-tasks', '/kanban', '/calendar'];
          if (createRoutes.includes(location.pathname)) {
            window.dispatchEvent(new CustomEvent('openCreateTaskModal'));
          } else {
            navigate('/my-tasks?new=1');
          }
        },
      },
      {
        id: 'toggle-theme',
        group: isVi ? 'Thao tác nhanh' : 'Quick Actions',
        title: isDarkMode
          ? isVi
            ? 'Chuyển sang Chế độ Sáng'
            : 'Switch to Light Mode'
          : isVi
            ? 'Chuyển sang Chế độ Tối'
            : 'Switch to Dark Mode',
        shortcut: 'D',
        icon: isDarkMode ? '☀️' : '🌙',
        action: () => {
          toggleTheme();
          setIsOpen(false);
        },
      },
      {
        id: 'open-shortcuts',
        group: isVi ? 'Thao tác nhanh' : 'Quick Actions',
        title: isVi ? 'Xem bảng phím tắt' : 'View keyboard shortcuts',
        shortcut: '?',
        icon: '⌨️',
        action: () => {
          setIsOpen(false);
          window.dispatchEvent(new CustomEvent('openShortcutsModal'));
        },
      },
      {
        id: 'go-dashboard',
        group: isVi ? 'Điều hướng' : 'Navigation',
        title: t('nav.dashboard'),
        icon: '📊',
        action: () => {
          navigate('/dashboard');
          setIsOpen(false);
        },
      },
      {
        id: 'go-tasks',
        group: isVi ? 'Điều hướng' : 'Navigation',
        title: t('nav.myTasks'),
        icon: '✅',
        action: () => {
          navigate('/my-tasks');
          setIsOpen(false);
        },
      },
      {
        id: 'go-kanban',
        group: isVi ? 'Điều hướng' : 'Navigation',
        title: t('nav.kanban'),
        icon: '📋',
        action: () => {
          navigate('/kanban');
          setIsOpen(false);
        },
      },
      {
        id: 'go-calendar',
        group: isVi ? 'Điều hướng' : 'Navigation',
        title: t('nav.calendar'),
        icon: '📅',
        action: () => {
          navigate('/calendar');
          setIsOpen(false);
        },
      },
      {
        id: 'go-profile',
        group: isVi ? 'Điều hướng' : 'Navigation',
        title: t('nav.profile'),
        icon: '👤',
        action: () => {
          navigate('/profile');
          setIsOpen(false);
        },
      },
    ],
    [isVi, isDarkMode, location.pathname, navigate, toggleTheme, t],
  );

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matchedActions = quickActions.filter((item) =>
      !q || item.title.toLowerCase().includes(q),
    );
    const matchedTasks = tasks
      .filter((task) => !q || task.title?.toLowerCase().includes(q))
      .slice(0, q ? 6 : 4)
      .map((task) => ({
        id: `task-${task.id}`,
        group: isVi ? 'Công việc' : 'Tasks',
        title: task.title,
        status: task.status,
        priority: task.priority,
        icon: task.status === 'COMPLETED' ? '✅' : '📌',
        action: () => {
          navigate(`/tasks/${task.id}`);
          setIsOpen(false);
        },
      }));

    return [...matchedTasks, ...matchedActions];
  }, [query, tasks, quickActions, isVi, navigate]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleInputKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (filteredItems.length ? (prev + 1) % filteredItems.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        filteredItems.length ? (prev - 1 + filteredItems.length) % filteredItems.length : 0,
      );
    } else if (e.key === 'Enter' && filteredItems[selectedIndex]) {
      e.preventDefault();
      filteredItems[selectedIndex].action();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] sm:pt-[15vh] px-4 bg-slate-950/60 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -12 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden"
          >
            {/* Search Input Bar */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 dark:border-white/10">
              <svg className="w-5 h-5 text-indigo-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder={isVi ? 'Tìm công việc, trang hoặc lệnh nhanh...' : 'Search tasks, pages, or commands...'}
                className="flex-1 bg-transparent text-sm sm:text-base text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none font-medium"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-1.5 py-0.5 rounded"
                >
                  {isVi ? 'Xóa' : 'Clear'}
                </button>
              )}
              <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                ESC
              </kbd>
            </div>

            {/* Results List */}
            <div className="max-h-[55vh] overflow-y-auto p-2 space-y-1 custom-scrollbar">
              {loadingTasks && tasks.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  {isVi ? 'Đang tải dữ liệu...' : 'Loading...'}
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                  {isVi ? 'Không tìm thấy kết quả phù hợp.' : 'No matching tasks or commands found.'}
                </div>
              ) : (
                filteredItems.map((item, idx) => {
                  const showGroup = idx === 0 || filteredItems[idx - 1].group !== item.group;
                  const isActive = idx === selectedIndex;
                  return (
                    <React.Fragment key={item.id}>
                      {showGroup && (
                        <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {item.group}
                        </div>
                      )}
                      <button
                        type="button"
                        onMouseEnter={() => setSelectedIndex(idx)}
                        onClick={item.action}
                        className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                          isActive
                            ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-200'
                            : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-base shrink-0">{item.icon}</span>
                          <span className={`text-sm font-medium truncate ${item.status === 'COMPLETED' ? 'line-through opacity-70' : ''}`}>
                            {item.title}
                          </span>
                        </div>
                        {item.shortcut ? (
                          <kbd className="px-2 py-0.5 text-[10px] font-mono font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-500 dark:text-slate-400 shrink-0">
                            {item.shortcut}
                          </kbd>
                        ) : item.priority ? (
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shrink-0">
                            {item.priority}
                          </span>
                        ) : null}
                      </button>
                    </React.Fragment>
                  );
                })
              )}
            </div>

            {/* Footer Hints */}
            <div className="hidden sm:flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-100 dark:border-white/5 text-[11px] text-slate-400">
              <div className="flex items-center gap-3">
                <span>↑↓ {isVi ? 'Di chuyển' : 'Navigate'}</span>
                <span>↵ {isVi ? 'Chọn' : 'Select'}</span>
              </div>
              <span>TaskFlow Command Palette</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CommandPalette;
