import React, { useState, useEffect } from 'react';
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

/* ═══════════════════════════════════════════
   Column Configuration
   ═══════════════════════════════════════════ */
const COLUMN_CONFIG = {
  TODO: {
    title: 'VIỆC CẦN LÀM',
    emoji: '📋',
    dotColor: 'bg-slate-400',
    headerGradient: 'from-slate-500 to-slate-600',
    dropAura: 'ring-slate-400/40 border-slate-400 bg-slate-50/50 dark:bg-slate-800/60 shadow-[0_0_40px_-8px_rgba(100,116,139,0.25)]',
    columnBg: 'bg-gradient-to-b from-slate-50/80 to-white/40 dark:from-slate-900/80 dark:to-slate-900/40 border-slate-200/80 dark:border-slate-800',
    countBg: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  },
  IN_PROGRESS: {
    title: 'ĐANG TIẾN HÀNH',
    emoji: '⚡',
    dotColor: 'bg-indigo-500',
    headerGradient: 'from-indigo-500 to-purple-600',
    dropAura: 'ring-indigo-500/40 border-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/40 shadow-[0_0_40px_-8px_rgba(99,102,241,0.25)]',
    columnBg: 'bg-gradient-to-b from-indigo-50/60 to-white/40 dark:from-indigo-950/30 dark:to-slate-900/40 border-indigo-100 dark:border-indigo-900/40',
    countBg: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300',
  },
  COMPLETED: {
    title: 'XONG',
    emoji: '✅',
    dotColor: 'bg-emerald-500',
    headerGradient: 'from-emerald-500 to-teal-600',
    dropAura: 'ring-emerald-500/40 border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/40 shadow-[0_0_40px_-8px_rgba(16,185,129,0.25)]',
    columnBg: 'bg-gradient-to-b from-emerald-50/60 to-white/40 dark:from-emerald-950/30 dark:to-slate-900/40 border-emerald-100 dark:border-emerald-900/40',
    countBg: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300',
  }
};

/* ═══════════════════════════════════════════
   Sortable Task Card Wrapper
   ═══════════════════════════════════════════ */
const SortableTask = ({ task, onEdit, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id, data: { type: 'Task', task } });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
      <TaskCard task={task} onEdit={onEdit} onDelete={onDelete} isDragging={isDragging} />
    </div>
  );
};

/* ═══════════════════════════════════════════
   Premium Kanban Column
   ═══════════════════════════════════════════ */
