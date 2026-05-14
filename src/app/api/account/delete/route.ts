import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser, destroySession } from '@/lib/session';
import { stripe } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL('/login', req.url), 303);

  // Cancel all Stripe subscriptions, then update DB
  const activeMemberships = await prisma.membership.findMany({
    where: { userId: user.id, status: 'active' },
  });
  for (const m of activeMemberships) {
    if (m.stripeSubscriptionId) {
      await stripe.subscriptions.cancel(m.stripeSubscriptionId);
    }
  }
  await prisma.membership.updateMany({
    where: { userId: user.id },
    data: { status: 'cancelled' },
  });
  // Block account by scrambling password/email rather than deleting (keeps FK integrity for historical records)
  await prisma.user.update({
    where: { id: user.id },
    data: {
      email: `deleted_${user.id}@example.invalid`,
      passwordHash: 'deleted',
      displayName: '(退会したユーザー)',
    },
  });
  await destroySession();
  return NextResponse.redirect(new URL('/?msg=account-deleted', req.url), 303);
}
