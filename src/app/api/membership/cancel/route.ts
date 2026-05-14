import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';
import { stripe } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL('/login', req.url), 303);
  const form = await req.formData();
  const id = String(form.get('membershipId'));
  const redirectTo = String(form.get('redirect') ?? '/account/billing');
  const m = await prisma.membership.findUnique({ where: { id } });
  if (m && m.userId === user.id) {
    if (m.stripeSubscriptionId) {
      await stripe.subscriptions.cancel(m.stripeSubscriptionId);
    }
    await prisma.membership.update({ where: { id }, data: { status: 'cancelled' } });
  }
  // Only allow same-origin relative paths
  const safe = redirectTo.startsWith('/') ? redirectTo : '/account/billing';
  const redirectUrl = new URL(safe, req.url);
  redirectUrl.searchParams.set('msg', 'cancelled');
  return NextResponse.redirect(redirectUrl, 303);
}
