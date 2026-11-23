import React, { useContext, useState, useEffect, useRef } from 'react';
import Sidebar from './Sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import PomodoroWidget from './PomodoroWidget';
import KeyboardShortcutsManager from './KeyboardShortcutsManager';
import MobileBottomNav from './MobileBottomNav';

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useContext(AuthContext);
  const { isDarkMode } = useContext(ThemeContext);
  const { t } = useTranslation();
  
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);

  const getInitials = (name) => {
    return name ? name.charAt(0).toUpperCase() : 'U';
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch notifications on mount and on route change
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const fetchNotifications = async () => {
      try {
        const response = await api.get('/tasks');
        const tasks = Array.isArray(response.data?.data) ? response.data.data : (Array.isArray(response.data) ? response.data : []);
        const now = new Date();
        now.setHours(0,0,0,0);
        
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const notifs = [];
        
        tasks.forEach(task => {
          if (task.status === 'COMPLETED' || !task.due_date) return;
          
          const dueDate = new Date(task.due_date);
          dueDate.setHours(0,0,0,0);
          
          if (dueDate < now) {
            notifs.push({
              id: task.id,
              title: task.title,
              type: 'overdue',
              date: task.due_date
            });
          } else if (dueDate.getTime() === tomorrow.getTime()) {
            notifs.push({
              id: task.id,
              title: task.title,
              type: 'dueTomorrow',
              date: task.due_date
            });
          }
        });
        
        // Sort: overdue first, then tomorrow
        notifs.sort((a, b) => {
          if (a.type === 'overdue' && b.type !== 'overdue') return -1;
          if (a.type !== 'overdue' && b.type === 'overdue') return 1;
          return new Date(a.date) - new Date(b.date);
        });
        
        setNotifications(notifs);
      } catch (err) {
        console.error('Failed to fetch notifications', err);
      }
    };
    
    fetchNotifications();
  }, [location.pathname, isAuthenticated]);

  const handleNotificationClick = (taskId) => {
    setShowNotifications(false);
    navigate(`/tasks?highlight=${taskId}`);
  };

  return (
    <div 
      className={`flex min-h-screen font-sans transition-colors duration-300 text-slate-900 dark:text-slate-100 ${!user?.theme_color ? 'bg-slate-50 dark:bg-slate-900' : ''}`}
      style={user?.theme_color ? { backgroundColor: user.theme_color } : {}}
    >
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 glass-effect flex items-center justify-between px-8 shrink-0 z-20">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Workspace</h2>
          </div>
          <div className="flex items-center gap-4 relative">
            
            {/* Notification Bell */}
            <div ref={dropdownRef} className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`p-2 rounded-full transition-colors relative ${showNotifications ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                
                {/* Red Dot Badge */}
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border-2 border-white dark:border-slate-900"></span>
                  </span>
                )}
              </button>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {showNotifications && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50 origin-top-right"
                  >
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                      <h3 className="font-semibold text-slate-800 dark:text-slate-100">{t('notifications.title')}</h3>
                      {notifications.length > 0 && (
                        <span className="text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 font-bold px-2 py-0.5 rounded-full">
                          {notifications.length}
                        </span>
                      )}
                    </div>
                    
                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center">
                          <svg className="w-10 h-10 mb-2 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          <p className="text-sm font-medium">{t('notifications.empty')}</p>
                        </div>
                      ) : (
                        <ul className="divide-y divide-slate-100 dark:divide-slate-700/50">
                          {notifications.map((notif, index) => (
                            <li 
                              key={`${notif.id}-${index}`}
                              onClick={() => handleNotificationClick(notif.id)}
                              className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors group flex gap-3 items-start"
                            >
                              <div className={`mt-0.5 shrink-0 rounded-full p-1.5 ${notif.type === 'overdue' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                                {notif.type === 'overdue' ? (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                ) : (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                  {notif.title}
                                </p>
                                <p className={`text-xs mt-1 font-medium ${notif.type === 'overdue' ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                  {notif.type === 'overdue' ? t('notifications.overdue') : t('notifications.dueTomorrow')}
                                </p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {user?.avatar_url ? (
              <img src={`http://localhost:5000${user.avatar_url}`} alt={user.username} className="w-9 h-9 rounded-full object-cover shadow-sm shadow-indigo-500/20 border border-white dark:border-slate-800" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold shadow-sm shadow-indigo-500/20">
                {getInitials(user?.username)}
              </div>
            )}
          </div>
        </header>
        
        <main className="flex-1 overflow-auto bg-slate-50/50 dark:bg-slate-900/50 p-4 sm:p-8 pb-28 sm:pb-8 relative z-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <KeyboardShortcutsManager />
      <PomodoroWidget />
      <MobileBottomNav />
    </div>
  );
};

export default Layout;
