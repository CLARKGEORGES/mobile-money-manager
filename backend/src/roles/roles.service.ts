import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.role.findMany({ include: { permissions: true, _count: { select: { users: true } } } });
  }

  findOne(id: string) {
    return this.prisma.role.findUnique({ where: { id }, include: { permissions: true } });
  }

  findPermissions() {
    return this.prisma.permission.findMany({ orderBy: [{ resource: 'asc' }, { action: 'asc' }] });
  }
}
