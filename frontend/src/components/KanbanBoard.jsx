import React from 'react';
import { DndContext, useDraggable, useDroppable, DragOverlay, closestCorners, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { format } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { triggerHaptic } from '../utils/haptics';
import { sounds } from '../utils/soundEffects';

const priorityConfig = {
  LOW: { color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400', vi: 'Thấp', en: 'Low' },
  MEDIUM: { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300', vi: 'Vừa', en: 'Med' },
  HIGH: { color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300', vi: 'Cao', en: 'High' },
  URGENT: { color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300', vi: 'Gấp', en: 'Urgent' },
};

const BoardTaskCard = ({ task, isOverlay, onStatusChange, onEdit, isVi }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  });

  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;
  const prio = priorityConfig[task.priority] || priorityConfig.MEDIUM;
  const formattedDate = task.due_date
    ? format(new Date(task.due_date), 'dd/MM', { locale: isVi ? vi : enUS })
    : null;

  const nextStatus =
    task.status === 'TODO' ? 'IN_PROGRESS' : task.status === 'IN_PROGRESS' ? 'COMPLETED' : 'TODO';
  const nextLabel =
    nextStatus === 'IN_PROGRESS'
      ? isVi
        ? '→ Đang làm'
        : '→ Doing'
      : nextStatus === 'COMPLETED'
        ? isVi
          ? '✓ Xong'
          : '✓ Done'
        : isVi
          ? '↺ Cần làm'
          : '↺ To Do';

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => onEdit && onEdit(task)}
      whileHover={{ y: -2 }}
      className={`group relative rounded-2xl p-4 transition-all duration-200 cursor-grab active:cursor-grabbing select-none
        bg-white dark:bg-slate-900/95 backdrop-blur-md
        border border-slate-200/80 dark:border-white/10
        shadow-xs hover:shadow-lg hover:border-indigo-400/50
        ${isDragging ? 'opacity-40 ring-2 ring-indigo-500 ring-offset-2' : ''} 
        ${isOverlay ? 'rotate-2 scale-105 shadow-2xl ring-2 ring-indigo-500 bg-white dark:bg-slate-900 z-50' : ''}
      `}
    >
      <div className="flex justify-between items-start gap-2 mb-2">
        <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-snug line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          {task.title}
        </h4>
        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0 tracking-wide uppercase ${prio.color}`}>
          {isVi ? prio.vi : prio.en}
        </span>
      </div>

      {task.category && (
        <div className="mb-2.5">
          <span
            className="inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold border"
            style={{
              borderColor: task.category.color + '40',
              color: task.category.color,
              backgroundColor: task.category.color + '15',
            }}
          >
            {task.category.name}
          </span>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-400 mt-auto pt-2 border-t border-slate-100 dark:border-white/5 gap-2">
        {formattedDate ? (
          <div className="flex items-center gap-1 font-medium">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{formattedDate}</span>
          </div>
        ) : (
          <span />
        )}

        {onStatusChange && (
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onStatusChange(task.id, nextStatus);
            }}
            className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-500/25 transition-colors cursor-pointer"
          >
            {nextLabel}
          </button>
        )}
      </div>
    </motion.div>
  );
};

const Column = ({ col, tasks, onTaskStatusChange, onEdit, isVi }) => {
  const { setNodeRef, isOver } = useDroppable({ id: col.id });

  return (
    <div className="flex flex-col w-full min-w-[285px] sm:min-w-[310px] lg:min-w-0">
      <div className="flex items-center justify-between mb-3 px-2">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${col.badgeColor}`} />
          <h3 className={`font-bold text-xs sm:text-sm tracking-wider uppercase ${col.headerColor}`}>
            {col.title}
          </h3>
        </div>
        <span className="bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-black px-2.5 py-0.5 rounded-full tabular-nums">
          {tasks.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 rounded-3xl p-3.5 min-h-[420px] flex flex-col gap-3 transition-all duration-300 border ${col.color} ${
          isOver
            ? 'ring-2 ring-indigo-500/70 border-indigo-400 bg-indigo-50/70 dark:bg-indigo-950/30 shadow-[0_0_35px_rgba(99,102,241,0.25)] scale-[1.01]'
            : 'border-slate-200/60 dark:border-white/5'
        }`}
      >
        {tasks.map((task) => (
          <BoardTaskCard
            key={task.id}
            task={task}
            onStatusChange={onTaskStatusChange}
            onEdit={onEdit}
            isVi={isVi}
          />
        ))}

        {tasks.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700/60 rounded-2xl p-6 text-slate-400 text-center">
            <span className="text-2xl mb-1 opacity-70">📥</span>
            <p className="text-xs font-semibold">{isVi ? 'Thả công việc vào đây' : 'Drop task here'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

const KanbanBoard = ({ tasks, onTaskStatusChange, onEdit }) => {
  const [activeTask, setActiveTask] = React.useState(null);
  const { i18n } = useTranslation();
  const isVi = i18n.language === 'vi';

  const columns = [
    {
      id: 'TODO',
      title: isVi ? 'CẦN LÀM' : 'TO DO',
      color: 'bg-slate-100/70 dark:bg-slate-900/60',
      headerColor: 'text-slate-600 dark:text-slate-300',
      badgeColor: 'bg-slate-400',
    },
    {
      id: 'IN_PROGRESS',
      title: isVi ? 'ĐANG LÀM' : 'IN PROGRESS',
      color: 'bg-indigo-50/60 dark:bg-indigo-950/25',
      headerColor: 'text-indigo-600 dark:text-indigo-400',
      badgeColor: 'bg-indigo-500',
    },
    {
      id: 'COMPLETED',
      title: isVi ? 'HOÀN THÀNH' : 'COMPLETED',
      color: 'bg-emerald-50/60 dark:bg-emerald-950/25',
      headerColor: 'text-emerald-600 dark:text-emerald-400',
      badgeColor: 'bg-emerald-500',
    },
  ];

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
  );

  const handleDragStart = (event) => {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) {
      setActiveTask(task);
      sounds.playPop();
      triggerHaptic('dragPick');
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;

    sounds.playDrop();
    triggerHaptic('dragDrop');

    const taskId = active.id;
    const newStatus = over.id;
    const task = tasks.find((t) => t.id === taskId);
    if (task && task.status !== newStatus) {
      onTaskStatusChange(taskId, newStatus);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex lg:grid lg:grid-cols-3 gap-5 overflow-x-auto lg:overflow-visible pb-4 hide-scrollbar snap-x snap-mandatory">
        {columns.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);
          return (
            <div key={col.id} className="snap-center shrink-0 w-[85vw] sm:w-[330px] lg:w-auto">
              <Column
                col={col}
                tasks={colTasks}
                onTaskStatusChange={onTaskStatusChange}
                onEdit={onEdit}
                isVi={isVi}
              />
            </div>
          );
        })}
      </div>

      <DragOverlay>
        {activeTask ? (
          <motion.div initial={{ scale: 1, rotate: 0 }} animate={{ scale: 1.04, rotate: 2 }}>
            <BoardTaskCard task={activeTask} isOverlay isVi={isVi} />
          </motion.div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default KanbanBoard;
