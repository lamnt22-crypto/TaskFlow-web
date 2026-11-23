import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { triggerHaptic } from '../utils/haptics';
import { sounds } from '../utils/soundEffects';

const navItems = [
  {
    to: '/dashboard',
    label: 'Tổng quan',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    )
  },
  {
    to: '/my-tasks',
    label: 'Nhiệm vụ',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    )
  },
  {
    to: '/kanban',
    label: 'Kanban',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
      </svg>
    )
  },
  {
    to: '/calendar',
    label: 'Lịch',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    )
  }
];

const MobileBottomNav = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-3 left-4 right-4 z-40 md:hidden">
      <div className="bg-slate-900/90 dark:bg-slate-950/95 backdrop-blur-2xl border border-white/15 rounded-3xl p-1.5 shadow-[0_10px_35px_rgba(0,0,0,0.5)] flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => {
                triggerHaptic('light');
                sounds.playPop();
              }}
              className="relative flex flex-col items-center justify-center py-2 px-3 rounded-2xl flex-1 text-center transition-colors"
            >
              {isActive && (
                <motion.div
                  layoutId="mobileNavActivePill"
                  transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                  className="absolute inset-0 bg-indigo-600/25 border border-indigo-400/40 rounded-2xl"
                />
              )}
              <div className={`relative z-10 ${isActive ? 'text-indigo-400 scale-110' : 'text-slate-400'} transition-all`}>
                {item.icon}
              </div>
              <span className={`relative z-10 text-[10px] font-bold mt-1 tracking-tight ${isActive ? 'text-white' : 'text-slate-400'}`}>
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
