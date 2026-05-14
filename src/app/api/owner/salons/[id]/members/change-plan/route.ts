import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireSalonOwner } from '@/lib/owner-guard';
import { stripe } from '@/lib/stripe';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  await requireSalonOwner(params.id);
  const f = await req.formData();
  const membershipId = String(f.get('membershipId'));
  const planId = String(f.get('planId'));
  const m = await prisma.membership.findUnique({ where: { id: membershipId } });
  const p = await prisma.plan.findUnique({ where: { id: planId } });
  if (m && p && m.salonId === params.id && p.salonId === params.id) {
    // Update Stripe subscription to new plan's price
    if (m.stripeSubscriptionId) {
      let stripePriceId = p.stripePriceId;
      if (!stripePriceId) {
        const price = await stripe.prices.create({
          unit_amount: p.priceJpy,
          currency: 'jpy',
          recurring: { interval: 'month' },
          product_data: { name: p.name },
        });
        stripePriceId = price.id;
        await prisma.plan.update({ where: { id: p.id }, data: { stripePriceId } });
      }
      const sub = await stripe.subscriptions.retrieve(m.stripeSubscriptionId);
      await stripe.subscriptions.update(m.stripeSubscriptionId, {
        items: [{ id: sub.items.data[0].id, price: stripePriceId }],
        proration_behavior: 'create_prorations',
      });
    }
    await prisma.membership.update({ where: { id: membershipId }, data: { planId } });
  }
  return NextResponse.redirect(new URL(`/owner/salons/${params.id}/members?msg=member-plan-changed`, req.url), 303);
}
