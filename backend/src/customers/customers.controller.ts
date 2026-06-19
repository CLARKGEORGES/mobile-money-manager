import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CustomersService, CreateCustomerDto, QueryCustomersDto } from './customers.service';

@ApiTags('Customers')
@ApiBearerAuth('JWT')
@Controller({ path: 'customers', version: '1' })
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un client' })
  create(@Body() dto: CreateCustomerDto) { return this.customersService.create(dto); }

  @Get()
  @ApiOperation({ summary: 'Lister les clients' })
  findAll(@Query() query: QueryCustomersDto) { return this.customersService.findAll(query); }

  @Get(':id')
  @ApiOperation({ summary: 'Détails d\'un client' })
  findOne(@Param('id') id: string) { return this.customersService.findOne(id); }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier un client' })
  update(@Param('id') id: string, @Body() dto: Partial<CreateCustomerDto>) { return this.customersService.update(id, dto); }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un client' })
  remove(@Param('id') id: string) { return this.customersService.remove(id); }
}
