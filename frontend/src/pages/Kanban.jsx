import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import TaskCard from '../components/TaskCard';
import TaskModal from '../components/TaskModal';
import DeleteModal from '../components/DeleteModal';
import { getTasks, updateTask, createTask, deleteTask } from '../services/taskService';
import { getCategories } from '../services/categoryService';
import { DndContext, DragOverlay, closestCorners, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useGamification } from '../context/GamificationContext';
import { triggerHaptic } from '../utils/haptics';
import { sounds } from '../utils/soundEffects';

const SortableTask = ({ task, onEdit, onDelete, onStatusChange }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'Task', task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
      <TaskCard
        task={task}
        onEdit={onEdit}
        onDelete={onDelete}
        onStatusChange={onStatusChange}
        isDragging={isDragging}
      />
    </div>
  );
};

const KanbanColumn = ({ statusKey, config, tasks, onEdit, onDelete, onStatusChange, onAddTask, isVi }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: statusKey,
    data: { type: 'Column', title: statusKey },
  });
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col w-full min-w-[285px] sm:min-w-[330px] xl:min-w-0 flex-1"
    >
      {/* Column Header */}
      <div className="flex items-center justify-between mb-3.5 px-1">
        <div className="flex items-center gap-2.5">
          <div className={`w-3 h-3 rounded-full ${config.dotColor} shadow-sm`} />
          <h3 className="font-black text-xs sm:text-sm tracking-widest uppercase text-slate-700 dark:text-slate-200">
            {config.title}
          </h3>
          <span className={`${config.countBg} text-xs font-black px-2.5 py-0.5 rounded-full tabular-nums`}>
            {tasks.length}
          </span>
        </div>
        <button
          type="button"
          onClick={() => onAddTask && onAddTask(statusKey)}
          title={isVi ? 'Thêm việc vào cột này' : 'Add task to column'}
          className="p-1.5 hover:bg-white dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all hover:shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Column Drop Zone */}
      <div
        ref={setNodeRef}
        className={`flex-1 rounded-3xl p-3.5 sm:p-4 min-h-[420px] xl:min-h-[520px] flex flex-col gap-3 transition-all duration-300 border backdrop-blur-md
          ${config.columnBg}
          ${
            isOver
              ? `ring-2 ${config.dropAura} scale-[1.01]`
              : 'border-slate-200/60 dark:border-slate-800/80 shadow-xs'
          }`}
      >
        <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
          <AnimatePresence>
            {tasks.map((task) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                layout
              >
                <SortableTask
                  task={task}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onStatusChange={onStatusChange}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </SortableContext>

        {tasks.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
              isOver
                ? 'border-indigo-300 bg-indigo-50/30 dark:border-indigo-500/40 dark:bg-indigo-950/20'
                : 'border-slate-200 dark:border-slate-700/60 bg-white/20 dark:bg-slate-900/30'
            }`}
          >
            <div className="text-4xl mb-3 opacity-50">{config.emoji}</div>
            <p className="text-sm font-bold text-slate-400 dark:text-slate-500">{t('kanban.dropHere')}</p>
            <button
              type="button"
              onClick={() => onAddTask && onAddTask(statusKey)}
              className="mt-3 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              + {t('tasks.create')}
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

const Kanban = () => {
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState(null);

  // Filters & Mobile Tab
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [mobileColumn, setMobileColumn] = useState('TODO'); // 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'ALL'

  // Modal states
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [defaultStatus, setDefaultStatus] = useState('TODO');

  const { t, i18n } = useTranslation();
  const isVi = i18n.language === 'vi';
  const { triggerCelebration, fetchStreaks, playTingSound } = useGamification();

  const columnConfigs = useMemo(
    () => ({
      TODO: {
        title: t('kanban.todo'),
        emoji: '📋',
        dotColor: 'bg-slate-400',
        dropAura: 'ring-slate-400/40 border-slate-400 bg-slate-50/50 dark:bg-slate-800/60',
        columnBg: 'bg-gradient-to-b from-slate-50/90 to-white/60 dark:from-slate-900/90 dark:to-slate-900/50',
        countBg: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
      },
      IN_PROGRESS: {
        title: t('kanban.inProgress'),
        emoji: '⚡',
        dotColor: 'bg-indigo-500',
        dropAura: 'ring-indigo-500/40 border-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/40',
        columnBg: 'bg-gradient-to-b from-indigo-50/70 to-white/60 dark:from-indigo-950/30 dark:to-slate-900/50',
        countBg: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300',
      },
      COMPLETED: {
        title: t('kanban.done'),
        emoji: '✅',
        dotColor: 'bg-emerald-500',
        dropAura: 'ring-emerald-500/40 border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/40',
        columnBg: 'bg-gradient-to-b from-emerald-50/70 to-white/60 dark:from-emerald-950/30 dark:to-slate-900/50',
        countBg: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300',
      },
    }),
    [t],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
  );

  const fetchBoardData = async () => {
    try {
      const [tasksRes, catRes] = await Promise.all([getTasks(), getCategories()]);
      setCategories(catRes.data || []);

      const enrichedTasks = (tasksRes.data || []).map((task) => ({
        ...task,
        category: (catRes.data || []).find((c) => c.id === task.category_id) || null,
      }));
      setTasks(enrichedTasks);
    } catch (error) {
      console.error('Error fetching board data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoardData();
  }, []);

  useEffect(() => {
    const handleOpenCreateModal = () => handleOpenCreate('TODO');
    window.addEventListener('openCreateTaskModal', handleOpenCreateModal);
    return () => window.removeEventListener('openCreateTaskModal', handleOpenCreateModal);
  }, []);

  const handleStatusChange = async (taskId, newStatus) => {
    const task = tasks.find((item) => item.id === taskId);
    if (!task || task.status === newStatus) return;

    setTasks((prev) => prev.map((item) => (item.id === taskId ? { ...item, status: newStatus } : item)));
    try {
      const response = await updateTask(taskId, { status: newStatus });
      toast.success(t('kanban.movedTo', { status: t(`enums.status.${newStatus}`) }));

      if (newStatus === 'COMPLETED') {
        playTingSound();
        const gamification = response?.data?.gamification || response?.gamification;
        triggerCelebration({
          type: gamification?.allCompleted ? 'all_completed' : 'task_completed',
          taskTitle: task.title,
          xpEarned: 100,
          streakCount: gamification?.currentStreak || 1,
        });
        fetchStreaks();
      }
      fetchBoardData();
    } catch (error) {
      toast.error(isVi ? 'Không thể cập nhật trạng thái' : 'Failed to update task status');
      fetchBoardData();
    }
  };

  const handleDragStart = (event) => {
    const task = tasks.find((item) => item.id === event.active.id);
    setActiveTask(task);
    sounds.playPop();
    triggerHaptic('dragPick');
  };

  const handleDragEnd = async (event) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    sounds.playDrop();
    triggerHaptic('dragDrop');

    let newStatus = over.id;
    if (over.data.current?.type === 'Task') {
      newStatus = over.data.current.task.status;
    }

    await handleStatusChange(active.id, newStatus);
  };

  const handleOpenCreate = (status = 'TODO') => {
    setTaskToEdit(null);
    setDefaultStatus(status);
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
        await updateTask(taskToEdit.id, taskData);
        toast.success(t('tasks.updated'));
      } else {
        await createTask({ ...taskData, status: taskData.status || defaultStatus });
        toast.success(t('tasks.created'));
      }
      fetchBoardData();
    } catch (err) {
      toast.error(isVi ? 'Thao tác thất bại' : 'Operation failed');
    }
  };
  const handleDeleteConfirm = async (taskId) => {
    try {
      await deleteTask(taskId);
      toast.success(t('tasks.deleted'));
      fetchBoardData();
    } catch (err) {
      toast.error(isVi ? 'Xóa thất bại' : 'Failed to delete');
    }
  };

  const filteredTasks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return tasks.filter((task) => {
      if (q && !task.title?.toLowerCase().includes(q)) return false;
      if (priorityFilter !== 'ALL' && task.priority !== priorityFilter) return false;
      if (categoryFilter !== 'ALL' && String(task.category_id) !== String(categoryFilter)) return false;
      return true;
    });
  }, [tasks, searchQuery, priorityFilter, categoryFilter]);

  const todoTasks = filteredTasks.filter((task) => task.status === 'TODO');
  const inProgressTasks = filteredTasks.filter((task) => task.status === 'IN_PROGRESS');
  const completedTasks = filteredTasks.filter((task) => task.status === 'COMPLETED');
  const completionRate = filteredTasks.length > 0 ? Math.round((completedTasks.length / filteredTasks.length) * 100) : 0;

  if (loading) {
    return (
      <Layout>
        <div className="max-w-[1600px] mx-auto flex flex-col h-full pb-12">
          <div className="mb-8 mt-4">
            <div className="h-10 w-64 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse mb-3" />
            <div className="h-5 w-80 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-3xl p-4 border border-slate-200 dark:border-slate-800 space-y-3 min-h-[420px]">
                <div className="h-6 w-36 rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse mb-4" />
                {[0, 1, 2].map((j) => (
                  <div key={j} className="h-28 rounded-2xl bg-slate-200/70 dark:bg-slate-800/70 animate-pulse" />
                ))}
              </div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  const columnGroups = [
    { key: 'TODO', tasks: todoTasks },
    { key: 'IN_PROGRESS', tasks: inProgressTasks },
    { key: 'COMPLETED', tasks: completedTasks },
  ];

  const visibleColumnsOnMobile =
    mobileColumn === 'ALL' ? columnGroups : columnGroups.filter((g) => g.key === mobileColumn);

  return (
    <Layout>
      <div className="max-w-[1600px] mx-auto flex flex-col h-full pb-8 relative">
        <div className="relative z-10 flex flex-col h-full">
          {/* Hero Header */}
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6"
          >
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-1.5">
                <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                  {t('kanban.title')}
                </h1>
                <span className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-3.5 py-1 rounded-full text-xs font-black shadow-md shadow-indigo-500/20 tabular-nums">
                  {filteredTasks.length} {t('kanban.active')}
                </span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-xs sm:text-sm">
                {t('kanban.subtitle')}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
              <div className="flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-xs">
                <Link
                  to="/my-tasks"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-white transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                  {t('kanban.list')}
                </Link>
                <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-bold text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/20 rounded-lg">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                  </svg>
                  {t('kanban.board')}
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleOpenCreate('TODO')}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-2 px-4 rounded-xl shadow-md shadow-indigo-500/25 transition-all flex items-center gap-1.5 text-xs sm:text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                {t('tasks.create')}
              </button>
            </div>
          </motion.div>

          {/* Filter & Search Bar */}
          <div className="bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3 mb-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shadow-xs">
            <div className="relative flex-1 min-w-0">
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('tasks.search')}
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none"
              >
                <option value="ALL">{t('tasks.allPriorities')}</option>
                <option value="URGENT">{t('enums.priority.URGENT')}</option>
                <option value="HIGH">{t('enums.priority.HIGH')}</option>
                <option value="MEDIUM">{t('enums.priority.MEDIUM')}</option>
                <option value="LOW">{t('enums.priority.LOW')}</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none max-w-[160px]"
              >
                <option value="ALL">{t('tasks.allCategories')}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              {(searchQuery || priorityFilter !== 'ALL' || categoryFilter !== 'ALL') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setPriorityFilter('ALL');
                    setCategoryFilter('ALL');
                  }}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/15 whitespace-nowrap"
                >
                  {t('tasks.clearFilters')}
                </button>
              )}
            </div>
          </div>

          {/* Mobile Column Segment Tabs (< md) */}
          <div className="flex md:hidden items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-2xl mb-4 overflow-x-auto hide-scrollbar">
            {[
              { id: 'TODO', label: `${t('kanban.todo')} (${todoTasks.length})` },
              { id: 'IN_PROGRESS', label: `${t('kanban.inProgress')} (${inProgressTasks.length})` },
              { id: 'COMPLETED', label: `${t('kanban.done')} (${completedTasks.length})` },
              { id: 'ALL', label: isVi ? 'Tất cả' : 'All' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setMobileColumn(tab.id)}
                className={`flex-1 whitespace-nowrap px-3 py-2 rounded-xl text-[11px] font-bold transition-colors ${
                  mobileColumn === tab.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Board Columns */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            {/* Mobile view (< md): renders focused tab or all */}
            <div className={`md:hidden ${mobileColumn === 'ALL' ? 'flex gap-4 overflow-x-auto pb-4 hide-scrollbar snap-x snap-mandatory' : 'flex flex-col gap-4'}`}>
              {visibleColumnsOnMobile.map((col) => (
                <div key={col.key} className={mobileColumn === 'ALL' ? 'snap-center shrink-0 w-[86vw]' : 'w-full'}>
                  <KanbanColumn
                    statusKey={col.key}
                    config={columnConfigs[col.key]}
                    tasks={col.tasks}
                    onEdit={handleOpenEdit}
                    onDelete={handleOpenDelete}
                    onStatusChange={handleStatusChange}
                    onAddTask={handleOpenCreate}
                    isVi={isVi}
                  />
                </div>
              ))}
            </div>

            {/* Tablet & Desktop view (md+): grid-cols-3 on xl, smooth horizontal scroll on md-lg */}
            <div className="hidden md:flex xl:grid xl:grid-cols-3 gap-6 overflow-x-auto xl:overflow-visible pb-4 flex-1 items-start hide-scrollbar">
              {columnGroups.map((col) => (
                <KanbanColumn
                  key={col.key}
                  statusKey={col.key}
                  config={columnConfigs[col.key]}
                  tasks={col.tasks}
                  onEdit={handleOpenEdit}
                  onDelete={handleOpenDelete}
                  onStatusChange={handleStatusChange}
                  onAddTask={handleOpenCreate}
                  isVi={isVi}
                />
              ))}
            </div>

            <DragOverlay>
              {activeTask ? (
                <motion.div
                  initial={{ scale: 1, rotate: 0 }}
                  animate={{ scale: 1.04, rotate: 2 }}
                  className="opacity-95 rounded-2xl"
                >
                  <TaskCard task={activeTask} />
                </motion.div>
              ) : null}
            </DragOverlay>
          </DndContext>

          {/* Footer Progress Bar */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-5 bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs"
          >
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <svg width={52} height={52} className="transform -rotate-90">
                  <circle cx={26} cy={26} r={21} fill="none" stroke="currentColor" strokeWidth={4} className="text-slate-200 dark:text-slate-800" />
                  <circle
                    cx={26}
                    cy={26}
                    r={21}
                    fill="none"
                    stroke="url(#statsGrad)"
                    strokeWidth={4}
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 21}
                    strokeDashoffset={2 * Math.PI * 21 * (1 - completionRate / 100)}
                    className="transition-all duration-1000 ease-out"
                  />
                  <defs>
                    <linearGradient id="statsGrad" x1="0" y1="0" x2="52" y2="52">
                      <stop stopColor="#6366f1" />
                      <stop offset="1" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[11px] font-black text-indigo-600 dark:text-indigo-400 tabular-nums">
                  {completionRate}%
                </span>
              </div>
              <div>
                <h4 className="font-bold text-slate-800 dark:text-white text-sm">{t('kanban.weeklyStage')}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {t('kanban.completedOf', { completed: completedTasks.length, total: filteredTasks.length })}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 w-full max-w-sm">
              <div className="flex justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  {t('kanban.todo')} ({todoTasks.length})
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  {t('kanban.inProgress')} ({inProgressTasks.length})
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  {t('kanban.done')} ({completedTasks.length})
                </span>
              </div>
              <div className="flex h-2.5 w-full rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                {filteredTasks.length > 0 && (
                  <>
                    <div
                      style={{ width: `${(todoTasks.length / filteredTasks.length) * 100}%` }}
                      className="bg-slate-400 transition-all duration-500"
                    />
                    <div
                      style={{ width: `${(inProgressTasks.length / filteredTasks.length) * 100}%` }}
                      className="bg-indigo-500 transition-all duration-500"
                    />
                    <div
                      style={{ width: `${(completedTasks.length / filteredTasks.length) * 100}%` }}
                      className="bg-emerald-500 transition-all duration-500"
                    />
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        <TaskModal
          isOpen={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          task={taskToEdit}
          categories={categories}
          onSave={handleSaveTask}
          onManageCategories={() => {}}
        />
        <DeleteModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          task={taskToDelete}
          onConfirm={handleDeleteConfirm}
        />
      </div>
    </Layout>
  );
};

export default Kanban;