const KanbanColumn = ({ statusKey, tasks, onEdit, onDelete, onAddTask }) => {
  const config = COLUMN_CONFIG[statusKey];
  const { setNodeRef, isOver } = useDroppable({
    id: statusKey,
    data: { type: 'Column', title: statusKey }
  });
  
  const { t } = useTranslation();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: statusKey === 'TODO' ? 0.1 : statusKey === 'IN_PROGRESS' ? 0.2 : 0.3, type: 'spring', stiffness: 200, damping: 25 }}
      className="flex flex-col min-w-[290px] sm:min-w-[340px] flex-1"
    >
      {/* Column Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${config.dotColor} shadow-sm`} />
          <h3 className="font-black text-sm tracking-widest uppercase text-slate-700 dark:text-slate-200">
            {config.title}
          </h3>
          <span className={`${config.countBg} text-xs font-black px-2.5 py-0.5 rounded-full`}>
            {tasks.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => onAddTask && onAddTask(statusKey)}
            className="p-1.5 hover:bg-white rounded-lg text-slate-400 hover:text-indigo-600 transition-all hover:shadow-md hover:scale-110"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
          </button>
          <button className="p-1.5 hover:bg-white rounded-lg text-slate-400 hover:text-slate-600 transition-all hover:shadow-md hover:scale-110">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg>
          </button>
        </div>
      </div>

      {/* Column Drop Zone */}
      <div 
        ref={setNodeRef}
        className={`flex-1 rounded-3xl p-4 min-h-[520px] flex flex-col gap-3 transition-all duration-300 border backdrop-blur-md
          ${config.columnBg}
          ${isOver 
            ? `ring-2 ${config.dropAura} scale-[1.01]` 
            : 'border-slate-200/60 shadow-[0_2px_16px_rgba(0,0,0,0.02)]'
          }`}
      >
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          <AnimatePresence>
            {tasks.map(task => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                layout
              >
                <SortableTask task={task} onEdit={onEdit} onDelete={onDelete} />
              </motion.div>
            ))}
          </AnimatePresence>
        </SortableContext>
        
        {/* Empty Drop Target */}
        {tasks.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-8 text-center transition-all
              ${isOver ? 'border-indigo-300 bg-indigo-50/30' : 'border-slate-200 bg-white/20'}
            `}
          >
            <div className="text-4xl mb-3 opacity-40">{config.emoji}</div>
            <p className="text-sm font-bold text-slate-400">{t('kanban.dropHere')}</p>
            <p className="text-xs text-slate-400/70 mt-1">Kéo thả công việc vào đây</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

/* ═══════════════════════════════════════════
   Premium Kanban Page
   ═══════════════════════════════════════════ */
const Kanban = () => {
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState(null);

  // Modal states
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [defaultStatus, setDefaultStatus] = useState('TODO');
  
  const { t } = useTranslation();
  const { triggerConfetti, triggerCelebration, fetchStreaks, playTingSound } = useGamification();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } })
  );

  const fetchBoardData = async () => {
    try {
      const [tasksRes, catRes] = await Promise.all([
        getTasks(),
        getCategories()
      ]);
      setCategories(catRes.data || []);
      
      const enrichedTasks = (tasksRes.data || []).map(task => ({
        ...task,
        category: (catRes.data || []).find(c => c.id === task.category_id) || null
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

  const handleDragStart = (event) => {
    const { active } = event;
    const task = tasks.find(t => t.id === active.id);
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

    const taskId = active.id;
    
    // If dropping over another task, get that task's status
    let newStatus = over.id; 
    if (over.data.current?.type === 'Task') {
      newStatus = over.data.current.task.status;
    }

    const task = tasks.find(t => t.id === taskId);
    if (task && task.status !== newStatus) {
      // Optimistic update
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
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
             streakCount: gamification?.currentStreak || 3
           });
           fetchStreaks();
        }
        fetchBoardData();
      } catch (error) {
        toast.error('Failed to update task status');
        fetchBoardData(); // revert on fail
      }
    }
  };

  // Handlers for modals
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
        await createTask({ ...taskData, status: defaultStatus });
        toast.success(t('tasks.created'));
      }
      fetchBoardData();
    } catch (err) {
      toast.error('Operation failed');
    }
  };
  const handleDeleteConfirm = async (taskId) => {
    try {
      await deleteTask(taskId);
      toast.success(t('tasks.deleted'));
      fetchBoardData();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const todoTasks = tasks.filter(t => t.status === 'TODO');
  const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS');
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED');
  const completionRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  if (loading) {
    return (
      <Layout>
        <div className="max-w-[1600px] mx-auto flex flex-col h-full pb-12">
          {/* Skeleton Header */}
          <div className="mb-8 mt-4">
            <div className="h-10 w-64 rounded-2xl animate-shimmer mb-3" />
            <div className="h-5 w-96 rounded-xl animate-shimmer" style={{ animationDelay: '0.1s' }} />
          </div>
          {/* Skeleton Columns */}
          <div className="flex gap-6 flex-1">
            {[0,1,2].map(i => (
              <div key={i} className="flex-1 min-w-[340px]">
                <div className="h-6 w-40 rounded-lg animate-shimmer mb-4" style={{ animationDelay: `${i * 0.1}s` }} />
                <div className="rounded-3xl p-4 border border-slate-100 space-y-3 min-h-[520px]">
                  {[0,1,2].map(j => (
                    <div key={j} className="h-32 rounded-2xl animate-shimmer" style={{ animationDelay: `${(i + j) * 0.1}s` }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-[1600px] mx-auto flex flex-col h-full pb-12 relative">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full opacity-15" 
            style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%)', filter: 'blur(60px)' }} />
          <div className="absolute top-1/2 -left-40 w-[500px] h-[500px] rounded-full opacity-10" 
            style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.3) 0%, transparent 70%)', filter: 'blur(60px)' }} />
        </div>

        <div className="relative z-10 flex flex-col h-full">
          {/* ══════════ Hero Header ══════════ */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-8"
          >
            <div>
              <div className="flex items-center gap-4 mb-2">
                <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-slate-900 via-indigo-800 to-slate-900 bg-clip-text text-transparent">
                  {t('kanban.title')}
                </h1>
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: 'spring', stiffness: 500 }}
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-1.5 rounded-2xl text-xs font-black shadow-lg shadow-indigo-500/25"
                >
                  {tasks.length} {t('kanban.active')}
                </motion.span>
              </div>
              <p className="text-slate-500 font-medium text-sm">{t('kanban.subtitle')}</p>
            </div>
            
            <div className="flex items-center gap-3 self-start md:self-auto">
              {/* View Mode */}
              <div className="flex glass-card rounded-xl p-1">
                <a href="/my-tasks" className="flex items-center gap-1.5 px-3 py-2 text-sm font-bold text-slate-500 rounded-lg hover:bg-white/80 hover:text-slate-700 transition-all">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                  {t('kanban.list')}
                </a>
                <button className="flex items-center gap-1.5 px-3 py-2 text-sm font-bold text-indigo-700 bg-white rounded-lg shadow-sm border border-slate-200/60">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" /></svg>
                  {t('kanban.board')}
                </button>
              </div>
              
              <motion.button 
                whileHover={{ y: -2, scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => handleOpenCreate('TODO')}
                className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:via-purple-700 hover:to-indigo-800 text-white font-bold py-2.5 px-5 rounded-2xl shadow-lg shadow-indigo-500/30 transition-all flex items-center gap-2 text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                {t('tasks.create')}
              </motion.button>
            </div>
          </motion.div>

          {/* ══════════ Board Columns ══════════ */}
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCorners} 
            onDragStart={handleDragStart} 
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-6 overflow-x-auto pb-4 flex-1 items-start hide-scrollbar">
              <KanbanColumn statusKey="TODO" tasks={todoTasks} onEdit={handleOpenEdit} onDelete={handleOpenDelete} onAddTask={handleOpenCreate} />
              <KanbanColumn statusKey="IN_PROGRESS" tasks={inProgressTasks} onEdit={handleOpenEdit} onDelete={handleOpenDelete} onAddTask={handleOpenCreate} />
              <KanbanColumn statusKey="COMPLETED" tasks={completedTasks} onEdit={handleOpenEdit} onDelete={handleOpenDelete} onAddTask={handleOpenCreate} />
            </div>
            
            {/* Drag Overlay */}
            <DragOverlay>
              {activeTask ? (
                <motion.div 
                  initial={{ scale: 1, rotate: 0 }}
                  animate={{ scale: 1.06, rotate: 2.5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="opacity-95 kanban-drag-overlay rounded-2xl"
                >
                  <TaskCard task={activeTask} />
                </motion.div>
              ) : null}
            </DragOverlay>
          </DndContext>
          
          {/* ══════════ Premium Footer Stats ══════════ */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-6 glass-card rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-5"
          >
            <div className="flex items-center gap-4">
              <div className="relative">
                {/* Progress ring */}
                <svg width={56} height={56} className="transform -rotate-90">
                  <circle cx={28} cy={28} r={23} fill="none" stroke="#e2e8f0" strokeWidth={4} />
                  <circle 
                    cx={28} cy={28} r={23} fill="none" 
                    stroke="url(#statsGrad)" strokeWidth={4} strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 23} 
                    strokeDashoffset={2 * Math.PI * 23 * (1 - completionRate / 100)}
                    className="transition-all duration-1000 ease-out"
                  />
                  <defs>
                    <linearGradient id="statsGrad" x1="0" y1="0" x2="56" y2="56">
                      <stop stopColor="#6366f1" /><stop offset="1" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-indigo-600">{completionRate}%</span>
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">{t('kanban.weeklyStage')}</h4>
                <p className="text-xs text-slate-500 mt-0.5">{t('kanban.completedOf', { completed: completedTasks.length, total: tasks.length })}</p>
              </div>
            </div>

            {/* Segmented Progress Bar */}
            <div className="flex flex-col gap-2 w-full max-w-sm">
              <div className="flex justify-between text-[11px] font-bold text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-300" />
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
              <div className="flex h-3 w-full rounded-full overflow-hidden bg-slate-100 shadow-inner">
                {tasks.length > 0 && (
                  <>
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(todoTasks.length / tasks.length) * 100}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="bg-gradient-to-r from-slate-300 to-slate-400 rounded-l-full"
                    />
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(inProgressTasks.length / tasks.length) * 100}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
                      className="bg-gradient-to-r from-indigo-500 to-purple-500 border-l-2 border-white"
                    />
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(completedTasks.length / tasks.length) * 100}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                      className="bg-gradient-to-r from-emerald-400 to-teal-500 border-l-2 border-white rounded-r-full"
                    />
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Modals */}
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
