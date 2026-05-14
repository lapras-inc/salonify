import Link from 'next/link';
import { prisma } from '@/lib/db';
import { FlashMessage } from '@/components/FlashMessage';
import { SalonCoverPlaceholder } from '@/components/SalonCoverPlaceholder';

export default async function Home({ searchParams }: { searchParams: { msg?: string } }) {
  const salons = await prisma.salon.findMany({
    where: { visibility: 'public' },
    include: { plans: true, _count: { select: { memberships: true } } },
    take: 6,
    orderBy: { createdAt: 'desc' },
  });
  return (
    <div>
      <FlashMessage code={searchParams.msg} />
      <section className="hero-bg hero-full -mt-8 pt-12 pb-14 mb-8 border-b border-slate-200">
        <div className="relative z-10 max-w-6xl mx-auto px-4">
          <p className="inline-flex items-center gap-1.5 text-sm text-indigo-600 mb-6 bg-white/80 backdrop-blur-sm rounded-full px-4 py-1.5 shadow-sm"><span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-600" />手数料 5%・審査なし・即日開設</p>
          <h1 className="text-6xl md:text-7xl font-bold leading-tight mb-6">誰でも、<br /><span className="relative inline-block"><span className="text-indigo-600">サロン</span>を開ける。<svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none" preserveAspectRatio="none"><path d="M0 6 Q25 0 50 6 T100 6 T150 6 T200 6 T250 6 T300 6" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" /></svg></span></h1>
          <p className="text-slate-600 mb-1">決済・メンバー管理・プラン設計まで、サロン運営に必要なすべてを。</p>
          <p className="text-slate-600 mb-8">手数料わずか <b>5%</b>（決済手数料込み）。</p>
          <div className="flex items-center gap-4">
            <Link href="/owner/salons/new" className="btn-primary">サロンを開設する →</Link>
            <Link href="/salons" className="btn-ghost">サロンを探す</Link>
            <span className="text-xs text-slate-400 ml-1">クレカ不要・30秒で完了</span>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-bold mb-4">新着サロン</h2>
        {salons.length === 0 ? (
          <p className="text-slate-500">まだサロンがありません。最初のサロンを開設しましょう。</p>
        ) : (
          <div className="grid md:grid-cols-3 gap-4">
            {salons.map(s => (
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
                <div className="text-xs text-slate-500 mt-3">会員 {s._count.memberships}人 · {s.plans.length}プラン</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
