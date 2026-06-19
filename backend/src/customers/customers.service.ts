import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { paginate, buildPaginatedResult } from '../common/utils/pagination.util';

export class CreateCustomerDto {
  name: string;
  phone: string;
  email?: string;
  address?: string;
}

export class QueryCustomersDto {
  search?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCustomerDto) {
    const exists = await this.prisma.customer.findUnique({ where: { phone: dto.phone } });
    if (exists) throw new ConflictException('Numéro de téléphone déjà utilisé');
    return this.prisma.customer.create({ data: dto });
  }

  async findAll(query: QueryCustomersDto) {
    const { page = 1, limit = 20, search } = query;
    const { skip, take } = paginate({ page, limit });
    const where: any = { deletedAt: null };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.customer.findMany({ where, skip, take, orderBy: { name: 'asc' } }),
      this.prisma.customer.count({ where }),
    ]);
    return buildPaginatedResult(data, total, page, limit);
  }

  async findOne(id: string) {
    const c = await this.prisma.customer.findUnique({
      where: { id, deletedAt: null },
      include: { transactions: { take: 10, orderBy: { transactionDate: 'desc' } } },
    });
    if (!c) throw new NotFoundException('Client introuvable');
    return c;
  }

  async update(id: string, dto: Partial<CreateCustomerDto>) {
    await this.findOne(id);
    return this.prisma.customer.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.customer.update({ where: { id }, data: { deletedAt: new Date() } });
    return { message: 'Client supprimé' };
  }
}
