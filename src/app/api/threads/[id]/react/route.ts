import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireSalonMember } from '@/lib/owner-guard';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const thread = await prisma.thread.findUnique({ where: { id: params.id } });
  if (!thread) return NextResponse.json({ error: 'not found' }, { status: 404 });
  const { user } = await requireSalonMember(thread.salonId);
  const existing = await prisma.reaction.findUnique({
    where: { threadId_userId_kind: { threadId: thread.id, userId: user.id, kind: 'like' } },
  });
  if (existing) {
    await prisma.reaction.delete({ where: { id: existing.id } });
  } else {
    await prisma.reaction.create({ data: { threadId: thread.id, userId: user.id, kind: 'like' } });
  }
  return NextResponse.redirect(new URL(`/salons/${thread.salonId}/board/all/${thread.id}`, req.url), 303);
}
