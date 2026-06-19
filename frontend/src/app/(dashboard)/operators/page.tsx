'use client';

import { useQuery } from '@tanstack/react-query';
import { api, extractData } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { MobileMoneyOperator } from '@/types';
import { Smartphone, ToggleLeft, ToggleRight } from 'lucide-react';

export default function OperatorsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['operators-detail'],
    queryFn: async () => {
      const res = await api.get('/operators');
      return extractData<(MobileMoneyOperator & { _count: { accounts: number } })[]>(res);
    },
  });

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Opérateurs Mobile Money</h2>
        <p className="text-sm text-gray-500">Gérez les opérateurs disponibles sur votre plateforme</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-36 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse" />
          ))
          : data?.map((op) => (
            <div key={op.id} className={`bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow ${!op.isActive ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${op.color}25` }}>
                    <Smartphone className="w-6 h-6" style={{ color: op.color || '#666' }} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">{op.name}</h3>
                    <p className="text-xs text-gray-400 font-mono">{op.code}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${op.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {op.isActive ? 'Actif' : 'Inactif'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex-1 bg-gray-50 dark:bg-gray-700 rounded-xl p-3 text-center">
                  <p className="font-bold text-gray-900 dark:text-white text-lg">{(op as any)._count?.accounts || 0}</p>
                  <p className="text-gray-500 text-xs">Comptes associés</p>
                </div>
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: op.color || '#ccc' }} title="Couleur de l'opérateur" />
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}
