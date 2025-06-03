import {
  PrismaClient,
  UserStatus,
  UserSource,
  ApplicationType,
  ApplicationStatus,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  // ======== 1. Permissions ==========
  const permissions = [
    { name: 'users.read', description: 'Read users' },
    { name: 'users.manage', description: 'Manage users' },
    { name: 'applications.read', description: 'Read applications' },
    { name: 'applications.manage', description: 'Manage applications' },
    { name: 'roles.read', description: 'Read roles' },
    { name: 'roles.manage', description: 'Manage roles' },
  ];
  const permRecords = [];
  for (const perm of permissions) {
    const p = await prisma.permission.upsert({
      where: { name: perm.name },
      update: {},
      create: perm,
    });
    permRecords.push(p);
  }

  // ======== 2. Roles ==========
  const roles = [
    { name: 'SuperAdmin', description: 'Super Administrator' },
    { name: 'Admin', description: 'Administrator' },
    { name: 'Manager', description: 'Manager' },
    { name: 'User', description: 'Regular user' },
    { name: 'ReadOnly', description: 'Read-only user' },
  ];
  const roleRecords = [];
  for (const role of roles) {
    const r = await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
    roleRecords.push(r);
  }

  // ======== 3. Assign Permissions to Roles =======
  const rolePermAssignments: Record<string, string[]> = {
    SuperAdmin: permRecords.map((p) => p.id), // all permissions
    Admin: permRecords.map((p) => p.id),
    Manager: permRecords
      .filter((p) => p.name.endsWith('.read') || p.name.endsWith('.manage'))
      .map((p) => p.id),
    User: permRecords.filter((p) => p.name.endsWith('.read')).map((p) => p.id),
    ReadOnly: permRecords
      .filter((p) => p.name.endsWith('.read'))
      .map((p) => p.id),
  };
  for (const role of roleRecords) {
    for (const permId of rolePermAssignments[role.name] || []) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId: role.id, permissionId: permId },
        },
        update: {},
        create: { roleId: role.id, permissionId: permId },
      });
    }
  }

  // ======== 4. Applications ==========
  // AuthCore Dashboard application
  const dashboardApp = await prisma.application.upsert({
    where: { clientId: 'authcore-dashboard' },
    update: {},
    create: {
      name: 'AuthCore Dashboard',
      type: ApplicationType.Web,
      clientId: 'authcore-dashboard',
      clientSecret: randomUUID(),
      redirectUris: ['http://localhost:2323/auth/callback'],
      applicationUrls: ['http://localhost:2323'],
      status: ApplicationStatus.Active,
      description: 'The admin dashboard for managing AuthCore',
      accessTokenLifetime: 60,
      refreshTokenLifetime: 7,
    },
  });
  // ======== 5. Users ==========
  // SUPERADMIN USER
  const superadminUser = await prisma.user.upsert({
    where: { email: 'superadmin@authcore.local' },
    update: {},
    create: {
      name: 'SuperAdmin User',
      email: 'superadmin@authcore.local',
      password: await bcrypt.hash('superadmin123', 10),
      status: UserStatus.Active,
      source: UserSource.Local,
    },
  });

  // ADMIN USER
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@authcore.local' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@authcore.local',
      password: await bcrypt.hash('admin123', 10),
      status: UserStatus.Active,
      source: UserSource.Local,
    },
  });

  // DEMO USER
  const demoUser = await prisma.user.upsert({
    where: { email: 'user@authcore.local' },
    update: {},
    create: {
      name: 'Demo User',
      email: 'user@authcore.local',
      password: await bcrypt.hash('user123', 10),
      status: UserStatus.Active,
      source: UserSource.Local,
    },
  });

  // ======== 6. Assign users to applications ==========
  for (const [user, apps] of [
    [superadminUser, [dashboardApp]],
    [adminUser, [dashboardApp]],
    [demoUser, [dashboardApp]],
  ] as const) {
    for (const app of apps) {
      await prisma.userApplication.upsert({
        where: {
          userId_applicationId: { userId: user.id, applicationId: app.id },
        },
        update: {},
        create: { userId: user.id, applicationId: app.id },
      });
    }
  }

  // ======== 7. Assign roles to users ==========
  const superAdminRole = roleRecords.find((r) => r.name === 'SuperAdmin')!;
  const adminRole = roleRecords.find((r) => r.name === 'Admin')!;
  const userRole = roleRecords.find((r) => r.name === 'User')!;
  // SuperAdmin gets both SuperAdmin & Admin
  await prisma.userRole.upsert({
    where: {
      userId_roleId: { userId: superadminUser.id, roleId: superAdminRole.id },
    },
    update: {},
    create: { userId: superadminUser.id, roleId: superAdminRole.id },
  });
  await prisma.userRole.upsert({
    where: {
      userId_roleId: { userId: superadminUser.id, roleId: adminRole.id },
    },
    update: {},
    create: { userId: superadminUser.id, roleId: adminRole.id },
  });
  // Admin gets Admin
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: adminRole.id } },
    update: {},
    create: { userId: adminUser.id, roleId: adminRole.id },
  });
  // Demo user gets User
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: demoUser.id, roleId: userRole.id } },
    update: {},
    create: { userId: demoUser.id, roleId: userRole.id },
  });

  console.log('Seed finished!');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
