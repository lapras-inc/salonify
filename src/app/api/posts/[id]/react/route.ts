import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireSalonMember } from '@/lib/owner-guard';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const post = await prisma.post.findUnique({ where: { id: params.id } });
  if (!post) return NextResponse.json({ error: 'not found' }, { status: 404 });
  const { user } = await requireSalonMember(post.salonId);

  const existing = await prisma.postReaction.findUnique({
    where: { postId_userId: { postId: post.id, userId: user.id } },
  });
  if (existing) {
    await prisma.postReaction.delete({ where: { id: existing.id } });
  } else {
    await prisma.postReaction.create({ data: { postId: post.id, userId: user.id } });
  }

  return NextResponse.redirect(new URL(`/salons/${post.salonId}/posts/${post.id}`, req.url), 303);
}
