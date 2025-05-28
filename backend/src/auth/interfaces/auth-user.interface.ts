// src/auth/auth-user.interface.ts
import { UserRole } from '@prisma/client';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  roles: UserRole[];
  applicationId: string;
}
