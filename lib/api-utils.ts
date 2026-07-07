import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from './auth';
import { hasPermission, type Permission } from './permissions';
import prisma from './prisma';

export async function checkAuth(requiredPermission?: Permission) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return {
      error: NextResponse.json({ error: 'Non autorisé' }, { status: 401 }),
      session: null,
    };
  }

  if (requiredPermission && !hasPermission(session.user.permissions, requiredPermission)) {
    return {
      error: NextResponse.json({ error: 'Permission refusée' }, { status: 403 }),
      session: null,
    };
  }

  return { error: null, session };
}

export async function logAction(
  userId: string,
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'SUSPEND' | 'REACTIVATE' | 'LOGIN' | 'LOGOUT',
  entity: 'MEMBER' | 'CAR' | 'EVENT' | 'USER' | 'PRODUCT' | 'ORDER' | 'CAMPAIGN',
  entityId?: string,
  details?: object,
  request?: Request
) {
  try {
    await prisma.log.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        details: details ? JSON.stringify(details) : null,
        ipAddress: request?.headers.get('x-forwarded-for') || null,
        userAgent: request?.headers.get('user-agent') || null,
      },
    });
  } catch (error) {
  }
}

export function errorResponse(message: string, status: number = 500) {
  return NextResponse.json({ error: message }, { status });
}

export function successResponse(data: object, status: number = 200) {
  return NextResponse.json(data, { status });
}
