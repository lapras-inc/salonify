import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-guard';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  await requireAdmin();
  const user = await prisma.user.findUnique({ where: { id: params.id } });
  if (!user) return NextResponse.json({ error: 'not found' }, { status: 404 });
  await prisma.user.update({
    where: { id: params.id },
    data: { passwordHash: 'suspended' },
  });
  return NextResponse.redirect(new URL('/admin/users?msg=user-suspended', req.url), 303);
}
