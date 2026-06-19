import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, ChangePasswordDto } from './dto/login.dto';
import { AuditAction } from '@prisma/client';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async login(dto: LoginDto, ipAddress?: string, userAgent?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email, deletedAt: null },
      include: { role: { include: { permissions: true } } },
    });

    const isValid = user && (await bcrypt.compare(dto.password, user.password));

    // Record login attempt
    if (user) {
      await this.prisma.loginHistory.create({
        data: { userId: user.id, ipAddress, userAgent, success: !!isValid },
      });
    }

    if (!isValid) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Compte suspendu ou inactif');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Audit log
    await this.prisma.auditLog.create({
      data: { userId: user.id, action: AuditAction.LOGIN, resource: 'auth', ipAddress, userAgent },
    });

    const tokens = await this.generateTokens(user.id, user.email);

    // Save refresh token hash
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: await bcrypt.hash(tokens.refreshToken, 10) },
    });

    const { password, refreshToken, ...safeUser } = user;
    return { user: safeUser, ...tokens };
  }

  async logout(userId: string, ipAddress?: string) {
    await this.prisma.user.update({ where: { id: userId }, data: { refreshToken: null } });
    await this.prisma.auditLog.create({
      data: { userId, action: AuditAction.LOGOUT, resource: 'auth', ipAddress },
    });
    return { message: 'Déconnexion réussie' };
  }

  async refreshTokens(userId: string, token: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.refreshToken) throw new UnauthorizedException('Accès refusé');

    const matches = await bcrypt.compare(token, user.refreshToken);
    if (!matches) throw new UnauthorizedException('Token invalide');

    const tokens = await this.generateTokens(user.id, user.email);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: await bcrypt.hash(tokens.refreshToken, 10) },
    });
    return tokens;
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    const valid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!valid) throw new BadRequestException('Mot de passe actuel incorrect');

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: await bcrypt.hash(dto.newPassword, 10) },
    });

    await this.prisma.auditLog.create({
      data: { userId, action: AuditAction.UPDATE, resource: 'auth' },
    });

    return { message: 'Mot de passe modifié avec succès' };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      include: { role: { include: { permissions: true } } },
    });
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    const { password, refreshToken, ...safeUser } = user;
    return safeUser;
  }

  private async generateTokens(userId: string, email: string) {
    const secret = this.configService.get<string>('JWT_SECRET', 'fallback-secret');
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET', 'fallback-refresh-secret');

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync({ sub: userId, email }, { secret, expiresIn: '15m' }),
      this.jwtService.signAsync({ sub: userId, email }, { secret: refreshSecret, expiresIn: '7d' }),
    ]);

    return { accessToken, refreshToken };
  }
}
