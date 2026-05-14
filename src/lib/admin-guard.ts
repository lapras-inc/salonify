import { redirect } from 'next/navigation';
import { getCurrentUser } from './session';

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || !user.isAdmin) redirect('/');
  return user;
}
