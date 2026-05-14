import Link from 'next/link';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-guard';
import { FlashMessage } from '@/components/FlashMessage';
import { SubmitButton } from '@/components/SubmitButton';

const PER_PAGE = 20;

export default async function AdminSalonsPage({
  searchParams,
}: {
  searchParams: { page?: string; msg?: string };
}) {
  await requireAdmin();

  const page = Math.max(1, Number(searchParams.page) || 1);

  const [salons, total] = await Promise.all([
    prisma.salon.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: {
        owner: { select: { email: true } },
        _count: { select: { memberships: true } },
      },
    }),
    prisma.salon.count(),
  ]);

  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">サロン管理</h1>
        <Link href="/admin" className="text-sm text-indigo-600 hover:underline">← ダッシュボード</Link>
      </div>
      <FlashMessage code={searchParams.msg} />

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="p-3">サロン名</th>
              <th className="p-3">オーナー</th>
              <th className="p-3">カテゴリ</th>
              <th className="p-3">公開</th>
              <th className="p-3">会員数</th>
              <th className="p-3">作成日</th>
              <th className="p-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {salons.map((salon) => (
              <tr key={salon.id} className="border-b">
                <td className="p-3">
                  <Link href={`/salons/${salon.id}`} className="text-indigo-600 hover:underline">
                    {salon.name}
                  </Link>
                </td>
                <td className="p-3">{salon.owner.email}</td>
                <td className="p-3">{salon.category}</td>
                <td className="p-3">{salon.visibility}</td>
                <td className="p-3">{salon._count.memberships}</td>
                <td className="p-3">{salon.createdAt.toLocaleDateString('ja-JP')}</td>
                <td className="p-3">
                  <form action={`/api/admin/salons/${salon.id}/delete`} method="post">
                    <SubmitButton
                      className="btn-danger text-xs"
                      loadingText="処理中..."
                      confirmMessage="このサロンを削除しますか？この操作は取り消せません。"
                    >
                      削除
                    </SubmitButton>
                  </form>
                </td>
              </tr>
            ))}
            {salons.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-slate-500">サロンがありません</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/salons?page=${p}`}
              className={`px-3 py-1 rounded text-sm ${p === page ? 'bg-indigo-600 text-white' : 'bg-slate-100 hover:bg-slate-200'}`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
