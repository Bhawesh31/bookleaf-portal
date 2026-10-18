import { api } from './client';
import {
  AdminDashboardStats,
  AIDraftResponse,
  InternalNote,
  TicketAdmin,
  TicketMessage,
} from '../types';

export interface AdminQueueFilters {
  status?: string;
  category?: string;
  priority?: string;
  assigned_admin_id?: string;
  search?: string;
  sort_strategy?: string;
}

export const adminApi = {
  getDashboardStats: () => api.get<AdminDashboardStats>('/admin/dashboard-stats'),

  getQueue: (filters?: AdminQueueFilters) => {
    const query = new URLSearchParams();
    if (filters?.status) query.set('status', filters.status);
    if (filters?.category) query.set('category', filters.category);
    if (filters?.priority) query.set('priority', filters.priority);
    if (filters?.assigned_admin_id) query.set('assigned_admin_id', filters.assigned_admin_id);
    if (filters?.search) query.set('search', filters.search);
    if (filters?.sort_strategy) query.set('sort_strategy', filters.sort_strategy);
    const qs = query.toString();
    return api.get<TicketAdmin[]>(`/admin/tickets${qs ? `?${qs}` : ''}`);
  },

  getTicketDetail: (ticketId: string) => api.get<TicketAdmin>(`/admin/tickets/${ticketId}`),

  updateStatus: (ticketId: string, status: string) =>
    api.patch<TicketAdmin>(`/admin/tickets/${ticketId}/status`, { status }),

  overridePriority: (ticketId: string, priority: string, reason?: string) =>
    api.patch<TicketAdmin>(`/admin/tickets/${ticketId}/priority`, { priority, reason }),

  overrideCategory: (ticketId: string, category: string, reason?: string) =>
    api.patch<TicketAdmin>(`/admin/tickets/${ticketId}/category`, { category, reason }),

  assignToSelf: (ticketId: string) =>
    api.post<TicketAdmin>(`/admin/tickets/${ticketId}/assign-self`),

  addNote: (ticketId: string, content: string) =>
    api.post<InternalNote>(`/admin/tickets/${ticketId}/notes`, { content }),

  generateAIDraft: (ticketId: string, custom_instructions?: string) =>
    api.post<AIDraftResponse>(`/admin/tickets/${ticketId}/ai-draft`, { custom_instructions }),

  publishResponse: (ticketId: string, content: string) =>
    api.post<TicketMessage>(`/admin/tickets/${ticketId}/publish-response`, { content }),
};
