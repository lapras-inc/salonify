import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyPassword } from '@/lib/auth';
import { createSession } from '@/lib/session';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'local';
  if (!rateLimit(`login:${ip}`, 20, 60_000)) {
    return NextResponse.json({ error: 'rate limited' }, { status: 429 });
  }
  const form = await req.formData();
  const email = String(form.get('email') ?? '');
  const password = String(form.get('password') ?? '');
  const next = String(form.get('next') ?? '');
  const safeDest = next.startsWith('/') ? next : '/dashboard';
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    const loginErr = `/login?error=invalid${next ? `&next=${encodeURIComponent(next)}` : ''}`;
    return NextResponse.redirect(new URL(loginErr, req.url), 303);
  }
  await createSession(user.id);
  return NextResponse.redirect(new URL(safeDest, req.url), 303);
}
