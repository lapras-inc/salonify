import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { stripe } from '@/lib/stripe';
import type Stripe from 'stripe';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  let event: Stripe.Event;

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (webhookSecret && sig) {
    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }
  } else {
    // Skip verification when secret is not configured (development)
    event = JSON.parse(body) as Stripe.Event;
  }

  switch (event.type) {
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice;
      const subId = (invoice as any).subscription as string | null;
      if (!subId) break;

      const membership = await prisma.membership.findFirst({
        where: { stripeSubscriptionId: subId },
      });
      if (membership) {
        await prisma.invoice.create({
          data: {
            membershipId: membership.id,
            amountJpy: invoice.amount_paid,
            status: 'paid',
          },
        });
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      const membership = await prisma.membership.findFirst({
        where: { stripeSubscriptionId: sub.id },
      });
      if (membership) {
        await prisma.membership.update({
          where: { id: membership.id },
          data: { status: 'cancelled' },
        });
      }
      break;
    }

    case 'invoice.payment_failed': {
      const failedInvoice = event.data.object as Stripe.Invoice;
      const failedSubId = (failedInvoice as any).subscription as string | null;
      if (!failedSubId) break;

      const membership = await prisma.membership.findFirst({
        where: { stripeSubscriptionId: failedSubId },
      });
      if (membership) {
        const newFailedCount = membership.failedCount + 1;
        await prisma.membership.update({
          where: { id: membership.id },
          data: {
            failedCount: newFailedCount,
            status: newFailedCount >= 3 ? 'suspended' : membership.status,
          },
        });
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
