import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Filter,
  Inbox,
  Search,
  SlidersHorizontal,
  UserCheck,
  UserX,
} from 'lucide-react';
import { adminApi, AdminQueueFilters } from '../../api/admin';
import { StatusBadge } from '../../components/common/StatusBadge';
import { UrgencyBadge } from '../../components/common/UrgencyBadge';
import { TicketAdmin } from '../../types';

export const TicketQueue: React.FC = () => {
  const [filters, setFilters] = useState<AdminQueueFilters>({
    status: '',
    category: '',
    priority: '',
    assigned_admin_id: '',
    search: '',
    sort_strategy: 'urgency',
  });

  const queryClient = useQueryClient();

  const { data: tickets, isLoading, error } = useQuery({
    queryKey: ['admin-ticket-queue', filters],
    queryFn: () => adminApi.getQueue(filters),
    refetchInterval: 5000,
  });

  const assignMutation = useMutation({
    mutationFn: (ticketId: string) => adminApi.assignToSelf(ticketId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ticket-queue'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
    },
  });

  const handleFilterChange = (key: keyof AdminQueueFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Operations Ticket Queue</h1>
        <p className="mt-1 text-sm text-slate-500">
          Prioritized incoming author queries, ISBN escalations, royalty reviews, and print defects.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search author, email, ticket #..."
              className="block w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50/50"
            />
          </div>

          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            aria-label="Filter by Status"
            className="block w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50/50 text-slate-700"
          >
            <option value="">All Statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>

          <select
            value={filters.priority}
            onChange={(e) => handleFilterChange('priority', e.target.value)}
            aria-label="Filter by Priority"
            className="block w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50/50 text-slate-700"
          >
            <option value="">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <select
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            aria-label="Filter by Category"
            className="block w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50/50 text-slate-700"
          >
            <option value="">All Categories</option>
            <option value="Royalty & Payments">Royalty & Payments</option>
            <option value="ISBN & Metadata Issues">ISBN & Metadata Issues</option>
            <option value="Printing & Quality">Printing & Quality</option>
            <option value="Distribution & Availability">Distribution & Availability</option>
            <option value="Book Status & Production Updates">Book Status & Production Updates</option>
            <option value="General Inquiry">General Inquiry</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-600">Sorting Strategy:</span>
            <select
              value={filters.sort_strategy}
              onChange={(e) => handleFilterChange('sort_strategy', e.target.value)}
              aria-label="Sorting Strategy"
              className="px-2 py-1 border border-slate-200 rounded-lg text-xs bg-slate-50 text-slate-800 font-medium"
            >
              <option value="urgency">Smart Urgency (Critical & Oldest First)</option>
              <option value="oldest">Oldest Tickets First</option>
              <option value="newest">Newest Tickets First</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleFilterChange('assigned_admin_id', filters.assigned_admin_id ? '' : 'unassigned')}
              className={`px-3 py-1 rounded-lg border text-xs font-medium transition-smooth ${
                filters.assigned_admin_id === 'unassigned'
                  ? 'bg-amber-100 border-amber-300 text-amber-900 font-bold'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {filters.assigned_admin_id === 'unassigned' ? '✓ Showing Unassigned Only' : 'Show Unassigned Only'}
            </button>

            <button
              onClick={() =>
                setFilters({
                  status: '',
                  category: '',
                  priority: '',
                  assigned_admin_id: '',
                  search: '',
                  sort_strategy: 'urgency',
                })
              }
              className="text-xs text-brand-600 hover:underline px-2 py-1"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Ticket Queue Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-4 animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-slate-200 rounded-xl"></div>
            ))}
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-600 text-sm">
            Error loading ticket queue. Please try again.
          </div>
        ) : tickets?.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <Inbox className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm font-semibold">No tickets match the selected filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Ticket</th>
                  <th className="py-3 px-4">Author</th>
                  <th className="py-3 px-4">Subject & Context</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Assigned To</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {tickets?.map((t) => (
                  <tr
                    key={t.id}
                    className={`hover:bg-slate-50/80 transition-smooth ${
                      t.priority === 'Critical' ? 'bg-red-50/20' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      <Link to={`/admin/tickets/${t.id}`} className="hover:text-brand-600">
                        {t.ticket_number}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{t.author_name}</div>
                      <div className="text-[11px] text-slate-400">{t.author_email}</div>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <Link
                        to={`/admin/tickets/${t.id}`}
                        className="font-medium text-slate-800 hover:text-brand-600 line-clamp-1"
                      >
                        {t.subject}
                      </Link>
                      <div className="text-[11px] text-slate-400 truncate">
                        {t.book_title}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-xs text-brand-800 bg-brand-50 px-2 py-0.5 rounded border border-brand-100 font-medium">
                        {t.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <UrgencyBadge priority={t.priority} />
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {t.assigned_admin_name ? (
                        <span className="inline-flex items-center space-x-1 text-slate-800 font-medium">
                          <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{t.assigned_admin_name}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      {!t.assigned_admin_id && (
                        <button
                          onClick={() => assignMutation.mutate(t.id)}
                          disabled={assignMutation.isPending}
                          className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-smooth"
                        >
                          Claim
                        </button>
                      )}
                      <Link
                        to={`/admin/tickets/${t.id}`}
                        className="inline-flex items-center space-x-1 px-3 py-1 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-xs transition-smooth"
                      >
                        <span>Manage</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
