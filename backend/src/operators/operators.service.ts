import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OperatorsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.mobileMoneyOperator.findMany({
      include: { _count: { select: { accounts: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const op = await this.prisma.mobileMoneyOperator.findUnique({
      where: { id },
      include: { accounts: { where: { deletedAt: null, isActive: true } } },
    });
    if (!op) throw new NotFoundException('Opérateur introuvable');
    return op;
  }

  async update(id: string, data: { isActive?: boolean; color?: string; logoUrl?: string }) {
    await this.findOne(id);
    return this.prisma.mobileMoneyOperator.update({ where: { id }, data });
  }
}
