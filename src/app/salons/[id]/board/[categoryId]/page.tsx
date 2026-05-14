import Link from 'next/link';
import { prisma } from '@/lib/db';
import { requireSalonMember } from '@/lib/owner-guard';

export default async function ThreadList({ params, searchParams }: { params: { id: string; categoryId: string }; searchParams: { page?: string } }) {
  const { salon } = await requireSalonMember(params.id);
  const page = Math.max(1, Number(searchParams.page ?? 1));
  const perPage = 20;
  const [threads, total] = await Promise.all([
    prisma.thread.findMany({
      where: { salonId: salon.id },
      orderBy: { createdAt: 'desc' },
      include: { author: true, _count: { select: { comments: true, reactions: true } } },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.thread.count({ where: { salonId: salon.id } }),
  ]);
  const pages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div>
      <Link href={`/salons/${salon.id}/home`} className="text-sm text-slate-500 hover:text-indigo-600 mb-2 inline-block">← サロンホーム</Link>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{salon.name} / 掲示板</h1>
        <Link href={`/salons/${salon.id}/board/${params.categoryId}/new`} className="btn-primary">+ 新規スレッド</Link>
      </div>
      {threads.length === 0 ? (
        <p className="text-slate-500 text-sm">まだスレッドがありません</p>
      ) : (
        <div className="space-y-2">
          {threads.map(t => (
            <Link key={t.id} href={`/salons/${salon.id}/board/${params.categoryId}/${t.id}`} className="card p-4 block hover:shadow">
              <div className="font-bold">{t.title}</div>
              <div className="text-xs text-slate-500 mt-1">{t.author.displayName} · {t.createdAt.toLocaleDateString()} · 💬 {t._count.comments} · ❤ {t._count.reactions}</div>
            </Link>
          ))}
        </div>
      )}
      {pages > 1 && (
        <div className="flex gap-1 mt-6 justify-center">
          {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
            <Link key={p} href={`?page=${p}`} className={`px-3 py-1 rounded border text-sm ${p === page ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white'}`}>{p}</Link>
          ))}
        </div>
      )}
    </div>
  );
}
