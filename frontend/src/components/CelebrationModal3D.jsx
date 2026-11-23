import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { sounds } from '../utils/soundEffects';
import { triggerHaptic } from '../utils/haptics';

const CelebrationModal3D = ({ 
  isOpen, 
  onClose, 
  type = 'task_completed', // 'task_completed' | 'streak_record' | 'all_completed' | 'level_up'
  taskTitle = '',
  xpEarned = 100,
  streakCount = 3,
  level = 4,
  levelTitle = 'Bậc Thầy Năng Suất'
}) => {
  const trophyRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      sounds.playLevelUpFanfare();
      triggerHaptic('levelUp');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
        {/* Backdrop with Aurora Blur */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-2xl"
        />

        {/* Dynamic Light Rays in Background */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
          <div className="w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-indigo-500/20 via-purple-500/30 to-amber-400/20 blur-[100px] animate-pulse" />
        </div>

        {/* 3D Celebration Stage Dialog */}
        <motion.div
          initial={{ scale: 0.8, y: 50, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.85, y: 30, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="relative z-10 w-full max-w-md bg-gradient-to-b from-slate-900/90 to-slate-950/95 border border-amber-500/30 dark:border-white/15 rounded-3xl p-8 shadow-[0_25px_70px_-15px_rgba(245,158,11,0.35)] text-center overflow-hidden flex flex-col items-center"
        >
          {/* Top Shiny Border Beam */}
          <div className="absolute top-0 left-1/4 right-1/4 h-[3px] bg-gradient-to-r from-transparent via-amber-400 to-transparent blur-[1px]" />

          {/* Close button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>

          {/* 3D Interactive Trophy / Hologram Emblem */}
          <div className="relative my-3 perspective-1000 w-36 h-36 flex items-center justify-center">
            {/* Spinning Aura Rings */}
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
              className="absolute inset-0 rounded-full border border-dashed border-amber-400/40"
            />
            <motion.div 
              animate={{ rotate: -360 }}
              transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
              className="absolute inset-2 rounded-full border border-indigo-500/30"
            />

            {/* Glowing 3D Emblem Container */}
            <motion.div
              ref={trophyRef}
              animate={{ 
                y: [0, -10, 0],
                rotateY: [0, 15, -15, 0]
              }}
              transition={{ 
                duration: 4, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
              style={{ transformStyle: 'preserve-3d' }}
              className="relative w-28 h-28 rounded-3xl bg-gradient-to-tr from-amber-500 via-yellow-300 to-amber-600 p-[2px] shadow-[0_0_50px_rgba(245,158,11,0.5)] flex items-center justify-center"
            >
              <div className="w-full h-full rounded-[22px] bg-slate-900/90 flex flex-col items-center justify-center relative overflow-hidden backdrop-blur-md">
                {/* Shimmer Light Reflection */}
                <motion.div 
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
                />
                
                {/* 3D Trophy / Medal Icon */}
                <span className="text-5xl select-none filter drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]">
                  {type === 'streak_record' ? '🔥' : type === 'all_completed' ? '👑' : '🏆'}
                </span>
              </div>
            </motion.div>

            {/* Orbiting Sparkles */}
            <motion.div
              animate={{ 
                scale: [0.8, 1.2, 0.8],
                opacity: [0.6, 1, 0.6]
              }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute -top-1 -right-1 text-2xl"
            >
              ✨
            </motion.div>
            <motion.div
              animate={{ 
                scale: [1.2, 0.8, 1.2],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{ repeat: Infinity, duration: 2.5, delay: 0.5 }}
              className="absolute -bottom-1 -left-1 text-xl"
            >
              ⚡
            </motion.div>
          </div>

          {/* Heading with Glowing Gradient */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <span className="inline-block px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-widest bg-amber-500/10 text-amber-400 border border-amber-500/30 mb-2 shadow-xs">
              {type === 'streak_record' ? 'Kỷ Lục Chuỗi Mới' : type === 'all_completed' ? 'Hoàn Thành Xuất Sắc' : 'Nhiệm Vụ Hoàn Tất'}
            </span>
            <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-400 to-yellow-100 tracking-tight">
              {type === 'streak_record' ? `🔥 Chuỗi ${streakCount} Ngày Rực Lửa!` : 'TUYỆT VỜI! LEVEL UP!'}
            </h2>
            {taskTitle && (
              <p className="text-slate-300 text-sm mt-1 line-clamp-1 font-medium">
                "{taskTitle}"
              </p>
            )}
          </motion.div>

          {/* Rewards Grid: XP & Streak */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="w-full grid grid-cols-2 gap-3 my-5"
          >
            {/* XP Card */}
            <div className="bg-slate-800/80 border border-amber-400/20 rounded-2xl p-3 flex flex-col items-center relative overflow-hidden">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Kinh nghiệm</span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-amber-400 text-xl font-black">+{xpEarned}</span>
                <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300">XP</span>
              </div>
            </div>

            {/* Streak Card */}
            <div className="bg-slate-800/80 border border-orange-500/20 rounded-2xl p-3 flex flex-col items-center relative overflow-hidden">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Streak</span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-orange-400 text-xl font-black">{streakCount}</span>
                <span className="text-xs font-bold text-slate-300">Ngày 🔥</span>
              </div>
            </div>
          </motion.div>

          {/* Level Progress Bar */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="w-full bg-slate-800/60 rounded-xl p-3 border border-white/5 mb-6"
          >
            <div className="flex justify-between items-center text-xs font-bold mb-1.5">
              <span className="text-indigo-400">Level {level}: {levelTitle}</span>
              <span className="text-slate-400">75% tới Level {level + 1}</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-700 overflow-hidden relative">
              <motion.div 
                initial={{ width: '40%' }}
                animate={{ width: '75%' }}
                transition={{ duration: 1, ease: 'easeOut', delay: 0.4 }}
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-400 shadow-[0_0_12px_rgba(99,102,241,0.6)]"
              />
            </div>
          </motion.div>

          {/* Action Button */}
          <motion.button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-sm tracking-wide shadow-[0_10px_30px_rgba(245,158,11,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Tiếp Tục Chinh Phục</span>
            <svg className="w-4 h-4 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
          </motion.button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CelebrationModal3D;
