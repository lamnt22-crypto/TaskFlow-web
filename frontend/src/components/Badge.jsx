import React from 'react';

export const Badge = ({ children, colorClass = "bg-slate-100 text-slate-700 border-slate-200" }) => (
  <span className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border ${colorClass} tracking-wide`}>
    {children}
  </span>
);

export const StatusBadge = ({ status }) => {
  const config = {
    'TODO': { 
      class: 'bg-slate-50 text-slate-600 border-slate-200', 
      label: 'Cần làm',
      dot: 'bg-slate-400'
    },
    'IN_PROGRESS': { 
      class: 'bg-indigo-50 text-indigo-700 border-indigo-200', 
      label: 'Đang làm',
      dot: 'bg-indigo-500'
    },
    'COMPLETED': { 
      class: 'bg-emerald-50 text-emerald-700 border-emerald-200', 
      label: 'Hoàn thành',
      dot: 'bg-emerald-500'
    }
  };
  
  const { class: cls, label, dot } = config[status] || config['TODO'];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-lg border ${cls} tracking-wide`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
};

export const PriorityBadge = ({ priority }) => {
  const config = {
    'LOW': { 
      class: 'bg-slate-50 text-slate-500 border-slate-200',
      label: 'THẤP',
      icon: '○'
    },
    'MEDIUM': { 
      class: 'bg-amber-50 text-amber-700 border-amber-200',
      label: 'TRUNG BÌNH',
      icon: '◐'
    },
    'HIGH': { 
      class: 'bg-orange-50 text-orange-700 border-orange-200',
      label: 'CAO',
      icon: '●'
    },
    'URGENT': { 
      class: 'bg-red-50 text-red-700 border-red-200 shadow-[0_0_10px_rgba(239,68,68,0.1)]',
      label: 'KHẨN CẤP',
      icon: '🔥'
    }
  };

  const { class: cls, label, icon } = config[priority] || config['MEDIUM'];
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-black rounded-lg border uppercase tracking-widest ${cls}`}>
      <span className="text-[9px]">{icon}</span>
      {label}
    </span>
  );
};
