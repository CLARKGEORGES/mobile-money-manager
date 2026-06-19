import { api, extractData } from '@/lib/api';
import { DashboardSummary, MonthlyChartData, Transaction } from '@/types';

export const dashboardService = {
  async getSummary(): Promise<DashboardSummary> {
    const res = await api.get('/dashboard/summary');
    return extractData(res);
  },

  async getMonthlyChart(): Promise<MonthlyChartData[]> {
    const res = await api.get('/dashboard/monthly-chart');
    return extractData(res);
  },

  async getRecentTransactions(limit = 10): Promise<Transaction[]> {
    const res = await api.get('/dashboard/recent-transactions', { params: { limit } });
    return extractData(res);
  },

  async getStats() {
    const res = await api.get('/dashboard/stats');
    return extractData(res);
  },
};
