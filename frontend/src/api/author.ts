import { api } from './client';
import { AuthorDashboardStats, AuthorProfile, Book, RoyaltySummary } from '../types';

export const authorApi = {
  getProfile: () => api.get<AuthorProfile>('/author/profile'),

  getDashboardStats: () => api.get<AuthorDashboardStats>('/author/dashboard-stats'),

  getBooks: (params?: { search?: string; genre?: string; status?: string; sort_by?: string }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.genre) query.set('genre', params.genre);
    if (params?.status) query.set('status', params.status);
    if (params?.sort_by) query.set('sort_by', params.sort_by);
    const qs = query.toString();
    return api.get<Book[]>(`/author/books${qs ? `?${qs}` : ''}`);
  },

  getRoyalties: () => api.get<RoyaltySummary>('/author/royalties'),
};
