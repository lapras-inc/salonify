import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';
import { sendVerificationEmail } from '@/lib/email';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const email = String(form.get('email') ?? '');
  const next = String(form.get('next') ?? '');

  if (!email) {
    return NextResponse.redirect(new URL('/signup', req.url), 303);
  }

  if (!rateLimit(`email:${email}`, 3, 600_000)) {
    const params = new URLSearchParams({ email, error: 'rate' });
    if (next) params.set('next', next);
    return NextResponse.redirect(new URL(`/signup/verify?${params}`, req.url), 303);
  }

  // Check if there's an existing verification record
  const existing = await prisma.emailVerification.findFirst({ where: { email } });
  if (!existing) {
    return NextResponse.redirect(new URL('/signup', req.url), 303);
  }

  // Generate new code, update record
  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
  await prisma.emailVerification.update({
    where: { id: existing.id },
    data: { code, expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
  });

  await sendVerificationEmail(email, code);

  const params = new URLSearchParams({ email });
  if (next) params.set('next', next);
  return NextResponse.redirect(new URL(`/signup/verify?${params}`, req.url), 303);
}
