import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-guard';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  await requireAdmin();
  const report = await prisma.report.findUnique({ where: { id: params.id } });
  if (!report) return NextResponse.json({ error: 'not found' }, { status: 404 });
  await prisma.report.update({
    where: { id: params.id },
    data: { resolved: true },
  });
  return NextResponse.redirect(new URL('/admin/reports?msg=report-resolved', req.url), 303);
}
