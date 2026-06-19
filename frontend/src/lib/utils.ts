import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { TransactionType, TransactionStatus, RoleName } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = 'XOF'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date, format = 'dd/MM/yyyy HH:mm'): string {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return format
    .replace('dd', day)
    .replace('MM', month)
    .replace('yyyy', String(year))
    .replace('HH', hours)
    .replace('mm', minutes);
}

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  DEPOSIT: 'Dépôt',
  WITHDRAWAL: 'Retrait',
  TRANSFER: 'Transfert',
  MERCHANT_PAYMENT: 'Paiement marchand',
  COLLECTION: 'Encaissement',
  DISBURSEMENT: 'Décaissement',
  FEE: 'Frais',
};

export const TRANSACTION_STATUS_LABELS: Record<TransactionStatus, string> = {
  PENDING: 'En attente',
  VALIDATED: 'Validée',
  CANCELLED: 'Annulée',
  FAILED: 'Échouée',
};

export const ROLE_LABELS: Record<RoleName, string> = {
  SUPER_ADMIN: 'Super Administrateur',
  ADMIN: 'Administrateur',
  ACCOUNTANT: 'Comptable',
  AGENT: 'Agent',
  AUDITOR: 'Auditeur',
};

export const TRANSACTION_STATUS_COLORS: Record<TransactionStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  VALIDATED: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  FAILED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
};

export const TRANSACTION_TYPE_COLORS: Record<TransactionType, string> = {
  DEPOSIT: 'text-green-600',
  COLLECTION: 'text-green-600',
  MERCHANT_PAYMENT: 'text-green-600',
  WITHDRAWAL: 'text-red-600',
  TRANSFER: 'text-blue-600',
  DISBURSEMENT: 'text-red-600',
  FEE: 'text-orange-600',
};

export const INCOME_TYPES: TransactionType[] = ['DEPOSIT', 'COLLECTION', 'MERCHANT_PAYMENT'];

export function isIncomeType(type: TransactionType): boolean {
  return INCOME_TYPES.includes(type);
}
