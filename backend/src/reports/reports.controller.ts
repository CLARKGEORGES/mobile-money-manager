import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RoleName } from '@prisma/client';
import { ReportsService, QueryReportDto } from './reports.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Reports')
@ApiBearerAuth('JWT')
@UseGuards(RolesGuard)
@Controller({ path: 'reports', version: '1' })
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.ACCOUNTANT, RoleName.AUDITOR)
  @ApiOperation({ summary: 'Générer un rapport financier' })
  generateReport(@Query() query: QueryReportDto) {
    return this.reportsService.generateReport(query);
  }

  @Get('journal')
  @ApiOperation({ summary: 'Journal des transactions' })
  getJournal(@Query() query: QueryReportDto) {
    return this.reportsService.getJournal(query);
  }
}
