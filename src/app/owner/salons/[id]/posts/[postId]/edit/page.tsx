import Link from 'next/link';
import { prisma } from '@/lib/db';
import { requireSalonOwner } from '@/lib/owner-guard';
import { SubmitButton } from '@/components/SubmitButton';
import { MarkdownEditor } from '@/components/MarkdownEditor';
import { notFound } from 'next/navigation';

export default async function EditPost({ params }: { params: { id: string; postId: string } }) {
  const { salon } = await requireSalonOwner(params.id);
  const post = await prisma.post.findUnique({ where: { id: params.postId } });
  if (!post || post.salonId !== salon.id) return notFound();
  const plans = await prisma.plan.findMany({ where: { salonId: salon.id } });

  return (
    <div className="max-w-3xl mx-auto">
      <Link href={`/owner/salons/${salon.id}/posts`} className="text-sm text-slate-500 hover:text-indigo-600 mb-2 inline-block">← 投稿管理</Link>
      <h1 className="text-2xl font-bold mb-6">{salon.name} / 投稿を編集</h1>
      <form action={`/api/owner/salons/${salon.id}/posts/${post.id}/update`} method="post" className="card p-6 space-y-3">
        <div><label className="label">タイトル</label><input className="input" name="title" required defaultValue={post.title} /></div>
        <MarkdownEditor name="bodyHtml" defaultValue={post.bodyMarkdown ?? post.bodyHtml ?? ''} />
        <div><label className="label">YouTube動画URL (任意)</label><input className="input" name="videoUrl" placeholder="https://www.youtube.com/watch?v=..." defaultValue={post.videoUrl ?? ''} /></div>
        <div>
          <label className="label">公開範囲</label>
          <select className="input" name="visibility" defaultValue={post.visibility}>
            <option value="all">全会員</option>
            {plans.map(p => <option key={p.id} value={`plan:${p.id}`}>{p.name} 限定</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" name="pinned" id="pinned" value="1" defaultChecked={post.pinned} />
          <label htmlFor="pinned" className="text-sm">固定表示</label>
        </div>
        <div className="flex gap-2">
          <SubmitButton className="btn-primary" loadingText="更新中...">公開する</SubmitButton>
          <SubmitButton className="btn-ghost" loadingText="保存中..." name="draft" value="1">下書き保存</SubmitButton>
        </div>
      </form>
    </div>
  );
}
