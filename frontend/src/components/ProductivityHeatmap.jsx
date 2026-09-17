import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../services/api';
import { format, subDays, startOfDay } from 'date-fns';

const ProductivityHeatmap = () => {
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const response = await api.get('/gamification');
        if (response.data.success) {
          setActivity(response.data.data.activity);
        }
      } catch (error) {
        console.error('Failed to fetch activity heatmap', error);
      } finally {
        setLoading(false);
      }
    };
    fetchActivity();
  }, []);

  // Generate last 90 days of data for the heatmap
  const days = Array.from({ length: 90 }, (_, i) => {
    const d = subDays(startOfDay(new Date()), 89 - i);
    return d;
  });

  const getActivityForDate = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const record = activity.find(a => a.activity_date.startsWith(dateStr));
    return record ? record.tasks_completed : 0;
  };

  const getIntensityClass = (count) => {
    if (count === 0) return 'bg-slate-100 dark:bg-slate-800';
    if (count <= 2) return 'bg-green-200 dark:bg-green-900/40';
    if (count <= 5) return 'bg-green-400 dark:bg-green-700/60';
    if (count <= 8) return 'bg-green-500 dark:bg-green-600/80';
    return 'bg-green-600 dark:bg-green-500';
  };

  if (loading) return <div className="h-24 animate-pulse bg-slate-200 dark:bg-slate-700 rounded-xl"></div>;

  return (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
      <h3 className="font-semibold text-slate-800 dark:text-white mb-4">Biểu đồ năng suất</h3>
      
      <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide">
        {days.map((date, index) => {
          const count = getActivityForDate(date);
          const intensityClass = getIntensityClass(count);
          
          return (
            <motion.div
              key={date.toISOString()}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.005 }}
              className={`w-3.5 h-3.5 rounded-[3px] flex-shrink-0 cursor-pointer transition-colors ${intensityClass}`}
              title={`${format(date, 'dd/MM/yyyy')}: ${count} tasks`}
              whileHover={{ scale: 1.2 }}
            />
          );
        })}
      </div>
      <div className="flex items-center gap-2 mt-3 text-xs text-slate-500 dark:text-slate-400">
        <span>Ít</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-[3px] bg-slate-100 dark:bg-slate-800"></div>
          <div className="w-3 h-3 rounded-[3px] bg-green-200 dark:bg-green-900/40"></div>
          <div className="w-3 h-3 rounded-[3px] bg-green-400 dark:bg-green-700/60"></div>
          <div className="w-3 h-3 rounded-[3px] bg-green-500 dark:bg-green-600/80"></div>
          <div className="w-3 h-3 rounded-[3px] bg-green-600 dark:bg-green-500"></div>
        </div>
        <span>Nhiều</span>
      </div>
    </div>
  );
};

export default ProductivityHeatmap;
