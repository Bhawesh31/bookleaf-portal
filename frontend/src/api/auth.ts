import { api } from './client';
import { User } from '../types';

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export const authApi = {
  login: (credentials: { email: string; password: string }) =>
    api.post<LoginResponse>('/auth/login', credentials),

  getMe: () => api.get<User>('/auth/me'),

  logout: () => api.post<{ message: string }>('/auth/logout'),
};
