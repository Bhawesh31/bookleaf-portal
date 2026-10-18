import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle,
  Clock,
  HelpCircle,
  Inbox,
  TrendingUp,
  UserCheck,
  UserX,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { adminApi } from '../../api/admin';

export const AdminDashboard: React.FC = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: () => adminApi.getDashboardStats(),
    refetchInterval: 10000,
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-2xl"></div>
          ))}
        </div>
        <div className="h-64 bg-slate-200 rounded-2xl"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-200">
          Failed to load operations dashboard statistics.
        </div>
      </div>
    );
  }

  // Format data for charts
  const categoryChartData = Object.entries(data.category_breakdown).map(([name, count]) => ({
    name: name.replace(' & ', ' &\n'),
    count,
  }));

  const priorityColors: Record<string, string> = {
    Critical: '#ef4444',
    High: '#f59e0b',
    Medium: '#3b82f6',
    Low: '#94a3b8',
  };

  const priorityChartData = Object.entries(data.priority_breakdown).map(([name, count]) => ({
    name,
    count,
    color: priorityColors[name] || '#94a3b8',
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-purple-700 mb-1">
            <span>BookLeaf Publishing • Operations Command Center</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Author Support & Operations Dashboard
          </h1>
        </div>

        <Link
          to="/admin/queue"
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-md transition-smooth self-start sm:self-center"
        >
          <Inbox className="w-4 h-4" />
          <span>Open Ticket Queue ({data.open_tickets + data.in_progress_tickets})</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
            Total Tickets
          </div>
          <div className="text-2xl font-bold text-slate-900">{data.total_tickets}</div>
          <div className="mt-1 text-[11px] text-slate-400">All-time queries</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-sm">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-amber-700 mb-1">
            Open Tickets
          </div>
          <div className="text-2xl font-bold text-amber-700">{data.open_tickets}</div>
          <div className="mt-1 text-[11px] text-amber-600">Awaiting first response</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-indigo-200 bg-indigo-50/20 shadow-sm">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-indigo-700 mb-1">
            In Progress
          </div>
          <div className="text-2xl font-bold text-indigo-700">{data.in_progress_tickets}</div>
          <div className="mt-1 text-[11px] text-indigo-600">Actively being worked</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-red-200 bg-red-50/30 shadow-sm">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-red-700 mb-1 flex items-center justify-between">
            <span>Critical / High</span>
            <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
          </div>
          <div className="text-2xl font-bold text-red-700">{data.critical_high_tickets}</div>
          <div className="mt-1 text-[11px] text-red-600">Urgent author escalations</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1 flex items-center justify-between">
            <span>Unassigned</span>
            <UserX className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-800">{data.unassigned_tickets}</div>
          <div className="mt-1 text-[11px] text-slate-400">Requires assignment</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1 flex items-center justify-between">
            <span>Avg Response</span>
            <Clock className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {data.avg_response_time_hours > 0 ? `${data.avg_response_time_hours}h` : 'N/A'}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Creation to first reply</div>
        </div>
      </div>

      {/* Analytics Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket Volume by Category */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Ticket Volume by Category</h2>
              <p className="text-xs text-slate-500">Distribution across the 6 official BookLeaf categories</p>
            </div>
            <BarChart3 className="w-5 h-5 text-slate-400" />
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" fill="#0284c7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Priority Distribution</h2>
            <p className="text-xs text-slate-500">AI-assessed and manual priority tiers</p>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={priorityChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={4}
                  dataKey="count"
                >
                  {priorityChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 pt-2">
            {priorityChartData.map((p) => (
              <div key={p.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }}></span>
                  <span className="font-medium text-slate-700">{p.name}</span>
                </div>
                <span className="font-bold text-slate-900">{p.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
