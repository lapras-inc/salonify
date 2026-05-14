import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireSalonMember } from '@/lib/owner-guard';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const thread = await prisma.thread.findUnique({ where: { id: params.id } });
  if (!thread) return NextResponse.json({ error: 'not found' }, { status: 404 });
  const { user } = await requireSalonMember(thread.salonId);
  const f = await req.formData();
  await prisma.report.create({
    data: {
      threadId: thread.id,
      reporterId: user.id,
      reason: String(f.get('reason') ?? 'unspecified').slice(0, 500),
    },
  });
  return NextResponse.redirect(new URL(`/salons/${thread.salonId}/board/all/${thread.id}?msg=reported`, req.url), 303);
}
