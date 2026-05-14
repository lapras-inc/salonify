import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireSalonMember } from '@/lib/owner-guard';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { user } = await requireSalonMember(params.id);
  if (!rateLimit(`thread:${user.id}`, 10, 60_000)) {
    return NextResponse.json({ error: 'rate limited' }, { status: 429 });
  }
  const f = await req.formData();
  const thread = await prisma.thread.create({
    data: {
      salonId: params.id,
      authorId: user.id,
      title: String(f.get('title')).slice(0, 200),
      body: String(f.get('body') ?? ''),
    },
  });
  return NextResponse.redirect(new URL(`/salons/${params.id}/board/all/${thread.id}?msg=thread-created`, req.url), 303);
}
