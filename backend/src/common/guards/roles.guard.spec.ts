import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { AuthUser } from '../types/jwt-payload';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  const run = (user: AuthUser | undefined, required: Role[] | undefined) => {
    const reflector = new Reflector();
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(required);
    const ctx = {
      getHandler: () => undefined,
      getClass: () => undefined,
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
    } as unknown as ExecutionContext;
    return new RolesGuard(reflector).canActivate(ctx);
  };

  const adminUser: AuthUser = {
    id: 'u1',
    name: 'Admin',
    email: 'admin@example.com',
    role: Role.ADMIN,
  };
  const normalUser: AuthUser = { ...adminUser, role: Role.USER };

  it('allows access when no roles are required', () => {
    expect(run(normalUser, undefined)).toBe(true);
  });

  it('allows a user whose role matches', () => {
    expect(run(adminUser, [Role.ADMIN])).toBe(true);
  });

  it('forbids a user with the wrong role', () => {
    expect(() => run(normalUser, [Role.ADMIN])).toThrow(ForbiddenException);
  });

  it('forbids when no user is present', () => {
    expect(() => run(undefined, [Role.ADMIN])).toThrow(ForbiddenException);
  });
});
