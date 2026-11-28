import React, { useContext, useState, useRef, useEffect } from 'react';
import { StatusBadge, PriorityBadge } from './Badge';
import { PomodoroContext } from '../context/PomodoroContext';
import { useTranslation } from 'react-i18next';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { triggerHaptic } from '../utils/haptics';
import { sounds } from '../utils/soundEffects';

const TaskCard = ({ task, onEdit, onDelete, onStatusChange, isDragging = false }) => {
  const { startFocus } = useContext(PomodoroContext);
  const { t, i18n } = useTranslation();
  const isVi = i18n.language === 'vi';
  const cardRef = useRef(null);
  const [hasHoverSupport, setHasHoverSupport] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const match = window.matchMedia('(hover: hover) and (pointer: fine)');
      setHasHoverSupport(match.matches);
      const listener = (e) => setHasHoverSupport(e.matches);
      match.addEventListener('change', listener);
      return () => match.removeEventListener('change', listener);
    }
  }, []);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 350, damping: 25 });
  const mouseYSpring = useSpring(y, { stiffness: 350, damping: 25 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], [6, -6]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], [-6, 6]);

  const [glarePosition, setGlarePosition] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = (e) => {
    if (!hasHoverSupport || !cardRef.current || isDragging) return;
    const rect = cardRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    x.set(mouseX / rect.width - 0.5);
    y.set(mouseY / rect.height - 0.5);

    setGlarePosition({
      x: Math.round((mouseX / rect.width) * 100),
      y: Math.round((mouseY / rect.height) * 100),
      opacity: 0.16,
    });
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    setGlarePosition((prev) => ({ ...prev, opacity: 0 }));
  };

  const formattedDate = task.due_date
    ? new Date(task.due_date).toLocaleDateString(isVi ? 'vi-VN' : 'en-US', {
        month: 'short',
        day: 'numeric',
      })
    : isVi
      ? 'Không hạn'
      : 'No due date';

  const completedSubtasks = task.subtasks?.filter((s) => s.is_completed)?.length || 0;
  const totalSubtasks = task.subtasks?.length || 0;
  const subtaskProgress = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  const priorityAccent = {
    URGENT: '#ef4444',
    HIGH: '#f97316',
    MEDIUM: '#eab308',
    LOW: '#6366f1',
  }[task.priority] || '#6366f1';

  const nextStatus =
    task.status === 'TODO' ? 'IN_PROGRESS' : task.status === 'IN_PROGRESS' ? 'COMPLETED' : 'TODO';

  const nextStatusLabel =
    nextStatus === 'IN_PROGRESS'
      ? isVi
        ? '→ Đang làm'
        : '→ In Progress'
      : nextStatus === 'COMPLETED'
        ? isVi
          ? '✓ Hoàn thành'
          : '✓ Done'
        : isVi
          ? '↺ Cần làm'
          : '↺ To Do';

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={() => onEdit && onEdit(task)}
      style={{
        rotateX: hasHoverSupport ? rotateX : 0,
        rotateY: hasHoverSupport ? rotateY : 0,
        transformStyle: 'preserve-3d',
        boxShadow: `inset 3.5px 0 0 0 ${priorityAccent}`,
      }}
      whileHover={
        hasHoverSupport
          ? {
              y: -4,
              scale: 1.015,
              transition: { type: 'spring', stiffness: 400, damping: 25 },
            }
          : undefined
      }
      whileTap={{ scale: 0.985 }}
      className={`group relative select-none rounded-2xl p-4 sm:p-5 cursor-grab active:cursor-grabbing transition-shadow duration-300
        overflow-hidden flex flex-col gap-3
        bg-white dark:bg-slate-900/95 backdrop-blur-md
        border border-slate-200/80 dark:border-white/10
        shadow-sm hover:shadow-xl hover:shadow-indigo-500/10
        ${isDragging ? 'shadow-2xl ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-950 opacity-60' : ''}
      `}
    >
      {/* Dynamic specular glare */}
      {hasHoverSupport && (
        <div
          className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300 rounded-2xl"
          style={{
            opacity: glarePosition.opacity,
            background: `radial-gradient(circle 260px at ${glarePosition.x}% ${glarePosition.y}%, rgba(99, 102, 241, 0.25), transparent 70%)`,
          }}
        />
      )}

      {/* Top accent beam */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Title & Priority Row */}
      <div className="flex justify-between items-start gap-2.5 relative z-10">
        <h3
          className={`font-bold leading-snug text-sm sm:text-[15px] tracking-tight line-clamp-2 transition-colors ${
            task.status === 'COMPLETED'
              ? 'text-slate-400 dark:text-slate-500 line-through'
              : 'text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
          }`}
        >
          {task.title}
        </h3>
        <div className="shrink-0">
          <PriorityBadge priority={task.priority} />
        </div>
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed line-clamp-2 relative z-10">
          {task.description}
        </p>
      )}

      {/* Subtasks Progress */}
      {totalSubtasks > 0 && (
        <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-800/70 p-2 rounded-xl border border-slate-100 dark:border-white/5 relative z-10">
          <svg className="w-3.5 h-3.5 text-indigo-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              style={{ width: `${subtaskProgress}%` }}
              className={`h-full rounded-full transition-all duration-500 ${
                completedSubtasks === totalSubtasks
                  ? 'bg-gradient-to-r from-emerald-400 to-teal-400'
                  : 'bg-gradient-to-r from-indigo-500 to-purple-500'
              }`}
            />
          </div>
          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 tabular-nums">
            {completedSubtasks}/{totalSubtasks}
          </span>
        </div>
      )}

      {/* Meta Chips */}
      <div className="flex items-center justify-between gap-2 flex-wrap pt-2 border-t border-slate-100 dark:border-white/5 relative z-10">
        <div className="flex items-center gap-1.5 flex-wrap">
          <StatusBadge status={task.status} />
          {task.category && (
            <div
              className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg border"
              style={{
                borderColor: (task.category.color || '#6366f1') + '35',
                color: task.category.color || '#6366f1',
                backgroundColor: (task.category.color || '#6366f1') + '12',
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: task.category.color || '#6366f1' }}
              />
              {task.category.name}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 dark:text-slate-400">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{formattedDate}</span>
        </div>
      </div>

      {/* Action Bar (Always accessible on Touch/Mobile, smooth reveal on Desktop) */}
      <div
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100/80 dark:border-white/5 relative z-20 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-200"
      >
        {onStatusChange ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              triggerHaptic('light');
              onStatusChange(task.id, nextStatus);
            }}
            className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-500/25 transition-colors cursor-pointer"
          >
            {nextStatusLabel}
          </button>
        ) : (
          <span className="text-[10px] font-mono text-slate-400">{t('kanban.dropHere')}</span>
        )}

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              triggerHaptic('light');
              sounds.playPop();
              startFocus(task);
            }}
            className="p-1.5 text-slate-400 hover:text-emerald-500 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-500/15 transition-colors cursor-pointer"
            title={isVi ? 'Bắt đầu Pomodoro Focus' : 'Start Pomodoro Focus'}
          >
            <span className="text-sm leading-none">🍅</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              triggerHaptic('light');
              onEdit && onEdit(task);
            }}
            className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-500/15 transition-colors cursor-pointer"
            title={isVi ? 'Chỉnh sửa công việc' : 'Edit task'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              triggerHaptic('medium');
              onDelete && onDelete(task);
            }}
            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/15 transition-colors cursor-pointer"
            title={isVi ? 'Xóa công việc' : 'Delete task'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default TaskCard;
