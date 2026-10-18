import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  Building,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  HelpCircle,
  Info,
  Layers,
  ShieldCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { authorApi } from '../../api/author';

export const MyRoyalties: React.FC = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['author-royalties'],
    queryFn: () => authorApi.getRoyalties(),
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse space-y-6">
        <div className="h-28 bg-slate-200 rounded-2xl"></div>
        <div className="h-64 bg-slate-200 rounded-2xl"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-red-700 text-sm">
          Failed to load royalties. Please try refreshing.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Royalty Management</h1>
        <p className="mt-1 text-sm text-slate-500">
          Transparent quarterly calculation, disbursement history, and per-title financial statements.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Royalty Earned</span>
            <DollarSign className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            ₹{data.total_earned.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-xs text-slate-500">Cumulative sales profit</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Disbursed (Paid Out)</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">
            ₹{data.total_paid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-xs text-slate-500">Directly transferred to linked bank</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Disbursement</span>
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-600">
            ₹{data.total_pending.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {data.total_pending >= data.threshold ? 'Eligible for next quarterly cycle' : 'Accumulating toward ₹1,000 threshold'}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Payout Threshold</span>
            <ShieldCheck className="w-5 h-5 text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-slate-800">
            ₹{data.threshold.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-xs text-slate-500">Below threshold rolls over to next quarter</div>
        </div>
      </div>

      {/* Official 80/20 Policy Explainer Banner */}
      <div className="bg-gradient-to-r from-brand-50 to-teal-50 border border-brand-200 rounded-2xl p-6 text-slate-800 space-y-3 shadow-xs">
        <div className="flex items-center space-x-2 text-brand-900 font-bold text-base">
          <Info className="w-5 h-5 text-brand-600" />
          <span>BookLeaf Official 80/20 Net-Profit Royalty Policy</span>
        </div>
        <p className="text-xs text-slate-700 leading-relaxed max-w-4xl">
          BookLeaf operates under a partner-first model distributing <strong>80% of net profits</strong> to authors and retaining 20%. Net profit is calculated as the <strong>Retail Selling Price (MRP)</strong> minus verified <strong>printing production costs</strong>, <strong>e-commerce platform commissions</strong> (Amazon/Flipkart), and <strong>shipping logistics</strong>. Royalties are computed at the conclusion of every fiscal quarter and disbursed via NEFT/IMPS bank transfer within <strong>45 days</strong> for accounts reaching the ₹1,000 threshold.
        </p>
        <div className="pt-1 flex flex-wrap gap-4 text-xs font-medium text-brand-900">
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-brand-600"></span>
            <span>Split: 80% Author / 20% BookLeaf</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-brand-600"></span>
            <span>Cycle: Quarterly payout within 45 days</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-brand-600"></span>
            <span>Minimum payout: ₹1,000 threshold</span>
          </div>
        </div>
      </div>

      {/* Per-Book Royalty Statement Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-slate-700" />
            <h2 className="text-base font-bold text-slate-900">Per-Title Royalty Breakdown</h2>
          </div>
          <Link
            to="/author/submit-ticket"
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center space-x-1"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Query a Payout</span>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Title & ISBN</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">MRP</th>
                <th className="py-3 px-4 text-right">Author Royalty/Copy</th>
                <th className="py-3 px-4 text-right">Sold Copies</th>
                <th className="py-3 px-4 text-right">Total Earned</th>
                <th className="py-3 px-4 text-right">Disbursed (Paid)</th>
                <th className="py-3 px-4 text-right">Pending</th>
                <th className="py-3 px-4 text-center">Last Payout</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {data.books.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/60 transition-smooth">
                  <td className="py-3.5 px-4 font-medium text-slate-900">
                    <div>{b.title}</div>
                    <div className="text-[11px] font-mono text-slate-400">{b.isbn} • {b.book_id}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                        b.status === 'Published & Live'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {b.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-medium">
                    {b.mrp !== null ? `₹${b.mrp}` : <span className="text-slate-400 italic">N/A</span>}
                  </td>
                  <td className="py-3.5 px-4 text-right font-medium">
                    {b.author_royalty_per_copy !== null ? `₹${b.author_royalty_per_copy}` : <span className="text-slate-400 italic">N/A</span>}
                  </td>
                  <td className="py-3.5 px-4 text-right font-semibold text-slate-800">
                    {b.total_copies_sold.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                    ₹{b.total_royalty_earned.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3.5 px-4 text-right font-semibold text-emerald-600">
                    ₹{b.royalty_paid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-amber-600">
                    ₹{b.royalty_pending.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3.5 px-4 text-center text-slate-500 font-mono text-[11px]">
                    {b.last_royalty_payout_date || <span className="text-slate-400 italic">None</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
