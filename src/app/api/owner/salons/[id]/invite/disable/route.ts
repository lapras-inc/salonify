import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireSalonOwner } from '@/lib/owner-guard';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  await requireSalonOwner(params.id);
  const f = await req.formData();
  const inviteId = String(f.get('inviteId'));
  const inv = await prisma.invite.findUnique({ where: { id: inviteId } });
  if (inv && inv.salonId === params.id) {
    await prisma.invite.update({ where: { id: inviteId }, data: { disabled: true } });
  }
  return NextResponse.redirect(new URL(`/owner/salons/${params.id}/edit?msg=invite-disabled`, req.url), 303);
}
