import { NextResponse } from 'next/server';
import { verifyToken } from './jwt';
import prisma from './prisma';

/**
 * Extracts and verifies the Bearer token, then loads the corresponding user.
 * Every token is signed with `{ userId, email, role }` (see lib/jwt.js signToken
 * callers) — this is the single place that looks the user up, so there's no risk
 * of routes drifting onto a different token shape or a different fallback secret.
 */
export async function authenticate(request) {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      error: {
        success: false,
        error: 'Unauthorized',
        message: "No token provided. Please include 'Authorization: Bearer <token>' header",
      },
      status: 401,
    };
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);

  if (!decoded) {
    return {
      error: {
        success: false,
        error: 'Unauthorized',
        message: 'Invalid or expired token',
      },
      status: 401,
    };
  }

  const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

  if (!user) {
    return {
      error: {
        success: false,
        error: 'Unauthorized',
        message: 'User not found',
      },
      status: 401,
    };
  }

  const { password, ...safeUser } = user;
  return { user: safeUser };
}

/**
 * @param {Request} request
 * @param {{ roles?: string[] }} [options] - if provided, the user's role must be one of these
 */
export async function requireAuth(request, options = {}) {
  const result = await authenticate(request);

  if (result.error) {
    return {
      response: NextResponse.json(result.error, { status: result.status }),
    };
  }

  if (options.roles && !options.roles.includes(result.user.role)) {
    return {
      response: NextResponse.json(
        { success: false, error: 'Access denied', message: 'You do not have permission to access this resource' },
        { status: 403 }
      ),
    };
  }

  return { user: result.user };
}
