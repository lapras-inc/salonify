import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/db';
import { requireSalonOwner } from '@/lib/owner-guard';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  await requireSalonOwner(params.id);
  const f = await req.formData();
  const label = String(f.get('label') ?? '').slice(0, 40);
  const maxUses = Math.max(0, Number(f.get('maxUses') ?? 0));
  const expDays = Math.max(0, Number(f.get('expDays') ?? 0));
  const code = randomBytes(12).toString('base64url');
  await prisma.invite.create({
    data: {
      salonId: params.id,
      code,
      label,
      maxUses,
      expiresAt: expDays > 0 ? new Date(Date.now() + expDays * 86400_000) : null,
    },
  });
  const redirectTo = String(f.get('redirect') ?? '');
  const dest = redirectTo.startsWith('/') ? `${redirectTo}?msg=invite-created` : `/owner/salons/${params.id}/edit?msg=invite-created`;
  return NextResponse.redirect(new URL(dest, req.url), 303);
}
