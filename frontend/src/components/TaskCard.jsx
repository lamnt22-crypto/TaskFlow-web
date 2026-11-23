import React, { useContext, useState, useRef } from 'react';
import { StatusBadge, PriorityBadge } from './Badge';
import { PomodoroContext } from '../context/PomodoroContext';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { triggerHaptic } from '../utils/haptics';
import { sounds } from '../utils/soundEffects';

const TaskCard = ({ task, onEdit, onDelete, isDragging = false }) => {
  const { startFocus } = useContext(PomodoroContext);
  const cardRef = useRef(null);

  // Mouse coords for 3D Tilt
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth spring physics for natural elastic response
  const mouseXSpring = useSpring(x, { stiffness: 350, damping: 25 });
  const mouseYSpring = useSpring(y, { stiffness: 350, damping: 25 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], [8, -8]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], [-8, 8]);

  // Dynamic specular glare coordinates
  const [glarePosition, setGlarePosition] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = (e) => {
    if (!cardRef.current || isDragging) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct);
    y.set(yPct);

    setGlarePosition({
      x: Math.round((mouseX / width) * 100),
      y: Math.round((mouseY / height) * 100),
      opacity: 0.25
    });
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    setGlarePosition(prev => ({ ...prev, opacity: 0 }));
  };

  // Format due date simply
  const formattedDate = task.due_date 
    ? new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : 'No due date';

  const completedSubtasks = task.subtasks?.filter(s => s.is_completed)?.length || 0;
  const totalSubtasks = task.subtasks?.length || 0;
  const subtaskProgress = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  // Priority accent configuration
  const priorityAccent = {
    URGENT: { borderColor: '#ef4444', glowColor: 'rgba(239,68,68,0.12)' },
    HIGH: { borderColor: '#f97316', glowColor: 'rgba(249,115,22,0.12)' },
    MEDIUM: { borderColor: '#eab308', glowColor: 'rgba(234,179,8,0.08)' },
    LOW: { borderColor: '#6366f1', glowColor: 'rgba(99,102,241,0.08)' },
  }[task.priority] || { borderColor: '#6366f1', glowColor: 'rgba(99,102,241,0.08)' };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      }}
      whileHover={{ 
        y: -5,
        scale: 1.02,
        transition: { type: 'spring', stiffness: 400, damping: 25 }
      }}
      whileTap={{ scale: 0.98 }}
      className={`group relative select-none rounded-2xl p-5 cursor-grab active:cursor-grabbing transition-all duration-300
        overflow-hidden flex flex-col gap-3.5
        ${isDragging ? 'shadow-2xl ring-2 ring-indigo-500 ring-offset-2 opacity-60' : ''}
      `}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.82) 100%)',
        backdropFilter: 'blur(24px) saturate(1.5)',
        border: '1px solid rgba(255,255,255,0.6)',
        boxShadow: `inset 3px 0 0 0 ${priorityAccent.borderColor}, 0 4px 20px -4px ${priorityAccent.glowColor}, 0 2px 8px -2px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.8)`,
      }}
    >
      {/* Specular dynamic light glare overlay */}
      <div 
        className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300 rounded-2xl"
        style={{
          opacity: glarePosition.opacity,
          background: `radial-gradient(circle 280px at ${glarePosition.x}% ${glarePosition.y}%, rgba(255, 255, 255, 0.6), transparent 70%)`,
        }}
      />

      {/* Top accent beam - animated gradient */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Action Buttons (Elevated in 3D) */}
      <div 
        style={{ transform: 'translateZ(26px)' }}
        className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center gap-1 glass-card rounded-xl p-1 z-20"
      >
        <button 
          onClick={(e) => {
            e.stopPropagation();
            triggerHaptic('light');
            sounds.playPop();
            startFocus(task);
          }}
          className="p-1.5 text-slate-400 hover:text-emerald-500 rounded-lg hover:bg-emerald-50 transition-all hover:scale-110"
          title="Bắt đầu Pomodoro Focus"
        >
          <span className="text-base leading-none">🍅</span>
        </button>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            triggerHaptic('light');
            onEdit && onEdit(task);
          }}
          className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-all hover:scale-110"
          title="Chỉnh sửa công việc"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
        </button>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            triggerHaptic('medium');
            onDelete && onDelete(task);
          }}
          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-all hover:scale-110"
          title="Xóa công việc"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>
      </div>

      {/* Header with Title & Priority Badge (3D elevated layer) */}
      <div 
        style={{ transform: 'translateZ(18px)' }}
        className="flex justify-between items-start gap-3 pr-14 relative z-10"
      >
        <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug text-[15px] tracking-tight line-clamp-2">
          {task.title}
        </h3>
        <div className="shrink-0">
          <PriorityBadge priority={task.priority} />
        </div>
      </div>
      
      {/* Description */}
      {task.description && (
        <p 
          style={{ transform: 'translateZ(10px)' }}
          className="text-slate-400 text-xs leading-relaxed line-clamp-2"
        >
          {task.description}
        </p>
      )}

      {/* Subtasks Progress with enhanced bar */}
      {totalSubtasks > 0 && (
        <div 
          style={{ transform: 'translateZ(14px)' }}
          className="flex items-center gap-2.5 mt-1 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100/80"
        >
          <svg className="w-3.5 h-3.5 text-indigo-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <div className="flex-1 h-2 bg-slate-200/80 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${subtaskProgress}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className={`h-full rounded-full ${
                completedSubtasks === totalSubtasks
                  ? 'bg-gradient-to-r from-emerald-400 to-teal-400 shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                  : 'bg-gradient-to-r from-indigo-500 to-purple-500'
              }`}
            />
          </div>
          <span className="text-[11px] font-black text-slate-600">
            {completedSubtasks}/{totalSubtasks}
          </span>
        </div>
      )}
      
      {/* Footer Info (Status, Category, Due Date) */}
      <div 
        style={{ transform: 'translateZ(12px)' }}
        className="mt-auto pt-3 flex items-center justify-between border-t border-slate-100/80"
      >
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={task.status} />
          {task.category && (
            <div 
              className="flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded-lg border shadow-xs"
              style={{ 
                borderColor: (task.category.color || '#6366f1') + '30',
                color: task.category.color || '#6366f1',
                backgroundColor: (task.category.color || '#6366f1') + '0d'
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full shadow-sm" style={{ backgroundColor: task.category.color || '#6366f1' }} />
              {task.category.name}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          {formattedDate}
        </div>
      </div>
    </motion.div>
  );
};

export default TaskCard;
