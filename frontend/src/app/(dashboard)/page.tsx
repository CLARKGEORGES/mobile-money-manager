'use client';

import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboard.service';
import { formatCurrency, formatDate, TRANSACTION_TYPE_LABELS, TRANSACTION_TYPE_COLORS, isIncomeType } from '@/lib/utils';
import { TrendingUp, TrendingDown, Wallet, Activity, ArrowUpRight, ArrowDownRight, Users, Banknote } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell } from 'recharts';

export default function DashboardPage() {
  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => dashboardService.getSummary(),
  });

  const { data: chartData } = useQuery({
    queryKey: ['dashboard-chart'],
    queryFn: () => dashboardService.getMonthlyChart(),
  });

  const { data: recentTxs } = useQuery({
    queryKey: ['dashboard-recent'],
    queryFn: () => dashboardService.getRecentTransactions(8),
  });

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardService.getStats(),
  });

  if (loadingSummary) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  const OPERATOR_COLORS = ['#FF6600', '#FFCC00', '#0066CC', '#1A73E8'];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="Solde Global"
          value={formatCurrency(summary?.totalBalance || 0)}
          icon={<Wallet className="w-6 h-6" />}
          trend="+5.2%"
          positive
          color="bg-blue-500"
        />
        <KpiCard
          label="Entrées du jour"
          value={formatCurrency(summary?.today.income || 0)}
          icon={<TrendingUp className="w-6 h-6" />}
          sub={`${summary?.today.transactionCount || 0} transactions`}
          positive
          color="bg-green-500"
        />
        <KpiCard
          label="Sorties du jour"
          value={formatCurrency(summary?.today.expense || 0)}
          icon={<TrendingDown className="w-6 h-6" />}
          color="bg-red-500"
        />
        <KpiCard
          label="Commissions"
          value={formatCurrency(summary?.today.commissions || 0)}
          icon={<Banknote className="w-6 h-6" />}
          sub="Aujourd'hui"
          positive
          color="bg-purple-500"
        />
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Utilisateurs actifs', value: stats.totalUsers, icon: <Users className="w-4 h-4" /> },
            { label: 'Comptes MM', value: stats.totalAccounts, icon: <Wallet className="w-4 h-4" /> },
            { label: 'Tx validées', value: stats.totalTransactions, icon: <Activity className="w-4 h-4" /> },
            { label: 'Tx en attente', value: stats.pendingTransactions, icon: <Activity className="w-4 h-4" />, warning: stats.pendingTransactions > 0 },
          ].map((s, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1 text-sm">
                {s.icon} {s.label}
              </div>
              <p className={`text-2xl font-bold ${s.warning ? 'text-orange-600' : 'text-gray-900 dark:text-white'}`}>
                {s.value.toLocaleString('fr-FR')}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Area chart */}
        <div className="xl:col-span-2 bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-6">Évolution sur 6 mois</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData || []}>
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              <Area type="monotone" dataKey="income" name="Entrées" stroke="#22c55e" fill="url(#colorIncome)" strokeWidth={2} />
              <Area type="monotone" dataKey="expense" name="Sorties" stroke="#ef4444" fill="url(#colorExpense)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Operator breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Répartition par opérateur</h3>
          {summary?.operatorBreakdown && summary.operatorBreakdown.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={summary.operatorBreakdown}
                    dataKey="balance"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={65}
                    innerRadius={40}
                  >
                    {summary.operatorBreakdown.map((entry, index) => (
                      <Cell key={entry.code} fill={entry.color || OPERATOR_COLORS[index % OPERATOR_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {summary.operatorBreakdown.map((op, i) => (
                  <div key={op.code} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: op.color || OPERATOR_COLORS[i] }} />
                      <span className="text-gray-600 dark:text-gray-400">{op.name}</span>
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(op.balance)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-gray-400 text-sm text-center py-8">Aucune donnée</p>
          )}
        </div>
      </div>

      {/* Recent transactions */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">Transactions récentes</h3>
          <a href="/dashboard/transactions" className="text-sm text-primary hover:underline">Voir tout</a>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {recentTxs?.slice(0, 8).map((tx) => {
            const income = isIncomeType(tx.type);
            return (
              <div key={tx.id} className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${income ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'}`}>
                  {income
                    ? <ArrowUpRight className="w-5 h-5 text-green-600 dark:text-green-400" />
                    : <ArrowDownRight className="w-5 h-5 text-red-600 dark:text-red-400" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {TRANSACTION_TYPE_LABELS[tx.type]} — {tx.customer?.name || 'N/A'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {tx.account.operator.name} • {formatDate(tx.transactionDate, 'dd/MM/yyyy HH:mm')}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${income ? 'text-green-600' : 'text-red-600'}`}>
                    {income ? '+' : '-'}{formatCurrency(Number(tx.amount))}
                  </p>
                  <p className="text-xs text-gray-400">{tx.reference}</p>
                </div>
              </div>
            );
          })}
          {(!recentTxs || recentTxs.length === 0) && (
            <div className="px-6 py-8 text-center text-gray-400 text-sm">Aucune transaction récente</div>
          )}
        </div>
      </div>
    </div>
  );
}

interface KpiCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  trend?: string;
  sub?: string;
  positive?: boolean;
  color: string;
}

function KpiCard({ label, value, icon, trend, sub, positive, color }: KpiCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 ${color} bg-opacity-10 rounded-xl flex items-center justify-center`}
          style={{ backgroundColor: `${color}20` }}>
          <div className={color.replace('bg-', 'text-')}>{icon}</div>
        </div>
        {trend && (
          <span className={`text-xs font-medium px-2 py-1 rounded-lg ${positive ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'}`}>
            {trend}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{value}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}
