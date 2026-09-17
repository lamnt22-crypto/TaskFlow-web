import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { prioritizeTasks } from '../services/aiService';

const AIAssistantWidget = () => {
  const [recommendation, setRecommendation] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendation = async () => {
      try {
        const data = await prioritizeTasks();
        setRecommendation(data.recommendation);
      } catch (error) {
        console.error('Failed to fetch AI recommendation:', error);
        setRecommendation('Có lỗi xảy ra khi lấy gợi ý từ AI.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRecommendation();
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, type: 'spring' }}
      className="mb-6 relative overflow-hidden rounded-2xl p-[1px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-purple-500/20"
    >
      <div className="bg-white dark:bg-slate-900 h-full w-full rounded-2xl p-5 flex flex-col md:flex-row items-center gap-4 relative z-10">
        <div className="flex-shrink-0 relative">
          <div className="w-12 h-12 flex items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 dark:text-indigo-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          {isLoading && (
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="absolute -inset-1 rounded-full border-2 border-transparent border-t-purple-500"
            />
          )}
        </div>
        
        <div className="flex-1 text-center md:text-left">
          <h3 className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 mb-1 flex items-center justify-center md:justify-start gap-2">
            Trợ lý AI Thông Minh ✨
          </h3>
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mx-auto md:mx-0 animate-pulse"
              />
            ) : (
              <motion.p 
                key="content"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-slate-700 dark:text-slate-300 font-medium"
              >
                {recommendation}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      {/* Dynamic Background Effect */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 rounded-full bg-purple-500/20 blur-2xl animate-pulse" />
      <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-32 h-32 rounded-full bg-indigo-500/20 blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
    </motion.div>
  );
};

export default AIAssistantWidget;
