import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  HelpCircle,
  Paperclip,
  Send,
  ShieldCheck,
  User,
} from 'lucide-react';
import { ticketsApi } from '../../api/tickets';
import { StatusBadge } from '../../components/common/StatusBadge';
import { UrgencyBadge } from '../../components/common/UrgencyBadge';

export const AuthorTicketDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [replyText, setReplyText] = useState('');
  const queryClient = useQueryClient();

  const { data: ticket, isLoading, error } = useQuery({
    queryKey: ['author-ticket-detail', id],
    queryFn: () => ticketsApi.getDetail(id!),
    enabled: !!id,
    refetchInterval: 4000, // Near-real-time polling: updates without refreshing the page!
  });

  const replyMutation = useMutation({
    mutationFn: (content: string) => ticketsApi.reply(id!, content),
    onSuccess: () => {
      setReplyText('');
      queryClient.invalidateQueries({ queryKey: ['author-ticket-detail', id] });
    },
  });

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    replyMutation.mutate(replyText.trim());
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse space-y-4">
        <div className="h-6 w-32 bg-slate-200 rounded"></div>
        <div className="h-40 bg-slate-200 rounded-2xl"></div>
        <div className="h-64 bg-slate-200 rounded-2xl"></div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-200">
          Ticket not found or access denied.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Back link */}
      <div>
        <Link
          to="/author/tickets"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-smooth"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Tickets</span>
        </Link>
      </div>

      {/* Ticket Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-2.5">
            <span className="font-mono text-sm font-bold bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg">
              {ticket.ticket_number}
            </span>
            <StatusBadge status={ticket.status} />
            <UrgencyBadge priority={ticket.priority} />
          </div>
          <div className="text-xs text-slate-400">
            Created: {new Date(ticket.created_at).toLocaleString()}
          </div>
        </div>

        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">{ticket.subject}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span className="px-2 py-0.5 rounded bg-brand-50 text-brand-700 font-medium border border-brand-100">
              {ticket.category}
            </span>
            <span>•</span>
            <span className="flex items-center space-x-1">
              <BookOpen className="w-3.5 h-3.5 text-slate-400" />
              <span>Related Title: <strong>{ticket.book_title}</strong></span>
            </span>
            {ticket.attachment_filename && (
              <>
                <span>•</span>
                <span className="flex items-center space-x-1 text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                  <Paperclip className="w-3.5 h-3.5" />
                  <span>{ticket.attachment_filename}</span>
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Conversation Thread */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider px-1">
          Conversation History
        </h2>

        <div className="space-y-4">
          {ticket.messages.map((message) => {
            const isAdmin = message.sender_role === 'admin';
            return (
              <div
                key={message.id}
                className={`flex flex-col ${isAdmin ? 'items-start' : 'items-end'}`}
              >
                <div
                  className={`max-w-2xl rounded-2xl p-5 shadow-xs border ${
                    isAdmin
                      ? 'bg-white text-slate-900 border-slate-200'
                      : 'bg-brand-600 text-white border-brand-700 shadow-md shadow-brand-600/10'
                  }`}
                >
                  <div className="flex items-center justify-between space-x-3 mb-2 pb-2 border-b border-slate-100/30">
                    <div className="flex items-center space-x-1.5">
                      {isAdmin ? (
                        <div className="w-5 h-5 rounded-full bg-brand-100 text-brand-800 flex items-center justify-center text-[10px] font-bold">
                          BL
                        </div>
                      ) : (
                        <User className="w-4 h-4 text-brand-200" />
                      )}
                      <span className="text-xs font-semibold">
                        {isAdmin ? 'BookLeaf Operations' : 'You (Author)'}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] ${
                        isAdmin ? 'text-slate-400' : 'text-brand-100'
                      }`}
                    >
                      {new Date(message.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>

                  <div className="text-xs leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Author Reply Box */}
      {ticket.status !== 'Closed' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
            Send a Reply
          </label>
          <form onSubmit={handleReplySubmit} className="space-y-3">
            <textarea
              rows={3}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Type your response here..."
              className="block w-full p-3 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50/50 text-slate-900"
            ></textarea>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={replyMutation.isPending || !replyText.trim()}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-md disabled:opacity-50 transition-smooth"
              >
                {replyMutation.isPending ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Message</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
