import Link from 'next/link';
import { prisma } from '@/lib/db';
import { requireSalonMember } from '@/lib/owner-guard';
import { canViewPost, PostVisibilityBadge } from '@/components/PostVisibilityBadge';
import { FlashMessage } from '@/components/FlashMessage';

export default async function PostList({ params, searchParams }: { params: { id: string }; searchParams: { msg?: string } }) {
  const { salon, isOwner, membership } = await requireSalonMember(params.id);
  const plans = await prisma.plan.findMany({ where: { salonId: salon.id } });
  const currentPlan = membership ? plans.find(p => p.id === membership.planId) ?? null : null;
  const posts = await prisma.post.findMany({
    where: { salonId: salon.id, draft: false },
    orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
    include: { author: true },
  });
  return (
    <div>
      <FlashMessage code={searchParams.msg} />
      <Link href={`/salons/${salon.id}/home`} className="text-sm text-slate-500 hover:text-indigo-600 mb-2 inline-block">← サロンホーム</Link>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{salon.name} / 投稿</h1>
        {isOwner && <Link href={`/owner/salons/${salon.id}/posts/new`} className="btn-primary">+ 新規投稿</Link>}
      </div>
      {currentPlan && !isOwner && (
        <div className="text-sm text-slate-600 mb-4">現在のプラン: <span className="font-bold text-indigo-700">{currentPlan.name}</span></div>
      )}
      {posts.length === 0 ? <p className="text-slate-500 text-sm">投稿がありません</p> : (
        <div className="space-y-3">
          {posts.map(p => {
            const canView = canViewPost(p.visibility, currentPlan?.id ?? null, isOwner);
            return (
              <Link key={p.id} href={`/salons/${salon.id}/posts/${p.id}`} className={`card p-5 block hover:shadow ${canView ? '' : 'opacity-60'}`}>
                <div className="flex items-center gap-2 flex-wrap">
                  {p.pinned && <span className="text-xs text-indigo-600">📌</span>}
                  <PostVisibilityBadge visibility={p.visibility} plans={plans} canView={canView} />
                  <span className="font-bold text-lg">{p.title}</span>
                </div>
                <div className="text-xs text-slate-500 mt-1">{p.author.displayName} · {p.createdAt.toLocaleDateString()}</div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
