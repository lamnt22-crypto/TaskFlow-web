import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import StreakWidget from './StreakWidget';
import LanguageToggle from './LanguageToggle';

const Sidebar = ({
  collapsed = false,
  onToggleCollapse,
  mobileOpen = false,
  onCloseMobile,
}) => {
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);
  const { logout } = useContext(AuthContext);
  const { t } = useTranslation();

  const navItems = [
    {
      to: '/dashboard',
      label: t('nav.dashboard'),
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
    },
    {
      to: '/my-tasks',
      label: t('nav.myTasks'),
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
    {
      to: '/kanban',
      label: t('nav.kanban'),
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
        </svg>
      ),
    },
    {
      to: '/calendar',
      label: t('nav.calendar'),
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
  ];

  const renderSidebarBody = (isCollapsed = false, isMobileDrawer = false) => (
    <>
      <div className={`h-16 flex items-center border-b border-slate-800/60 shrink-0 ${isCollapsed ? 'justify-center px-2' : 'justify-between px-5'}`}>
        <div className="flex items-center gap-2.5 overflow-hidden">
          <svg className="w-6 h-6 text-indigo-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {!isCollapsed && (
            <h1 className="text-xl font-bold text-white tracking-tight truncate">TaskFlow</h1>
          )}
        </div>

        {isMobileDrawer ? (
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close navigation menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        ) : onToggleCollapse ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={`p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ${isCollapsed ? 'hidden' : ''}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        ) : null}
      </div>

      {isCollapsed && onToggleCollapse && !isMobileDrawer && (
        <div className="px-3 pt-3 flex justify-center">
          <button
            type="button"
            onClick={onToggleCollapse}
            title="Expand sidebar"
            aria-label="Expand sidebar"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      <nav className={`flex-1 overflow-y-auto hide-scrollbar ${isCollapsed ? 'px-2.5 py-4' : 'px-4 py-6'} space-y-2`}>
        {!isCollapsed && (
          <div className="text-xs font-semibold text-slate-500 mb-3 px-2 tracking-wider">MAIN NAVIGATION</div>
        )}

        {navItems.map((item) => (
          <motion.div key={item.to} whileHover={{ scale: 1.02, x: isCollapsed ? 0 : 2 }} whileTap={{ scale: 0.98 }}>
            <NavLink
              to={item.to}
              onClick={isMobileDrawer ? onCloseMobile : undefined}
              title={isCollapsed ? item.label : undefined}
              className={({ isActive }) =>
                `flex items-center ${isCollapsed ? 'justify-center px-2 py-3' : 'gap-3 px-4 py-2.5'} rounded-lg transition-all duration-200 ${
                  isActive ? 'bg-indigo-600/15 text-indigo-400 font-medium' : 'hover:bg-slate-800/80 hover:text-white'
                }`
              }
            >
              {item.icon}
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          </motion.div>
        ))}

        {!isCollapsed && (
          <div className="py-2">
            <StreakWidget />
          </div>
        )}

        {!isCollapsed && (
          <div className="pt-4 pb-1">
            <div className="text-xs font-semibold text-slate-500 mb-3 px-2 tracking-wider">PREFERENCES</div>
          </div>
        )}

        {!isCollapsed && (
          <div className="px-4 mb-2 flex justify-start">
            <LanguageToggle />
          </div>
        )}

        <button
          type="button"
          onClick={toggleTheme}
          title={isCollapsed ? (isDarkMode ? t('profile.darkMode') : t('profile.lightMode')) : undefined}
          className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2 py-3' : 'justify-between px-4 py-2.5'} rounded-lg hover:bg-slate-800/80 hover:text-white transition-all duration-200 text-slate-400 group`}
        >
          <div className="flex items-center gap-3">
            {isDarkMode ? (
              <svg className="w-5 h-5 text-indigo-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-amber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            )}
            {!isCollapsed && <span>{isDarkMode ? t('profile.darkMode') : t('profile.lightMode')}</span>}
          </div>
          {!isCollapsed && (
            <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${isDarkMode ? 'bg-indigo-500' : 'bg-slate-700'}`}>
              <div className={`w-3 h-3 bg-white rounded-full shadow-sm transform transition-transform ${isDarkMode ? 'translate-x-4' : 'translate-x-0'}`}></div>
            </div>
          )}
        </button>

        {!isCollapsed && (
          <div className="pt-2 pb-1">
            <div className="text-xs font-semibold text-slate-500 mb-3 px-2 tracking-wider">ACCOUNT</div>
          </div>
        )}

        <NavLink
          to="/profile"
          onClick={isMobileDrawer ? onCloseMobile : undefined}
          title={isCollapsed ? t('nav.profile') : undefined}
          className={({ isActive }) =>
            `flex items-center ${isCollapsed ? 'justify-center px-2 py-3' : 'gap-3 px-4 py-2.5'} rounded-lg transition-all duration-200 ${
              isActive ? 'bg-indigo-600/15 text-indigo-400 font-medium' : 'hover:bg-slate-800/80 hover:text-white'
            }`
          }
        >
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          {!isCollapsed && <span className="truncate">{t('nav.profile')}</span>}
        </NavLink>
      </nav>

      <div className="p-3 sm:p-4 border-t border-slate-800/60 shrink-0">
        <button
          type="button"
          onClick={() => {
            if (isMobileDrawer && onCloseMobile) onCloseMobile();
            logout();
          }}
          title={isCollapsed ? t('nav.logout') : undefined}
          className={`flex items-center ${isCollapsed ? 'justify-center px-2 py-3' : 'gap-3 px-4 py-3'} w-full rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors`}
        >
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {!isCollapsed && <span>{t('nav.logout')}</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex ${
          collapsed ? 'w-20' : 'w-64'
        } bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-xl border-r border-slate-800 dark:border-slate-900 text-slate-300 flex-col h-screen sticky top-0 transition-all duration-300 z-20 shadow-2xl shadow-indigo-900/20 shrink-0`}
      >
        {renderSidebarBody(collapsed, false)}
      </aside>

      {/* Mobile / Tablet Slide-Over Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onCloseMobile}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 360, damping: 34 }}
              className="relative w-72 max-w-[85vw] h-full bg-slate-900 dark:bg-slate-950 border-r border-slate-800 text-slate-300 flex flex-col z-10 shadow-2xl"
            >
              {renderSidebarBody(false, true)}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
