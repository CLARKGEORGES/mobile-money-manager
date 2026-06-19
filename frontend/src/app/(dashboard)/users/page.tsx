'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, extractData } from '@/lib/api';
import { formatDate, ROLE_LABELS } from '@/lib/utils';
import { Plus, Search, UserCheck, UserX, Loader2, Shield } from 'lucide-react';
import { User, Role, UserStatus } from '@/types';
import { useForm } from 'react-hook-form';

const STATUS_COLORS: Record<UserStatus, string> = {
  ACTIVE: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  INACTIVE: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
  SUSPENDED: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
};

export default function UsersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['users', page, search],
    queryFn: async () => {
      const res = await api.get('/users', { params: { page, limit: 20, search: search || undefined } });
      return extractData<{ data: User[]; meta: any }>(res);
    },
  });

  const { data: roles } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await api.get('/roles');
      return extractData<Role[]>(res);
    },
  });

  const { register, handleSubmit, reset } = useForm<{ email: string; password: string; firstName: string; lastName: string; phone?: string; roleId: string }>();

  const createMutation = useMutation({
    mutationFn: async (data: any) => { const res = await api.post('/users', data); return extractData(res); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setShowForm(false); reset(); },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: UserStatus }) => {
      const res = await api.patch(`/users/${id}/status`, { status });
      return extractData(res);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Utilisateurs</h2>
          <p className="text-sm text-gray-500">{data?.meta.total || 0} utilisateur(s)</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition font-medium text-sm">
          <Plus className="w-4 h-4" /> Nouvel utilisateur
        </button>
      </div>

      <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-2.5">
        <Search className="w-4 h-4 text-gray-400" />
        <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Rechercher un utilisateur..."
          className="bg-transparent text-sm text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none w-full" />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
              {['Utilisateur', 'Email', 'Rôle', 'Statut', 'Dernière connexion', 'Actions'].map((h) => (
                <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 6 }).map((_, j) => (
                  <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" /></td>
                ))}</tr>
              ))
              : data?.data.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-primary font-semibold text-xs">{user.firstName[0]}{user.lastName[0]}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-gray-400">{user.phone || '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{user.email}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-primary" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{ROLE_LABELS[user.role.name] || user.role.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[user.status]}`}>
                      {user.status === 'ACTIVE' ? 'Actif' : user.status === 'INACTIVE' ? 'Inactif' : 'Suspendu'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Jamais'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {user.status === 'ACTIVE'
                        ? <button onClick={() => statusMutation.mutate({ id: user.id, status: 'SUSPENDED' })}
                            className="p-1.5 rounded-lg text-orange-600 hover:bg-orange-100 dark:hover:bg-orange-900/20 transition" title="Suspendre">
                            <UserX className="w-4 h-4" />
                          </button>
                        : <button onClick={() => statusMutation.mutate({ id: user.id, status: 'ACTIVE' })}
                            className="p-1.5 rounded-lg text-green-600 hover:bg-green-100 dark:hover:bg-green-900/20 transition" title="Activer">
                            <UserCheck className="w-4 h-4" />
                          </button>
                      }
                    </div>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
        {data && data.meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-700">
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
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold">Créer un utilisateur</h3>
              <button onClick={() => { setShowForm(false); reset(); }}>✕</button>
            </div>
            <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Prénom</label>
                  <input {...register('firstName', { required: true })} className="form-input" placeholder="Jean" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Nom</label>
                  <input {...register('lastName', { required: true })} className="form-input" placeholder="Dupont" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Email</label>
                <input {...register('email', { required: true })} type="email" className="form-input" placeholder="jean@example.com" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Téléphone</label>
                <input {...register('phone')} className="form-input" placeholder="+22500000000" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Rôle</label>
                <select {...register('roleId', { required: true })} className="form-select">
                  <option value="">Choisir un rôle</option>
                  {roles?.map((r) => <option key={r.id} value={r.id}>{ROLE_LABELS[r.name] || r.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Mot de passe (min. 8 caractères)</label>
                <input {...register('password', { required: true, minLength: 8 })} type="password" className="form-input" placeholder="••••••••" />
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
              {createMutation.isError && (
                <p className="text-red-500 text-sm text-center">{(createMutation.error as any)?.response?.data?.message}</p>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
