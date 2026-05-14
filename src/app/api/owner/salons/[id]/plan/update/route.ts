import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireSalonOwner } from '@/lib/owner-guard';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  await requireSalonOwner(params.id);
  const f = await req.formData();
  const planId = String(f.get('planId'));
  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan || plan.salonId !== params.id) {
    return NextResponse.redirect(new URL(`/owner/salons/${params.id}/edit`, req.url), 303);
  }
  await prisma.plan.update({
    where: { id: planId },
    data: {
      name: String(f.get('name')),
      priceJpy: Math.max(0, Math.min(100000, Number(f.get('priceJpy') ?? 0))),
      trialDays: Math.max(0, Math.min(30, Number(f.get('trialDays') ?? 0))),
      introDiscount: Math.max(0, Number(f.get('introDiscount') ?? 0)),
      description: String(f.get('description') ?? '') || null,
    },
  });
  return NextResponse.redirect(new URL(`/owner/salons/${params.id}/edit?msg=plan-updated`, req.url), 303);
}
