import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/db';
import { requireSalonOwner } from '@/lib/owner-guard';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  await requireSalonOwner(params.id);
  const f = await req.formData();
  const newVisibility = String(f.get('visibility') ?? 'public');

  const salon = await prisma.salon.update({
    where: { id: params.id },
    data: {
      name: String(f.get('name')).slice(0, 80),
      tagline: String(f.get('tagline')).slice(0, 140),
      description: String(f.get('description')),
      category: String(f.get('category')),
      visibility: newVisibility,
      coverUrl: String(f.get('coverUrl') ?? '') || null,
      thumbUrl: String(f.get('thumbUrl') ?? '') || null,
    },
  });

  // Auto-create an unlimited invite URL when switching to invite mode
  if (newVisibility === 'invite') {
    const existing = await prisma.invite.findFirst({ where: { salonId: params.id } });
    if (!existing) {
      await prisma.invite.create({
        data: {
          salonId: params.id,
          code: randomBytes(12).toString('base64url'),
          maxUses: 0, // unlimited
        },
      });
    }
  }

  return NextResponse.redirect(new URL(`/owner/salons/${params.id}/edit?msg=salon-updated`, req.url), 303);
}
