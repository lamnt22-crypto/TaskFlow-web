import React, { useContext } from 'react';
import { StatusBadge, PriorityBadge } from './Badge';
import { PomodoroContext } from '../context/PomodoroContext';
import { motion } from 'framer-motion';

const TaskCard = ({ task, onEdit, onDelete }) => {
  const { startFocus } = useContext(PomodoroContext);

  // Format due date simply
  const formattedDate = task.due_date 
    ? new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : 'No due date';

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 hover:shadow-lg hover:-translate-y-0.5 dark:hover:shadow-indigo-500/20 transition-all group flex flex-col gap-3 relative overflow-hidden cursor-grab active:cursor-grabbing">
      
      {/* Action Buttons (visible on hover) */}
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-md px-1 shadow-sm z-10">
        <button 
          onClick={() => startFocus(task)}
          className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          title="Start Focus (Pomodoro)"
        >
          <span className="text-base leading-none">🍅</span>
        </button>
        <button 
          onClick={() => onEdit && onEdit(task)}
          className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          title="Edit Task"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
        </button>
        <button 
          onClick={() => onDelete && onDelete(task)}
          className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          title="Delete Task"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>
      </div>

      <div className="flex justify-between items-start gap-4 pr-16">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-tight">
          {task.title}
        </h3>
        <div className="shrink-0 flex gap-2">
          <PriorityBadge priority={task.priority} />
        </div>
      </div>
      
      {task.description && (
        <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-2 leading-relaxed">
          {task.description}
        </p>
      )}

      {task.subtasks && task.subtasks.length > 0 && (
        <div className="flex items-center gap-2 mt-1">
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
          <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all ${task.subtasks.filter(s => s.is_completed).length === task.subtasks.length ? 'bg-emerald-500' : 'bg-blue-500'}`}
              style={{ width: `${Math.round((task.subtasks.filter(s => s.is_completed).length / task.subtasks.length) * 100)}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {task.subtasks.filter(s => s.is_completed).length}/{task.subtasks.length}
          </span>
        </div>
      )}
      
      <div className="mt-auto pt-3 flex items-center justify-between border-t border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <StatusBadge status={task.status} />
          {task.category && (
             <div className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: task.category.color || '#64748b' }}></span>
                {task.category.name}
             </div>
          )}
        </div>
        
        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          {formattedDate}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
