import { notFound, redirect } from 'next/navigation';
import { prisma } from './db';
import { getCurrentUser } from './session';

export async function requireSalonOwner(salonId: string) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const salon = await prisma.salon.findUnique({ where: { id: salonId } });
  if (!salon) notFound();
  if (salon.ownerId !== user.id) notFound();
  return { user, salon };
}

export async function requireSalonMember(salonId: string) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const salon = await prisma.salon.findUnique({ where: { id: salonId } });
  if (!salon) notFound();
  const membership = await prisma.membership.findUnique({
    where: { userId_salonId: { userId: user.id, salonId } },
  });
  const isOwner = salon.ownerId === user.id;
  if (!isOwner && (!membership || membership.status !== 'active')) {
    redirect(`/salons/${salonId}`);
  }
  return { user, salon, membership, isOwner };
}
