// ─── Enums ───────────────────────────────────────────────────────────────────

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
export type RoleName = 'SUPER_ADMIN' | 'ADMIN' | 'ACCOUNTANT' | 'AGENT' | 'AUDITOR';
export type OperatorCode = 'ORANGE_MONEY' | 'MTN_MOMO' | 'MOOV_MONEY' | 'WAVE';
export type TransactionType = 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER' | 'MERCHANT_PAYMENT' | 'COLLECTION' | 'DISBURSEMENT' | 'FEE';
export type TransactionStatus = 'PENDING' | 'VALIDATED' | 'CANCELLED' | 'FAILED';
export type NotificationType = 'TRANSACTION' | 'LOW_BALANCE' | 'ANOMALY' | 'NEW_USER' | 'SECURITY';
export type NotificationStatus = 'UNREAD' | 'READ';
export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'VALIDATE' | 'CANCEL' | 'EXPORT';

// ─── Models ──────────────────────────────────────────────────────────────────

export interface Permission {
  id: string;
  resource: string;
  action: string;
}

export interface Role {
  id: string;
  name: RoleName;
  description?: string;
  permissions: Permission[];
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  status: UserStatus;
  roleId: string;
  role: Role;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MobileMoneyOperator {
  id: string;
  code: OperatorCode;
  name: string;
  logoUrl?: string;
  color?: string;
  isActive: boolean;
}

export interface MobileMoneyAccount {
  id: string;
  accountNumber: string;
  accountName: string;
  operatorId: string;
  operator: MobileMoneyOperator;
  initialBalance: number;
  currentBalance: number;
  isActive: boolean;
  description?: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Transaction {
  id: string;
  reference: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  fees: number;
  commission: number;
  netAmount: number;
  accountId: string;
  account: MobileMoneyAccount;
  customerId?: string;
  customer?: Customer;
  createdById: string;
  createdBy: Pick<User, 'id' | 'firstName' | 'lastName' | 'email'>;
  description?: string;
  externalRef?: string;
  transactionDate: string;
  validatedAt?: string;
  cancelledAt?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  user: Pick<User, 'id' | 'firstName' | 'lastName' | 'email'>;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  status: NotificationStatus;
  title: string;
  message: string;
  data?: Record<string, any>;
  createdAt: string;
}

// ─── API Response types ───────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: User;
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export interface DashboardSummary {
  totalBalance: number;
  today: {
    transactionCount: number;
    income: number;
    expense: number;
    commissions: number;
  };
  topAccounts: MobileMoneyAccount[];
  operatorBreakdown: {
    id: string;
    name: string;
    code: OperatorCode;
    color?: string;
    balance: number;
    accountCount: number;
  }[];
}

export interface MonthlyChartData {
  label: string;
  income: number;
  expense: number;
  count: number;
}
