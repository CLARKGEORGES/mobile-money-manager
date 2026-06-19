'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, extractData } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Plus, Search, Loader2, Trash2, UserSquare2 } from 'lucide-react';
import { Customer } from '@/types';
import { useForm } from 'react-hook-form';

export default function CustomersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['customers', page, search],
    queryFn: async () => {
      const res = await api.get('/customers', { params: { page, limit: 20, search: search || undefined } });
      return extractData<{ data: Customer[]; meta: any }>(res);
    },
  });

  const { register, handleSubmit, reset } = useForm<{ name: string; phone: string; email?: string; address?: string }>();

  const createMutation = useMutation({
    mutationFn: async (data: any) => { const res = await api.post('/customers', data); return extractData(res); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['customers'] }); setShowForm(false); reset(); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const res = await api.delete(`/customers/${id}`); return extractData(res); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Clients</h2>
          <p className="text-sm text-gray-500">{data?.meta.total || 0} client(s)</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition font-medium text-sm">
          <Plus className="w-4 h-4" /> Nouveau client
        </button>
      </div>

      <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-2.5">
        <Search className="w-4 h-4 text-gray-400" />
        <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Rechercher un client..."
          className="bg-transparent text-sm text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none w-full" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse" />
          ))
          : data?.data.map((customer) => (
            <div key={customer.id} className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <UserSquare2 className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 dark:text-white truncate">{customer.name}</p>
                <p className="text-sm text-gray-500 font-mono">{customer.phone}</p>
                {customer.email && <p className="text-xs text-gray-400 truncate">{customer.email}</p>}
                <p className="text-xs text-gray-400 mt-1">Depuis {new Date(customer.createdAt).toLocaleDateString('fr-FR')}</p>
              </div>
              <button onClick={() => { if (confirm('Supprimer ce client ?')) deleteMutation.mutate(customer.id); }}
                className="p-1.5 rounded-lg text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 transition flex-shrink-0">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        }
      </div>

      {data && data.meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Page {data.meta.page} / {data.meta.totalPages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={!data.meta.hasPrevPage}
              className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
              Précédent
            </button>
            <button onClick={() => setPage(p => p+1)} disabled={!data.meta.hasNextPage}
              className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
              Suivant
            </button>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold">Nouveau client</h3>
              <button onClick={() => { setShowForm(false); reset(); }}>✕</button>
            </div>
            <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Nom complet</label>
                <input {...register('name', { required: true })} className="form-input" placeholder="Amadou Traoré" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Téléphone</label>
                <input {...register('phone', { required: true })} className="form-input" placeholder="+22501234567" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Email (optionnel)</label>
                <input {...register('email')} type="email" className="form-input" placeholder="amadou@example.com" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Adresse (optionnel)</label>
                <input {...register('address')} className="form-input" placeholder="Abidjan, Côte d'Ivoire" />
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
