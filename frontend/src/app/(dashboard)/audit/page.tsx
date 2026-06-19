'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, extractData } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Shield, Search } from 'lucide-react';

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-700',
  UPDATE: 'bg-blue-100 text-blue-700',
  DELETE: 'bg-red-100 text-red-700',
  LOGIN: 'bg-purple-100 text-purple-700',
  LOGOUT: 'bg-gray-100 text-gray-600',
  VALIDATE: 'bg-emerald-100 text-emerald-700',
  CANCEL: 'bg-orange-100 text-orange-700',
  EXPORT: 'bg-cyan-100 text-cyan-700',
};

export default function AuditPage() {
  const [page, setPage] = useState(1);
  const [resource, setResource] = useState('');
  const [action, setAction] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['audit', page, resource, action],
    queryFn: async () => {
      const res = await api.get('/audit', {
        params: { page, limit: 30, resource: resource || undefined, action: action || undefined },
      });
      return extractData<{ data: any[]; meta: any }>(res);
    },
  });

  const resources = ['users', 'accounts', 'transactions', 'customers', 'auth', 'operators'];
  const actions = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'VALIDATE', 'CANCEL', 'EXPORT'];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Journal d'audit</h2>
        <p className="text-sm text-gray-500">Traçabilité complète de toutes les actions</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 flex gap-3 flex-wrap">
        <select value={resource} onChange={(e) => { setResource(e.target.value); setPage(1); }}
          className="border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none">
          <option value="">Toutes les ressources</option>
          {resources.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }}
          className="border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none">
          <option value="">Toutes les actions</option>
          {actions.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                {['Date', 'Utilisateur', 'Action', 'Ressource', 'IP', 'Détails'].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {isLoading
                ? Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" /></td>
                  ))}</tr>
                ))
                : data?.data.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{formatDate(log.createdAt)}</td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{log.user.firstName} {log.user.lastName}</p>
                      <p className="text-xs text-gray-400">{log.user.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-600'}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{log.resource}</td>
                    <td className="px-4 py-3 text-xs text-gray-400 font-mono">{log.ipAddress || '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate">
                      {log.resourceId ? `ID: ${log.resourceId.slice(0, 8)}...` : '—'}
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
        {data && data.meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-700">
            <p className="text-sm text-gray-500">Page {data.meta.page} / {data.meta.totalPages} — {data.meta.total} entrées</p>
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
    </div>
  );
}
