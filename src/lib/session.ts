import { cache } from 'react';
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { prisma } from './db';

const secret = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'dev-secret-change-me-please-32chars-min'
);
const COOKIE = 'session';

export type SessionPayload = { uid: string };

export async function createSession(uid: string) {
  const token = await new SignJWT({ uid })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret);
  cookies().set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function destroySession() {
  cookies().delete(COOKIE);
}

export async function getSession(): Promise<SessionPayload | null> {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export const getCurrentUser = cache(async () => {
  const s = await getSession();
  if (!s) return null;
  return prisma.user.findUnique({ where: { id: s.uid } });
});

export async function requireUser() {
  const u = await getCurrentUser();
  if (!u) throw new Error('UNAUTHORIZED');
  return u;
}
