import Link from 'next/link';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-guard';
import { FlashMessage } from '@/components/FlashMessage';
import { SubmitButton } from '@/components/SubmitButton';

const PER_PAGE = 20;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string; msg?: string };
}) {
  await requireAdmin();

  const q = searchParams.q ?? '';
  const page = Math.max(1, Number(searchParams.page) || 1);

  const where = q ? { email: { contains: q, mode: 'insensitive' as const } } : {};
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
    prisma.user.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">ユーザー管理</h1>
        <Link href="/admin" className="text-sm text-indigo-600 hover:underline">← ダッシュボード</Link>
      </div>
      <FlashMessage code={searchParams.msg} />

      <form method="get" className="mb-6 flex gap-2">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="メールアドレスで検索"
          className="input flex-1"
        />
        <button type="submit" className="btn-primary">検索</button>
      </form>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="p-3">メール</th>
              <th className="p-3">表示名</th>
              <th className="p-3">登録日</th>
              <th className="p-3">認証済</th>
              <th className="p-3">管理者</th>
              <th className="p-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b">
                <td className="p-3">{user.email}</td>
                <td className="p-3">{user.displayName}</td>
                <td className="p-3">{user.createdAt.toLocaleDateString('ja-JP')}</td>
                <td className="p-3">{user.emailVerified ? '✓' : '—'}</td>
                <td className="p-3">{user.isAdmin ? '✓' : '—'}</td>
                <td className="p-3 flex gap-2">
                  <form action={`/api/admin/users/${user.id}/toggle-admin`} method="post">
                    <SubmitButton className="btn-primary text-xs" loadingText="処理中...">
                      {user.isAdmin ? '管理者解除' : '管理者にする'}
                    </SubmitButton>
                  </form>
                  {user.passwordHash !== 'suspended' && (
                    <form action={`/api/admin/users/${user.id}/suspend`} method="post">
                      <SubmitButton
                        className="btn-danger text-xs"
                        loadingText="処理中..."
                        confirmMessage="このユーザーを停止しますか？"
                      >
                        停止
                      </SubmitButton>
                    </form>
                  )}
                  {user.passwordHash === 'suspended' && (
                    <span className="text-xs text-red-500 py-1">停止済</span>
                  )}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-slate-500">ユーザーが見つかりません</td>
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
              href={`/admin/users?q=${encodeURIComponent(q)}&page=${p}`}
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
