import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGamification } from '../context/GamificationContext';

const StreakWidget = () => {
  const { streaks, fetchStreaks } = useGamification();

  useEffect(() => {
    fetchStreaks();
  }, [fetchStreaks]);

  const hasStreak = streaks.current_streak > 0;

  return (
    <motion.div 
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
      title={`Chuỗi hiện tại: ${streaks.current_streak} ngày. Kỷ lục: ${streaks.highest_streak} ngày.`}
    >
      <div className="relative">
        <span className={`text-xl ${hasStreak ? '' : 'grayscale opacity-50'}`}>🔥</span>
        {hasStreak && (
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute inset-0 bg-orange-500 blur-md rounded-full -z-10 opacity-30"
          />
        )}
      </div>
      <span className={`font-bold ${hasStreak ? 'text-orange-500 dark:text-orange-400' : 'text-slate-500 dark:text-slate-400'}`}>
        {streaks.current_streak}
      </span>
    </motion.div>
  );
};

export default StreakWidget;
