import 'server-only';
import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import type { NextRequest } from 'next/server';

let adminApp: App | null = null;

function getAdminApp(): App {
  if (adminApp) return adminApp;
  const existing = getApps();
  if (existing.length > 0) {
    adminApp = existing[0];
    return adminApp;
  }

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_JSON is not set. Create a service account in the Firebase console ' +
        '(Project settings → Service accounts → Generate new private key), then paste the JSON ' +
        'as a single-line value in .env.local.',
    );
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON.');
  }

  adminApp = initializeApp({
    credential: cert(parsed as Parameters<typeof cert>[0]),
  });
  return adminApp;
}

export interface AuthedUser {
  uid: string;
  email: string | null;
}

/**
 * Verify the Firebase ID token on the `Authorization: Bearer <token>` header.
 * Throws if the token is missing, malformed, or invalid.
 */
export async function verifyAuth(req: NextRequest): Promise<AuthedUser> {
  const header = req.headers.get('authorization') ?? req.headers.get('Authorization');
  if (!header || !header.startsWith('Bearer ')) {
    throw new AuthError('Missing Authorization header', 401);
  }
  const token = header.slice('Bearer '.length).trim();
  if (!token) {
    throw new AuthError('Empty bearer token', 401);
  }
  try {
    const decoded = await getAuth(getAdminApp()).verifyIdToken(token);
    return { uid: decoded.uid, email: decoded.email ?? null };
  } catch (err) {
    throw new AuthError('Invalid or expired ID token', 401);
  }
}

export class AuthError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'AuthError';
  }
}
