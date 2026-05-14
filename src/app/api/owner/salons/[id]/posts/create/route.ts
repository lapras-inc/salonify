import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireSalonOwner } from '@/lib/owner-guard';
import { sanitizeHtml } from '@/lib/sanitize';
import { rateLimit } from '@/lib/rate-limit';
import { marked } from 'marked';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { user } = await requireSalonOwner(params.id);
  if (!rateLimit(`post:${user.id}`, 30, 60_000)) {
    return NextResponse.json({ error: 'rate limited' }, { status: 429 });
  }
  const f = await req.formData();
  const bodyMarkdown = String(f.get('bodyHtml') ?? '');
  await prisma.post.create({
    data: {
      salonId: params.id,
      authorId: user.id,
      title: String(f.get('title')).slice(0, 200),
      bodyHtml: sanitizeHtml(marked.parse(bodyMarkdown, { async: false }) as string),
      bodyMarkdown,
      videoUrl: String(f.get('videoUrl') ?? '') || null,
      visibility: String(f.get('visibility') ?? 'all'),
      pinned: f.get('pinned') === '1',
      draft: f.get('draft') === '1',
    },
  });
  return NextResponse.redirect(new URL(`/salons/${params.id}/posts?msg=posted`, req.url), 303);
}
