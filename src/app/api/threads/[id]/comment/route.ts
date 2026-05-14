import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireSalonMember } from '@/lib/owner-guard';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const thread = await prisma.thread.findUnique({ where: { id: params.id } });
  if (!thread) return NextResponse.json({ error: 'not found' }, { status: 404 });
  const { user } = await requireSalonMember(thread.salonId);
  if (!rateLimit(`comment:${user.id}`, 30, 60_000)) {
    return NextResponse.json({ error: 'rate limited' }, { status: 429 });
  }
  const f = await req.formData();
  let parentId = String(f.get('parentId') ?? '') || null;
  if (parentId) {
    // Nest max 1 level — if parent has a parent, flatten to that parent
    const parent = await prisma.comment.findUnique({ where: { id: parentId } });
    if (parent?.parentId) parentId = parent.parentId;
  }
  await prisma.comment.create({
    data: {
      threadId: thread.id,
      authorId: user.id,
      parentId,
      body: String(f.get('body') ?? '').slice(0, 2000),
    },
  });
  return NextResponse.redirect(new URL(`/salons/${thread.salonId}/board/all/${thread.id}?msg=commented`, req.url), 303);
}
