import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import TaskCard from '../components/TaskCard';
import { getTasks, updateTask } from '../services/taskService';
import { getCategories } from '../services/categoryService';
import { DndContext, DragOverlay, closestCorners } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useGamification } from '../context/GamificationContext';

const SortableTask = ({ task, onEdit, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id, data: { type: 'Task', task } });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
      <TaskCard task={task} onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
};

const KanbanColumn = ({ title, statusKey, count, colorClass, tasks }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: statusKey, // Use original Enum key for dropping
    data: { type: 'Column', title: statusKey }
  });
  
  const { t } = useTranslation();

  return (
    <div 
      ref={setNodeRef}
      className={`flex flex-col bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border p-4 min-w-[320px] flex-1 transition-colors ${isOver ? 'border-indigo-400 dark:border-indigo-500 shadow-sm' : 'border-slate-200/60 dark:border-slate-700/60'}`}
    >
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${colorClass}`}></div>
          <h3 className="font-bold text-slate-800 dark:text-slate-100 tracking-wide">{title}</h3>
          <span className="bg-slate-200/70 dark:bg-slate-700/70 text-slate-600 dark:text-slate-300 text-xs font-semibold px-2 py-0.5 rounded-md ml-1">{count}</span>
        </div>
        <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500">
          <button className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded hover:text-slate-600 dark:hover:text-slate-300 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg></button>
          <button className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded hover:text-slate-600 dark:hover:text-slate-300 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg></button>
        </div>
      </div>
      <div className="flex flex-col gap-3 flex-1 overflow-y-auto min-h-[150px]">
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <SortableTask key={task.id} task={task} onEdit={() => {}} onDelete={() => {}} />
          ))}
        </SortableContext>
        
        {tasks.length === 0 && (
          <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/30 dark:bg-slate-800/30 p-6 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 mt-2">
            <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            <span className="text-sm font-medium">{t('kanban.dropHere')}</span>
            <span className="text-xs opacity-70">{t('kanban.releasePlace', { title })}</span>
          </div>
        )}
      </div>
    </div>
  );
};

const Kanban = () => {
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState(null);
  
  const { t } = useTranslation();
  const { triggerConfetti, fetchStreaks, playTingSound } = useGamification();

  const fetchBoardData = async () => {
    try {
      const [tasksRes, catRes] = await Promise.all([
        getTasks(),
        getCategories()
      ]);
      setCategories(catRes.data);
      
      const enrichedTasks = tasksRes.data.map(task => ({
        ...task,
        category: catRes.data.find(c => c.id === task.category_id) || null
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
  };

  const handleDragEnd = async (event) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

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
        }
        fetchBoardData();
      } catch (error) {
        toast.error('Failed to update task status');
        fetchBoardData(); // revert on fail
      }
    }
  };

  const todoTasks = tasks.filter(t => t.status === 'TODO');
  const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS');
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED');

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-[1600px] mx-auto flex flex-col h-full pb-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{t('kanban.title')}</h1>
              <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-xs font-semibold px-2 py-0.5 rounded-full mt-1">{tasks.length} {t('kanban.active')}</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400">{t('kanban.subtitle')}</p>
          </div>
          
          <div className="flex items-center gap-3 self-start md:self-auto">
            <div className="flex bg-white dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700 shadow-sm mr-2">
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                {t('kanban.list')}
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 rounded-md shadow-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" /></svg>
                {t('kanban.board')}
              </button>
            </div>
            
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg shadow-sm shadow-indigo-500/30 transition-all flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              {t('tasks.create')}
            </button>
          </div>
        </div>

        {/* Board Columns with DndContext */}
        <DndContext collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex gap-6 overflow-x-auto pb-4 flex-1 items-start">
            <KanbanColumn title={t('kanban.todo')} statusKey="TODO" count={todoTasks.length} colorClass="bg-slate-400 dark:bg-slate-500" tasks={todoTasks} />
            <KanbanColumn title={t('kanban.inProgress')} statusKey="IN_PROGRESS" count={inProgressTasks.length} colorClass="bg-indigo-500" tasks={inProgressTasks} />
            <KanbanColumn title={t('kanban.done')} statusKey="COMPLETED" count={completedTasks.length} colorClass="bg-emerald-500" tasks={completedTasks} />
          </div>
          <DragOverlay>
            {activeTask ? (
              <motion.div 
                initial={{ scale: 1, rotate: 0 }}
                animate={{ scale: 1.05, rotate: 3 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="opacity-90 shadow-2xl cursor-grabbing"
              >
                <TaskCard task={activeTask} />
              </motion.div>
            ) : null}
          </DragOverlay>
        </DndContext>
        
        {/* Footer Stats Bar */}
        <div className="mt-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-slate-800 dark:text-slate-100">{t('kanban.weeklyStage')}</h4>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{t('kanban.completedOf', { completed: completedTasks.length, total: tasks.length })}</p>
            </div>
          </div>
          <div className="flex flex-col gap-1 w-full max-w-xs">
            <div className="flex justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span>{t('kanban.todo')} ({todoTasks.length})</span>
              <span>{t('kanban.inProgress')} ({inProgressTasks.length})</span>
              <span>{t('kanban.done')} ({completedTasks.length})</span>
            </div>
            <div className="flex h-2 w-full rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700">
              {tasks.length > 0 && (
                <>
                  <div className="bg-slate-300 dark:bg-slate-500" style={{ width: `${(todoTasks.length / tasks.length) * 100}%` }}></div>
                  <div className="bg-indigo-500 border-l border-white dark:border-slate-800" style={{ width: `${(inProgressTasks.length / tasks.length) * 100}%` }}></div>
                  <div className="bg-emerald-500 border-l border-white dark:border-slate-800" style={{ width: `${(completedTasks.length / tasks.length) * 100}%` }}></div>
                </>
              )}
            </div>
          </div>
        </div>

      </div>
    </Layout>
  );
};

export default Kanban;
