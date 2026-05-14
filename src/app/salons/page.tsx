import Link from 'next/link';
import { prisma } from '@/lib/db';
import { SalonCoverPlaceholder } from '@/components/SalonCoverPlaceholder';

const CATEGORIES = ['ビジネス', '趣味', 'アート', 'テクノロジー', '教育', 'その他'];

export default async function SalonsPage({ searchParams }: { searchParams: { category?: string; sort?: string } }) {
  const { category, sort } = searchParams;
  const salons = await prisma.salon.findMany({
    where: {
      visibility: 'public',
      ...(category ? { category } : {}),
    },
    include: { plans: true, _count: { select: { memberships: true } } },
    orderBy: sort === 'popular' ? { memberships: { _count: 'desc' } } : { createdAt: 'desc' },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">サロンを探す</h1>
      <div className="flex flex-wrap gap-2 mb-6 text-sm">
        <Link href="/salons" className={`px-3 py-1 rounded-full border ${!category ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white'}`}>すべて</Link>
        {CATEGORIES.map(c => (
          <Link key={c} href={`/salons?category=${encodeURIComponent(c)}`} className={`px-3 py-1 rounded-full border ${category === c ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white'}`}>{c}</Link>
        ))}
        <span className="flex-1" />
        <Link href={`/salons?${category ? `category=${encodeURIComponent(category)}&` : ''}sort=new`} className={`px-3 py-1 rounded-full border ${sort !== 'popular' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white'}`}>新着順</Link>
        <Link href={`/salons?${category ? `category=${encodeURIComponent(category)}&` : ''}sort=popular`} className={`px-3 py-1 rounded-full border ${sort === 'popular' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white'}`}>人気順</Link>
      </div>
      {salons.length === 0 ? (
        <p className="text-slate-500">条件に合うサロンがありません</p>
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          {salons.map(s => {
            const minPrice = Math.min(...s.plans.map(p => p.priceJpy), Infinity);
            return (
              <Link key={s.id} href={`/salons/${s.id}`} className="card overflow-hidden hover:shadow-md transition">
                {s.thumbUrl ? (
                  <img src={s.thumbUrl} alt="" className="w-full aspect-video object-cover" />
                ) : (
                  <SalonCoverPlaceholder title={s.name} category={s.category ?? undefined} />
                )}
                <div className="p-5">
                <div className="text-xs text-indigo-600 mb-1">{s.category}</div>
                <div className="font-bold text-lg">{s.name}</div>
                <div className="text-sm text-slate-600 mt-1 line-clamp-2">{s.tagline}</div>
                <div className="text-xs text-slate-500 mt-3">会員 {s._count.memberships}人{isFinite(minPrice) && ` · ¥${minPrice.toLocaleString()}〜/月`}</div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
