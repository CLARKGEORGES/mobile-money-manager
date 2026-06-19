'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, extractData } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Plus, Search, Wallet, TrendingUp, TrendingDown, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';
import { MobileMoneyAccount, MobileMoneyOperator } from '@/types';
import { useForm } from 'react-hook-form';

const OPERATOR_ICON_COLORS: Record<string, string> = {
  ORANGE_MONEY: 'bg-orange-100 text-orange-600',
  MTN_MOMO: 'bg-yellow-100 text-yellow-700',
  MOOV_MONEY: 'bg-blue-100 text-blue-600',
  WAVE: 'bg-indigo-100 text-indigo-600',
};

export default function AccountsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['accounts', search],
    queryFn: async () => {
      const res = await api.get('/accounts', { params: { limit: 100, search: search || undefined } });
      return extractData<{ data: MobileMoneyAccount[] }>(res).data;
    },
  });

  const { data: operators } = useQuery({
    queryKey: ['operators'],
    queryFn: async () => {
      const res = await api.get('/operators');
      return extractData<MobileMoneyOperator[]>(res);
    },
  });

  const { register, handleSubmit, reset } = useForm<{ accountNumber: string; accountName: string; operatorId: string; initialBalance: number; description?: string }>();

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/accounts', data);
      return extractData(res);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['accounts'] }); setShowForm(false); reset(); },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await api.patch(`/accounts/${id}`, { isActive });
      return extractData(res);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounts'] }),
  });

  const totalBalance = data?.reduce((sum, a) => sum + Number(a.currentBalance), 0) || 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Comptes Mobile Money</h2>
          <p className="text-sm text-gray-500">Solde global: <span className="font-semibold text-primary">{formatCurrency(totalBalance)}</span></p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition font-medium text-sm">
          <Plus className="w-4 h-4" /> Nouveau compte
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-2.5">
        <Search className="w-4 h-4 text-gray-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un compte..."
          className="bg-transparent text-sm text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none w-full" />
      </div>

      {/* Cards grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {data?.map((account) => {
            const diff = Number(account.currentBalance) - Number(account.initialBalance);
            const positive = diff >= 0;
            const iconClass = OPERATOR_ICON_COLORS[account.operator.code] || 'bg-gray-100 text-gray-600';

            return (
              <div key={account.id} className={`bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow ${!account.isActive ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconClass}`}>
                      <Wallet className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">{account.accountName}</p>
                      <p className="text-xs text-gray-500 font-mono">{account.accountNumber}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleMutation.mutate({ id: account.id, isActive: !account.isActive })}
                    className={`text-${account.isActive ? 'green' : 'gray'}-500 hover:opacity-80`}
                    title={account.isActive ? 'Désactiver' : 'Activer'}
                  >
                    {account.isActive ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                  </button>
                </div>

                <div className="mb-3">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(Number(account.currentBalance))}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Solde actuel</p>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1.5">
                    {positive
                      ? <TrendingUp className="w-4 h-4 text-green-500" />
                      : <TrendingDown className="w-4 h-4 text-red-500" />
                    }
                    <span className={positive ? 'text-green-600' : 'text-red-600'}>
                      {positive ? '+' : ''}{formatCurrency(diff)}
                    </span>
                  </div>
                  <span
                    className="px-2.5 py-1 rounded-full text-xs font-medium"
                    style={{ backgroundColor: `${account.operator.color}20`, color: account.operator.color || '#666' }}
                  >
                    {account.operator.name}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">Nouveau compte</h3>
              <button onClick={() => { setShowForm(false); reset(); }} className="text-gray-400">✕</button>
            </div>
            <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Opérateur</label>
                <select {...register('operatorId', { required: true })} className="form-select">
                  <option value="">Choisir un opérateur</option>
                  {operators?.map((op) => <option key={op.id} value={op.id}>{op.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Numéro de compte</label>
                <input {...register('accountNumber', { required: true })} placeholder="07 00 12 345" className="form-input" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Nom du compte</label>
                <input {...register('accountName', { required: true })} placeholder="Caisse Orange Abidjan" className="form-input" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Solde initial (FCFA)</label>
                <input {...register('initialBalance')} type="number" placeholder="0" className="form-input" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Description</label>
                <input {...register('description')} placeholder="Description optionnelle" className="form-input" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowForm(false); reset(); }}
                  className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm">
                  Annuler
                </button>
                <button type="submit" disabled={createMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition text-sm font-medium disabled:opacity-50">
                  {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />} Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
