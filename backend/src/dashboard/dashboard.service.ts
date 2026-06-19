import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionStatus, TransactionType } from '@prisma/client';
import { startOfDay, endOfDay, startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

const INCOME_TYPES = [TransactionType.DEPOSIT, TransactionType.COLLECTION, TransactionType.MERCHANT_PAYMENT];
const EXPENSE_TYPES = [TransactionType.WITHDRAWAL, TransactionType.DISBURSEMENT, TransactionType.TRANSFER, TransactionType.FEE];

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getSummary() {
    const today = new Date();
    const dayStart = startOfDay(today);
    const dayEnd = endOfDay(today);

    const [totalBalance, todayTxs, accounts, operatorStats] = await Promise.all([
      // Total balance across all active accounts
      this.prisma.mobileMoneyAccount.aggregate({
        where: { isActive: true },
        _sum: { currentBalance: true },
      }),

      // Today's transactions (validated)
      this.prisma.transaction.findMany({
        where: {
          status: TransactionStatus.VALIDATED,
          transactionDate: { gte: dayStart, lte: dayEnd },
          deletedAt: null,
        },
        select: { type: true, amount: true, fees: true, commission: true, netAmount: true },
      }),

      // Top accounts by volume
      this.prisma.mobileMoneyAccount.findMany({
        where: { isActive: true },
        include: { operator: true },
        orderBy: { currentBalance: 'desc' },
        take: 5,
      }),

      // Per-operator breakdown
      this.prisma.mobileMoneyOperator.findMany({
        where: { isActive: true },
        include: {
          accounts: {
            where: { isActive: true },
            select: { currentBalance: true },
          },
        },
      }),
    ]);

    const todayIncome = todayTxs
      .filter((t) => INCOME_TYPES.includes(t.type))
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const todayExpense = todayTxs
      .filter((t) => EXPENSE_TYPES.includes(t.type))
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const todayCommissions = todayTxs.reduce((sum, t) => sum + Number(t.commission), 0);

    const operatorBreakdown = operatorStats.map((op) => ({
      id: op.id,
      name: op.name,
      code: op.code,
      color: op.color,
      balance: op.accounts.reduce((sum, a) => sum + Number(a.currentBalance), 0),
      accountCount: op.accounts.length,
    }));

    return {
      totalBalance: Number(totalBalance._sum.currentBalance) || 0,
      today: {
        transactionCount: todayTxs.length,
        income: todayIncome,
        expense: todayExpense,
        commissions: todayCommissions,
      },
      topAccounts: accounts,
      operatorBreakdown,
    };
  }

  async getMonthlyChart() {
    const months: { label: string; income: number; expense: number; count: number }[] = [];

    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);

      const txs = await this.prisma.transaction.findMany({
        where: {
          status: TransactionStatus.VALIDATED,
          transactionDate: { gte: monthStart, lte: monthEnd },
          deletedAt: null,
        },
        select: { type: true, amount: true },
      });

      const income = txs.filter((t) => INCOME_TYPES.includes(t.type)).reduce((s, t) => s + Number(t.amount), 0);
      const expense = txs.filter((t) => EXPENSE_TYPES.includes(t.type)).reduce((s, t) => s + Number(t.amount), 0);

      months.push({ label: format(date, 'MMM yyyy'), income, expense, count: txs.length });
    }

    return months;
  }

  async getRecentTransactions(limit = 10) {
    return this.prisma.transaction.findMany({
      where: { deletedAt: null },
      include: {
        account: { include: { operator: true } },
        customer: true,
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { transactionDate: 'desc' },
      take: limit,
    });
  }

  async getStats() {
    const [totalUsers, totalAccounts, totalTransactions, pendingTransactions] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null, status: 'ACTIVE' } }),
      this.prisma.mobileMoneyAccount.count({ where: { isActive: true } }),
      this.prisma.transaction.count({ where: { deletedAt: null, status: TransactionStatus.VALIDATED } }),
      this.prisma.transaction.count({ where: { deletedAt: null, status: TransactionStatus.PENDING } }),
    ]);

    return { totalUsers, totalAccounts, totalTransactions, pendingTransactions };
  }
}
