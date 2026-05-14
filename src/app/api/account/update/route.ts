import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL('/login', req.url), 303);
  const form = await req.formData();
  await prisma.user.update({
    where: { id: user.id },
    data: {
      displayName: String(form.get('displayName') ?? user.displayName).slice(0, 40),
      bio: String(form.get('bio') ?? ''),
      avatarUrl: String(form.get('avatarUrl') ?? '') || null,
    },
  });
  return NextResponse.redirect(new URL('/account?msg=account-updated', req.url), 303);
}
