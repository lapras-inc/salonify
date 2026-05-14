import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';
import { FlashMessage } from '@/components/FlashMessage';

export default async function Dashboard({ searchParams }: { searchParams: { msg?: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const memberships = await prisma.membership.findMany({
    where: { userId: user.id, status: 'active' },
    include: { salon: true, plan: true },
    orderBy: { joinedAt: 'desc' },
  });
  const owned = await prisma.salon.findMany({
    where: { ownerId: user.id },
    include: { _count: { select: { memberships: true } } },
  });

  return (
    <div>
      <FlashMessage code={searchParams.msg} />
      <h1 className="text-2xl font-bold mb-6">マイページ</h1>

      <section className="mb-10">
        <h2 className="font-bold mb-3">参加中のサロン</h2>
        {memberships.length === 0 ? (
          <p className="text-slate-500 text-sm">まだサロンに参加していません。<Link href="/salons" className="text-indigo-600">サロンを探す</Link></p>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {memberships.map(m => (
              <Link key={m.id} href={`/salons/${m.salon.id}/home`} className="card p-4 hover:shadow-md">
                <div className="font-bold">{m.salon.name}</div>
                <div className="text-xs text-slate-500 mt-1">{m.plan.name} / ¥{m.plan.priceJpy.toLocaleString()} · {m.status}</div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold">運営中のサロン</h2>
          <Link href="/owner/salons/new" className="btn-ghost">+ 新規開設</Link>
        </div>
        {owned.length === 0 ? (
          <p className="text-slate-500 text-sm">運営中のサロンはありません</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {owned.map(s => (
              <Link key={s.id} href={`/owner/salons/${s.id}/dashboard`} className="card p-4 hover:shadow-md">
                <div className="font-bold">{s.name}</div>
                <div className="text-xs text-slate-500 mt-1">会員 {s._count.memberships}人</div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
