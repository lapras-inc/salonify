import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-guard';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  await requireAdmin();
  const salon = await prisma.salon.findUnique({ where: { id: params.id } });
  if (!salon) return NextResponse.json({ error: 'not found' }, { status: 404 });
  await prisma.salon.delete({ where: { id: params.id } });
  return NextResponse.redirect(new URL('/admin/salons?msg=salon-deleted', req.url), 303);
}
