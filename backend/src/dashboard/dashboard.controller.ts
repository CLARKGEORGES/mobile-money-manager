import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@ApiBearerAuth('JWT')
@Controller({ path: 'dashboard', version: '1' })
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Résumé du tableau de bord' })
  getSummary() {
    return this.dashboardService.getSummary();
  }

  @Get('monthly-chart')
  @ApiOperation({ summary: 'Graphique mensuel sur 6 mois' })
  getMonthlyChart() {
    return this.dashboardService.getMonthlyChart();
  }

  @Get('recent-transactions')
  @ApiOperation({ summary: 'Transactions récentes' })
  getRecentTransactions(@Query('limit') limit?: number) {
    return this.dashboardService.getRecentTransactions(limit || 10);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Statistiques globales' })
  getStats() {
    return this.dashboardService.getStats();
  }
}
