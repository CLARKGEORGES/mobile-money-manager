import { Controller, Get, Patch, Param, Body } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { OperatorsService } from './operators.service';

@ApiTags('Operators')
@ApiBearerAuth('JWT')
@Controller({ path: 'operators', version: '1' })
export class OperatorsController {
  constructor(private readonly operatorsService: OperatorsService) {}

  @Get()
  @ApiOperation({ summary: 'Lister les opérateurs Mobile Money' })
  findAll() { return this.operatorsService.findAll(); }

  @Get(':id')
  @ApiOperation({ summary: 'Détails d\'un opérateur' })
  findOne(@Param('id') id: string) { return this.operatorsService.findOne(id); }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier un opérateur' })
  update(@Param('id') id: string, @Body() body: any) { return this.operatorsService.update(id, body); }
}
