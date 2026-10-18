import React from 'react';

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const getBadgeStyle = () => {
    switch (status) {
      case 'Open':
        return 'bg-amber-50 text-amber-700 border-amber-300 ring-1 ring-amber-400/20';
      case 'In Progress':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200 ring-1 ring-indigo-400/20';
      case 'Resolved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-300';
      case 'Closed':
        return 'bg-slate-100 text-slate-500 border-slate-300';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getBadgeStyle()}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
          status === 'Open'
            ? 'bg-amber-500'
            : status === 'In Progress'
            ? 'bg-indigo-500 animate-pulse'
            : status === 'Resolved'
            ? 'bg-emerald-500'
            : 'bg-slate-400'
        }`}
      ></span>
      {status}
    </span>
  );
};
