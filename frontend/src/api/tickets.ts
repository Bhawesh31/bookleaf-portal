import { api } from './client';
import { TicketAuthor, TicketMessage } from '../types';

export interface CreateTicketPayload {
  book_id?: string | null;
  subject: string;
  description: string;
  attachment_filename?: string | null;
}

export const ticketsApi = {
  create: (payload: CreateTicketPayload) => api.post<TicketAuthor>('/tickets', payload),

  list: (status?: string) => {
    const qs = status ? `?status=${encodeURIComponent(status)}` : '';
    return api.get<TicketAuthor[]>(`/tickets${qs}`);
  },

  getDetail: (ticketId: string) => api.get<TicketAuthor>(`/tickets/${ticketId}`),

  reply: (ticketId: string, content: string) =>
    api.post<TicketMessage>(`/tickets/${ticketId}/reply`, { content }),
};
