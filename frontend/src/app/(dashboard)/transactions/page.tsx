'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionsService } from '@/services/transactions.service';
import { api, extractData } from '@/lib/api';
import {
  formatCurrency, formatDate, TRANSACTION_TYPE_LABELS, TRANSACTION_STATUS_LABELS,
  TRANSACTION_STATUS_COLORS, TRANSACTION_TYPE_COLORS, isIncomeType,
} from '@/lib/utils';
import { Plus, Search, Filter, CheckCircle, XCircle, Eye, Trash2, ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react';
import { Transaction, TransactionStatus, TransactionType, MobileMoneyAccount } from '@/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const txSchema = z.object({
  type: z.string().min(1),
  amount: z.coerce.number().min(1),
  fees: z.coerce.number().min(0).optional(),
  commission: z.coerce.number().min(0).optional(),
  accountId: z.string().min(1),
  customerId: z.string().optional(),
  description: z.string().optional(),
});

type TxForm = z.infer<typeof txSchema>;

const TX_TYPES: TransactionType[] = ['DEPOSIT','WITHDRAWAL','TRANSFER','MERCHANT_PAYMENT','COLLECTION','DISBURSEMENT','FEE'];
const TX_STATUSES: TransactionStatus[] = ['PENDING','VALIDATED','CANCELLED','FAILED'];

export default function TransactionsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['transactions', page, search, typeFilter, statusFilter],
    queryFn: () => transactionsService.getAll({
      page, limit: 20,
      search: search || undefined,
      type: (typeFilter as TransactionType) || undefined,
      status: (statusFilter as TransactionStatus) || undefined,
    }),
  });

  const { data: accounts } = useQuery({
    queryKey: ['accounts-select'],
    queryFn: async () => {
      const res = await api.get('/accounts', { params: { limit: 100, isActive: true } });
      return extractData<{ data: MobileMoneyAccount[] }>(res).data;
    },
  });

  const createMutation = useMutation({
    mutationFn: transactionsService.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['transactions'] }); setShowForm(false); reset(); },
  });

  const validateMutation = useMutation({
    mutationFn: transactionsService.validate,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transactions'] }),
  });

  const cancelMutation = useMutation({
    mutationFn: transactionsService.cancel,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transactions'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: transactionsService.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transactions'] }),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<TxForm>({
    resolver: zodResolver(txSchema),
  });

  const onSubmit = (data: TxForm) => createMutation.mutate(data as any);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Transactions</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {data?.meta.total.toLocaleString('fr-FR') || 0} transaction(s) au total
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition font-medium text-sm"
        >
          <Plus className="w-4 h-4" /> Nouvelle transaction
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 flex gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-xl px-4 py-2 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text" placeholder="Rechercher (référence, client...)"
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="bg-transparent text-sm text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none w-full"
          />
        </div>
        <select
          value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="">Tous les types</option>
          {TX_TYPES.map((t) => <option key={t} value={t}>{TRANSACTION_TYPE_LABELS[t]}</option>)}
        </select>
        <select
          value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="">Tous les statuts</option>
          {TX_STATUSES.map((s) => <option key={s} value={s}>{TRANSACTION_STATUS_LABELS[s]}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                {['Référence', 'Date', 'Type', 'Client', 'Compte', 'Montant', 'Frais', 'Statut', 'Actions'].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
                : data?.data.map((tx) => {
                  const income = isIncomeType(tx.type);
                  return (
                    <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono text-gray-600 dark:text-gray-400">{tx.reference}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {formatDate(tx.transactionDate)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {income
                            ? <ArrowUpRight className="w-4 h-4 text-green-500" />
                            : <ArrowDownRight className="w-4 h-4 text-red-500" />
                          }
                          <span className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">{TRANSACTION_TYPE_LABELS[tx.type]}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{tx.customer?.name || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {tx.account.accountName}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`text-sm font-semibold ${income ? 'text-green-600' : 'text-red-600'}`}>
                          {income ? '+' : '-'}{formatCurrency(Number(tx.amount))}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{formatCurrency(Number(tx.fees))}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${TRANSACTION_STATUS_COLORS[tx.status]}`}>
                          {TRANSACTION_STATUS_LABELS[tx.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {tx.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => validateMutation.mutate(tx.id)}
                                disabled={validateMutation.isPending}
                                className="p-1.5 rounded-lg text-green-600 hover:bg-green-100 dark:hover:bg-green-900/20 transition"
                                title="Valider"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => cancelMutation.mutate(tx.id)}
                                disabled={cancelMutation.isPending}
                                className="p-1.5 rounded-lg text-orange-600 hover:bg-orange-100 dark:hover:bg-orange-900/20 transition"
                                title="Annuler"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {tx.status !== 'VALIDATED' && (
                            <button
                              onClick={() => { if (confirm('Supprimer cette transaction ?')) deleteMutation.mutate(tx.id); }}
                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 transition"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              }
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-700">
            <p className="text-sm text-gray-500">
              Page {data.meta.page} sur {data.meta.totalPages} — {data.meta.total} résultats
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={!data.meta.hasPrevPage}
                className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Précédent
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={!data.meta.hasNextPage}
                className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">Nouvelle transaction</h3>
              <button onClick={() => { setShowForm(false); reset(); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">✕</button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Type" error={errors.type?.message}>
                  <select {...register('type')} className="form-select">
                    <option value="">Choisir...</option>
                    {TX_TYPES.map((t) => <option key={t} value={t}>{TRANSACTION_TYPE_LABELS[t]}</option>)}
                  </select>
                </FormField>
                <FormField label="Compte" error={errors.accountId?.message}>
                  <select {...register('accountId')} className="form-select">
                    <option value="">Choisir...</option>
                    {accounts?.map((a) => <option key={a.id} value={a.id}>{a.accountName} ({a.operator.name})</option>)}
                  </select>
                </FormField>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <FormField label="Montant (FCFA)" error={errors.amount?.message}>
                  <input {...register('amount')} type="number" placeholder="50000" className="form-input" />
                </FormField>
                <FormField label="Frais" error={errors.fees?.message}>
                  <input {...register('fees')} type="number" placeholder="500" className="form-input" />
                </FormField>
                <FormField label="Commission" error={errors.commission?.message}>
                  <input {...register('commission')} type="number" placeholder="250" className="form-input" />
                </FormField>
              </div>
              <FormField label="Description">
                <input {...register('description')} placeholder="Description optionnelle" className="form-input" />
              </FormField>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowForm(false); reset(); }}
                  className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm">
                  Annuler
                </button>
                <button type="submit" disabled={createMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition text-sm font-medium disabled:opacity-50">
                  {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Créer
                </button>
              </div>
              {createMutation.isError && (
                <p className="text-red-500 text-sm text-center">{(createMutation.error as any)?.response?.data?.message || 'Erreur'}</p>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function FormField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
