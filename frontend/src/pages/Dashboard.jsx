import React, { useState, useEffect, useContext } from 'react';
import Layout from '../components/Layout';
import { getTaskStats, getTasks, createTask, updateTask } from '../services/taskService';
import { getCategories } from '../services/categoryService';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { PriorityBadge } from '../components/Badge';
import { Link, useNavigate } from 'react-router-dom';
import TaskModal from '../components/TaskModal';
import AIAssistantWidget from '../components/AIAssistantWidget';
import CategoryModal from '../components/CategoryModal';
import AIPlannerModal from '../components/AIPlannerModal';
import AIFilePlannerModal from '../components/AIFilePlannerModal';
import SmartTaskInput from '../components/SmartTaskInput';
import ProductivityHeatmap from '../components/ProductivityHeatmap';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useGamification } from '../context/GamificationContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
} from 'recharts';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const { isDarkMode } = useContext(ThemeContext);
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [todayTasks, setTodayTasks] = useState([]);
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { t, i18n } = useTranslation();
  const isVi = i18n.language === 'vi';
  const { triggerConfetti, fetchStreaks, playTingSound } = useGamification();

  // Chart modes
  const [barChartMode, setBarChartMode] = useState('updated_at'); // 'updated_at' | 'due_date'
  const [pieChartMode, setPieChartMode] = useState('tasks'); // 'time' | 'tasks'

  // Modal states
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isAIPlannerModalOpen, setIsAIPlannerModalOpen] = useState(false);
  const [isAIFilePlannerModalOpen, setIsAIFilePlannerModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [statsData, todayData, upcomingData, allData, catsData] = await Promise.all([
        getTaskStats(),
        getTasks({ dueDate: 'today' }),
        getTasks({ dueDate: 'upcoming', sort: 'dueDateAsc' }),
        getTasks(),
        getCategories(),
      ]);

      if (statsData.success) setStats(statsData.data);
      if (todayData.success) setTodayTasks(todayData.data || []);
      if (upcomingData.success) setUpcomingTasks(upcomingData.data || []);
      if (allData.success) setAllTasks(allData.data || []);
      if (catsData.success) setCategories(catsData.data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const handleOpenCreateModal = () => handleOpenCreate();
    window.addEventListener('openCreateTaskModal', handleOpenCreateModal);
    return () => window.removeEventListener('openCreateTaskModal', handleOpenCreateModal);
  }, []);

  const handleOpenCreate = () => {
    setTaskToEdit(null);
    setIsTaskModalOpen(true);
  };

  const handleOpenEdit = (task) => {
    setTaskToEdit(task);
    setIsTaskModalOpen(true);
  };

  const handleGamificationResponse = (response) => {
    const gamification = response?.data?.gamification || response?.gamification;
    if (!gamification) return;
    playTingSound();
    triggerConfetti(gamification.allCompleted ? 'massive' : 'small');
    fetchStreaks();
    if (gamification.allCompleted) {
      toast.success(
        isVi
          ? '🎉 Tuyệt vời! Bạn đã hoàn thành TẤT CẢ công việc hôm nay!'
          : '🎉 Amazing! You completed ALL tasks for today!',
        { duration: 4000, icon: '🌟' },
      );
    } else {
      toast.success(
        isVi
          ? `🔥 Chuỗi năng suất: ${gamification.currentStreak} ngày liên tiếp!`
          : `🔥 Productivity streak: ${gamification.currentStreak} days!`,
        { icon: '🔥' },
      );
    }
  };

  const handleSaveTask = async (taskData) => {
    try {
      if (taskToEdit) {
        const response = await updateTask(taskToEdit.id, taskData);
        toast.success(t('tasks.updated'));
        handleGamificationResponse(response);
      } else {
        const response = await createTask(taskData);
        toast.success(t('tasks.created'));
        handleGamificationResponse(response);
      }
      fetchData();
    } catch (err) {
      toast.error(isVi ? 'Thao tác thất bại' : 'Operation failed');
    }
  };

  const handleToggleStatus = async (task, e) => {
    e.stopPropagation();
    try {
      const newStatus = task.status === 'COMPLETED' ? 'TODO' : 'COMPLETED';
      const response = await updateTask(task.id, { status: newStatus });
      toast.success(
        newStatus === 'COMPLETED'
          ? isVi
            ? 'Đã hoàn thành công việc! 🎉'
            : 'Task marked as done! 🎉'
          : isVi
            ? 'Đã mở lại công việc'
            : 'Task reopened',
      );
      if (newStatus === 'COMPLETED') {
        playTingSound();
        handleGamificationResponse(response);
      }
      fetchData();
    } catch (err) {
      toast.error(isVi ? 'Không thể cập nhật trạng thái' : 'Failed to update status');
    }
  };

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (isVi) {
      if (hour < 12) return 'Chào buổi sáng';
      if (hour < 18) return 'Chào buổi chiều';
      return 'Chào buổi tối';
    }
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getRelativeDueLabel = (dateStr) => {
    if (!dateStr) return '';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    const diffDays = Math.round((target - today) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return isVi ? `Quá hạn ${Math.abs(diffDays)}n` : `${Math.abs(diffDays)}d overdue`;
    if (diffDays === 0) return isVi ? 'Hôm nay' : 'Today';
    if (diffDays === 1) return isVi ? 'Ngày mai' : 'Tomorrow';
    return isVi ? `Còn ${diffDays} ngày` : `In ${diffDays}d`;
  };

  const currentDate = new Date().toLocaleDateString(isVi ? 'vi-VN' : 'en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const totalCompleted = stats?.completedTasks || 0;
  const totalTasks = stats?.totalTasks || 0;
  const inProgressTasks = stats?.inProgressTasks || 0;
  const overdueTasks = stats?.overdueTasks || 0;
  const remainingTasks = Math.max(0, totalTasks - totalCompleted);
  const progressPercent = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;
  const inProgressPercent = totalTasks > 0 ? Math.round((inProgressTasks / totalTasks) * 100) : 0;

  const todayDoneCount = todayTasks.filter((item) => item.status === 'COMPLETED').length;
  const todayProgressPercent =
    todayTasks.length > 0 ? Math.round((todayDoneCount / todayTasks.length) * 100) : 0;

  // Compute Bar Chart Data (7 Days)
  const generateBarData = () => {
    const data = [];
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString(isVi ? 'vi-VN' : 'en-US', { month: 'short', day: 'numeric' });

      let completedCount = 0;
      let createdCount = 0;

      allTasks.forEach((task) => {
        if (task.status === 'COMPLETED') {
          const dateField = barChartMode === 'updated_at' ? task.updated_at : task.due_date;
          if (dateField) {
            const targetDate = new Date(dateField);
            if (
              targetDate.getDate() === d.getDate() &&
              targetDate.getMonth() === d.getMonth() &&
              targetDate.getFullYear() === d.getFullYear()
            ) {
              completedCount++;
            }
          }
        }

        if (task.created_at) {
          const createdDate = new Date(task.created_at);
          if (
            createdDate.getDate() === d.getDate() &&
            createdDate.getMonth() === d.getMonth() &&
            createdDate.getFullYear() === d.getFullYear()
          ) {
            createdCount++;
          }
        }
      });
      data.push({ name: dateStr, completed: completedCount, created: createdCount });
    }
    return data;
  };

  // Compute Pie Chart Data
  const generatePieData = () => {
    if (pieChartMode === 'time' && stats?.categoryPomodoros?.length > 0) {
      return stats.categoryPomodoros.map((item) => ({
        name: item.name,
        value: item.value * 25,
        color: item.color || '#4f46e5',
      }));
    }

    const categoryCounts = {};
    allTasks.forEach((task) => {
      const catId = task.category_id || 'uncategorized';
      categoryCounts[catId] = (categoryCounts[catId] || 0) + 1;
    });

    const data = [];
    Object.keys(categoryCounts).forEach((catId) => {
      if (catId === 'uncategorized') {
        data.push({
          name: isVi ? 'Chưa phân loại' : 'Uncategorized',
          value: categoryCounts[catId],
          color: '#94a3b8',
        });
      } else {
        const cat = categories.find((c) => c.id === parseInt(catId, 10));
        if (cat) {
          data.push({ name: cat.name, value: categoryCounts[catId], color: cat.color || '#4f46e5' });
        }
      }
    });
    return data.sort((a, b) => b.value - a.value);
  };

  const barData = generateBarData();
  const pieData = generatePieData();

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 18, scale: 0.98 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: 'spring', stiffness: 180, damping: 20 },
    },
  };

  const tooltipStyles = {
    borderRadius: '12px',
    border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(226,232,240,0.9)',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.18)',
    background: isDarkMode ? '#0f172a' : 'rgba(255, 255, 255, 0.96)',
    color: isDarkMode ? '#f1f5f9' : '#0f172a',
    fontSize: '12px',
  };

  const kpiCards = [
    {
      label: isVi ? 'Tổng công việc' : 'Total Tasks',
      value: totalTasks,
      sublabel: isVi ? `${remainingTasks} việc đang mở` : `${remainingTasks} open tasks`,
      icon: 'M4 6h16M4 10h16M4 14h16M4 18h16',
      iconBg: 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/25',
      pillClass: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/15 dark:text-indigo-300',
      onClick: () => navigate('/my-tasks'),
    },
    {
      label: isVi ? 'Đang thực hiện' : 'In Progress',
      value: inProgressTasks,
      sublabel: `${inProgressPercent}% ${isVi ? 'khối lượng' : 'of workload'}`,
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
      iconBg: 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-orange-500/25',
      pillClass: 'text-amber-600 bg-amber-50 dark:bg-amber-500/15 dark:text-amber-300',
      onClick: () => navigate('/kanban'),
    },
    {
      label: isVi ? 'Đã hoàn thành' : 'Completed',
      value: totalCompleted,
      sublabel: isVi ? `Đạt ${progressPercent}%` : `${progressPercent}% done`,
      icon: 'M5 13l4 4L19 7',
      iconBg: 'bg-gradient-to-br from-emerald-400 to-teal-500 shadow-emerald-500/25',
      pillClass: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/15 dark:text-emerald-300',
      onClick: () => navigate('/my-tasks'),
    },
    {
      label: isVi ? 'Quá hạn' : 'Overdue',
      value: overdueTasks,
      sublabel:
        overdueTasks > 0
          ? isVi
            ? 'Cần xử lý ngay'
            : 'Needs attention'
          : isVi
            ? 'Đúng tiến độ ✓'
            : 'On track ✓',
      icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
      iconBg:
        overdueTasks > 0
          ? 'bg-gradient-to-br from-rose-500 to-pink-600 shadow-rose-500/25'
          : 'bg-gradient-to-br from-slate-400 to-slate-500 shadow-slate-500/20',
      pillClass:
        overdueTasks > 0
          ? 'text-rose-600 bg-rose-50 dark:bg-rose-500/15 dark:text-rose-300'
          : 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/15 dark:text-emerald-300',
      onClick: () => navigate('/my-tasks'),
    },
  ];

  return (
    <Layout>
      <div className="max-w-6xl mx-auto flex flex-col space-y-6 pb-8 relative">
        {/* Soft Background Aurora */}
        <div className="absolute top-0 left-0 w-full h-[500px] overflow-hidden pointer-events-none z-0 opacity-40 dark:opacity-25">
          <div className="absolute -top-[100px] -left-[100px] w-[420px] h-[420px] rounded-full bg-gradient-to-br from-blue-300/40 to-purple-300/40 blur-[100px]" />
          <div className="absolute top-[40px] -right-[100px] w-[360px] h-[360px] rounded-full bg-gradient-to-bl from-emerald-200/40 to-teal-200/40 blur-[100px]" />
        </div>

        <div className="relative z-10 w-full flex flex-col space-y-6">
          {/* Personalized Greeting & Daily Focus Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/90 dark:bg-slate-900/90 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1">
                {currentDate}
              </p>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight truncate">
                {getTimeGreeting()}, {user?.username || 'TaskFlow'} 👋
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-2.5">
                <div className="w-40 sm:w-52 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-500"
                    style={{ width: `${todayTasks.length > 0 ? todayProgressPercent : progressPercent}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
                  {todayTasks.length > 0
                    ? isVi
                      ? `Hôm nay: ${todayDoneCount}/${todayTasks.length} việc (${todayProgressPercent}%)`
                      : `Today: ${todayDoneCount}/${todayTasks.length} done (${todayProgressPercent}%)`
                    : isVi
                      ? `Tổng tiến độ: ${progressPercent}%`
                      : `Overall progress: ${progressPercent}%`}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsAIPlannerModalOpen(true)}
                className="px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 hover:bg-indigo-100 dark:hover:bg-indigo-500/25 transition-colors flex items-center gap-1.5"
              >
                <span>🪄</span>
                <span>{isVi ? 'AI Lập Kế Hoạch' : 'AI Smart Plan'}</span>
              </button>
              <button
                type="button"
                onClick={handleOpenCreate}
                className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-md shadow-indigo-500/20 transition-all flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                <span>{t('tasks.create')}</span>
              </button>
            </div>
          </div>

          <div className="w-full shrink-0">
            <AIAssistantWidget />
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 py-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-28 rounded-2xl bg-slate-200/70 dark:bg-slate-800/70 animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm font-medium">
              {error}
            </div>
          ) : stats ? (
            <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex flex-col gap-6">
              {/* Quick Capture Smart Input */}
              <motion.div variants={itemVariants} className="w-full">
                <SmartTaskInput
                  className="mb-0"
                  onSubmit={async (taskData) => {
                    try {
                      const response = await createTask(taskData);
                      toast.success(t('tasks.created'));
                      handleGamificationResponse(response);
                      fetchData();
                    } catch (err) {
                      toast.error(isVi ? 'Không thể tạo công việc' : 'Failed to create task');
                    }
                  }}
                  isSubmitting={false}
                />
              </motion.div>

              {/* MAIN 2-COLUMN LAYOUT */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* LEFT COLUMN */}
                <div className="lg:col-span-8 flex flex-col gap-6 min-w-0">
                  {/* 4 Real-Data KPI Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {kpiCards.map((stat, idx) => (
                      <motion.button
                        type="button"
                        variants={itemVariants}
                        key={idx}
                        onClick={stat.onClick}
                        className="text-left bg-white/95 dark:bg-slate-900/90 backdrop-blur-sm border border-slate-100 dark:border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xs relative transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
                      >
                        <div className="flex justify-between items-start mb-3 gap-2 w-full">
                          <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shadow-md shrink-0 text-white ${stat.iconBg}`}>
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={stat.icon} />
                            </svg>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full truncate max-w-[96px] ${stat.pillClass}`}>
                            {stat.sublabel}
                          </span>
                        </div>
                        <div>
                          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight tabular-nums mb-0.5">
                            {stat.value}
                          </p>
                          <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold truncate">
                            {stat.label}
                          </p>
                        </div>
                      </motion.button>
                    ))}
                  </div>

                  {/* TODAY'S TASKS (Actionable Mobile Cards + Desktop Table) */}
                  <motion.div
                    variants={itemVariants}
                    className="bg-white/95 dark:bg-slate-900/90 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden"
                  >
                    <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2.5">
                        <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white">
                          {isVi ? 'Công việc hôm nay' : "Today's Tasks"}
                        </h2>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 tabular-nums">
                          {todayTasks.length}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setIsAIFilePlannerModalOpen(true)}
                          className="text-xs font-semibold px-3 py-1.5 bg-violet-50 dark:bg-violet-500/15 border border-violet-200 dark:border-violet-500/30 rounded-lg text-violet-600 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-500/25 transition-colors flex items-center gap-1.5"
                        >
                          <span className="text-sm">📄</span> {isVi ? 'Tệp AI' : 'AI File Plan'}
                        </button>
                        <button
                          onClick={handleOpenCreate}
                          className="text-xs font-semibold px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        >
                          + {isVi ? 'Thêm việc' : 'New Task'}
                        </button>
                      </div>
                    </div>

                    {/* Mobile Card View (< md) */}
                    <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
                      {todayTasks.length > 0 ? (
                        todayTasks.map((task) => {
                          const isDone = task.status === 'COMPLETED';
                          return (
                            <div
                              key={task.id}
                              onClick={() => handleOpenEdit(task)}
                              className="p-4 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                            >
                              <button
                                type="button"
                                onClick={(e) => handleToggleStatus(task, e)}
                                aria-label="Toggle task completion"
                                className={`mt-0.5 w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors ${
                                  isDone
                                    ? 'bg-emerald-500 border-emerald-500 text-white'
                                    : 'border-slate-300 dark:border-slate-600 hover:border-indigo-500'
                                }`}
                              >
                                {isDone && (
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </button>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-bold truncate ${isDone ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-100'}`}>
                                  {task.title}
                                </p>
                                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                  <PriorityBadge priority={task.priority} />
                                  {task.category && (
                                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                      #{task.category.name}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="px-4 py-8 text-center text-sm text-slate-400">
                          {t('dashboard.noTasksToday')}
                        </div>
                      )}
                    </div>

                    {/* Desktop Table View (md+) */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] uppercase tracking-wider text-slate-400 font-bold bg-slate-50/50 dark:bg-slate-900">
                            <th className="pl-6 pr-2 py-3.5 w-10" />
                            <th className="px-4 py-3.5">{isVi ? 'Tên công việc' : 'Task Title'}</th>
                            <th className="px-4 py-3.5">{isVi ? 'Danh mục' : 'Category'}</th>
                            <th className="px-4 py-3.5">{isVi ? 'Ưu tiên' : 'Priority'}</th>
                            <th className="px-6 py-3.5">{isVi ? 'Trạng thái' : 'Status'}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {todayTasks.length > 0 ? (
                            todayTasks.map((task) => {
                              const isDone = task.status === 'COMPLETED';
                              return (
                                <tr
                                  key={task.id}
                                  onClick={() => handleOpenEdit(task)}
                                  className="border-b last:border-b-0 border-slate-50 dark:border-slate-800/70 hover:bg-indigo-50/40 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group"
                                >
                                  <td className="pl-6 pr-2 py-3.5">
                                    <button
                                      type="button"
                                      onClick={(e) => handleToggleStatus(task, e)}
                                      aria-label="Toggle completion"
                                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                                        isDone
                                          ? 'bg-emerald-500 border-emerald-500 text-white'
                                          : 'border-slate-300 dark:border-slate-600 hover:border-indigo-500'
                                      }`}
                                    >
                                      {isDone && (
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                      )}
                                    </button>
                                  </td>
                                  <td className="px-4 py-3.5">
                                    <p className={`text-sm font-bold truncate max-w-[240px] transition-colors ${isDone ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'}`}>
                                      {task.title}
                                    </p>
                                  </td>
                                  <td className="px-4 py-3.5">
                                    {task.category ? (
                                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                        {task.category.name}
                                      </span>
                                    ) : (
                                      <span className="text-xs text-slate-400">-</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3.5">
                                    <PriorityBadge priority={task.priority} />
                                  </td>
                                  <td className="px-6 py-3.5">
                                    {isDone ? (
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        {t('enums.status.COMPLETED')}
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                        {t(`enums.status.${task.status}`)}
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan="5" className="px-6 py-8 text-center text-sm font-medium text-slate-400">
                                {t('dashboard.noTasksToday')}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>

                  {/* CHART SECTION */}
                  <motion.div
                    variants={itemVariants}
                    className="bg-white/95 dark:bg-slate-900/90 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xs"
                  >
                    <div className="flex flex-wrap justify-between items-center mb-4 sm:mb-6 gap-3">
                      <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white">
                        {isVi ? 'Thống kê 7 ngày qua' : 'Task Analytics (7 Days)'}
                      </h2>
                      <select
                        value={barChartMode}
                        onChange={(e) => setBarChartMode(e.target.value)}
                        className="text-xs font-semibold px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 outline-none cursor-pointer"
                      >
                        <option value="updated_at">{isVi ? 'Theo ngày hoàn thành' : 'By completion date'}</option>
                        <option value="due_date">{isVi ? 'Theo hạn chót' : 'By due date'}</option>
                      </select>
                    </div>
                    <div className="h-60 sm:h-72 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6366f1" stopOpacity={1} />
                              <stop offset="95%" stopColor="#818cf8" stopOpacity={0.85} />
                            </linearGradient>
                            <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#c084fc" stopOpacity={1} />
                              <stop offset="95%" stopColor="#d8b4fe" stopOpacity={0.85} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#1e293b' : '#f1f5f9'} />
                          <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: isDarkMode ? '#94a3b8' : '#64748b', fontWeight: 600 }}
                            dy={8}
                          />
                          <YAxis
                            allowDecimals={false}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: isDarkMode ? '#94a3b8' : '#64748b', fontWeight: 600 }}
                          />
                          <RechartsTooltip
                            cursor={{ fill: isDarkMode ? 'rgba(255,255,255,0.04)' : '#f8fafc' }}
                            contentStyle={tooltipStyles}
                            labelStyle={{ fontWeight: '700', color: isDarkMode ? '#cbd5e1' : '#475569', marginBottom: '6px' }}
                          />
                          <Legend
                            iconType="circle"
                            wrapperStyle={{ fontSize: '12px', fontWeight: 500, paddingTop: '16px', color: isDarkMode ? '#cbd5e1' : '#64748b' }}
                          />
                          <Bar
                            dataKey="completed"
                            name={isVi ? 'Hoàn thành' : 'Completed'}
                            stackId="a"
                            fill="url(#colorCompleted)"
                            radius={[0, 0, 6, 6]}
                            barSize={22}
                          />
                          <Bar
                            dataKey="created"
                            name={isVi ? 'Tạo mới' : 'Created'}
                            stackId="a"
                            fill="url(#colorCreated)"
                            radius={[6, 6, 0, 0]}
                            barSize={22}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </motion.div>

                  {/* 90-Day Productivity Heatmap */}
                  <motion.div variants={itemVariants}>
                    <ProductivityHeatmap />
                  </motion.div>
                </div>

                {/* RIGHT COLUMN */}
                <div className="lg:col-span-4 flex flex-col gap-6 min-w-0">
                  {/* UPCOMING DEADLINES LIST */}
                  <motion.div
                    variants={itemVariants}
                    className="bg-white/95 dark:bg-slate-900/90 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col min-h-[340px] lg:h-[400px]"
                  >
                    <div className="flex justify-between items-center mb-5">
                      <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white">
                        {t('dashboard.upcomingDeadlines')}
                      </h2>
                      <Link to="/my-tasks" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                        {t('dashboard.viewAll')}
                      </Link>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                      {upcomingTasks.length > 0 ? (
                        <div className="flex flex-col gap-3.5">
                          {upcomingTasks.slice(0, 6).map((task) => {
                            const relLabel = getRelativeDueLabel(task.due_date);
                            const isUrgentDue = relLabel === 'Hôm nay' || relLabel === 'Today' || relLabel.includes('overdue') || relLabel.includes('Quá hạn');
                            return (
                              <div
                                key={task.id}
                                onClick={() => handleOpenEdit(task)}
                                className="flex items-center gap-3 p-2 -mx-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer group transition-colors"
                              >
                                <div className="flex items-center justify-center w-9 h-9 bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                    {task.title}
                                  </p>
                                  <p className="text-xs font-medium text-slate-400 truncate mt-0.5">
                                    {task.category ? task.category.name : isVi ? 'Không danh mục' : 'No category'}
                                  </p>
                                </div>
                                <span
                                  className={`text-[10px] font-bold px-2 py-1 rounded-lg shrink-0 ${
                                    isUrgentDue
                                      ? 'bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-300'
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                                  }`}
                                >
                                  {relLabel}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 py-8 text-center">
                          <p className="text-sm font-medium mb-3">{t('dashboard.noUpcoming')}</p>
                          <button
                            onClick={handleOpenCreate}
                            className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-300"
                          >
                            + {t('tasks.create')}
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>

                  {/* CATEGORIES PIE CHART */}
                  <motion.div
                    variants={itemVariants}
                    className="bg-white/95 dark:bg-slate-900/90 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col h-[360px] sm:h-[400px]"
                  >
                    <div className="flex justify-between items-center mb-4 gap-2">
                      <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white truncate">
                        {pieChartMode === 'time'
                          ? isVi
                            ? 'Thời gian tập trung (phút)'
                            : 'Focus Time (Mins)'
                          : isVi
                            ? 'Phân bổ theo Danh mục'
                            : 'Category Distribution'}
                      </h2>
                      <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 shrink-0">
                        <button
                          onClick={() => setPieChartMode('tasks')}
                          className={`px-2 py-1 text-[10px] font-bold rounded-md transition-colors ${pieChartMode === 'tasks' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-300' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >
                          {isVi ? 'VIỆC' : 'TASKS'}
                        </button>
                        <button
                          onClick={() => setPieChartMode('time')}
                          className={`px-2 py-1 text-[10px] font-bold rounded-md transition-colors ${pieChartMode === 'time' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-300' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >
                          {isVi ? 'GIỜ' : 'TIME'}
                        </button>
                      </div>
                    </div>
                    <div className="flex-1 w-full flex items-center justify-center min-h-0">
                      {pieData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              innerRadius="58%"
                              outerRadius="82%"
                              paddingAngle={2}
                              dataKey="value"
                              stroke="none"
                              cornerRadius={4}
                            >
                              {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <RechartsTooltip contentStyle={tooltipStyles} itemStyle={{ fontWeight: '600' }} />
                            <Legend
                              iconType="circle"
                              wrapperStyle={{ fontSize: '12px', fontWeight: 600, paddingTop: '8px', color: isDarkMode ? '#cbd5e1' : '#64748b' }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <p className="text-slate-400 font-medium text-sm">{isVi ? 'Chưa có dữ liệu' : 'No data'}</p>
                      )}
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          ) : null}
        </div>

        <TaskModal
          isOpen={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          task={taskToEdit}
          categories={categories}
          onSave={handleSaveTask}
          onManageCategories={() => setIsCategoryModalOpen(true)}
        />

        <CategoryModal
          isOpen={isCategoryModalOpen}
          onClose={() => {
            setIsCategoryModalOpen(false);
            fetchData();
          }}
        />

        <AIPlannerModal
          isOpen={isAIPlannerModalOpen}
          onClose={() => setIsAIPlannerModalOpen(false)}
          onPlanCreated={() => fetchData()}
        />

        <AIFilePlannerModal
          isOpen={isAIFilePlannerModalOpen}
          onClose={() => setIsAIFilePlannerModalOpen(false)}
          onPlanCreated={() => fetchData()}
        />
      </div>
    </Layout>
  );
};

export default Dashboard;
