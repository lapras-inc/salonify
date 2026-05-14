import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { requireSalonMember } from '@/lib/owner-guard';
import { extractYouTubeId } from '@/lib/sanitize';

export default async function PostDetail({ params }: { params: { id: string; postId: string } }) {
  const { salon, user, membership, isOwner } = await requireSalonMember(params.id);
  const post = await prisma.post.findUnique({ where: { id: params.postId }, include: { author: true, reactions: true } });
  if (!post || post.salonId !== salon.id) notFound();

  // Plan-gated visibility
  if (post.visibility.startsWith('plan:')) {
    const requiredPlanId = post.visibility.slice(5);
    if (!isOwner && membership?.planId !== requiredPlanId) {
      return (
        <div className="max-w-2xl mx-auto card p-8 text-center">
          <h1 className="text-xl font-bold">この投稿は上位プラン限定です</h1>
          <p className="text-slate-600 mt-2 text-sm">プランをアップグレードしてください</p>
          <Link href={`/salons/${salon.id}`} className="btn-ghost mt-4 inline-block">サロン詳細へ</Link>
        </div>
      );
    }
  }

  const yt = post.videoUrl ? extractYouTubeId(post.videoUrl) : null;

  return (
    <article className="max-w-3xl mx-auto">
      <Link href={`/salons/${salon.id}/posts`} className="text-sm text-indigo-600">← 投稿一覧</Link>
      <div className="card p-8 mt-3">
        <h1 className="text-3xl font-bold">{post.title}</h1>
        <div className="text-xs text-slate-500 mt-2">{post.author.displayName} · {post.createdAt.toLocaleString()}</div>
        {yt && (
          <div className="mt-4 aspect-video">
            <iframe className="w-full h-full rounded" src={`https://www.youtube.com/embed/${yt}`} allowFullScreen />
          </div>
        )}
        <div className="prose mt-6" dangerouslySetInnerHTML={{ __html: post.bodyHtml }} />
        <div className="mt-6 pt-4 border-t">
          <form action={`/api/posts/${post.id}/react`} method="post">
            <button className="btn-ghost text-sm">{post.reactions.some(r => r.userId === user.id) ? '❤ いいね済' : '♡ いいね'} ({post.reactions.length})</button>
          </form>
        </div>
      </div>
    </article>
  );
}
