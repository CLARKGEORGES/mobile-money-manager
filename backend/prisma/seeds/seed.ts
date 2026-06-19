import { PrismaClient, RoleName, OperatorCode, TransactionType, TransactionStatus, AuditAction } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // ── Permissions ──────────────────────────────────────────────────────────
  const resources = ['users', 'roles', 'accounts', 'transactions', 'customers', 'reports', 'audit', 'operators'];
  const actions = ['create', 'read', 'update', 'delete', 'export', 'validate'];

  const allPermissions: { resource: string; action: string }[] = [];
  for (const resource of resources) {
    for (const action of actions) {
      allPermissions.push({ resource, action });
    }
  }

  await prisma.permission.createMany({ data: allPermissions, skipDuplicates: true });
  const permissions = await prisma.permission.findMany();

  // ── Roles ─────────────────────────────────────────────────────────────────
  const superAdminRole = await prisma.role.upsert({
    where: { name: RoleName.SUPER_ADMIN },
    update: { permissions: { set: permissions.map((p) => ({ id: p.id })) } },
    create: {
      name: RoleName.SUPER_ADMIN,
      description: 'Super Administrateur avec tous les droits',
      permissions: { connect: permissions.map((p) => ({ id: p.id })) },
    },
  });

  const adminPerms = permissions.filter((p) => !['delete'].includes(p.action) || p.resource !== 'audit');
  const adminRole = await prisma.role.upsert({
    where: { name: RoleName.ADMIN },
    update: {},
    create: {
      name: RoleName.ADMIN,
      description: 'Administrateur',
      permissions: { connect: adminPerms.map((p) => ({ id: p.id })) },
    },
  });

  const accountantPerms = permissions.filter(
    (p) => ['transactions', 'accounts', 'customers', 'reports'].includes(p.resource),
  );
  const accountantRole = await prisma.role.upsert({
    where: { name: RoleName.ACCOUNTANT },
    update: {},
    create: {
      name: RoleName.ACCOUNTANT,
      description: 'Comptable',
      permissions: { connect: accountantPerms.map((p) => ({ id: p.id })) },
    },
  });

  const agentPerms = permissions.filter(
    (p) => ['transactions', 'customers'].includes(p.resource) && ['create', 'read'].includes(p.action),
  );
  const agentRole = await prisma.role.upsert({
    where: { name: RoleName.AGENT },
    update: {},
    create: {
      name: RoleName.AGENT,
      description: 'Agent de caisse',
      permissions: { connect: agentPerms.map((p) => ({ id: p.id })) },
    },
  });

  const auditorPerms = permissions.filter((p) => p.action === 'read' || p.resource === 'audit');
  const auditorRole = await prisma.role.upsert({
    where: { name: RoleName.AUDITOR },
    update: {},
    create: {
      name: RoleName.AUDITOR,
      description: 'Auditeur (lecture seule)',
      permissions: { connect: auditorPerms.map((p) => ({ id: p.id })) },
    },
  });

  console.log('✅ Roles & permissions created');

  // ── Users ─────────────────────────────────────────────────────────────────
  const hash = (pwd: string) => bcrypt.hashSync(pwd, 10);

  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@mobilemoney.com' },
    update: {},
    create: {
      email: 'superadmin@mobilemoney.com',
      password: hash('SuperAdmin@123'),
      firstName: 'Super',
      lastName: 'Admin',
      phone: '+22500000001',
      roleId: superAdminRole.id,
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@mobilemoney.com' },
    update: {},
    create: {
      email: 'admin@mobilemoney.com',
      password: hash('Admin@123'),
      firstName: 'Jean',
      lastName: 'Kouassi',
      phone: '+22500000002',
      roleId: adminRole.id,
    },
  });

  const accountant = await prisma.user.upsert({
    where: { email: 'comptable@mobilemoney.com' },
    update: {},
    create: {
      email: 'comptable@mobilemoney.com',
      password: hash('Comptable@123'),
      firstName: 'Marie',
      lastName: 'Diallo',
      phone: '+22500000003',
      roleId: accountantRole.id,
    },
  });

  const agent = await prisma.user.upsert({
    where: { email: 'agent@mobilemoney.com' },
    update: {},
    create: {
      email: 'agent@mobilemoney.com',
      password: hash('Agent@123'),
      firstName: 'Kofi',
      lastName: 'Mensah',
      phone: '+22500000004',
      roleId: agentRole.id,
    },
  });

  console.log('✅ Users created');

  // ── Operators ─────────────────────────────────────────────────────────────
  const orangeMoney = await prisma.mobileMoneyOperator.upsert({
    where: { code: OperatorCode.ORANGE_MONEY },
    update: {},
    create: { code: OperatorCode.ORANGE_MONEY, name: 'Orange Money', color: '#FF6600', isActive: true },
  });
  const mtnMomo = await prisma.mobileMoneyOperator.upsert({
    where: { code: OperatorCode.MTN_MOMO },
    update: {},
    create: { code: OperatorCode.MTN_MOMO, name: 'MTN Mobile Money', color: '#FFCC00', isActive: true },
  });
  const moovMoney = await prisma.mobileMoneyOperator.upsert({
    where: { code: OperatorCode.MOOV_MONEY },
    update: {},
    create: { code: OperatorCode.MOOV_MONEY, name: 'Moov Money', color: '#0066CC', isActive: true },
  });
  const wave = await prisma.mobileMoneyOperator.upsert({
    where: { code: OperatorCode.WAVE },
    update: {},
    create: { code: OperatorCode.WAVE, name: 'Wave', color: '#1A73E8', isActive: true },
  });

  console.log('✅ Operators created');

  // ── Accounts ──────────────────────────────────────────────────────────────
  const acc1 = await prisma.mobileMoneyAccount.upsert({
    where: { accountNumber: '07 00 00 001' },
    update: {},
    create: {
      accountNumber: '07 00 00 001',
      accountName: 'Caisse Orange Principale',
      operatorId: orangeMoney.id,
      initialBalance: 5000000,
      currentBalance: 5000000,
    },
  });
  const acc2 = await prisma.mobileMoneyAccount.upsert({
    where: { accountNumber: '05 00 00 001' },
    update: {},
    create: {
      accountNumber: '05 00 00 001',
      accountName: 'Caisse MTN Principale',
      operatorId: mtnMomo.id,
      initialBalance: 3000000,
      currentBalance: 3000000,
    },
  });
  const acc3 = await prisma.mobileMoneyAccount.upsert({
    where: { accountNumber: '01 00 00 001' },
    update: {},
    create: {
      accountNumber: '01 00 00 001',
      accountName: 'Caisse Moov Principale',
      operatorId: moovMoney.id,
      initialBalance: 2000000,
      currentBalance: 2000000,
    },
  });
  const acc4 = await prisma.mobileMoneyAccount.upsert({
    where: { accountNumber: 'WV-00001' },
    update: {},
    create: {
      accountNumber: 'WV-00001',
      accountName: 'Caisse Wave Principale',
      operatorId: wave.id,
      initialBalance: 1500000,
      currentBalance: 1500000,
    },
  });

  console.log('✅ Accounts created');

  // ── Customers ─────────────────────────────────────────────────────────────
  const customers = [
    { name: 'Amadou Traoré', phone: '+22501234567', email: 'amadou@example.com' },
    { name: 'Fatou Coulibaly', phone: '+22507654321', email: 'fatou@example.com' },
    { name: 'Ibrahim Sanogo', phone: '+22509876543', email: null },
    { name: 'Aïssatou Barry', phone: '+22506543210', email: 'aissatou@example.com' },
    { name: 'Moussa Koné', phone: '+22502345678', email: null },
  ];

  const createdCustomers = await Promise.all(
    customers.map((c) =>
      prisma.customer.upsert({
        where: { phone: c.phone },
        update: {},
        create: c,
      }),
    ),
  );

  console.log('✅ Customers created');

  // ── Sample Transactions ───────────────────────────────────────────────────
  const txTypes = [
    TransactionType.DEPOSIT,
    TransactionType.WITHDRAWAL,
    TransactionType.TRANSFER,
    TransactionType.MERCHANT_PAYMENT,
    TransactionType.COLLECTION,
  ];
  const accounts = [acc1, acc2, acc3, acc4];

  const now = new Date();
  const transactions = [];

  for (let i = 1; i <= 50; i++) {
    const type = txTypes[i % txTypes.length];
    const amount = Math.floor(Math.random() * 500000) + 5000;
    const fees = Math.floor(amount * 0.01);
    const commission = Math.floor(amount * 0.005);
    const isDeposit = [TransactionType.DEPOSIT, TransactionType.COLLECTION, TransactionType.MERCHANT_PAYMENT].includes(type);
    const netAmount = isDeposit ? amount - fees : -(amount + fees);
    const account = accounts[i % accounts.length];
    const customer = createdCustomers[i % createdCustomers.length];
    const daysAgo = Math.floor(Math.random() * 30);
    const txDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    transactions.push({
      reference: `TX${String(i).padStart(6, '0')}-${Date.now()}`,
      type,
      status: TransactionStatus.VALIDATED,
      amount,
      fees,
      commission,
      netAmount,
      accountId: account.id,
      customerId: customer.id,
      createdById: agent.id,
      description: `Transaction de démonstration #${i}`,
      transactionDate: txDate,
      validatedAt: txDate,
    });
  }

  await prisma.transaction.createMany({ data: transactions, skipDuplicates: true });
  console.log('✅ Sample transactions created');

  // ── Audit logs ────────────────────────────────────────────────────────────
  await prisma.auditLog.createMany({
    data: [
      { userId: superAdmin.id, action: AuditAction.LOGIN, resource: 'auth', ipAddress: '192.168.1.1' },
      { userId: admin.id, action: AuditAction.LOGIN, resource: 'auth', ipAddress: '192.168.1.2' },
      { userId: agent.id, action: AuditAction.CREATE, resource: 'transactions', ipAddress: '192.168.1.3' },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Audit logs created');
  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📋 Demo credentials:');
  console.log('  Super Admin: superadmin@mobilemoney.com / SuperAdmin@123');
  console.log('  Admin:       admin@mobilemoney.com / Admin@123');
  console.log('  Comptable:   comptable@mobilemoney.com / Comptable@123');
  console.log('  Agent:       agent@mobilemoney.com / Agent@123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
