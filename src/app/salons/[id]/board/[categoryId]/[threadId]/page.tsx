import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { requireSalonMember } from '@/lib/owner-guard';
import { renderMarkdown } from '@/lib/sanitize';
import { FlashMessage } from '@/components/FlashMessage';
import { SubmitButton } from '@/components/SubmitButton';

export default async function ThreadDetail({ params, searchParams }: { params: { id: string; categoryId: string; threadId: string }; searchParams: { msg?: string } }) {
  const { user, salon } = await requireSalonMember(params.id);
  const thread = await prisma.thread.findUnique({
    where: { id: params.threadId },
    include: {
      author: true,
      comments: {
        include: { author: true, replies: { include: { author: true }, orderBy: { createdAt: 'asc' } } },
        where: { parentId: null },
        orderBy: { createdAt: 'asc' },
      },
      reactions: true,
    },
  });
  if (!thread || thread.salonId !== salon.id) notFound();

  const myReaction = thread.reactions.find(r => r.userId === user.id);
  const likeCount = thread.reactions.length;

  return (
    <div className="max-w-3xl mx-auto">
      <FlashMessage code={searchParams.msg} />
      <Link href={`/salons/${salon.id}/board/${params.categoryId}`} className="text-sm text-indigo-600">← スレッド一覧</Link>
      <article className="card p-6 mt-3">
        <h1 className="text-2xl font-bold">{thread.title}</h1>
        <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">{thread.author.avatarUrl && <img src={thread.author.avatarUrl} alt="" className="w-5 h-5 rounded-full object-cover" />}{thread.author.displayName} · {thread.createdAt.toLocaleString()}</div>
        <div className="mt-4 prose prose-sm" dangerouslySetInnerHTML={{ __html: renderMarkdown(thread.body) }} />
        <div className="mt-4 flex gap-2 items-center">
          <form action={`/api/threads/${thread.id}/react`} method="post">
            <button className="btn-ghost text-sm">{myReaction ? '❤ いいね済' : '♡ いいね'} ({likeCount})</button>
          </form>
          <form action={`/api/threads/${thread.id}/report`} method="post">
            <input type="hidden" name="reason" value="user report" />
            <button className="text-xs text-slate-400 hover:text-red-600">通報</button>
          </form>
        </div>
      </article>

      <section className="mt-6">
        <h2 className="font-bold mb-3">コメント</h2>
        <div className="space-y-3">
          {thread.comments.map(c => (
            <div key={c.id} className="card p-4">
              <div className="prose prose-sm" dangerouslySetInnerHTML={{ __html: renderMarkdown(c.body) }} />
              <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">{c.author.avatarUrl && <img src={c.author.avatarUrl} alt="" className="w-5 h-5 rounded-full object-cover" />}{c.author.displayName} · {c.createdAt.toLocaleString()}</div>
              {c.replies.length > 0 && (
                <div className="ml-6 mt-3 space-y-2 border-l-2 border-slate-100 pl-3">
                  {c.replies.map(r => (
                    <div key={r.id}>
                      <div className="prose prose-sm" dangerouslySetInnerHTML={{ __html: renderMarkdown(r.body) }} />
                      <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">↳ {r.author.avatarUrl && <img src={r.author.avatarUrl} alt="" className="w-5 h-5 rounded-full object-cover" />}{r.author.displayName} · {r.createdAt.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              )}
              <form action={`/api/threads/${thread.id}/comment`} method="post" className="mt-3 flex gap-2">
                <input type="hidden" name="parentId" value={c.id} />
                <input className="input flex-1 text-xs" name="body" placeholder="返信..." required />
                <SubmitButton className="btn-ghost text-xs" loadingText="送信中...">返信</SubmitButton>
              </form>
            </div>
          ))}
        </div>

        <form action={`/api/threads/${thread.id}/comment`} method="post" className="mt-4 card p-4 space-y-2">
          <textarea className="input" name="body" rows={3} placeholder="コメントを書く..." required />
          <SubmitButton className="btn-primary" loadingText="送信中...">コメント</SubmitButton>
        </form>
      </section>
    </div>
  );
}
