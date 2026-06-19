import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto, QueryUsersDto, UpdateUserStatusDto } from './dto/user.dto';
import { paginate, buildPaginatedResult } from '../common/utils/pagination.util';
import { AuditAction } from '@prisma/client';

const USER_SELECT = {
  id: true, email: true, firstName: true, lastName: true,
  phone: true, avatarUrl: true, status: true, lastLoginAt: true,
  createdAt: true, updatedAt: true,
  role: { select: { id: true, name: true, description: true } },
};

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateUserDto, actorId: string) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) throw new ConflictException('Email déjà utilisé');

    const user = await this.prisma.user.create({
      data: { ...dto, password: await bcrypt.hash(dto.password, 10) },
      select: USER_SELECT,
    });

    await this.prisma.auditLog.create({
      data: { userId: actorId, action: AuditAction.CREATE, resource: 'users', resourceId: user.id, newValues: user as any },
    });

    return user;
  }

  async findAll(query: QueryUsersDto) {
    const { page = 1, limit = 20, search, status, roleId } = query;
    const { skip, take } = paginate({ page, limit });

    const where: any = { deletedAt: null };
    if (status) where.status = status;
    if (roleId) where.roleId = roleId;
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({ where, skip, take, select: USER_SELECT, orderBy: { createdAt: 'desc' } }),
      this.prisma.user.count({ where }),
    ]);

    return buildPaginatedResult(data, total, page, limit);
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id, deletedAt: null },
      select: { ...USER_SELECT, loginHistory: { take: 10, orderBy: { createdAt: 'desc' } } },
    });
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    return user;
  }

  async update(id: string, dto: UpdateUserDto, actorId: string) {
    const user = await this.findOne(id);
    const data: any = { ...dto };
    if (dto.password) data.password = await bcrypt.hash(dto.password, 10);

    const updated = await this.prisma.user.update({ where: { id }, data, select: USER_SELECT });

    await this.prisma.auditLog.create({
      data: {
        userId: actorId, action: AuditAction.UPDATE, resource: 'users', resourceId: id,
        oldValues: user as any, newValues: updated as any,
      },
    });

    return updated;
  }

  async updateStatus(id: string, dto: UpdateUserStatusDto, actorId: string) {
    await this.findOne(id);
    const updated = await this.prisma.user.update({ where: { id }, data: { status: dto.status }, select: USER_SELECT });
    await this.prisma.auditLog.create({
      data: { userId: actorId, action: AuditAction.UPDATE, resource: 'users', resourceId: id, newValues: { status: dto.status } },
    });
    return updated;
  }

  async remove(id: string, actorId: string) {
    await this.findOne(id);
    await this.prisma.user.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.prisma.auditLog.create({
      data: { userId: actorId, action: AuditAction.DELETE, resource: 'users', resourceId: id },
    });
    return { message: 'Utilisateur supprimé' };
  }

  async getLoginHistory(userId: string) {
    await this.findOne(userId);
    return this.prisma.loginHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
