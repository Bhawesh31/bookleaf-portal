import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  History,
  Lock,
  MessageSquare,
  Paperclip,
  RotateCcw,
  Send,
  ShieldCheck,
  Sparkles,
  User,
  UserCheck,
} from 'lucide-react';
import { adminApi } from '../../api/admin';
import { StatusBadge } from '../../components/common/StatusBadge';
import { UrgencyBadge } from '../../components/common/UrgencyBadge';
import { AIDraftResponse } from '../../types';

export const AdminTicketDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  // Internal Note form
  const [noteContent, setNoteContent] = useState('');

  // AI draft state
  const [customInstructions, setCustomInstructions] = useState('');
  const [draftContent, setDraftContent] = useState('');
  const [draftMeta, setDraftMeta] = useState<AIDraftResponse | null>(null);

  // Active tab
  const [activeTab, setActiveTab] = useState<'response' | 'notes' | 'audit'>('response');

  const { data: ticket, isLoading, error } = useQuery({
    queryKey: ['admin-ticket-detail', id],
    queryFn: () => adminApi.getTicketDetail(id!),
    enabled: !!id,
    refetchInterval: 5000,
  });

  // Mutations
  const statusMutation = useMutation({
    mutationFn: (newStatus: string) => adminApi.updateStatus(id!, newStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ticket-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
    },
  });

  const priorityMutation = useMutation({
    mutationFn: (newPriority: string) => adminApi.overridePriority(id!, newPriority),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ticket-detail', id] });
    },
  });

  const categoryMutation = useMutation({
    mutationFn: (newCategory: string) => adminApi.overrideCategory(id!, newCategory),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ticket-detail', id] });
    },
  });

  const assignSelfMutation = useMutation({
    mutationFn: () => adminApi.assignToSelf(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ticket-detail', id] });
    },
  });

  const noteMutation = useMutation({
    mutationFn: (content: string) => adminApi.addNote(id!, content),
    onSuccess: () => {
      setNoteContent('');
      queryClient.invalidateQueries({ queryKey: ['admin-ticket-detail', id] });
    },
  });

  const aiDraftMutation = useMutation({
    mutationFn: () => adminApi.generateAIDraft(id!, customInstructions),
    onSuccess: (res) => {
      setDraftMeta(res);
      setDraftContent(res.draft_reply);
    },
  });

  const publishMutation = useMutation({
    mutationFn: (content: string) => adminApi.publishResponse(id!, content),
    onSuccess: () => {
      setDraftContent('');
      setDraftMeta(null);
      queryClient.invalidateQueries({ queryKey: ['admin-ticket-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse space-y-6">
        <div className="h-6 w-32 bg-slate-200 rounded"></div>
        <div className="h-32 bg-slate-200 rounded-2xl"></div>
        <div className="grid grid-cols-3 gap-6">
          <div className="h-96 bg-slate-200 rounded-2xl"></div>
          <div className="col-span-2 h-96 bg-slate-200 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-200">
          Ticket not found or error loading workbench.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top back link */}
      <div>
        <Link
          to="/admin/queue"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-smooth"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Ticket Queue</span>
        </Link>
      </div>

      {/* Ticket Header & Quick Action Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <span className="font-mono text-base font-bold bg-slate-100 text-slate-900 px-3 py-1 rounded-xl">
              {ticket.ticket_number}
            </span>
            <StatusBadge status={ticket.status} />
            <UrgencyBadge priority={ticket.priority} />
            <span className="text-xs px-2.5 py-1 rounded-lg bg-brand-50 text-brand-800 font-semibold border border-brand-200">
              {ticket.category}
            </span>
          </div>

          {/* Assignment badge / button */}
          <div className="flex items-center space-x-3">
            {ticket.assigned_admin_name ? (
              <span className="text-xs font-medium text-slate-700 flex items-center space-x-1.5 bg-slate-100 px-3 py-1.5 rounded-xl">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <span>Assigned: <strong>{ticket.assigned_admin_name}</strong></span>
              </span>
            ) : (
              <button
                onClick={() => assignSelfMutation.mutate()}
                disabled={assignSelfMutation.isPending}
                className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-xs transition-smooth"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Assign to Me</span>
              </button>
            )}
          </div>
        </div>

        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">{ticket.subject}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span>Author: <strong>{ticket.author_name}</strong> ({ticket.author_email})</span>
            <span>•</span>
            <span>Related: <strong>{ticket.book_title}</strong></span>
            <span>•</span>
            <span>Classification Source: <strong className="capitalize">{ticket.classification_source}</strong></span>
            <span>•</span>
            <span>Priority Source: <strong className="capitalize">{ticket.priority_source}</strong></span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Operational Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Author Context, Verified Database Facts & Controls */}
        <div className="space-y-6">
          {/* Status & Priority Control Panel */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2">
              Ticket Controls
            </h3>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Change Status
              </label>
              <select
                value={ticket.status}
                onChange={(e) => statusMutation.mutate(e.target.value)}
                disabled={statusMutation.isPending}
                className="w-full text-xs font-semibold p-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-800"
              >
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Override Priority
              </label>
              <select
                value={ticket.priority}
                onChange={(e) => priorityMutation.mutate(e.target.value)}
                disabled={priorityMutation.isPending}
                className="w-full text-xs font-semibold p-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-800"
              >
                <option value="Critical">Critical (Immediate SLA)</option>
                <option value="High">High (48h Resolution)</option>
                <option value="Medium">Medium (Standard)</option>
                <option value="Low">Low (Informational)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Override Category
              </label>
              <select
                value={ticket.category}
                onChange={(e) => categoryMutation.mutate(e.target.value)}
                disabled={categoryMutation.isPending}
                className="w-full text-xs font-semibold p-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-800"
              >
                <option value="Royalty & Payments">Royalty & Payments</option>
                <option value="ISBN & Metadata Issues">ISBN & Metadata Issues</option>
                <option value="Printing & Quality">Printing & Quality</option>
                <option value="Distribution & Availability">Distribution & Availability</option>
                <option value="Book Status & Production Updates">Book Status & Production Updates</option>
                <option value="General Inquiry">General Inquiry</option>
              </select>
            </div>
          </div>

          {/* AI Decision Explanation */}
          {ticket.ai_reasoning && (
            <div className="bg-purple-50/60 rounded-2xl border border-purple-200 p-4 text-xs text-purple-900 space-y-1.5 shadow-xs">
              <div className="flex items-center space-x-1.5 font-bold text-purple-950">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>AI Classification Analysis</span>
              </div>
              <p className="leading-relaxed text-[11px] text-purple-800">{ticket.ai_reasoning}</p>
            </div>
          )}

          {/* Author Details Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2">
              Author Profile
            </h3>
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span className="text-slate-400">Name:</span>
                <span className="font-semibold text-slate-900">{ticket.author_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Email:</span>
                <span className="font-mono text-slate-800">{ticket.author_email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Related Title:</span>
                <span className="font-semibold text-brand-700">{ticket.book_title}</span>
              </div>
              {ticket.attachment_filename && (
                <div className="flex justify-between pt-1">
                  <span className="text-slate-400">Attachment:</span>
                  <span className="font-medium text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                    {ticket.attachment_filename}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Workbench (AI Drafts, Thread, Notes, Audit) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tab Navigation */}
          <div className="flex border-b border-slate-200 space-x-6 text-xs font-bold uppercase tracking-wider">
            <button
              onClick={() => setActiveTab('response')}
              className={`pb-3 flex items-center space-x-2 transition-smooth ${
                activeTab === 'response'
                  ? 'border-b-2 border-brand-600 text-brand-600'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>AI Response Workbench</span>
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`pb-3 flex items-center space-x-2 transition-smooth ${
                activeTab === 'notes'
                  ? 'border-b-2 border-brand-600 text-brand-600'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>Private Internal Notes ({ticket.internal_notes.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`pb-3 flex items-center space-x-2 transition-smooth ${
                activeTab === 'audit'
                  ? 'border-b-2 border-brand-600 text-brand-600'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Audit Trail ({ticket.audit_events.length})</span>
            </button>
          </div>

          {/* TAB 1: AI Response Workbench */}
          {activeTab === 'response' && (
            <div className="space-y-6">
              {/* AI Draft Generator Panel */}
              <div className="bg-gradient-to-br from-brand-50/70 via-white to-purple-50/50 rounded-2xl border border-brand-200/80 p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-5 h-5 text-brand-600" />
                    <h3 className="text-sm font-bold text-slate-900">
                      Context-Aware AI Response Draft
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => aiDraftMutation.mutate()}
                    disabled={aiDraftMutation.isPending}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-brand-500/20 disabled:opacity-50 transition-smooth"
                  >
                    {aiDraftMutation.isPending ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{draftContent ? 'Regenerate Draft' : 'Generate AI Draft'}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Optional custom admin instructions */}
                <div>
                  <input
                    type="text"
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    placeholder="Add special instructions for AI (e.g. 'Ask for photographs of binding', 'Confirm ₹3,570 payout date')..."
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                {/* Grounding facts badge list */}
                {draftMeta && (
                  <div className="space-y-2 pt-2 border-t border-brand-100">
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                      <span className="font-semibold text-slate-500">Verified Facts Used:</span>
                      {draftMeta.grounding_facts.map((fact, idx) => (
                        <span key={idx} className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md">
                          {fact}
                        </span>
                      ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                      <span className="font-semibold text-slate-500">Knowledge Base Policies:</span>
                      {draftMeta.policy_references.map((pol, idx) => (
                        <span key={idx} className="bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-md">
                          {pol}
                        </span>
                      ))}
                      <span className="ml-auto text-[10px] text-slate-400 font-mono">
                        Engine: {draftMeta.model_used}
                      </span>
                    </div>
                  </div>
                )}

                {/* Response Editor & Human-in-the-Loop Publishing */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Response Editor <span className="text-slate-400 font-normal lowercase">(review & edit before publishing)</span>
                    </label>
                    {draftContent && (
                      <span className="text-[11px] text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        Admin approval required to send
                      </span>
                    )}
                  </div>

                  <textarea
                    rows={8}
                    value={draftContent}
                    onChange={(e) => setDraftContent(e.target.value)}
                    placeholder="Click 'Generate AI Draft' above or write a manual response directly..."
                    className="w-full p-4 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white text-slate-900 leading-relaxed font-sans shadow-inner"
                  ></textarea>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setDraftContent('')}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100"
                    >
                      Clear
                    </button>

                    <button
                      type="button"
                      onClick={() => publishMutation.mutate(draftContent)}
                      disabled={publishMutation.isPending || !draftContent.trim()}
                      className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-smooth"
                    >
                      {publishMutation.isPending ? (
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Publish Response to Author</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Conversation Messages Thread */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Ticket Communication History
                </h3>

                <div className="space-y-4">
                  {ticket.messages.map((m) => {
                    const isAdmin = m.sender_role === 'admin';
                    return (
                      <div
                        key={m.id}
                        className={`p-4 rounded-2xl border ${
                          isAdmin
                            ? 'bg-brand-50/40 border-brand-200 text-slate-900'
                            : 'bg-white border-slate-200 text-slate-900'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100 text-xs">
                          <div className="flex items-center space-x-2 font-bold">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider ${
                                isAdmin ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {m.sender_role}
                            </span>
                            <span>{m.sender_name}</span>
                          </div>
                          <span className="text-slate-400 text-[11px]">
                            {new Date(m.created_at).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-xs leading-relaxed whitespace-pre-wrap">{m.content}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Private Internal Notes */}
          {activeTab === 'notes' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 text-amber-900 text-xs flex items-center space-x-2">
                <Lock className="w-4 h-4 flex-shrink-0 text-amber-700" />
                <span>
                  <strong>Strict Privacy Guarantee:</strong> Internal notes are exclusively visible to BookLeaf operations staff and are never included in author payloads or author views.
                </span>
              </div>

              {/* New note form */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Add Private Internal Note
                </label>
                <textarea
                  rows={3}
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Record internal printer escalations, bank tracking numbers, or team notes..."
                  className="w-full p-3 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50 text-slate-900"
                ></textarea>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => noteMutation.mutate(noteContent.trim())}
                    disabled={noteMutation.isPending || !noteContent.trim()}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-smooth"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Save Internal Note</span>
                  </button>
                </div>
              </div>

              {/* Notes list */}
              <div className="space-y-3">
                {ticket.internal_notes.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl">
                    No internal notes recorded yet.
                  </div>
                ) : (
                  ticket.internal_notes.map((n) => (
                    <div
                      key={n.id}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="font-semibold text-slate-900">{n.admin_name}</span>
                        <span className="text-[11px] font-mono">{new Date(n.created_at).toLocaleString()}</span>
                      </div>
                      <div className="text-xs leading-relaxed whitespace-pre-wrap">{n.content}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Audit Trail */}
          {activeTab === 'audit' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2">
                Ticket Action Audit Log
              </h3>

              <div className="relative border-l-2 border-slate-200 ml-3 space-y-6 py-2">
                {ticket.audit_events.map((a) => (
                  <div key={a.id} className="relative pl-6">
                    <span className="absolute -left-1.5 top-1 w-3 h-3 rounded-full bg-brand-500 ring-4 ring-white"></span>
                    <div className="text-xs font-bold text-slate-900">{a.action}</div>
                    <div className="text-[11px] text-slate-500">
                      By {a.actor_name} • {new Date(a.created_at).toLocaleString()}
                    </div>
                    {a.new_values && (
                      <pre className="mt-1 p-2 rounded-lg bg-slate-50 border border-slate-100 text-[10px] text-slate-700 font-mono overflow-x-auto">
                        {JSON.stringify(a.new_values, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
