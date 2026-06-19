import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto, UpdateTransactionDto, QueryTransactionsDto } from './dto/transaction.dto';
import { paginate, buildPaginatedResult } from '../common/utils/pagination.util';
import { AuditAction, TransactionStatus, TransactionType } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const TX_INCLUDE = {
  account: { include: { operator: true } },
  customer: true,
  createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
  attachments: true,
};

const INCOME_TYPES = [TransactionType.DEPOSIT, TransactionType.COLLECTION, TransactionType.MERCHANT_PAYMENT];

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  private generateRef(): string {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const short = uuidv4().split('-')[0].toUpperCase();
    return `TX${date}-${short}`;
  }

  private calcNetAmount(type: TransactionType, amount: number, fees: number): number {
    const isIncome = INCOME_TYPES.includes(type);
    return isIncome ? amount - fees : -(amount + fees);
  }

  async create(dto: CreateTransactionDto, createdById: string) {
    const account = await this.prisma.mobileMoneyAccount.findUnique({ where: { id: dto.accountId } });
    if (!account || !account.isActive) throw new NotFoundException('Compte introuvable ou inactif');

    if (dto.customerId) {
      const customer = await this.prisma.customer.findUnique({ where: { id: dto.customerId } });
      if (!customer) throw new NotFoundException('Client introuvable');
    }

    const fees = dto.fees || 0;
    const commission = dto.commission || 0;
    const netAmount = this.calcNetAmount(dto.type, dto.amount, fees);

    const transaction = await this.prisma.$transaction(async (tx) => {
      const newTx = await tx.transaction.create({
        data: {
          reference: this.generateRef(),
          type: dto.type,
          status: TransactionStatus.PENDING,
          amount: dto.amount,
          fees,
          commission,
          netAmount,
          accountId: dto.accountId,
          customerId: dto.customerId,
          createdById,
          description: dto.description,
          externalRef: dto.externalRef,
          transactionDate: dto.transactionDate ? new Date(dto.transactionDate) : new Date(),
        },
        include: TX_INCLUDE,
      });

      await tx.auditLog.create({
        data: {
          userId: createdById,
          action: AuditAction.CREATE,
          resource: 'transactions',
          resourceId: newTx.id,
          transactionId: newTx.id,
          newValues: { reference: newTx.reference, type: newTx.type, amount: newTx.amount },
        },
      });

      return newTx;
    });

    return transaction;
  }

  async findAll(query: QueryTransactionsDto) {
    const { page = 1, limit = 20, search, type, status, accountId, customerId, createdById, dateFrom, dateTo, amountMin, amountMax } = query;
    const { skip, take } = paginate({ page, limit });

    const where: any = { deletedAt: null };
    if (type) where.type = type;
    if (status) where.status = status;
    if (accountId) where.accountId = accountId;
    if (customerId) where.customerId = customerId;
    if (createdById) where.createdById = createdById;
    if (dateFrom || dateTo) {
      where.transactionDate = {};
      if (dateFrom) where.transactionDate.gte = new Date(dateFrom);
      if (dateTo) where.transactionDate.lte = new Date(dateTo);
    }
    if (amountMin !== undefined || amountMax !== undefined) {
      where.amount = {};
      if (amountMin !== undefined) where.amount.gte = amountMin;
      if (amountMax !== undefined) where.amount.lte = amountMax;
    }
    if (search) {
      where.OR = [
        { reference: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { externalRef: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where, skip, take, include: TX_INCLUDE,
        orderBy: { transactionDate: 'desc' },
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return buildPaginatedResult(data, total, page, limit);
  }

  async findOne(id: string) {
    const tx = await this.prisma.transaction.findUnique({ where: { id, deletedAt: null }, include: TX_INCLUDE });
    if (!tx) throw new NotFoundException('Transaction introuvable');
    return tx;
  }

  async update(id: string, dto: UpdateTransactionDto, actorId: string) {
    const tx = await this.findOne(id);
    if (tx.status !== TransactionStatus.PENDING) {
      throw new BadRequestException('Seules les transactions en attente peuvent être modifiées');
    }

    const fees = dto.fees ?? Number(tx.fees);
    const amount = dto.amount ?? Number(tx.amount);
    const type = dto.type ?? tx.type;
    const netAmount = this.calcNetAmount(type, amount, fees);

    const updated = await this.prisma.transaction.update({
      where: { id },
      data: { ...dto, netAmount, transactionDate: dto.transactionDate ? new Date(dto.transactionDate) : undefined },
      include: TX_INCLUDE,
    });

    await this.prisma.auditLog.create({
      data: {
        userId: actorId, action: AuditAction.UPDATE, resource: 'transactions', resourceId: id, transactionId: id,
        oldValues: { amount: tx.amount, type: tx.type, fees: tx.fees },
        newValues: { amount: updated.amount, type: updated.type, fees: updated.fees },
      },
    });

    return updated;
  }

  async validate(id: string, actorId: string) {
    const tx = await this.findOne(id);
    if (tx.status !== TransactionStatus.PENDING) {
      throw new BadRequestException('Transaction déjà traitée');
    }

    const updated = await this.prisma.$transaction(async (prisma) => {
      const validated = await prisma.transaction.update({
        where: { id },
        data: { status: TransactionStatus.VALIDATED, validatedAt: new Date() },
        include: TX_INCLUDE,
      });

      // Update account balance
      await prisma.mobileMoneyAccount.update({
        where: { id: tx.accountId },
        data: { currentBalance: { increment: Number(tx.netAmount) } },
      });

      await prisma.auditLog.create({
        data: {
          userId: actorId, action: AuditAction.VALIDATE, resource: 'transactions', resourceId: id, transactionId: id,
        },
      });

      return validated;
    });

    return updated;
  }

  async cancel(id: string, actorId: string) {
    const tx = await this.findOne(id);
    if (tx.status === TransactionStatus.CANCELLED) {
      throw new BadRequestException('Transaction déjà annulée');
    }

    const updated = await this.prisma.$transaction(async (prisma) => {
      // Reverse balance if was validated
      if (tx.status === TransactionStatus.VALIDATED) {
        await prisma.mobileMoneyAccount.update({
          where: { id: tx.accountId },
          data: { currentBalance: { decrement: Number(tx.netAmount) } },
        });
      }

      const cancelled = await prisma.transaction.update({
        where: { id },
        data: { status: TransactionStatus.CANCELLED, cancelledAt: new Date() },
        include: TX_INCLUDE,
      });

      await prisma.auditLog.create({
        data: { userId: actorId, action: AuditAction.CANCEL, resource: 'transactions', resourceId: id, transactionId: id },
      });

      return cancelled;
    });

    return updated;
  }

  async remove(id: string, actorId: string) {
    const tx = await this.findOne(id);
    if (tx.status === TransactionStatus.VALIDATED) {
      throw new ForbiddenException('Impossible de supprimer une transaction validée');
    }
    await this.prisma.transaction.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.prisma.auditLog.create({
      data: { userId: actorId, action: AuditAction.DELETE, resource: 'transactions', resourceId: id },
    });
    return { message: 'Transaction supprimée' };
  }
}
