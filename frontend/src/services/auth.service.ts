import { api, extractData } from '@/lib/api';
import { AuthTokens, User } from '@/types';
import Cookies from 'js-cookie';

export const authService = {
  async login(email: string, password: string): Promise<AuthTokens> {
    const res = await api.post('/auth/login', { email, password });
    const data = extractData<AuthTokens>(res);
    Cookies.set('accessToken', data.accessToken, { expires: 1 / 96 });
    Cookies.set('refreshToken', data.refreshToken, { expires: 7 });
    return data;
  },

  async logout(): Promise<void> {
    try { await api.post('/auth/logout'); } catch {}
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
  },

  async getProfile(): Promise<User> {
    const res = await api.get('/auth/profile');
    return extractData<User>(res);
  },

  async changePassword(currentPassword: string, newPassword: string) {
    const res = await api.patch('/auth/change-password', { currentPassword, newPassword });
    return extractData(res);
  },

  isAuthenticated(): boolean {
    return !!Cookies.get('accessToken');
  },
};
