'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, extractData } from '@/lib/api';
import { formatCurrency, formatDate, TRANSACTION_TYPE_LABELS, TRANSACTION_STATUS_LABELS, TRANSACTION_STATUS_COLORS, isIncomeType } from '@/lib/utils';
import { FileBarChart2, Download, ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type Period = 'daily' | 'weekly' | 'monthly' | 'annual' | 'custom';

export default function ReportsPage() {
  const [period, setPeriod] = useState<Period>('monthly');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data: report, isLoading } = useQuery({
    queryKey: ['reports', period, dateFrom, dateTo],
    queryFn: async () => {
      const params: any = { period };
      if (period === 'custom') { params.dateFrom = dateFrom; params.dateTo = dateTo; }
      const res = await api.get('/reports', { params });
      return extractData<any>(res);
    },
    enabled: period !== 'custom' || (!!dateFrom && !!dateTo),
  });

  const byTypeChart = report
    ? Object.entries(report.byType).map(([type, d]: any) => ({
        name: TRANSACTION_TYPE_LABELS[type as keyof typeof TRANSACTION_TYPE_LABELS] || type,
        count: d.count,
        amount: d.amount,
      }))
    : [];

  const byOpChart = report
    ? Object.entries(report.byOperator).map(([code, d]: any) => ({
        name: d.name,
        count: d.count,
        amount: d.amount,
      }))
    : [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Rapports financiers</h2>
          <p className="text-sm text-gray-500">Analyse et suivi de vos transactions</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition font-medium text-sm">
          <Download className="w-4 h-4" /> Exporter
        </button>
      </div>

      {/* Period selector */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 flex gap-3 flex-wrap items-center">
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1 gap-1">
          {([['daily', 'Jour'], ['weekly', 'Semaine'], ['monthly', 'Mois'], ['annual', 'Année'], ['custom', 'Personnalisé']] as [Period, string][]).map(([p, label]) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${period === p ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}>
              {label}
            </button>
          ))}
        </div>
        {period === 'custom' && (
          <div className="flex gap-3 items-center">
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
              className="border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none" />
            <span className="text-gray-400">→</span>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
              className="border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none" />
          </div>
        )}
      </div>

      {/* Summary cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : report && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total transactions', value: report.summary.totalTransactions.toLocaleString('fr-FR'), icon: <BarChart3 className="w-5 h-5" />, color: 'text-blue-600 bg-blue-100' },
            { label: 'Total entrées', value: formatCurrency(report.summary.totalIncome), icon: <ArrowUpRight className="w-5 h-5" />, color: 'text-green-600 bg-green-100' },
            { label: 'Total sorties', value: formatCurrency(report.summary.totalExpense), icon: <ArrowDownRight className="w-5 h-5" />, color: 'text-red-600 bg-red-100' },
            { label: 'Solde net', value: formatCurrency(report.summary.netBalance), icon: report.summary.netBalance >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />, color: report.summary.netBalance >= 0 ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100' },
          ].map((s, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
              <div className={`w-10 h-10 ${s.color} rounded-xl flex items-center justify-center mb-3`}>{s.icon}</div>
              <p className="text-xl font-bold text-gray-900 dark:text-white mb-1">{s.value}</p>
              <p className="text-sm text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Charts */}
      {report && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Par type de transaction</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={byTypeChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number, name) => name === 'amount' ? formatCurrency(v) : v} />
                <Legend />
                <Bar yAxisId="left" dataKey="amount" name="Montant" fill="#3b82f6" radius={[4,4,0,0]} />
                <Bar yAxisId="right" dataKey="count" name="Nombre" fill="#22c55e" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Par opérateur</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={byOpChart} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tickFormatter={(v) => `${(v/1000000).toFixed(1)}M`} tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={90} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="amount" name="Montant" fill="#8b5cf6" radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Transactions table */}
      {report?.transactions && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">Journal des transactions ({report.transactions.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                  {['Référence', 'Date', 'Type', 'Client', 'Opérateur', 'Montant', 'Frais', 'Commission', 'Statut'].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {report.transactions.slice(0, 50).map((tx: any) => {
                  const income = isIncomeType(tx.type);
                  return (
                    <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-4 py-2.5 text-xs font-mono text-gray-500">{tx.reference}</td>
                      <td className="px-4 py-2.5 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">{formatDate(tx.transactionDate)}</td>
                      <td className="px-4 py-2.5 text-xs text-gray-700 dark:text-gray-300">{TRANSACTION_TYPE_LABELS[tx.type as keyof typeof TRANSACTION_TYPE_LABELS]}</td>
                      <td className="px-4 py-2.5 text-xs text-gray-600 dark:text-gray-400">{tx.customer?.name || '—'}</td>
                      <td className="px-4 py-2.5 text-xs text-gray-600 dark:text-gray-400">{tx.account?.operator?.name}</td>
                      <td className="px-4 py-2.5 text-xs font-semibold whitespace-nowrap">
                        <span className={income ? 'text-green-600' : 'text-red-600'}>
                          {income ? '+' : '-'}{formatCurrency(Number(tx.amount))}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-gray-500">{formatCurrency(Number(tx.fees))}</td>
                      <td className="px-4 py-2.5 text-xs text-gray-500">{formatCurrency(Number(tx.commission))}</td>
                      <td className="px-4 py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TRANSACTION_STATUS_COLORS[tx.status as keyof typeof TRANSACTION_STATUS_COLORS]}`}>
                          {TRANSACTION_STATUS_LABELS[tx.status as keyof typeof TRANSACTION_STATUS_LABELS]}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
