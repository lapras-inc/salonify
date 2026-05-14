import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireSalonOwner } from '@/lib/owner-guard';
import { sanitizeHtml } from '@/lib/sanitize';
import { marked } from 'marked';

export async function POST(req: NextRequest, { params }: { params: { id: string; postId: string } }) {
  await requireSalonOwner(params.id);
  const post = await prisma.post.findUnique({ where: { id: params.postId } });
  if (!post || post.salonId !== params.id) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }
  const f = await req.formData();
  const bodyMarkdown = String(f.get('bodyHtml') ?? '');
  await prisma.post.update({
    where: { id: params.postId },
    data: {
      title: String(f.get('title')).slice(0, 200),
      bodyHtml: sanitizeHtml(marked.parse(bodyMarkdown, { async: false }) as string),
      bodyMarkdown,
      videoUrl: String(f.get('videoUrl') ?? '') || null,
      visibility: String(f.get('visibility') ?? 'all'),
      pinned: f.get('pinned') === '1',
      draft: f.get('draft') === '1',
    },
  });
  return NextResponse.redirect(new URL(`/owner/salons/${params.id}/posts?msg=post-updated`, req.url), 303);
}
