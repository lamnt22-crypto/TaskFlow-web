import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { prioritizeTasks } from '../services/aiService';
import HolographicOrb3D from './HolographicOrb3D';
import { sounds } from '../utils/soundEffects';
import { triggerHaptic } from '../utils/haptics';

const AIAssistantWidget = () => {
  const { i18n } = useTranslation();
  const isVi = i18n.language === 'vi';

  const [recommendation, setRecommendation] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [, setActiveAction] = useState(null);

  const fetchRecommendation = async () => {
    setIsLoading(true);
    sounds.playHologramPulse();
    triggerHaptic('light');
    try {
      const data = await prioritizeTasks();
      if (data && data.recommendation) {
        setRecommendation(data.recommendation);
      } else {
        setRecommendation(
          isVi
            ? 'Hôm nay hãy tập trung vào các công việc có mức độ khẩn cấp cao để duy trì chuỗi Streak!'
            : 'Focus on high-urgency tasks today to maintain your peak productivity streak!'
        );
      }
    } catch (error) {
      console.error('Failed to fetch AI recommendation:', error);
      setRecommendation(
        isVi
          ? 'Chào bạn! Hệ thống đề xuất bạn hoàn thành 2 công việc quan trọng nhất trước 12:00 trưa để đạt hiệu suất 100%.'
          : 'Welcome! Complete your top 2 priority tasks before noon for optimal workflow efficiency.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendation();
  }, [i18n.language]);

  const handleQuickAction = (actionName) => {
    setActiveAction(actionName);
    sounds.playPop();
    triggerHaptic('medium');
    fetchRecommendation();
    setTimeout(() => setActiveAction(null), 2000);
  };

  return (
    <div 
      style={{ minHeight: '150px', width: '100%', flexShrink: 0 }}
      className="w-full shrink-0 mb-6 relative overflow-hidden rounded-3xl p-[1.5px] bg-gradient-to-r from-cyan-500 via-indigo-500 to-fuchsia-500 shadow-[0_15px_40px_-10px_rgba(99,102,241,0.2)] group block"
    >
      {/* Dynamic Ambient Background Aura */}
      <div className="absolute top-0 -left-20 w-60 h-60 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none group-hover:scale-125 transition-transform duration-700" />
      <div className="absolute bottom-0 -right-20 w-60 h-60 rounded-full bg-fuchsia-500/15 blur-3xl pointer-events-none group-hover:scale-125 transition-transform duration-700" />

      {/* Main Glass Content Container */}
      <div 
        style={{ minHeight: '150px' }}
        className="relative z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-[22px] p-6 sm:p-7 flex flex-col md:flex-row items-center gap-6 border border-slate-200/80 dark:border-white/10"
      >
        {/* Left: 3D Holographic Orb */}
        <div className="flex-shrink-0 cursor-pointer" onClick={() => fetchRecommendation()}>
          <HolographicOrb3D size="lg" isThinking={isLoading} />
        </div>
        
        {/* Center: AI Insights & Content */}
        <div className="flex-1 text-center md:text-left min-w-0">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 mb-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.25)]">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              TaskFlow AI Quantum Orb
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">
              {isVi ? '• Trợ lý thời gian thực' : '• Real-time AI Assistant'}
            </span>
          </div>

          <h3 className="font-extrabold text-lg sm:text-xl text-slate-900 dark:text-white tracking-tight mb-2">
            {isVi ? 'Đề Xuất Năng Suất Cá Nhân Hóa ✨' : 'Personalized Productivity Insights ✨'}
          </h3>

          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-2 py-1"
              >
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-full w-5/6 mx-auto md:mx-0 animate-pulse" />
                <div className="h-4 bg-slate-200/70 dark:bg-slate-800/60 rounded-full w-2/3 mx-auto md:mx-0 animate-pulse" />
              </motion.div>
            ) : (
              <motion.p 
                key="content"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed font-normal"
              >
                {recommendation}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Quick AI Action Pills */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-white/5">
            <button
              onClick={() => handleQuickAction('prioritize')}
              disabled={isLoading}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white bg-slate-100 dark:bg-white/5 hover:bg-cyan-500/10 dark:hover:bg-cyan-500/20 border border-slate-200 dark:border-white/10 hover:border-cyan-400/40 transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <span>{isVi ? '⚡ Phân tích ưu tiên' : '⚡ Prioritize Tasks'}</span>
            </button>
            <button
              onClick={() => handleQuickAction('focus')}
              disabled={isLoading}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white bg-slate-100 dark:bg-white/5 hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20 border border-slate-200 dark:border-white/10 hover:border-indigo-400/40 transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <span>{isVi ? '🎯 Lập kế hoạch 3 bước' : '🎯 3-Step Action Plan'}</span>
            </button>
            <button
              onClick={() => handleQuickAction('streak')}
              disabled={isLoading}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-fuchsia-600 dark:hover:text-white bg-slate-100 dark:bg-white/5 hover:bg-fuchsia-500/10 dark:hover:bg-fuchsia-500/20 border border-slate-200 dark:border-white/10 hover:border-fuchsia-400/40 transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <span>{isVi ? '🔥 Tối ưu Streak' : '🔥 Boost Streak'}</span>
            </button>
          </div>
        </div>

        {/* Right Refresh Trigger */}
        <div className="shrink-0 flex items-center">
          <button
            onClick={() => fetchRecommendation()}
            disabled={isLoading}
            className="p-3 rounded-2xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/15 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer shadow-sm"
            title={isVi ? 'Làm mới phân tích AI' : 'Refresh AI insights'}
          >
            <svg className={`w-5 h-5 ${isLoading ? 'animate-spin text-cyan-500' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIAssistantWidget;
