import Link from 'next/link';
import { prisma } from '@/lib/db';
import { requireSalonMember } from '@/lib/owner-guard';
import { canViewPost, PostVisibilityBadge } from '@/components/PostVisibilityBadge';
import { FlashMessage } from '@/components/FlashMessage';
import { SubmitButton } from '@/components/SubmitButton';

export default async function SalonHome({ params, searchParams }: { params: { id: string }; searchParams: { msg?: string } }) {
  const { salon, isOwner, membership } = await requireSalonMember(params.id);
  const plans = await prisma.plan.findMany({ where: { salonId: salon.id } });
  const currentPlan = membership ? plans.find(p => p.id === membership.planId) ?? null : null;
  const latestPosts = await prisma.post.findMany({
    where: { salonId: salon.id, draft: false },
    orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
    take: 5,
    include: { author: true },
  });
  const latestThreads = await prisma.thread.findMany({
    where: { salonId: salon.id },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { author: true, _count: { select: { comments: true } } },
  });

  return (
    <div>
      <FlashMessage code={searchParams.msg} />
      {salon.coverUrl && <img src={salon.coverUrl} alt="" className="w-full aspect-[3/1] object-cover rounded-lg mb-6" />}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{salon.name}</h1>
          <p className="text-sm text-slate-500">{salon.tagline}</p>
        </div>
        <nav className="flex gap-2 text-sm">
          <Link href={`/salons/${salon.id}/posts`} className="btn-ghost">投稿一覧</Link>
          <Link href={`/salons/${salon.id}/board`} className="btn-ghost">掲示板</Link>
          {isOwner && <Link href={`/owner/salons/${salon.id}/dashboard`} className="btn-primary">運営</Link>}
        </nav>
      </div>

      {!isOwner && membership && currentPlan && (
        <div className="card p-4 mb-6 flex items-center justify-between">
          <div className="text-sm">
            <span className="text-slate-500">現在のプラン：</span>
            <span className="font-bold text-indigo-700">{currentPlan.name}</span>
            <span className="text-slate-500 ml-2">¥{currentPlan.priceJpy.toLocaleString()}/月</span>
          </div>
          <div className="flex gap-2">
            <Link href={`/salons/${salon.id}`} className="btn-ghost text-xs">プラン変更</Link>
            <form action="/api/membership/cancel" method="post">
              <input type="hidden" name="membershipId" value={membership.id} />
              <input type="hidden" name="redirect" value={`/salons/${salon.id}`} />
              <SubmitButton confirmMessage="本当にこのサロンを退会しますか？コンテンツの閲覧・投稿ができなくなります。" className="btn-ghost text-red-600 text-xs" loadingText="退会中...">退会する</SubmitButton>
            </form>
          </div>
        </div>
      )}

      <section className="mb-8">
        <h2 className="font-bold mb-3">最新の投稿</h2>
        {latestPosts.length === 0 ? (
          <p className="text-slate-500 text-sm">まだ投稿がありません</p>
        ) : (
          <div className="space-y-2">
            {latestPosts.map(p => {
              const canView = canViewPost(p.visibility, currentPlan?.id ?? null, isOwner);
              return (
                <Link key={p.id} href={`/salons/${salon.id}/posts/${p.id}`} className={`card p-4 block hover:shadow ${canView ? '' : 'opacity-60'}`}>
                  <div className="flex items-center gap-2 flex-wrap">
                    {p.pinned && <span className="text-xs text-indigo-600">📌</span>}
                    <PostVisibilityBadge visibility={p.visibility} plans={plans} canView={canView} />
                    <span className="font-bold">{p.title}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">{p.author.displayName} · {p.createdAt.toLocaleDateString()}</div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-bold mb-3">掲示板の新着スレッド</h2>
        {latestThreads.length === 0 ? (
          <p className="text-slate-500 text-sm">まだスレッドがありません</p>
        ) : (
          <div className="space-y-2">
            {latestThreads.map(t => (
              <Link key={t.id} href={`/salons/${salon.id}/board/all/${t.id}`} className="card p-4 block hover:shadow">
                <div className="font-bold">{t.title}</div>
                <div className="text-xs text-slate-500 mt-1">{t.author.displayName} · {t._count.comments} 返信</div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
