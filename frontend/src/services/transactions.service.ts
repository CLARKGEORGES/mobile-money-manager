import { api, extractData } from '@/lib/api';
import { Transaction, PaginatedResponse } from '@/types';

export interface CreateTransactionPayload {
  type: string;
  amount: number;
  fees?: number;
  commission?: number;
  accountId: string;
  customerId?: string;
  description?: string;
  externalRef?: string;
  transactionDate?: string;
}

export interface TransactionFilters {
  search?: string;
  type?: string;
  status?: string;
  accountId?: string;
  customerId?: string;
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
  page?: number;
  limit?: number;
}

export const transactionsService = {
  async getAll(filters: TransactionFilters = {}): Promise<PaginatedResponse<Transaction>> {
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== undefined && v !== ''));
    const res = await api.get('/transactions', { params });
    return extractData(res);
  },

  async getOne(id: string): Promise<Transaction> {
    const res = await api.get(`/transactions/${id}`);
    return extractData(res);
  },

  async create(data: CreateTransactionPayload): Promise<Transaction> {
    const res = await api.post('/transactions', data);
    return extractData(res);
  },

  async update(id: string, data: Partial<CreateTransactionPayload>): Promise<Transaction> {
    const res = await api.patch(`/transactions/${id}`, data);
    return extractData(res);
  },

  async validate(id: string): Promise<Transaction> {
    const res = await api.patch(`/transactions/${id}/validate`);
    return extractData(res);
  },

  async cancel(id: string): Promise<Transaction> {
    const res = await api.patch(`/transactions/${id}/cancel`);
    return extractData(res);
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/transactions/${id}`);
  },
};
