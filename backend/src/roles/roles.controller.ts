import { Controller, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RolesService } from './roles.service';

@ApiTags('Roles')
@ApiBearerAuth('JWT')
@Controller({ path: 'roles', version: '1' })
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @ApiOperation({ summary: 'Lister les rôles' })
  findAll() { return this.rolesService.findAll(); }

  @Get('permissions')
  @ApiOperation({ summary: 'Lister toutes les permissions' })
  findPermissions() { return this.rolesService.findPermissions(); }

  @Get(':id')
  @ApiOperation({ summary: 'Détails d\'un rôle' })
  findOne(@Param('id') id: string) { return this.rolesService.findOne(id); }
}
