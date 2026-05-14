import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL('/login', req.url), 303);
  const f = await req.formData();
  const salon = await prisma.salon.create({
    data: {
      ownerId: user.id,
      name: String(f.get('name')).slice(0, 80),
      tagline: String(f.get('tagline')).slice(0, 140),
      description: String(f.get('description')),
      category: String(f.get('category')),
      visibility: String(f.get('visibility') ?? 'public'),
      coverUrl: String(f.get('coverUrl') ?? '') || null,
      thumbUrl: String(f.get('thumbUrl') ?? '') || null,
      plans: {
        create: {
          name: String(f.get('planName') ?? 'スタンダード'),
          priceJpy: Math.max(0, Math.min(100000, Number(f.get('planPrice') ?? 0))),
          trialDays: Math.max(0, Math.min(30, Number(f.get('planTrial') ?? 0))),
          introDiscount: Math.max(0, Number(f.get('planDiscount') ?? 0)),
        },
      },
    },
  });
  return NextResponse.redirect(new URL(`/owner/salons/${salon.id}/dashboard?msg=salon-created`, req.url), 303);
}
