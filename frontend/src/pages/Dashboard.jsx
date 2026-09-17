import React, { useState, useEffect, useContext } from 'react';
import Layout from '../components/Layout';
import { getTaskStats, getTasks, createTask, updateTask } from '../services/taskService';
import { getCategories } from '../services/categoryService';
import { AuthContext } from '../context/AuthContext';
import { StatusBadge, PriorityBadge } from '../components/Badge';
import { Link } from 'react-router-dom';
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
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, CartesianGrid } from 'recharts';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [todayTasks, setTodayTasks] = useState([]);
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { t, i18n } = useTranslation();
  const { triggerConfetti, fetchStreaks, playTingSound } = useGamification();

  // Chart modes
  const [barChartMode, setBarChartMode] = useState('updated_at'); // 'updated_at' or 'due_date'
  const [pieChartMode, setPieChartMode] = useState('time'); // 'time' or 'tasks'

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
        getCategories()
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

  // Listen for keyboard shortcut event
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

  const handleSaveTask = async (taskData) => {
    try {
      if (taskToEdit) {
        const response = await updateTask(taskToEdit.id, taskData);
        toast.success(t('messages.taskUpdated') || t('tasks.updated') || 'Task updated successfully');
        if (response?.data?.gamification || response?.gamification) {
          const gamification = response.data?.gamification || response.gamification;
          playTingSound();
          triggerConfetti(gamification.allCompleted ? 'massive' : 'small');
          fetchStreaks(); // Refresh streak widget
          
          if (gamification.allCompleted) {
             toast.success('🎉 Tuyệt vời! Bạn đã hoàn thành TẤT CẢ công việc hôm nay!', { duration: 4000, icon: '🌟' });
          } else {
             toast.success(`🔥 Chuỗi năng suất: ${gamification.currentStreak} ngày liên tiếp!`, { icon: '🔥' });
          }
        }
      } else {
        const response = await createTask(taskData);
        toast.success(t('tasks.created') || 'Task created successfully');
        if (response?.data?.gamification || response?.gamification) {
          const gamification = response.data?.gamification || response.gamification;
          playTingSound();
          triggerConfetti(gamification.allCompleted ? 'massive' : 'small');
          fetchStreaks();
          
          if (gamification.allCompleted) {
             toast.success('🎉 Tuyệt vời! Bạn đã hoàn thành TẤT CẢ công việc hôm nay!', { duration: 4000, icon: '🌟' });
          } else {
             toast.success(`🔥 Chuỗi năng suất: ${gamification.currentStreak} ngày liên tiếp!`, { icon: '🔥' });
          }
        }
      }
      fetchData(); // Refresh dashboard
    } catch (err) {
      toast.error('Operation failed');
    }
  };

  const handleToggleStatus = async (task, e) => {
    e.stopPropagation();
    try {
      const newStatus = task.status === 'COMPLETED' ? 'TODO' : 'COMPLETED';
      await updateTask(task.id, { ...task, status: newStatus });
      toast.success(newStatus === 'COMPLETED' ? 'Task marked as done! 🎉' : 'Task reopened');
      if (newStatus === 'COMPLETED') {
        playTingSound();
      }
      fetchData();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const getDayGreeting = () => {
    return t('dashboard.greeting');
  };

  const currentDate = new Date().toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
  const totalCompleted = stats?.completedTasks || 0;
  const totalTasks = stats?.totalTasks || 0;
  const progressPercent = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;

  // Compute Bar Chart Data (7 Days)
  const generateBarData = () => {
    const data = [];
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      // Format as 'Oct 24' like reference
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      let completedCount = 0;
      let createdCount = 0;
      
      allTasks.forEach(task => {
        // Completed Tasks
        if (task.status === 'COMPLETED') {
          const dateField = barChartMode === 'updated_at' ? task.updated_at : task.due_date;
          if (dateField) {
            const targetDate = new Date(dateField);
            if (targetDate.getDate() === d.getDate() && targetDate.getMonth() === d.getMonth() && targetDate.getFullYear() === d.getFullYear()) {
              completedCount++;
            }
          }
        }
        
        // Created Tasks
        if (task.created_at) {
          const createdDate = new Date(task.created_at);
          if (createdDate.getDate() === d.getDate() && createdDate.getMonth() === d.getMonth() && createdDate.getFullYear() === d.getFullYear()) {
            createdCount++;
          }
        }
      });
      data.push({ name: dateStr, completed: completedCount, created: createdCount });
    }
    return data;
  };

  // Compute Pie Chart Data (Category Distribution or Time Analytics)
  const generatePieData = () => {
    if (pieChartMode === 'time' && stats?.categoryPomodoros) {
      return stats.categoryPomodoros.map(item => ({
        name: item.name,
        value: item.value * 25, // Convert Pomodoro sessions to minutes
        color: item.color || '#4f46e5'
      }));
    }

    const filteredTasks = allTasks;
    const categoryCounts = {};
    
    filteredTasks.forEach(t => {
      const catId = t.category_id || 'uncategorized';
      categoryCounts[catId] = (categoryCounts[catId] || 0) + 1;
    });

    const data = [];
    Object.keys(categoryCounts).forEach(catId => {
      if (catId === 'uncategorized') {
        data.push({ name: 'Uncategorized', value: categoryCounts[catId], color: '#94a3b8' });
      } else {
        const cat = categories.find(c => c.id === parseInt(catId));
        if (cat) {
          data.push({ name: cat.name, value: categoryCounts[catId], color: cat.color || '#4f46e5' });
        }
      }
    });
    return data.sort((a,b) => b.value - a.value);
  };

  const barData = generateBarData();
  const pieData = generatePieData();

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    show: { 
      opacity: 1, 
      y: 0, 
      scale: 1, 
      transition: { type: 'spring', stiffness: 100, damping: 15 } 
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto flex flex-col h-full space-y-6 pb-12 relative">
        {/* Soft Background Aurora */}
        <div className="absolute top-0 left-0 w-full h-[600px] overflow-hidden pointer-events-none z-0 opacity-50">
          <div className="absolute -top-[100px] -left-[100px] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-blue-300/40 to-purple-300/40 blur-[100px]" />
          <div className="absolute top-[50px] -right-[100px] w-[400px] h-[400px] rounded-full bg-gradient-to-bl from-emerald-200/40 to-teal-200/40 blur-[100px]" />
        </div>
        
        <div className="relative z-10 w-full flex flex-col h-full space-y-6">
          <AIAssistantWidget />
          {/* Header Stats */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <svg className="animate-spin h-8 w-8 text-indigo-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <p className="text-slate-500 font-medium text-sm">Loading dashboard...</p>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm font-medium">
            {error}
          </div>
        ) : stats ? (
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex flex-col gap-6">
            
            {/* NEW SMART INPUT TOP BAR */}
            <motion.div variants={itemVariants} className="w-full">
              <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-[2px] bg-gradient-to-r from-blue-100 via-purple-100 to-emerald-100">
                <div className="bg-white rounded-[14px] w-full h-full p-2">
                  <SmartTaskInput 
                  onSubmit={async (taskData) => {
                    try {
                      const response = await createTask(taskData);
                      toast.success(t('tasks.created'));
                      if (response?.data?.gamification || response?.gamification) {
                        const gamification = response.data?.gamification || response.gamification;
                        playTingSound();
                        triggerConfetti(gamification.allCompleted ? 'massive' : 'small');
                        fetchStreaks();
                        if (gamification.allCompleted) {
                           toast.success('🎉 Tuyệt vời! Bạn đã hoàn thành TẤT CẢ công việc hôm nay!', { duration: 4000, icon: '🌟' });
                        } else {
                           toast.success(`🔥 Chuỗi năng suất: ${gamification.currentStreak} ngày liên tiếp!`, { icon: '🔥' });
                        }
                      }
                      fetchData();
                    } catch (err) {
                      toast.error('Failed to create task from smart input');
                    }
                  }}
                  isSubmitting={false}
                />
                </div>
              </div>
            </motion.div>

            {/* MAIN 2-COLUMN LAYOUT */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* LEFT COLUMN (Approx 70% / 8 cols) */}
              <div className="lg:col-span-8 flex flex-col gap-6">
                
                {/* 4 STAT CARDS ROW */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Tasks', value: stats.totalTasks || 0, icon: 'M4 6h16M4 10h16M4 14h16M4 18h16', iconColor: 'text-white', iconBg: 'bg-gradient-to-br from-blue-400 to-indigo-500 shadow-blue-500/30', trend: '+12% ⭡', trendColor: 'text-emerald-600 bg-emerald-50' },
                    { label: 'In Progress', value: stats.inProgressTasks || 0, icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', iconColor: 'text-white', iconBg: 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-orange-500/30', trend: '+5% ⭡', trendColor: 'text-emerald-600 bg-emerald-50' },
                    { label: 'Completed', value: stats.completedTasks || 0, icon: 'M5 13l4 4L19 7', iconColor: 'text-white', iconBg: 'bg-gradient-to-br from-emerald-400 to-teal-500 shadow-emerald-500/30', trend: '-2% ⭣', trendColor: 'text-rose-600 bg-rose-50' },
                    { label: 'Overdue', value: stats.overdueTasks || 0, icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z', iconColor: 'text-white', iconBg: 'bg-gradient-to-br from-rose-400 to-pink-500 shadow-rose-500/30', trend: '+1% ⭡', trendColor: 'text-emerald-600 bg-emerald-50' },
                  ].map((stat, idx) => (
                    <motion.div variants={itemVariants} key={idx} className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.02)] relative transition-all hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:-translate-y-1">
                      <div className="flex justify-between items-start mb-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${stat.iconBg} ${stat.iconColor}`}>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={stat.icon} /></svg>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${stat.trendColor}`}>{stat.trend}</span>
                      </div>
                      <div>
                        <p className="text-3xl font-bold text-slate-800 tracking-tight mb-1">{stat.value}</p>
                        <p className="text-slate-400 text-xs font-semibold">{stat.label}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* CHART SECTION */}
                <motion.div variants={itemVariants} className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-bold text-slate-800">Task Analytics</h2>
                    <select 
                      value={barChartMode} 
                      onChange={e => setBarChartMode(e.target.value)}
                      className="text-xs font-semibold px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-slate-600 outline-none cursor-pointer"
                    >
                      <option value="updated_at">This week</option>
                    </select>
                  </div>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={1}/>
                            <stop offset="95%" stopColor="#60a5fa" stopOpacity={0.8}/>
                          </linearGradient>
                          <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#c084fc" stopOpacity={1}/>
                            <stop offset="95%" stopColor="#d8b4fe" stopOpacity={0.8}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} dy={10} />
                        <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} />
                        <RechartsTooltip 
                          cursor={{fill: '#f8fafc'}}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', background: 'rgba(255, 255, 255, 0.95)', color: '#1e293b', fontSize: '12px' }}
                          labelStyle={{ fontWeight: '700', color: '#64748b', marginBottom: '8px' }}
                          itemStyle={{ color: '#0f172a', fontWeight: '600' }}
                        />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 500, paddingTop: '20px', color: '#64748b' }} />
                        <Bar dataKey="completed" name="Completed" stackId="a" fill="url(#colorCompleted)" radius={[0, 0, 6, 6]} barSize={24} />
                        <Bar dataKey="created" name="Created" stackId="a" fill="url(#colorCreated)" radius={[6, 6, 0, 0]} barSize={24} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>

                {/* TABLE SECTION: TODAY'S TASKS */}
                <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] overflow-hidden">
                  <div className="p-6 flex justify-between items-center border-b border-slate-50">
                    <h2 className="text-lg font-bold text-slate-800">Today's Tasks</h2>
                    <div className="flex gap-2">
                      <button onClick={() => setIsAIFilePlannerModalOpen(true)} className="text-xs font-semibold px-3 py-1.5 bg-violet-50 border border-violet-200 rounded-lg text-violet-600 hover:bg-violet-100 transition-colors flex items-center gap-1.5">
                        <span className="text-sm">📄</span> AI File Plan
                      </button>
                      <button onClick={() => setIsAIPlannerModalOpen(true)} className="text-xs font-semibold px-3 py-1.5 bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-600 hover:bg-indigo-100 transition-colors flex items-center gap-1.5">
                        <span className="text-sm">🪄</span> AI Smart Plan
                      </button>
                      <button onClick={handleOpenCreate} className="text-xs font-semibold px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">
                        + New Task
                      </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-50 text-[10px] uppercase tracking-wider text-slate-400 font-bold bg-white">
                          <th className="px-6 py-4 font-bold">Task Title</th>
                          <th className="px-6 py-4 font-bold">Due Date</th>
                          <th className="px-6 py-4 font-bold">Category</th>
                          <th className="px-6 py-4 font-bold">Priority</th>
                          <th className="px-6 py-4 font-bold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {todayTasks.length > 0 ? todayTasks.map((task) => (
                          <tr key={task.id} onClick={() => handleOpenEdit(task)} className="border-b border-slate-50 hover:bg-blue-50/50 cursor-pointer transition-colors group">
                            <td className="px-6 py-4">
                              <p className="text-sm font-bold text-slate-700 group-hover:text-blue-600 transition-colors truncate max-w-[200px]">{task.title}</p>
                            </td>
                            <td className="px-6 py-4 text-xs font-medium text-slate-500">
                              {new Date(task.due_date).toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US', { month: 'short', day: 'numeric' })}
                            </td>
                            <td className="px-6 py-4">
                              {task.category ? (
                                <span className="text-xs font-bold text-slate-600">{task.category.name}</span>
                              ) : (
                                <span className="text-xs font-medium text-slate-400">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <PriorityBadge priority={task.priority} />
                            </td>
                            <td className="px-6 py-4 flex items-center">
                              {task.status === 'COMPLETED' ? (
                                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-wider">
                                  <span className="w-1 h-1 rounded-full bg-emerald-600"></span> Completed
                                </span>
                              ) : (
                                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-600 text-[10px] font-bold uppercase tracking-wider">
                                  <span className="w-1 h-1 rounded-full bg-amber-500"></span> Pending
                                </span>
                              )}
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan="5" className="px-6 py-8 text-center text-sm font-medium text-slate-400">
                              No tasks for today.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              </div>

              {/* RIGHT COLUMN (Approx 30% / 4 cols) */}
              <div className="lg:col-span-4 flex flex-col gap-6">
                
                {/* UPCOMING DEADLINES LIST */}
                <motion.div variants={itemVariants} className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col h-[400px]">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-bold text-slate-800">Upcoming Deadlines</h2>
                    <span className="text-xs font-bold text-blue-500 cursor-pointer hover:text-blue-600">See all</span>
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                    {upcomingTasks.length > 0 ? (
                      <div className="flex flex-col gap-4">
                        {upcomingTasks.slice(0, 5).map(task => (
                          <div 
                            key={task.id} 
                            onClick={() => handleOpenEdit(task)}
                            className="flex items-center gap-4 cursor-pointer group"
                          >
                             <div className="flex items-center justify-center w-10 h-10 bg-blue-50 text-blue-500 rounded-full shrink-0 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                             </div>
                             <div className="flex-1 min-w-0">
                               <p className="font-bold text-slate-800 text-sm truncate group-hover:text-blue-600 transition-colors">{task.title}</p>
                               <p className="text-xs font-medium text-slate-400 truncate mt-0.5">
                                 {task.category ? task.category.name : 'No category'}
                               </p>
                             </div>
                             <div className="text-right shrink-0">
                               <p className="text-xs font-bold text-slate-500">
                                 {new Date(task.due_date).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' })}
                               </p>
                             </div>
                          </div>
                        ))}
                        <button className="w-full mt-2 py-2.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                          New Task
                        </button>
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-400">
                        <p className="text-sm font-medium">No upcoming tasks</p>
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* CATEGORIES PIE CHART (Like Top Sales) */}
                <motion.div variants={itemVariants} className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col h-[400px]">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-bold text-slate-800">
                      {pieChartMode === 'time' ? 'Time Analytics (Mins)' : 'Category Distribution'}
                    </h2>
                    <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                      <button onClick={() => setPieChartMode('time')} className={`px-2 py-1 text-[10px] font-bold rounded-md transition-colors ${pieChartMode === 'time' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>TIME</button>
                      <button onClick={() => setPieChartMode('tasks')} className={`px-2 py-1 text-[10px] font-bold rounded-md transition-colors ${pieChartMode === 'tasks' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>TASKS</button>
                    </div>
                  </div>
                  <div className="flex-1 w-full flex items-center justify-center">
                    {pieData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={90}
                            paddingAngle={2}
                            dataKey="value"
                            stroke="none"
                            cornerRadius={4}
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <RechartsTooltip 
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)', background: '#fff', color: '#0f172a', fontSize: '12px' }}
                            itemStyle={{ fontWeight: '600' }}
                          />
                          <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 600, paddingTop: '10px', color: '#64748b' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-slate-400 font-medium text-sm">No data</p>
                    )}
                  </div>
                </motion.div>

              </div>
            </div>
          </motion.div>
        ) : null}
        </div>
        
        {/* Modals for direct task interaction */}
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
            fetchData(); // Refresh categories when modal closes
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
