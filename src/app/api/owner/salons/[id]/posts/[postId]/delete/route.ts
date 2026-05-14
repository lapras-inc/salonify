import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireSalonOwner } from '@/lib/owner-guard';

export async function POST(req: NextRequest, { params }: { params: { id: string; postId: string } }) {
  await requireSalonOwner(params.id);
  const post = await prisma.post.findUnique({ where: { id: params.postId } });
  if (!post || post.salonId !== params.id) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }
  await prisma.post.delete({ where: { id: params.postId } });
  return NextResponse.redirect(new URL(`/owner/salons/${params.id}/posts?msg=post-deleted`, req.url), 303);
}
