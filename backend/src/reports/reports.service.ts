import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionStatus, TransactionType } from '@prisma/client';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

export type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'annual' | 'custom';

export class QueryReportDto {
  period?: ReportPeriod;
  dateFrom?: string;
  dateTo?: string;
  accountId?: string;
  operatorId?: string;
  userId?: string;
  page?: number;
  limit?: number;
}

const INCOME_TYPES = [TransactionType.DEPOSIT, TransactionType.COLLECTION, TransactionType.MERCHANT_PAYMENT];
const EXPENSE_TYPES = [TransactionType.WITHDRAWAL, TransactionType.DISBURSEMENT, TransactionType.TRANSFER, TransactionType.FEE];

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  private getDateRange(period: ReportPeriod, dateFrom?: string, dateTo?: string) {
    const now = new Date();
    switch (period) {
      case 'daily': return { gte: startOfDay(now), lte: endOfDay(now) };
      case 'weekly': return { gte: startOfWeek(now, { weekStartsOn: 1 }), lte: endOfWeek(now, { weekStartsOn: 1 }) };
      case 'monthly': return { gte: startOfMonth(now), lte: endOfMonth(now) };
      case 'annual': return { gte: startOfYear(now), lte: endOfYear(now) };
      case 'custom':
        return {
          gte: dateFrom ? new Date(dateFrom) : startOfMonth(now),
          lte: dateTo ? new Date(dateTo) : endOfMonth(now),
        };
      default: return { gte: startOfMonth(now), lte: endOfMonth(now) };
    }
  }

  async generateReport(query: QueryReportDto) {
    const dateRange = this.getDateRange(query.period || 'monthly', query.dateFrom, query.dateTo);

    const where: any = {
      deletedAt: null,
      status: TransactionStatus.VALIDATED,
      transactionDate: dateRange,
    };

    if (query.accountId) where.accountId = query.accountId;
    if (query.userId) where.createdById = query.userId;
    if (query.operatorId) where.account = { operatorId: query.operatorId };

    const transactions = await this.prisma.transaction.findMany({
      where,
      include: {
        account: { include: { operator: true } },
        customer: true,
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { transactionDate: 'desc' },
    });

    const totalIncome = transactions
      .filter((t) => INCOME_TYPES.includes(t.type))
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpense = transactions
      .filter((t) => EXPENSE_TYPES.includes(t.type))
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalFees = transactions.reduce((sum, t) => sum + Number(t.fees), 0);
    const totalCommissions = transactions.reduce((sum, t) => sum + Number(t.commission), 0);

    const byType: Record<string, { count: number; amount: number }> = {};
    for (const tx of transactions) {
      if (!byType[tx.type]) byType[tx.type] = { count: 0, amount: 0 };
      byType[tx.type].count++;
      byType[tx.type].amount += Number(tx.amount);
    }

    const byOperator: Record<string, { count: number; amount: number; name: string }> = {};
    for (const tx of transactions) {
      const opName = tx.account.operator.name;
      const opCode = tx.account.operator.code;
      if (!byOperator[opCode]) byOperator[opCode] = { count: 0, amount: 0, name: opName };
      byOperator[opCode].count++;
      byOperator[opCode].amount += Number(tx.amount);
    }

    return {
      period: query.period || 'monthly',
      dateRange: { from: dateRange.gte, to: dateRange.lte },
      summary: {
        totalTransactions: transactions.length,
        totalIncome,
        totalExpense,
        netBalance: totalIncome - totalExpense,
        totalFees,
        totalCommissions,
      },
      byType,
      byOperator,
      transactions,
    };
  }

  async getJournal(query: QueryReportDto) {
    const { page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;
    const dateRange = this.getDateRange(query.period || 'monthly', query.dateFrom, query.dateTo);

    const where: any = { deletedAt: null, transactionDate: dateRange };
    if (query.accountId) where.accountId = query.accountId;

    const [data, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where, skip, take: limit,
        include: {
          account: { include: { operator: true } },
          customer: true,
          createdBy: { select: { firstName: true, lastName: true } },
        },
        orderBy: { transactionDate: 'asc' },
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }
}
