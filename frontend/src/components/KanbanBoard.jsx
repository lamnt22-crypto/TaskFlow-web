import React from 'react';
import { DndContext, useDraggable, useDroppable, DragOverlay, closestCorners, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

// Column IDs
const COLUMNS = [
  { id: 'TODO', title: 'CẦN LÀM', color: 'bg-slate-100 dark:bg-slate-800/50', headerColor: 'text-slate-600 dark:text-slate-400' },
  { id: 'IN_PROGRESS', title: 'ĐANG LÀM', color: 'bg-blue-50 dark:bg-blue-900/10', headerColor: 'text-blue-600 dark:text-blue-400' },
  { id: 'COMPLETED', title: 'HOÀN THÀNH', color: 'bg-emerald-50 dark:bg-emerald-900/10', headerColor: 'text-emerald-600 dark:text-emerald-400' }
];

const priorityConfig = {
  LOW: { color: 'bg-slate-100 text-slate-600', label: 'Low' },
  MEDIUM: { color: 'bg-blue-100 text-blue-700', label: 'Med' },
  HIGH: { color: 'bg-orange-100 text-orange-700', label: 'High' },
  URGENT: { color: 'bg-red-100 text-red-700', label: 'Urgent' }
};

// Draggable Task Card
const TaskCard = ({ task, isOverlay }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const prio = priorityConfig[task.priority] || priorityConfig.MEDIUM;
  
  const formattedDate = task.due_date 
    ? format(new Date(task.due_date), 'dd/MM/yyyy', { locale: vi })
    : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow group
        ${isDragging ? 'opacity-50' : 'opacity-100'} 
        ${isOverlay ? 'rotate-2 scale-105 shadow-xl cursor-grabbing' : ''}
      `}
    >
      <div className="flex justify-between items-start gap-2 mb-2">
        <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm leading-snug line-clamp-2">
          {task.title}
        </h4>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${prio.color}`}>
          {prio.label}
        </span>
      </div>
      
      {task.category && (
        <div className="mb-3">
          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold border"
            style={{ 
              borderColor: task.category.color + '40',
              color: task.category.color,
              backgroundColor: task.category.color + '10'
            }}
          >
            {task.category.name}
          </span>
        </div>
      )}

      <div className="flex items-center gap-2 mt-auto">
        {formattedDate && (
          <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            {formattedDate}
          </div>
        )}
      </div>
    </div>
  );
};

// Droppable Column
const Column = ({ col, tasks }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: col.id,
  });

  return (
    <div className="flex flex-col min-w-[300px] max-w-[350px] w-full shrink-0">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className={`font-bold text-sm tracking-wide ${col.headerColor}`}>
          {col.title}
        </h3>
        <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold px-2 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </div>
      
      <div 
        ref={setNodeRef} 
        className={`flex-1 rounded-2xl p-3 min-h-[500px] flex flex-col gap-3 transition-colors ${col.color} ${isOver ? 'ring-2 ring-indigo-400 ring-inset bg-indigo-50/50 dark:bg-indigo-900/20' : ''}`}
      >
        {tasks.map(task => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
};

const KanbanBoard = ({ tasks, onTaskStatusChange }) => {
  const [activeTask, setActiveTask] = React.useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Start dragging after moving 5px
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  const handleDragStart = (event) => {
    const { active } = event;
    const task = tasks.find(t => t.id === active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id;
    const newStatus = over.id;

    const task = tasks.find(t => t.id === taskId);
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
      <div className="flex gap-6 overflow-x-auto pb-4 hide-scrollbar snap-x snap-mandatory">
        {COLUMNS.map(col => {
          const colTasks = tasks.filter(t => t.status === col.id);
          return (
            <div key={col.id} className="snap-center shrink-0">
               <Column col={col} tasks={colTasks} />
            </div>
          );
        })}
      </div>

      <DragOverlay>
        {activeTask ? <TaskCard task={activeTask} isOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
};

export default KanbanBoard;
