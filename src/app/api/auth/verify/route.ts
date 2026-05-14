import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createSession } from '@/lib/session';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const email = String(form.get('email') ?? '');
  const code = String(form.get('code') ?? '');
  const next = String(form.get('next') ?? '');
  const safeDest = next.startsWith('/') ? next : '/dashboard';

  const verifyParams = `email=${encodeURIComponent(email)}${next ? `&next=${encodeURIComponent(next)}` : ''}`;

  // Rate limit: 5 attempts per email per 10 minutes
  if (!rateLimit(`verify:${email}`, 5, 600_000)) {
    return NextResponse.redirect(new URL(`/signup/verify?error=rate&${verifyParams}`, req.url), 303);
  }

  const record = await prisma.emailVerification.findFirst({
    where: { email, code },
  });

  if (!record || record.expiresAt < new Date()) {
    return NextResponse.redirect(new URL(`/signup/verify?error=invalid&${verifyParams}`, req.url), 303);
  }

  // Check if user already exists (e.g. race condition)
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    await prisma.emailVerification.deleteMany({ where: { email } });
    return NextResponse.redirect(new URL(`/signup/verify?error=exists&${verifyParams}`, req.url), 303);
  }

  const user = await prisma.user.create({
    data: {
      email: record.email,
      passwordHash: record.passwordHash,
      displayName: record.displayName,
      emailVerified: true,
    },
  });

  await prisma.emailVerification.deleteMany({ where: { email } });
  await createSession(user.id);
  return NextResponse.redirect(new URL(safeDest, req.url), 303);
}
