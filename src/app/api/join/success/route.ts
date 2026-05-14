import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { stripe } from '@/lib/stripe';

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('session_id');
  if (!sessionId) return NextResponse.redirect(new URL('/', req.url), 303);

  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['subscription'],
  });

  const userId = session.metadata?.userId;
  const salonId = session.metadata?.salonId;
  const planId = session.metadata?.planId;

  if (!userId || !salonId || !planId) {
    return NextResponse.redirect(new URL('/', req.url), 303);
  }

  const subscriptionId =
    typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription?.id;

  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  const nextBillAt = new Date();
  nextBillAt.setDate(nextBillAt.getDate() + (plan && plan.trialDays > 0 ? plan.trialDays : 30));

  const firstAmount = plan
    ? plan.trialDays > 0
      ? 0
      : Math.max(0, plan.priceJpy - plan.introDiscount)
    : 0;

  // Reactivate if previously cancelled, otherwise create new
  const existing = await prisma.membership.findUnique({
    where: { userId_salonId: { userId, salonId } },
  });

  const membership = existing
    ? await prisma.membership.update({
        where: { id: existing.id },
        data: {
          planId,
          status: 'active',
          nextBillAt,
          failedCount: 0,
          joinedAt: new Date(),
          stripeSubscriptionId: subscriptionId,
        },
      })
    : await prisma.membership.create({
        data: {
          userId,
          salonId,
          planId,
          nextBillAt,
          stripeSubscriptionId: subscriptionId,
        },
      });

  if (firstAmount > 0) {
    await prisma.invoice.create({
      data: { membershipId: membership.id, amountJpy: firstAmount, status: 'paid' },
    });
  }

  return NextResponse.redirect(new URL(`/salons/${salonId}/home?msg=joined`, req.url), 303);
}
