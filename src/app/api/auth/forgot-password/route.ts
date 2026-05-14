import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';
import { sendPasswordResetEmail } from '@/lib/email';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const email = String(form.get('email') ?? '');

  // Rate limit: 3 per email per 10 minutes
  if (!rateLimit(`reset:${email}`, 3, 600_000)) {
    return NextResponse.redirect(new URL('/forgot-password?msg=rate', req.url), 303);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.redirect(new URL('/forgot-password?msg=not-found', req.url), 303);
  }

  const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');

  // Delete any existing reset records for this email
  await prisma.passwordReset.deleteMany({ where: { email } });

  await prisma.passwordReset.create({
    data: {
      email,
      code,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  });

  await sendPasswordResetEmail(email, code);

  return NextResponse.redirect(new URL(`/forgot-password/verify?email=${encodeURIComponent(email)}`, req.url), 303);
}
