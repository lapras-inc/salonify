import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';
import { stripe } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL('/login', req.url), 303);

  const form = await req.formData();
  const salonId = String(form.get('salonId'));
  const planId = String(form.get('planId'));

  const inviteCode = String(form.get('invite') ?? '');

  const salon = await prisma.salon.findUnique({ where: { id: salonId } });
  if (!salon) return NextResponse.redirect(new URL('/', req.url), 303);

  // Invite-only: validate invite code (skip for plan changes by existing active members)
  const existingCheck = await prisma.membership.findUnique({
    where: { userId_salonId: { userId: user.id, salonId } },
  });
  if (salon.visibility === 'invite' && !(existingCheck && existingCheck.status === 'active')) {
    if (!inviteCode) return NextResponse.redirect(new URL(`/salons/${salonId}`, req.url), 303);
    const inv = await prisma.invite.findUnique({ where: { code: inviteCode } });
    const expired = inv?.expiresAt && inv.expiresAt < new Date();
    const exhausted = inv && inv.maxUses > 0 && inv.uses >= inv.maxUses;
    if (!inv || inv.salonId !== salonId || inv.disabled || expired || exhausted) {
      return NextResponse.redirect(new URL(`/salons/${salonId}`, req.url), 303);
    }
    // Increment usage after successful validation (will be counted once join succeeds below)
    await prisma.invite.update({ where: { id: inv.id }, data: { uses: inv.uses + 1 } });
  }

  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan || plan.salonId !== salonId) {
    return NextResponse.redirect(new URL(`/salons/${salonId}`, req.url), 303);
  }

  const existing = existingCheck;
  // Already on the same plan — nothing to do
  if (existing && existing.status === 'active' && existing.planId === planId) {
    return NextResponse.redirect(new URL(`/salons/${salonId}/home`, req.url), 303);
  }

  // Active plan change
  if (existing && existing.status === 'active') {
    // Stripe でサブスク更新 (キーがある場合のみ)
    if (process.env.STRIPE_SECRET_KEY) {
      let newStripePriceId = plan.stripePriceId;
      if (!newStripePriceId) {
        const price = await stripe.prices.create({
          unit_amount: plan.priceJpy,
          currency: 'jpy',
          recurring: { interval: 'month' },
          product_data: { name: plan.name },
        });
        newStripePriceId = price.id;
        await prisma.plan.update({ where: { id: plan.id }, data: { stripePriceId: newStripePriceId } });
      }
      if (existing.stripeSubscriptionId) {
        const sub = await stripe.subscriptions.retrieve(existing.stripeSubscriptionId);
        await stripe.subscriptions.update(existing.stripeSubscriptionId, {
          items: [{ id: sub.items.data[0].id, price: newStripePriceId }],
          proration_behavior: 'create_prorations',
        });
      }
    }

    await prisma.membership.update({ where: { id: existing.id }, data: { planId } });
    return NextResponse.redirect(new URL(`/salons/${salonId}/home?msg=plan-changed`, req.url), 303);
  }

  // --- 新規入会 / 再入会 ---

  // Stripe キーがない場合: Checkout をスキップして直接入会
  if (!process.env.STRIPE_SECRET_KEY) {
    const nextBillAt = new Date();
    nextBillAt.setDate(nextBillAt.getDate() + (plan.trialDays > 0 ? plan.trialDays : 30));
    const firstAmount = plan.trialDays > 0 ? 0 : Math.max(0, plan.priceJpy - plan.introDiscount);

    const prev = await prisma.membership.findUnique({
      where: { userId_salonId: { userId: user.id, salonId } },
    });
    const membership = prev
      ? await prisma.membership.update({
          where: { id: prev.id },
          data: { planId, status: 'active', nextBillAt, failedCount: 0, joinedAt: new Date() },
        })
      : await prisma.membership.create({
          data: { userId: user.id, salonId, planId, nextBillAt },
        });
    if (firstAmount > 0) {
      await prisma.invoice.create({ data: { membershipId: membership.id, amountJpy: firstAmount, status: 'paid' } });
    }
    return NextResponse.redirect(new URL(`/salons/${salonId}/home?msg=joined`, req.url), 303);
  }

  // --- Stripe Checkout ---

  let stripeCustomerId = user.stripeCustomerId;
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { userId: user.id },
    });
    stripeCustomerId = customer.id;
    await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId } });
  }

  let stripePriceId = plan.stripePriceId;
  if (!stripePriceId) {
    const price = await stripe.prices.create({
      unit_amount: plan.priceJpy,
      currency: 'jpy',
      recurring: { interval: 'month' },
      product_data: { name: plan.name },
    });
    stripePriceId = price.id;
    await prisma.plan.update({ where: { id: plan.id }, data: { stripePriceId } });
  }

  const headersList = await headers();
  const origin = headersList.get('origin') || headersList.get('x-forwarded-host') || new URL(req.url).origin;
  const baseUrl = origin.startsWith('http') ? origin : `https://${origin}`;

  const sessionParams: Record<string, unknown> = {
    customer: stripeCustomerId,
    mode: 'subscription' as const,
    line_items: [{ price: stripePriceId, quantity: 1 }],
    success_url: `${baseUrl}/api/join/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/salons/${salonId}/join?plan=${planId}${inviteCode ? `&invite=${inviteCode}` : ''}`,
    metadata: { userId: user.id, salonId, planId },
    subscription_data: {
      metadata: { userId: user.id, salonId, planId },
    } as Record<string, unknown>,
  };

  if (plan.trialDays > 0) {
    (sessionParams.subscription_data as Record<string, unknown>).trial_period_days = plan.trialDays;
  }

  if (plan.introDiscount > 0) {
    const coupon = await stripe.coupons.create({
      amount_off: plan.introDiscount,
      currency: 'jpy',
      duration: 'once',
      name: `${plan.name} 初月割引`,
    });
    sessionParams.discounts = [{ coupon: coupon.id }];
  }

  const session = await stripe.checkout.sessions.create(
    sessionParams as Parameters<typeof stripe.checkout.sessions.create>[0],
  );

  return NextResponse.redirect(session.url!, 303);
}
