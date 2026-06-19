import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RoleName } from '@prisma/client';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto, UpdateTransactionDto, QueryTransactionsDto } from './dto/transaction.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Transactions')
@ApiBearerAuth('JWT')
@UseGuards(RolesGuard)
@Controller({ path: 'transactions', version: '1' })
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.ACCOUNTANT, RoleName.AGENT)
  @ApiOperation({ summary: 'Créer une transaction' })
  create(@Body() dto: CreateTransactionDto, @CurrentUser('id') actorId: string) {
    return this.transactionsService.create(dto, actorId);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les transactions' })
  findAll(@Query() query: QueryTransactionsDto) {
    return this.transactionsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détails d\'une transaction' })
  findOne(@Param('id') id: string) {
    return this.transactionsService.findOne(id);
  }

  @Patch(':id')
  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.ACCOUNTANT)
  @ApiOperation({ summary: 'Modifier une transaction' })
  update(@Param('id') id: string, @Body() dto: UpdateTransactionDto, @CurrentUser('id') actorId: string) {
    return this.transactionsService.update(id, dto, actorId);
  }

  @Patch(':id/validate')
  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.ACCOUNTANT)
  @ApiOperation({ summary: 'Valider une transaction' })
  validate(@Param('id') id: string, @CurrentUser('id') actorId: string) {
    return this.transactionsService.validate(id, actorId);
  }

  @Patch(':id/cancel')
  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.ACCOUNTANT)
  @ApiOperation({ summary: 'Annuler une transaction' })
  cancel(@Param('id') id: string, @CurrentUser('id') actorId: string) {
    return this.transactionsService.cancel(id, actorId);
  }

  @Delete(':id')
  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN)
  @ApiOperation({ summary: 'Supprimer une transaction' })
  remove(@Param('id') id: string, @CurrentUser('id') actorId: string) {
    return this.transactionsService.remove(id, actorId);
  }
}
