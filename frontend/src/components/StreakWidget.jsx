import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useGamification } from '../context/GamificationContext';

const StreakWidget = ({ compact = false }) => {
  const { streaks, fetchStreaks } = useGamification();
  const { i18n } = useTranslation();
  const isVi = i18n.language === 'vi';

  useEffect(() => {
    fetchStreaks();
  }, [fetchStreaks]);

  const currentStreak = streaks?.current_streak || 0;
  const highestStreak = streaks?.highest_streak || 0;
  const hasStreak = currentStreak > 0;

  if (compact) {
    return (
      <div
        className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl border transition-colors ${
          hasStreak
            ? 'bg-orange-500/15 border-orange-500/30 text-orange-400'
            : 'bg-slate-800/70 border-slate-700/60 text-slate-400'
        }`}
        title={
          isVi
            ? `Chuỗi hiện tại: ${currentStreak} ngày • Kỷ lục: ${highestStreak} ngày`
            : `Current streak: ${currentStreak} days • Best: ${highestStreak} days`
        }
      >
        <span className={`text-base leading-none ${hasStreak ? '' : 'grayscale opacity-60'}`}>🔥</span>
        <span className="text-[11px] font-black tabular-nums mt-1">{currentStreak}</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ scale: 0.96, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border transition-all ${
        hasStreak
          ? 'bg-gradient-to-r from-orange-500/15 via-amber-500/10 to-transparent border-orange-500/30'
          : 'bg-slate-800/70 border-slate-700/60 hover:border-slate-600'
      }`}
      title={
        isVi
          ? `Chuỗi hiện tại: ${currentStreak} ngày • Kỷ lục: ${highestStreak} ngày`
          : `Current streak: ${currentStreak} days • Best: ${highestStreak} days`
      }
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="relative shrink-0">
          <span className={`text-xl leading-none ${hasStreak ? '' : 'grayscale opacity-60'}`}>🔥</span>
          {hasStreak && (
            <motion.div
              animate={{ scale: [1, 1.25, 1], opacity: [0.45, 0.85, 0.45] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute inset-0 bg-orange-500 blur-md rounded-full -z-10 opacity-30"
            />
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-baseline gap-1.5">
            <span className={`text-sm font-black tabular-nums ${hasStreak ? 'text-orange-400' : 'text-slate-200'}`}>
              {currentStreak}
            </span>
            <span className="text-xs font-semibold text-slate-300 truncate">
              {isVi ? 'ngày streak' : currentStreak === 1 ? 'day streak' : 'days streak'}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 truncate">
            {isVi ? `Kỷ lục: ${highestStreak} ngày` : `Best: ${highestStreak} days`}
          </p>
        </div>
      </div>

      <span
        className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
          hasStreak
            ? 'bg-orange-500/20 text-orange-300 border border-orange-400/30'
            : 'bg-slate-700/70 text-slate-400'
        }`}
      >
        {hasStreak ? (isVi ? 'Đang cháy' : 'Active') : isVi ? 'Mới' : 'Ready'}
      </span>
    </motion.div>
  );
};

export default StreakWidget;
