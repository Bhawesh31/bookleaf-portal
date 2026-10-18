import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Filter,
  HelpCircle,
  Inbox,
  MessageSquare,
  Plus,
} from 'lucide-react';
import { ticketsApi } from '../../api/tickets';
import { StatusBadge } from '../../components/common/StatusBadge';
import { UrgencyBadge } from '../../components/common/UrgencyBadge';

export const TicketList: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState('');

  const { data: tickets, isLoading, error } = useQuery({
    queryKey: ['author-tickets', statusFilter],
    queryFn: () => ticketsApi.list(statusFilter || undefined),
    refetchInterval: 5000, // Near-real-time polling every 5s
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Support Inquiries</h1>
          <p className="mt-1 text-sm text-slate-500">
            Track real-time status and communications with BookLeaf publishing operations.
          </p>
        </div>

        <Link
          to="/author/submit-ticket"
          className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-md transition-smooth flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Query</span>
        </Link>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3">
        <Filter className="w-4 h-4 text-slate-400 ml-2" />
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Filter Status:</span>
        <div className="flex flex-wrap gap-1.5">
          {['', 'Open', 'In Progress', 'Resolved', 'Closed'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-smooth ${
                statusFilter === s
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {s || 'All Statuses'}
            </button>
          ))}
        </div>
      </div>

      {/* Tickets List / Table */}
      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-slate-200 rounded-2xl"></div>
          ))}
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-200">
          Failed to load tickets. Please try refreshing.
        </div>
      ) : tickets?.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-500 space-y-3">
          <Inbox className="w-10 h-10 mx-auto text-slate-300" />
          <p className="text-sm font-medium">No tickets found for this filter.</p>
          <Link
            to="/author/submit-ticket"
            className="inline-block text-xs font-semibold text-brand-600 hover:underline"
          >
            Submit a query to support &rarr;
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
          {tickets?.map((t) => (
            <Link
              key={t.id}
              to={`/author/tickets/${t.id}`}
              className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 transition-smooth group"
            >
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                    {t.ticket_number}
                  </span>
                  <StatusBadge status={t.status} />
                  <UrgencyBadge priority={t.priority} />
                  <span className="text-xs text-brand-700 font-medium bg-brand-50 px-2 py-0.5 rounded border border-brand-100">
                    {t.category}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-brand-600 transition-smooth">
                  {t.subject}
                </h3>
                <div className="text-xs text-slate-500 flex items-center space-x-2">
                  <span>Related to: <strong>{t.book_title}</strong></span>
                  <span>•</span>
                  <span>Updated: {new Date(t.updated_at).toLocaleString()}</span>
                </div>
              </div>

              <div className="flex items-center space-x-4 self-end sm:self-center">
                <div className="flex items-center space-x-1 text-xs text-slate-400">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{t.messages.length} messages</span>
                </div>
                <span className="text-xs font-semibold text-brand-600 flex items-center space-x-1 group-hover:translate-x-1 transition-smooth">
                  <span>Open Thread</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
