import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RoleName } from '@prisma/client';
import { AccountsService } from './accounts.service';
import { CreateAccountDto, UpdateAccountDto, QueryAccountsDto } from './dto/account.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Accounts')
@ApiBearerAuth('JWT')
@UseGuards(RolesGuard)
@Controller({ path: 'accounts', version: '1' })
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post()
  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN)
  @ApiOperation({ summary: 'Créer un compte Mobile Money' })
  create(@Body() dto: CreateAccountDto, @CurrentUser('id') actorId: string) {
    return this.accountsService.create(dto, actorId);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les comptes' })
  findAll(@Query() query: QueryAccountsDto) {
    return this.accountsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détails d\'un compte' })
  findOne(@Param('id') id: string) {
    return this.accountsService.findOne(id);
  }

  @Patch(':id')
  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN)
  @ApiOperation({ summary: 'Modifier un compte' })
  update(@Param('id') id: string, @Body() dto: UpdateAccountDto, @CurrentUser('id') actorId: string) {
    return this.accountsService.update(id, dto, actorId);
  }

  @Delete(':id')
  @Roles(RoleName.SUPER_ADMIN)
  @ApiOperation({ summary: 'Supprimer un compte' })
  remove(@Param('id') id: string, @CurrentUser('id') actorId: string) {
    return this.accountsService.remove(id, actorId);
  }
}
