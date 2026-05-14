import Link from 'next/link';
import { prisma } from '@/lib/db';
import { requireSalonOwner } from '@/lib/owner-guard';
import { FlashMessage } from '@/components/FlashMessage';
import { SubmitButton } from '@/components/SubmitButton';

export default async function OwnerPosts({ params, searchParams }: { params: { id: string }; searchParams: { msg?: string } }) {
  const { salon } = await requireSalonOwner(params.id);
  const posts = await prisma.post.findMany({
    where: { salonId: salon.id },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div>
      <FlashMessage code={searchParams.msg} />
      <Link href={`/owner/salons/${salon.id}/dashboard`} className="text-sm text-slate-500 hover:text-indigo-600 mb-2 inline-block">← ダッシュボード</Link>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{salon.name} / 投稿管理</h1>
        <Link href={`/owner/salons/${salon.id}/posts/new`} className="btn-primary">新規投稿</Link>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="p-3">タイトル</th><th>作成日</th><th>状態</th><th>公開範囲</th><th></th>
            </tr>
          </thead>
          <tbody>
            {posts.map(p => (
              <tr key={p.id} className={`border-t ${p.draft ? 'bg-amber-50' : ''}`}>
                <td className="p-3">
                  {p.pinned && <span className="text-xs text-indigo-600 mr-1">📌</span>}
                  {p.title}
                </td>
                <td>{p.createdAt.toLocaleDateString()}</td>
                <td>
                  {p.draft ? (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">下書き</span>
                  ) : (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-700">公開中</span>
                  )}
                </td>
                <td className="text-xs text-slate-600">{p.visibility === 'all' ? '全会員' : 'プラン限定'}</td>
                <td className="p-3">
                  <div className="flex gap-2 items-center">
                    <Link href={`/salons/${salon.id}/posts/${p.id}`} className="text-xs text-slate-600 hover:text-indigo-600">表示</Link>
                    <Link href={`/owner/salons/${salon.id}/posts/${p.id}/edit`} className="text-xs text-indigo-600">編集</Link>
                    <form action={`/api/owner/salons/${salon.id}/posts/${p.id}/delete`} method="post">
                      <SubmitButton confirmMessage="この投稿を削除しますか？" className="text-xs text-red-600" loadingText="削除中...">削除</SubmitButton>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {posts.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-slate-500">投稿がありません</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
