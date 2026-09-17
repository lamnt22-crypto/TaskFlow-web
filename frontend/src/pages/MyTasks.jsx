import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import TaskModal from '../components/TaskModal';
import DeleteModal from '../components/DeleteModal';
import CategoryModal from '../components/CategoryModal';
import AIPlannerModal from '../components/AIPlannerModal';
import AIFilePlannerModal from '../components/AIFilePlannerModal';
import SmartTaskInput from '../components/SmartTaskInput';
import KanbanBoard from '../components/KanbanBoard';
import { getTasks, createTask, updateTask, deleteTask } from '../services/taskService';
import { getCategories } from '../services/categoryService';
import { StatusBadge, PriorityBadge } from '../components/Badge';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { PomodoroContext } from '../context/PomodoroContext';
import { useGamification } from '../context/GamificationContext';

const MyTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('dueDateAsc');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'board'

  const { t, i18n } = useTranslation();
  const { startFocus } = React.useContext(PomodoroContext);
  const { triggerConfetti, fetchStreaks, playTingSound } = useGamification();

  // Modal States
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isAIPlannerModalOpen, setIsAIPlannerModalOpen] = useState(false);
  const [isAIFilePlannerModalOpen, setIsAIFilePlannerModalOpen] = useState(false);

  // Load Categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategories();
        if (data.success && data.data) {
          setCategories(data.data);
        }
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    };
    fetchCategories();
  }, []);

  // Search Debounce
  useEffect(() => {
    const timerId = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 500);
    return () => clearTimeout(timerId);
  }, [searchInput]);

  // Listen for keyboard shortcut event
  useEffect(() => {
    const handleOpenCreateModal = () => handleOpenCreate();
    window.addEventListener('openCreateTaskModal', handleOpenCreateModal);
    return () => window.removeEventListener('openCreateTaskModal', handleOpenCreateModal);
  }, []);

  // Load Tasks based on filters
  const fetchTasks = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setError(null);
    try {
      const params = { sort: sortOrder };
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (priorityFilter !== 'ALL') params.priority = priorityFilter;
      if (categoryFilter !== 'ALL') params.category = categoryFilter;

      const data = await getTasks(params);
      if (data.success) {
        setTasks(data.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || t('tasks.failedFetch'));
      toast.error(t('tasks.failedFetch'));
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [searchQuery, sortOrder, statusFilter, priorityFilter, categoryFilter]);

  // Handlers
  const handleOpenCreate = () => {
    setTaskToEdit(null);
    setIsTaskModalOpen(true);
  };
  const handleOpenEdit = (task) => {
    setTaskToEdit(task);
    setIsTaskModalOpen(true);
  };
  const handleOpenDelete = (task) => {
    setTaskToDelete(task);
    setIsDeleteModalOpen(true);
  };
  const handleSaveTask = async (taskData) => {
    try {
      if (taskToEdit) {
        const response = await updateTask(taskToEdit.id, taskData);
        toast.success(t('tasks.updated'));
        if (response?.data?.gamification || response?.gamification) {
          const gamification = response.data?.gamification || response.gamification;
          triggerConfetti(gamification.allCompleted ? 'massive' : 'small');
          fetchStreaks();
          
          if (gamification.allCompleted) {
             toast.success('🎉 Tuyệt vời! Bạn đã hoàn thành TẤT CẢ công việc hôm nay!', { duration: 4000, icon: '🌟' });
          } else {
             toast.success(`🔥 Chuỗi năng suất: ${gamification.currentStreak} ngày liên tiếp!`, { icon: '🔥' });
          }
        }
      } else {
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
      }
      fetchTasks(false);
    } catch (err) {
      toast.error('Operation failed');
    }
  };

  const handleTaskStatusChange = async (taskId, newStatus) => {
    try {
      const response = await updateTask(taskId, { status: newStatus });
      if (response?.data?.gamification || response?.gamification) {
        const gamification = response.data?.gamification || response.gamification;
        if (newStatus === 'COMPLETED') {
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
      fetchTasks(false);
    } catch (error) {
      toast.error('Failed to update task status');
    }
  };

  const handleDeleteConfirm = async (taskId) => {
    try {
      await deleteTask(taskId);
      toast.success(t('tasks.deleted'));
      fetchTasks(false);
    } catch (err) {
      toast.error('Failed to delete task');
    }
  };
  const handleToggleStatus = async (task) => {
    try {
      const newStatus = task.status === 'COMPLETED' ? 'TODO' : 'COMPLETED';
      const response = await updateTask(task.id, { ...task, status: newStatus });
      toast.success(newStatus === 'COMPLETED' ? 'Task marked as done! 🎉' : 'Task reopened');
      if (newStatus === 'COMPLETED' && (response?.data?.gamification || response?.gamification)) {
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
      fetchTasks(false);
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleExportCSV = () => {
    if (tasks.length === 0) {
      toast.error('Không có dữ liệu để xuất');
      return;
    }

    const BOM = '\uFEFF'; // For Excel UTF-8 support
    let csvContent = BOM + 'ID,Title,Description,Status,Priority,Due Date,Category\n';

    enrichedTasks.forEach(task => {
      const escapeCsv = (str) => {
        if (!str) return '""';
        const stringified = String(str);
        return `"${stringified.replace(/"/g, '""')}"`;
      };

      const row = [
        task.id,
        escapeCsv(task.title),
        escapeCsv(task.description),
        escapeCsv(task.status),
        escapeCsv(task.priority),
        task.due_date ? escapeCsv(new Date(task.due_date).toLocaleDateString()) : '""',
        escapeCsv(task.category ? task.category.name : 'Uncategorized')
      ].join(',');

      csvContent += row + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `TaskFlow_Export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Xuất dữ liệu thành công!', { icon: '📥' });
  };

  // Enrich tasks with category data and group them
  const enrichedTasks = tasks.map(task => {
    const matchedCategory = categories.find(c => c.id === task.category_id);
    return { ...task, category: matchedCategory || null };
  });

  const isToday = (dateStr) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const today = new Date();
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
  };

  const isUpcoming = (dateStr) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return date > today;
  };

  const todayTasks = enrichedTasks.filter(t => t.status !== 'COMPLETED' && isToday(t.due_date));
  const upcomingTasks = enrichedTasks.filter(t => t.status !== 'COMPLETED' && isUpcoming(t.due_date));
  const completedTasks = enrichedTasks.filter(t => t.status === 'COMPLETED');
  
  // Tasks that don't fit Today or Upcoming (e.g. past due non-completed, or no due date)
  const otherTasks = enrichedTasks.filter(task => 
    task.status !== 'COMPLETED' && !isToday(task.due_date) && !isUpcoming(task.due_date)
  );

  const activeCount = todayTasks.length + upcomingTasks.length + otherTasks.length;
  const overdueCount = otherTasks.filter(task => task.due_date && new Date(task.due_date) < new Date()).length;

  const TaskRow = ({ task }) => {
    const priorityColor = task.priority === 'URGENT' || task.priority === 'HIGH' ? 'border-l-rose-500' : task.priority === 'MEDIUM' ? 'border-l-amber-400' : 'border-l-blue-400';
    
    return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      className={`flex items-center justify-between p-4 mb-3 bg-white/90 backdrop-blur-sm rounded-xl border-y border-r border-slate-100 border-l-4 ${priorityColor} shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all group ${task.status === 'COMPLETED' ? 'opacity-60 saturate-50' : ''}`}
    >
      <div className="flex items-start gap-4">
        <button 
          onClick={() => handleToggleStatus(task)}
          className={`mt-0.5 shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${task.status === 'COMPLETED' ? 'bg-emerald-500 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)] scale-110' : 'border-slate-300 hover:border-emerald-500 hover:bg-emerald-50'}`}
        >
          {task.status === 'COMPLETED' && (
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
          )}
        </button>
        <div>
          <h3 className={`font-bold text-[15px] transition-colors duration-300 ${task.status === 'COMPLETED' ? 'text-slate-400 line-through' : 'text-slate-800 group-hover:text-blue-600'}`}>
            {task.title}
          </h3>
          <p className="text-slate-500 text-xs mt-1 line-clamp-1 max-w-2xl">{task.description}</p>
          <div className="flex items-center gap-3 mt-2.5">
            {task.subtasks && task.subtasks.length > 0 && (
              <span className="flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                {task.subtasks.filter(s => s.is_completed).length}/{task.subtasks.length}
              </span>
            )}
            {task.category && (
              <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: task.category.color || '#4f46e5' }}></span>
                {task.category.name}
              </span>
            )}
            <div className="scale-90 origin-left"><PriorityBadge priority={task.priority} /></div>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-6 shrink-0">
        {task.due_date && (
          <div className={`flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg border ${task.status === 'COMPLETED' ? 'bg-slate-50 text-slate-400 border-slate-200' : isToday(task.due_date) ? 'bg-amber-50 text-amber-600 border-amber-200' : new Date(task.due_date) < new Date() ? 'bg-red-50 text-red-600 border-red-200' : 'bg-white text-slate-500 border-slate-200 shadow-sm'}`}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            {isToday(task.due_date) ? (i18n.language === 'vi' ? 'Hôm nay, ' : 'Today, ') : ''}
            {new Date(task.due_date).toLocaleTimeString(i18n.language === 'vi' ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit', ...(isToday(task.due_date) ? {} : { month: 'short', day: 'numeric' }) })}
          </div>
        )}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
          <button onClick={() => startFocus(task)} className="p-2 text-slate-400 hover:text-rose-500 rounded-xl hover:bg-rose-50 transition-colors" title="Start Focus">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </button>
          <button onClick={() => handleOpenEdit(task)} className="p-2 text-slate-400 hover:text-blue-600 rounded-xl hover:bg-blue-50 transition-colors">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          </button>
          <button onClick={() => handleOpenDelete(task)} className="p-2 text-slate-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition-colors">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>
      </div>
    </motion.div>
    );
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto flex flex-col h-full pb-12 relative">
        {/* Soft Background Aurora */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0 opacity-40">
          <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-blue-300/40 to-purple-300/40 blur-[120px]" />
          <div className="absolute top-[20%] -right-[10%] w-[40%] h-[60%] rounded-full bg-gradient-to-bl from-emerald-200/40 to-teal-200/40 blur-[120px]" />
        </div>
        
        <div className="relative z-10 flex flex-col h-full">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 mt-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-extrabold tracking-tight text-slate-800">{t('tasks.title')}</h1>
                <span className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md shadow-blue-500/20">{activeCount} {t('kanban.active')}</span>
              </div>
              <p className="text-slate-500 font-medium text-sm flex flex-wrap items-center gap-4">
                <span>{t('tasks.subtitle')}</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]"></span> {activeCount} {i18n.language === 'vi' ? 'đang hoạt động' : 'active tasks'}</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]"></span> {todayTasks.length} {i18n.language === 'vi' ? 'hạn hôm nay' : 'due today'}</span>
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button 
                onClick={handleExportCSV}
                className="h-11 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 font-bold px-4 rounded-xl shadow-sm transition-all flex items-center gap-2 hover:-translate-y-0.5"
                title="Export to CSV"
              >
                <span className="text-lg">📥</span> <span className="hidden sm:inline">Export</span>
              </button>
              
              <button 
                onClick={() => setIsAIFilePlannerModalOpen(true)}
                className="h-11 bg-white hover:bg-slate-50 text-violet-600 border border-violet-200 hover:border-violet-300 font-bold px-4 rounded-xl shadow-sm transition-all flex items-center gap-2 hover:-translate-y-0.5"
                title="AI Document Plan"
              >
                <span className="text-xl">📄</span> <span className="hidden sm:inline">AI File Plan</span>
              </button>

              <button 
                onClick={() => setIsAIPlannerModalOpen(true)}
                className="h-11 bg-white hover:bg-slate-50 text-indigo-600 border border-indigo-200 hover:border-indigo-300 font-bold px-4 rounded-xl shadow-sm transition-all flex items-center gap-2 hover:-translate-y-0.5"
              >
                <span className="text-xl">🪄</span> AI Smart Plan
              </button>
              
              <button 
                onClick={handleOpenCreate}
                className="h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-6 rounded-xl shadow-lg shadow-indigo-500/30 transition-all flex items-center gap-2 hover:-translate-y-0.5"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                {t('tasks.create')}
              </button>
            </div>
          </div>

          {/* NLP Smart Add Input (Colorful) */}
          <div className="relative mb-8 group z-10">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-300 via-purple-300 to-emerald-300 rounded-[20px] blur opacity-40 group-hover:opacity-70 transition duration-500"></div>
            <div className="relative">
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
                    fetchTasks(false);
                  } catch (err) {
                    toast.error('Failed to create task from smart input');
                  }
                }}
                isSubmitting={false}
              />
            </div>
          </div>

          {/* Integrated Toolbar Section */}
          <div className="bg-white/80 backdrop-blur-md p-3 rounded-2xl shadow-[0_2px_15px_rgba(0,0,0,0.04)] border border-white mb-8 flex flex-row flex-wrap lg:flex-nowrap items-center gap-3">
            <div className="relative flex-1 w-full min-w-[200px] h-11">
              <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input 
                id="global-search-input"
                type="text" 
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={t('tasks.search')} 
                className="w-full h-full pl-10 pr-4 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium placeholder-slate-400 shadow-inner shadow-slate-100/50"
              />
            </div>
            
            <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar flex-shrink-0 w-full lg:w-auto h-11">
              <div className="flex items-center bg-slate-50 border border-slate-100 rounded-xl px-3 h-full">
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent border-none text-xs font-bold text-slate-600 focus:outline-none cursor-pointer uppercase tracking-wider h-full"
                >
                  <option value="ALL">{t('tasks.allStatuses')}</option>
                  <option value="TODO">{t('enums.status.TODO')}</option>
                  <option value="IN_PROGRESS">{t('enums.status.IN_PROGRESS')}</option>
                  <option value="COMPLETED">{t('enums.status.COMPLETED')}</option>
                </select>
              </div>

              <div className="flex items-center bg-slate-50 border border-slate-100 rounded-xl px-3 h-full">
                <select 
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="bg-transparent border-none text-xs font-bold text-slate-600 focus:outline-none cursor-pointer uppercase tracking-wider h-full"
                >
                  <option value="ALL">{t('tasks.allPriorities')}</option>
                  <option value="URGENT">{t('enums.priority.URGENT')}</option>
                  <option value="HIGH">{t('enums.priority.HIGH')}</option>
                  <option value="MEDIUM">{t('enums.priority.MEDIUM')}</option>
                  <option value="LOW">{t('enums.priority.LOW')}</option>
                </select>
              </div>
              
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl pl-3 pr-1.5 h-full">
                <select 
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-transparent border-none text-xs font-bold text-slate-600 focus:outline-none cursor-pointer uppercase tracking-wider max-w-[120px] truncate h-full"
                >
                  <option value="ALL">{t('tasks.allCategories')}</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <div className="w-px h-5 bg-slate-200"></div>
                <button onClick={() => setIsCategoryModalOpen(true)} className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-blue-600 bg-white rounded-md shadow-sm transition-colors shrink-0" title="Manage Categories">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </button>
              </div>

              <div className="flex items-center h-full px-2 ml-auto">
                <select 
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="bg-transparent border-none text-sm font-medium text-slate-600 focus:outline-none cursor-pointer h-full"
                >
                  <option value="dueDateAsc">{t('tasks.sortDueAsc')}</option>
                  <option value="dueDateDesc">{t('tasks.sortDueDesc')}</option>
                  <option value="createdAtDesc">{t('tasks.sortNewest')}</option>
                </select>
              </div>

              <div className="flex items-center gap-1 bg-slate-50 border border-slate-100 rounded-xl p-1 h-11 ml-2 shrink-0">
                <button 
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                  <span className="hidden sm:inline">Danh sách</span>
                </button>
                <button 
                  onClick={() => setViewMode('board')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${viewMode === 'board' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" /></svg>
                  <span className="hidden sm:inline">Bảng</span>
                </button>
              </div>
            </div>
          </div>

        {/* States Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center flex-1 py-12">
            <svg className="animate-spin h-10 w-10 text-indigo-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center flex-1 py-12 bg-red-50/50 dark:bg-red-500/10 rounded-xl border border-red-100 dark:border-red-500/20">
            <p className="text-red-600 dark:text-red-300 mb-6 text-sm">{error}</p>
          </div>
        ) : enrichedTasks.length > 0 ? (
          viewMode === 'board' ? (
            <KanbanBoard tasks={enrichedTasks} onTaskStatusChange={handleTaskStatusChange} />
          ) : (
            <div className="flex flex-col gap-6">
              
              {/* Today */}
              {todayTasks.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                      <span className="p-1.5 bg-amber-100 rounded-lg text-amber-500 shadow-sm">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                      </span>
                      {t('tasks.today')}
                      <span className="bg-amber-100 text-amber-600 px-2.5 py-0.5 rounded-full text-xs font-bold">{todayTasks.length}</span>
                    </h2>
                  </div>
                  <AnimatePresence>
                    {todayTasks.map(task => <TaskRow key={task.id} task={task} />)}
                  </AnimatePresence>
                </div>
              )}

              {/* Other (Past Due / No Date) */}
              {otherTasks.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4 mt-2">
                    <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                      <span className="p-1.5 bg-rose-100 rounded-lg text-rose-500 shadow-sm">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </span>
                      {t('tasks.otherActive')}
                      <span className="bg-rose-100 text-rose-600 px-2.5 py-0.5 rounded-full text-xs font-bold">{otherTasks.length}</span>
                    </h2>
                  </div>
                  <AnimatePresence>
                    {otherTasks.map(task => <TaskRow key={task.id} task={task} />)}
                  </AnimatePresence>
                </div>
              )}

              {/* Upcoming */}
              {upcomingTasks.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4 mt-2">
                    <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                      <span className="p-1.5 bg-blue-100 rounded-lg text-blue-500 shadow-sm">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      </span>
                      {t('tasks.upcoming')}
                      <span className="bg-blue-100 text-blue-600 px-2.5 py-0.5 rounded-full text-xs font-bold">{upcomingTasks.length}</span>
                    </h2>
                  </div>
                  <AnimatePresence>
                    {upcomingTasks.map(task => <TaskRow key={task.id} task={task} />)}
                  </AnimatePresence>
                </div>
              )}

              {/* Completed */}
              {completedTasks.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4 mt-2">
                    <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                      <span className="p-1.5 bg-emerald-100 rounded-lg text-emerald-500 shadow-sm">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                      </span>
                      {t('tasks.completed')}
                      <span className="bg-emerald-100 text-emerald-600 px-2.5 py-0.5 rounded-full text-xs font-bold">{completedTasks.length}</span>
                    </h2>
                  </div>
                  <motion.div layout className="transition-opacity">
                    <AnimatePresence>
                      {completedTasks.map(task => <TaskRow key={task.id} task={task} />)}
                    </AnimatePresence>
                  </motion.div>
                </div>
              )}

            </div>
          )
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center flex-1 py-16 bg-white/50 backdrop-blur-sm rounded-3xl border border-white/60 shadow-[0_4px_20px_rgba(0,0,0,0.02)] mt-8"
          >
            {/* Visual SVG Empty State */}
            <div className="relative w-48 h-48 mb-6 drop-shadow-xl text-blue-200">
              <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="30" y="30" width="140" height="140" rx="30" fill="currentColor" fillOpacity="0.8"/>
                <path d="M70 70H130M70 100H130M70 130H100" stroke="#fff" strokeWidth="12" strokeLinecap="round"/>
                <circle cx="140" cy="140" r="35" fill="url(#grad1)" stroke="#fff" strokeWidth="6" />
                <path d="M130 140L137 147L150 133" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
                <defs>
                  <linearGradient id="grad1" x1="105" y1="105" x2="175" y2="175" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#34d399"/>
                    <stop offset="1" stopColor="#10b981"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">{t('tasks.noTasksFilter')}</h3>
            <p className="text-slate-500 font-medium mb-6">Enjoy your free time, or create a new task.</p>
            <button onClick={handleOpenCreate} className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 transition-all hover:-translate-y-1">
              + {t('tasks.create')}
            </button>
          </motion.div>
        )}
        </div>

        {/* Modals */}
        <TaskModal 
          isOpen={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          task={taskToEdit}
          categories={categories}
          onSave={handleSaveTask}
          onManageCategories={() => setIsCategoryModalOpen(true)}
        />
        
        <DeleteModal 
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          task={taskToDelete}
          onConfirm={handleDeleteConfirm}
        />

        <CategoryModal
          isOpen={isCategoryModalOpen}
          onClose={() => {
            setIsCategoryModalOpen(false);
            // Refresh categories when closing modal
            const fetchCategories = async () => {
              const data = await getCategories();
              if (data.success && data.data) setCategories(data.data);
            };
            fetchCategories();
          }}
        />

        <AIPlannerModal
          isOpen={isAIPlannerModalOpen}
          onClose={() => setIsAIPlannerModalOpen(false)}
          onPlanCreated={() => fetchTasks(true)}
        />

        <AIFilePlannerModal
          isOpen={isAIFilePlannerModalOpen}
          onClose={() => setIsAIFilePlannerModalOpen(false)}
          onPlanCreated={() => fetchTasks(true)}
        />
      </div>
    </Layout>
  );
};

export default MyTasks;
