import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  FileUp,
  HelpCircle,
  Paperclip,
  Send,
  Sparkles,
  X,
} from 'lucide-react';
import { authorApi } from '../../api/author';
import { ticketsApi } from '../../api/tickets';
import { TicketAuthor } from '../../types';

const ticketSchema = z.object({
  book_id: z.string().optional(),
  subject: z
    .string()
    .min(5, { message: 'Subject must be at least 5 characters.' })
    .max(255, { message: 'Subject cannot exceed 255 characters.' }),
  description: z
    .string()
    .min(15, { message: 'Please provide at least 15 characters describing your concern.' }),
});

type TicketFormData = z.infer<typeof ticketSchema>;

export const SubmitTicket: React.FC = () => {
  const [attachment, setAttachment] = useState<File | null>(null);
  const [createdTicket, setCreatedTicket] = useState<TicketAuthor | null>(null);
  const navigate = useNavigate();

  // Load author's books for selector
  const { data: books } = useQuery({
    queryKey: ['author-books'],
    queryFn: () => authorApi.getBooks(),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TicketFormData>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      book_id: '',
      subject: '',
      description: '',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: TicketFormData) =>
      ticketsApi.create({
        book_id: data.book_id && data.book_id !== '' ? data.book_id : null,
        subject: data.subject,
        description: data.description,
        attachment_filename: attachment ? attachment.name : null,
      }),
    onSuccess: (ticket) => {
      setCreatedTicket(ticket);
    },
  });

  const onSubmit = (data: TicketFormData) => {
    mutation.mutate(data);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachment(e.target.files[0]);
    }
  };

  if (createdTicket) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 shadow-md">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Query Submitted Successfully!</h1>
          <p className="mt-2 text-sm text-slate-600">
            Your support request has been logged and assigned ticket reference{' '}
            <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
              {createdTicket.ticket_number}
            </span>
            .
          </p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 text-left text-xs text-slate-600 space-y-2 max-w-md mx-auto shadow-xs">
          <div className="flex justify-between">
            <span className="text-slate-400">Classified Category:</span>
            <span className="font-semibold text-slate-800">{createdTicket.category}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Assigned Priority:</span>
            <span className="font-semibold text-brand-700">{createdTicket.priority}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Status:</span>
            <span className="font-semibold text-amber-600">{createdTicket.status}</span>
          </div>
        </div>

        <div className="flex justify-center space-x-3 pt-2">
          <Link
            to={`/author/tickets/${createdTicket.id}`}
            className="inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm shadow-md transition-smooth"
          >
            <span>View Ticket Thread</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <button
            onClick={() => {
              setCreatedTicket(null);
              setAttachment(null);
            }}
            className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-smooth"
          >
            Submit Another Query
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Submit a Support Query</h1>
        <p className="mt-1 text-sm text-slate-500">
          Reach our author operations desk regarding royalties, print proofs, distribution listings, or ISBN inquiries.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        {mutation.isError && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{(mutation.error as any)?.message || 'Failed to submit query. Please try again.'}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Related Book Dropdown */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Related Title / Book
            </label>
            <select
              {...register('book_id')}
              className="block w-full px-3 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50/50 text-slate-800"
            >
              <option value="">General / Account Level (Not book-specific)</option>
              {books?.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title} (ISBN: {b.isbn}) — {b.status}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-slate-400">
              Selecting your book allows our team and AI system to review your verified royalties and production status immediately.
            </p>
          </div>

          {/* Subject Line */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Subject Line *
            </label>
            <input
              type="text"
              id="subject"
              {...register('subject')}
              placeholder="e.g., Question regarding Q3 royalty payout or ISBN Amazon sync"
              className="block w-full px-3 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50/50 text-slate-900"
            />
            {errors.subject && (
              <p className="mt-1 text-xs text-red-600 font-medium">{errors.subject.message}</p>
            )}
          </div>

          {/* Detailed Description */}
          <div>
            <label htmlFor="description" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Detailed Description *
            </label>
            <textarea
              rows={6}
              id="description"
              {...register('description')}
              placeholder="Please describe your query with as much detail as possible (e.g., order numbers, copies received, specific platforms, or dates)..."
              className="block w-full px-3 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50/50 text-slate-900 leading-relaxed"
            ></textarea>
            {errors.description && (
              <p className="mt-1 text-xs text-red-600 font-medium">{errors.description.message}</p>
            )}
          </div>

          {/* Optional File Attachment UI */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Supporting Attachment <span className="text-slate-400 font-normal">(Optional - Photos of misprints, invoices, etc.)</span>
            </label>
            <div className="flex items-center space-x-3">
              <label className="cursor-pointer inline-flex items-center space-x-2 px-4 py-2 border border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-smooth">
                <FileUp className="w-4 h-4 text-slate-500" />
                <span>Choose File</span>
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx"
                />
              </label>

              {attachment ? (
                <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-brand-50 text-brand-800 rounded-lg text-xs border border-brand-200">
                  <Paperclip className="w-3.5 h-3.5 text-brand-600" />
                  <span className="font-medium max-w-[200px] truncate">{attachment.name}</span>
                  <button
                    type="button"
                    onClick={() => setAttachment(null)}
                    className="text-slate-400 hover:text-red-500 ml-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <span className="text-xs text-slate-400">No file selected (Max 10MB)</span>
              )}
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-xs text-slate-500">
              <Sparkles className="w-3.5 h-3.5 text-brand-600" />
              <span>Auto-prioritized and routed by BookLeaf Operations AI</span>
            </div>

            <button
              type="submit"
              disabled={mutation.isPending}
              className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm shadow-md shadow-brand-500/20 disabled:opacity-50 transition-smooth"
            >
              {mutation.isPending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Support Ticket</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
