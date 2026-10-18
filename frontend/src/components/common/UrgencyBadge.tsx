import React from 'react';

export const UrgencyBadge: React.FC<{ priority: string }> = ({ priority }) => {
  const getBadgeStyle = () => {
    switch (priority) {
      case 'Critical':
        return 'bg-red-50 text-red-700 border-red-200 ring-1 ring-red-500/20';
      case 'High':
        return 'bg-amber-50 text-amber-700 border-amber-200 ring-1 ring-amber-500/20';
      case 'Medium':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Low':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${getBadgeStyle()}`}
    >
      {priority}
    </span>
  );
};
