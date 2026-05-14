import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const email = String(form.get('email') ?? '');
  const code = String(form.get('code') ?? '');
  const password = String(form.get('password') ?? '');
  const confirmPassword = String(form.get('confirmPassword') ?? '');

  const verifyParams = `email=${encodeURIComponent(email)}`;

  // Rate limit: 5 attempts per email per 10 minutes
  if (!rateLimit(`reset-verify:${email}`, 5, 600_000)) {
    return NextResponse.redirect(new URL(`/forgot-password/verify?error=rate&${verifyParams}`, req.url), 303);
  }

  if (password !== confirmPassword) {
    return NextResponse.redirect(new URL(`/forgot-password/verify?error=mismatch&${verifyParams}`, req.url), 303);
  }

  if (password.length < 8) {
    return NextResponse.redirect(new URL(`/forgot-password/verify?error=short&${verifyParams}`, req.url), 303);
  }

  const record = await prisma.passwordReset.findFirst({
    where: { email, code },
  });

  if (!record || record.expiresAt < new Date()) {
    return NextResponse.redirect(new URL(`/forgot-password/verify?error=invalid&${verifyParams}`, req.url), 303);
  }

  const passwordHash = await hashPassword(password);

  await prisma.user.update({
    where: { email },
    data: { passwordHash },
  });

  await prisma.passwordReset.deleteMany({ where: { email } });

  return NextResponse.redirect(new URL('/login?msg=reset-complete', req.url), 303);
}
