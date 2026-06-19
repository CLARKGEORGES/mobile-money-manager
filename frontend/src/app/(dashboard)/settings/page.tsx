'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';
import { Lock, User, CheckCircle, Loader2 } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
  const [success, setSuccess] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<{ currentPassword: string; newPassword: string; confirmPassword: string }>();

  const changePwdMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      authService.changePassword(data.currentPassword, data.newPassword),
    onSuccess: () => {
      setSuccess('Mot de passe modifié avec succès');
      reset();
      setTimeout(() => setSuccess(''), 3000);
    },
  });

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Paramètres</h2>
        <p className="text-sm text-gray-500">Gérez vos préférences et votre sécurité</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 w-fit">
        {[['profile', 'Profil', User], ['security', 'Sécurité', Lock]] as const}.map(([tab, label, Icon]) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === tab ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-400'}`}>
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* Profile */}
      {activeTab === 'profile' && user && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 space-y-5">
          <h3 className="font-semibold text-gray-900 dark:text-white">Informations du profil</h3>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-bold text-xl">{user.firstName[0]}{user.lastName[0]}</span>
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{user.firstName} {user.lastName}</p>
              <p className="text-gray-500">{user.email}</p>
              <p className="text-sm text-primary">{user.role?.name}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {[
              { label: 'Téléphone', value: user.phone || 'Non renseigné' },
              { label: 'Statut', value: user.status },
              { label: 'Rôle', value: user.role?.description || user.role?.name },
              { label: 'Membre depuis', value: new Date(user.createdAt).toLocaleDateString('fr-FR') },
            ].map((f) => (
              <div key={f.label} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3">
                <p className="text-gray-500 text-xs mb-1">{f.label}</p>
                <p className="font-medium text-gray-900 dark:text-white">{f.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Security */}
      {activeTab === 'security' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 space-y-5">
          <h3 className="font-semibold text-gray-900 dark:text-white">Changer le mot de passe</h3>
          {success && (
            <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl px-4 py-3 text-green-700 dark:text-green-400 text-sm">
              <CheckCircle className="w-4 h-4" /> {success}
            </div>
          )}
          <form onSubmit={handleSubmit((d) => {
            if (d.newPassword !== d.confirmPassword) return;
            changePwdMutation.mutate({ currentPassword: d.currentPassword, newPassword: d.newPassword });
          })} className="space-y-4">
            {[
              { name: 'currentPassword' as const, label: 'Mot de passe actuel' },
              { name: 'newPassword' as const, label: 'Nouveau mot de passe (min. 8 caractères)' },
              { name: 'confirmPassword' as const, label: 'Confirmer le nouveau mot de passe' },
            ].map((f) => (
              <div key={f.name}>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">{f.label}</label>
                <input {...register(f.name, { required: true, minLength: f.name !== 'currentPassword' ? 8 : 1 })}
                  type="password" placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition text-sm" />
              </div>
            ))}
            <button type="submit" disabled={changePwdMutation.isPending}
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition font-medium text-sm disabled:opacity-50">
              {changePwdMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Modifier le mot de passe
            </button>
            {changePwdMutation.isError && (
              <p className="text-red-500 text-sm text-center">{(changePwdMutation.error as any)?.response?.data?.message}</p>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
