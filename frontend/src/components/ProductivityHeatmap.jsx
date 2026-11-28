import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { format, subDays, startOfDay } from 'date-fns';

const ProductivityHeatmap = () => {
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const { i18n } = useTranslation();
  const isVi = i18n.language === 'vi';

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const response = await api.get('/gamification');
        if (response.data.success) {
          setActivity(response.data.data?.activity || []);
        }
      } catch (error) {
        console.error('Failed to fetch activity heatmap', error);
      } finally {
        setLoading(false);
      }
    };
    fetchActivity();
  }, []);

  const days = Array.from({ length: 90 }, (_, i) => subDays(startOfDay(new Date()), 89 - i));

  const getActivityForDate = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const record = activity.find((a) => a.activity_date?.startsWith(dateStr));
    return record ? record.tasks_completed : 0;
  };

  const totalCompleted90Days = activity.reduce((sum, item) => sum + (item.tasks_completed || 0), 0);

  const getIntensityClass = (count) => {
    if (count === 0) return 'bg-slate-100 dark:bg-slate-800/90';
    if (count <= 2) return 'bg-emerald-200 dark:bg-emerald-900/60';
    if (count <= 5) return 'bg-emerald-400 dark:bg-emerald-700/80';
    if (count <= 8) return 'bg-emerald-500 dark:bg-emerald-500';
    return 'bg-emerald-600 dark:bg-emerald-400';
  };

  if (loading) {
    return <div className="h-32 animate-pulse bg-slate-200 dark:bg-slate-800 rounded-2xl" />;
  }

  return (
    <div className="bg-white/95 dark:bg-slate-900/90 p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white">
            {isVi ? 'Biểu đồ nhịp độ 90 ngày' : '90-Day Productivity Heatmap'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isVi
              ? `${totalCompleted90Days} công việc hoàn thành trong 3 tháng gần đây`
              : `${totalCompleted90Days} tasks completed in the last 90 days`}
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
          <span>{isVi ? 'Ít' : 'Less'}</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-[3px] bg-slate-100 dark:bg-slate-800/90" />
            <div className="w-3 h-3 rounded-[3px] bg-emerald-200 dark:bg-emerald-900/60" />
            <div className="w-3 h-3 rounded-[3px] bg-emerald-400 dark:bg-emerald-700/80" />
            <div className="w-3 h-3 rounded-[3px] bg-emerald-500 dark:bg-emerald-500" />
            <div className="w-3 h-3 rounded-[3px] bg-emerald-600 dark:bg-emerald-400" />
          </div>
          <span>{isVi ? 'Nhiều' : 'More'}</span>
        </div>
      </div>

      <div className="overflow-x-auto hide-scrollbar pb-1">
        <div className="grid grid-flow-col grid-rows-7 gap-1.5 min-w-[460px]">
          {days.map((date, index) => {
            const count = getActivityForDate(date);
            const intensityClass = getIntensityClass(count);

            return (
              <motion.div
                key={date.toISOString()}
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: Math.min(index * 0.003, 0.25) }}
                className={`w-3.5 h-3.5 rounded-[4px] cursor-pointer transition-colors ${intensityClass}`}
                title={`${format(date, 'dd/MM/yyyy')}: ${count} ${isVi ? 'công việc' : 'tasks'}`}
                whileHover={{ scale: 1.25 }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProductivityHeatmap;
