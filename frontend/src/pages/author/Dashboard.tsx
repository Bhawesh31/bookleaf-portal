import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookCheck,
  BookOpen,
  Clock,
  DollarSign,
  HelpCircle,
  Inbox,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';
import { authorApi } from '../../api/author';
import { StatusBadge } from '../../components/common/StatusBadge';
import { UrgencyBadge } from '../../components/common/UrgencyBadge';

export const AuthorDashboard: React.FC = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['author-dashboard-stats'],
    queryFn: () => authorApi.getDashboardStats(),
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse space-y-6">
        <div className="h-28 bg-slate-200 rounded-2xl"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-200 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-red-700 text-sm">
          Failed to load dashboard data. Please try refreshing.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Hero Banner */}
      <div className="bg-gradient-to-r from-navy-900 via-slate-900 to-brand-950 rounded-2xl p-6 md:p-8 text-white shadow-xl shadow-slate-900/10 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2 text-brand-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-4 h-4" />
            <span>Author Portal • {data.author.author_id}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            Welcome back, {data.author.name}
          </h1>
          <p className="mt-1 text-slate-300 text-sm max-w-xl">
            Track your book catalog, quarterly sales royalties, and submit inquiries directly to our publishing operations team.
          </p>
        </div>

        <Link
          to="/author/submit-ticket"
          className="inline-flex items-center space-x-2 px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm shadow-lg shadow-brand-600/30 transition-smooth flex-shrink-0"
        >
          <HelpCircle className="w-4 h-4" />
          <span>Raise Support Query</span>
        </Link>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow transition-smooth">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Titles</span>
            <BookOpen className="w-4 h-4 text-brand-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{data.total_books}</div>
          <div className="mt-1 flex items-center space-x-2 text-xs text-slate-500">
            <span className="text-emerald-600 font-medium">{data.published_books} live</span>
            {data.in_production_books > 0 && (
              <span>• {data.in_production_books} in production</span>
            )}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow transition-smooth">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Copies Sold</span>
            <ShoppingBag className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{data.total_copies_sold.toLocaleString()}</div>
          <div className="mt-1 text-xs text-slate-500">Across all retail channels</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow transition-smooth">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Royalty Earned</span>
            <DollarSign className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">₹{data.total_royalty_earned.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          <div className="mt-1 text-xs text-emerald-600 font-medium">₹{data.royalty_paid.toLocaleString('en-IN', { minimumFractionDigits: 2 })} disbursed</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow transition-smooth">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Royalty</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-600">₹{data.royalty_pending.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          <div className="mt-1 text-xs text-slate-500">Disbursed on quarterly cycle</div>
        </div>
      </div>

      {/* Main Content Split: Recent Tickets & Quick Links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Recent Support Inquiries */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-2">
              <Inbox className="w-5 h-5 text-slate-700" />
              <h2 className="text-base font-bold text-slate-900">Recent Support Queries</h2>
            </div>
            <Link
              to="/author/tickets"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {data.recent_tickets.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-3">
              <HelpCircle className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-sm">You haven't submitted any support queries yet.</p>
              <Link
                to="/author/submit-ticket"
                className="inline-block text-xs font-semibold text-brand-600 hover:underline"
              >
                Submit your first query &rarr;
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {data.recent_tickets.map((t) => (
                <Link
                  key={t.id}
                  to={`/author/tickets/${t.id}`}
                  className="py-3.5 flex items-center justify-between hover:bg-slate-50/80 px-2 rounded-xl transition-smooth group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono font-medium text-slate-400">
                        {t.ticket_number}
                      </span>
                      <StatusBadge status={t.status} />
                      <UrgencyBadge priority={t.priority} />
                    </div>
                    <div className="text-sm font-semibold text-slate-800 group-hover:text-brand-600 transition-smooth">
                      {t.subject}
                    </div>
                  </div>
                  <div className="text-right text-xs text-slate-400">
                    <div>{t.created_at}</div>
                    <span className="text-[11px] text-brand-600 group-hover:underline">View details</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Knowledge Base & Policies Summary Card */}
        <div className="bg-gradient-to-b from-slate-50 to-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-200/80 pb-3">
            <BookCheck className="w-5 h-5 text-teal-600" />
            <h2 className="text-base font-bold text-slate-900">Author Key Policies</h2>
          </div>

          <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
            <div className="p-3 bg-white rounded-xl border border-slate-200/60 shadow-xs">
              <div className="font-semibold text-slate-900 mb-1">Royalty Policy (80/20 Split)</div>
              BookLeaf distributes 80% of net profits quarterly within 45 days after quarter-end for balances meeting the ₹1,000 threshold.
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200/60 shadow-xs">
              <div className="font-semibold text-slate-900 mb-1">Quality Assurance & Reprints</div>
              Verified print defects (misprints, binding issues) qualify for a free reprint within 5–7 business days upon photo verification.
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200/60 shadow-xs">
              <div className="font-semibold text-slate-900 mb-1">Distribution Stock Sync</div>
              Temporary out-of-stock notices on Amazon or Flipkart can be re-synced by our team within 24–48 hours.
            </div>
          </div>

          <div className="pt-2">
            <Link
              to="/author/royalties"
              className="w-full flex items-center justify-center space-x-1.5 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition-smooth"
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>View Detailed Royalty Breakdown</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
