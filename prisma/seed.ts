import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

const fullPermissions = {
  item: { create: true, read: true, update: true, delete: true },
  indent: { create: true, read: true, update: true, delete: true },
  mi: { create: true, read: true, update: true, delete: true },
  rfq: { create: true, read: true, update: true, delete: true },
  vendor: { create: true, read: true, update: true, delete: true },
};

const viewerPermissions = {
  item: { create: false, read: true, update: false, delete: false },
  indent: { create: false, read: true, update: false, delete: false },
  mi: { create: false, read: true, update: false, delete: false },
  rfq: { create: false, read: true, update: false, delete: false },
  vendor: { create: false, read: true, update: false, delete: false },
};

const procurementPermissions = {
  item: { create: true, read: true, update: true, delete: false },
  indent: { create: true, read: true, update: true, delete: false },
  mi: { create: true, read: true, update: true, delete: false },
  rfq: { create: true, read: true, update: true, delete: false },
  vendor: { create: true, read: true, update: true, delete: false },
};

async function main() {
  const company = await prisma.company.upsert({
    where: { id: '00000000-0000-4000-8000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000001',
      name: 'Kraya Demo Company',
    },
  });

  const procurementRole = await prisma.role.upsert({
    where: { name: 'Procurement Manager' },
    update: { permissions: procurementPermissions },
    create: {
      name: 'Procurement Manager',
      description: 'Can manage procurement workflows',
      permissions: procurementPermissions,
    },
  });

  const viewerRole = await prisma.role.upsert({
    where: { name: 'Viewer' },
    update: { permissions: viewerPermissions },
    create: {
      name: 'Viewer',
      description: 'Read-only access',
      permissions: viewerPermissions,
    },
  });

  const superAdminRole = await prisma.role.upsert({
    where: { name: 'Super Admin Role' },
    update: { permissions: fullPermissions },
    create: {
      name: 'Super Admin Role',
      description: 'Full permissions',
      permissions: fullPermissions,
    },
  });

  const adminPassword = await bcrypt.hash('Admin@123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@kraya.com' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'admin@kraya.com',
      phone: '+910000000001',
      password: adminPassword,
      isAdmin: true,
      userRoles: {
        create: [{ roleId: superAdminRole.id }],
      },
    },
  });

  const userPassword = await bcrypt.hash('User@123', 10);
  await prisma.user.upsert({
    where: { email: 'user@kraya.com' },
    update: {},
    create: {
      name: 'Viewer User',
      email: 'user@kraya.com',
      phone: '+910000000002',
      password: userPassword,
      isAdmin: false,
      userRoles: {
        create: [{ roleId: viewerRole.id }],
      },
    },
  });

  const vendorPassword = await bcrypt.hash('Vendor@123', 10);
  await prisma.vendor.upsert({
    where: { email: 'vendor@example.com' },
    update: {},
    create: {
      name: 'Acme Supplies',
      email: 'vendor@example.com',
      phone: '+910000000003',
      address: '123 Industrial Area',
      companyName: 'Acme Supplies Pvt Ltd',
      password: vendorPassword,
    },
  });

  await prisma.item.upsert({
    where: { itemId: 'ITEM-001' },
    update: {},
    create: {
      itemId: 'ITEM-001',
      companyId: company.id,
      itemCode: 'STEEL-10MM',
      name: 'Steel Rod 10mm',
      description: 'Construction grade steel rod',
      unit: 'kg',
      price: 85.5,
      createdByUserId: admin.id,
    },
  });

  console.log('Seed completed.');
  console.log('Admin: admin@kraya.com / Admin@123');
  console.log('User: user@kraya.com / User@123');
  console.log('Vendor: vendor@example.com / Vendor@123');
  console.log(`Company ID: ${company.id}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
