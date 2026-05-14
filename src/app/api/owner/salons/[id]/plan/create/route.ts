import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireSalonOwner } from '@/lib/owner-guard';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  await requireSalonOwner(params.id);
  const f = await req.formData();
  await prisma.plan.create({
    data: {
      salonId: params.id,
      name: String(f.get('name')),
      priceJpy: Math.max(0, Math.min(100000, Number(f.get('priceJpy') ?? 0))),
      trialDays: Math.max(0, Math.min(30, Number(f.get('trialDays') ?? 0))),
      introDiscount: Math.max(0, Number(f.get('introDiscount') ?? 0)),
    },
  });
  return NextResponse.redirect(new URL(`/owner/salons/${params.id}/edit?msg=plan-added`, req.url), 303);
}
