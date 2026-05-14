import { NextRequest, NextResponse } from 'next/server';
import { requireSalonOwner } from '@/lib/owner-guard';

// Mock payout: real implementation would queue a transfer via Stripe Connect or bank API.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  await requireSalonOwner(params.id);
  return NextResponse.redirect(new URL(`/owner/salons/${params.id}/revenue?msg=payout-requested`, req.url), 303);
}
