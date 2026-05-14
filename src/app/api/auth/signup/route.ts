import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import { sendVerificationEmail } from '@/lib/email';
import crypto from 'crypto';

const Schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(1).max(40),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'local';
  if (!rateLimit(`signup:${ip}`, 10, 60_000)) {
    return NextResponse.json({ error: 'rate limited' }, { status: 429 });
  }
  const form = await req.formData();
  const next = String(form.get('next') ?? '');
  const parsed = Schema.safeParse({
    email: form.get('email'),
    password: form.get('password'),
    displayName: form.get('displayName'),
  });
  if (!parsed.success) {
    return NextResponse.redirect(new URL(`/signup?error=invalid${next ? `&next=${encodeURIComponent(next)}` : ''}`, req.url), 303);
  }
  const exists = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (exists) {
    return NextResponse.redirect(new URL(`/signup?error=exists${next ? `&next=${encodeURIComponent(next)}` : ''}`, req.url), 303);
  }

  // Rate limit email sending: 3 per email per 10 minutes
  if (!rateLimit(`email:${parsed.data.email}`, 3, 600_000)) {
    return NextResponse.redirect(new URL(`/signup?error=rate${next ? `&next=${encodeURIComponent(next)}` : ''}`, req.url), 303);
  }

  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
  const passwordHash = await hashPassword(parsed.data.password);

  // Delete any existing verification records for this email
  await prisma.emailVerification.deleteMany({ where: { email: parsed.data.email } });

  await prisma.emailVerification.create({
    data: {
      email: parsed.data.email,
      code,
      displayName: parsed.data.displayName,
      passwordHash,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  });

  await sendVerificationEmail(parsed.data.email, code);

  const verifyUrl = `/signup/verify?email=${encodeURIComponent(parsed.data.email)}${next ? `&next=${encodeURIComponent(next)}` : ''}`;
  return NextResponse.redirect(new URL(verifyUrl, req.url), 303);
}
