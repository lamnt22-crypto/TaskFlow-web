import React from 'react';

export const Badge = ({ children, colorClass = "bg-slate-100 text-slate-700 border-slate-200" }) => (
  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${colorClass}`}>
    {children}
  </span>
);

export const StatusBadge = ({ status }) => {
  const styles = {
    'TODO': 'bg-slate-100 text-slate-600 border-slate-200',
    'IN_PROGRESS': 'bg-blue-50 text-blue-700 border-blue-200',
    'COMPLETED': 'bg-emerald-50 text-emerald-700 border-emerald-200'
  };
  
  const labels = {
    'TODO': 'To Do',
    'IN_PROGRESS': 'In Progress',
    'COMPLETED': 'Completed'
  };

  return <Badge colorClass={styles[status] || styles['TODO']}>{labels[status] || status}</Badge>;
};

export const PriorityBadge = ({ priority }) => {
  const styles = {
    'LOW': 'bg-slate-50 text-slate-600 border-slate-200',
    'MEDIUM': 'bg-yellow-50 text-yellow-700 border-yellow-200',
    'HIGH': 'bg-orange-50 text-orange-700 border-orange-200',
    'URGENT': 'bg-red-50 text-red-700 border-red-200'
  };
  
  return <Badge colorClass={styles[priority] || styles['MEDIUM']}>{priority}</Badge>;
};
