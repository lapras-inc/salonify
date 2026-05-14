import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireSalonOwner } from '@/lib/owner-guard';
import { stripe } from '@/lib/stripe';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  await requireSalonOwner(params.id);
  const f = await req.formData();
  const membershipId = String(f.get('membershipId'));
  const m = await prisma.membership.findUnique({ where: { id: membershipId } });
  if (m && m.salonId === params.id) {
    if (m.stripeSubscriptionId) {
      await stripe.subscriptions.cancel(m.stripeSubscriptionId);
    }
    await prisma.membership.update({ where: { id: membershipId }, data: { status: 'cancelled' } });
  }
  return NextResponse.redirect(new URL(`/owner/salons/${params.id}/members?msg=member-removed`, req.url), 303);
}
