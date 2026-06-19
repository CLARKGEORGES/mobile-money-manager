import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAccountDto, UpdateAccountDto, QueryAccountsDto } from './dto/account.dto';
import { paginate, buildPaginatedResult } from '../common/utils/pagination.util';
import { AuditAction } from '@prisma/client';

const ACCOUNT_INCLUDE = { operator: true };

@Injectable()
export class AccountsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateAccountDto, actorId: string) {
    const exists = await this.prisma.mobileMoneyAccount.findUnique({ where: { accountNumber: dto.accountNumber } });
    if (exists) throw new ConflictException('Numéro de compte déjà utilisé');

    const operator = await this.prisma.mobileMoneyOperator.findUnique({ where: { id: dto.operatorId } });
    if (!operator) throw new NotFoundException('Opérateur introuvable');

    const account = await this.prisma.mobileMoneyAccount.create({
      data: {
        ...dto,
        initialBalance: dto.initialBalance || 0,
        currentBalance: dto.initialBalance || 0,
      },
      include: ACCOUNT_INCLUDE,
    });

    await this.prisma.auditLog.create({
      data: { userId: actorId, action: AuditAction.CREATE, resource: 'accounts', resourceId: account.id, newValues: account as any },
    });

    return account;
  }

  async findAll(query: QueryAccountsDto) {
    const { page = 1, limit = 20, search, operatorId, isActive } = query;
    const { skip, take } = paginate({ page, limit });

    const where: any = { deletedAt: null };
    if (operatorId) where.operatorId = operatorId;
    if (isActive !== undefined) where.isActive = isActive;
    if (search) {
      where.OR = [
        { accountNumber: { contains: search, mode: 'insensitive' } },
        { accountName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.mobileMoneyAccount.findMany({ where, skip, take, include: ACCOUNT_INCLUDE, orderBy: { createdAt: 'desc' } }),
      this.prisma.mobileMoneyAccount.count({ where }),
    ]);

    return buildPaginatedResult(data, total, page, limit);
  }

  async findOne(id: string) {
    const account = await this.prisma.mobileMoneyAccount.findUnique({
      where: { id, deletedAt: null },
      include: {
        ...ACCOUNT_INCLUDE,
        transactions: { take: 10, orderBy: { transactionDate: 'desc' }, include: { customer: true } },
      },
    });
    if (!account) throw new NotFoundException('Compte introuvable');
    return account;
  }

  async update(id: string, dto: UpdateAccountDto, actorId: string) {
    const account = await this.findOne(id);
    const updated = await this.prisma.mobileMoneyAccount.update({ where: { id }, data: dto, include: ACCOUNT_INCLUDE });

    await this.prisma.auditLog.create({
      data: { userId: actorId, action: AuditAction.UPDATE, resource: 'accounts', resourceId: id, oldValues: account as any, newValues: updated as any },
    });

    return updated;
  }

  async remove(id: string, actorId: string) {
    await this.findOne(id);
    await this.prisma.mobileMoneyAccount.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.prisma.auditLog.create({
      data: { userId: actorId, action: AuditAction.DELETE, resource: 'accounts', resourceId: id },
    });
    return { message: 'Compte supprimé' };
  }
}
