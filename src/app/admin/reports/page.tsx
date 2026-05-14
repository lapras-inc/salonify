import Link from 'next/link';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-guard';
import { FlashMessage } from '@/components/FlashMessage';
import { SubmitButton } from '@/components/SubmitButton';

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: { msg?: string };
}) {
  await requireAdmin();

  const reports = await prisma.report.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      reporter: { select: { displayName: true } },
      thread: { select: { id: true, title: true, salonId: true } },
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">通報管理</h1>
        <Link href="/admin" className="text-sm text-indigo-600 hover:underline">← ダッシュボード</Link>
      </div>
      <FlashMessage code={searchParams.msg} />

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="p-3">スレッド</th>
              <th className="p-3">通報者</th>
              <th className="p-3">理由</th>
              <th className="p-3">状態</th>
              <th className="p-3">日時</th>
              <th className="p-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr key={report.id} className="border-b">
                <td className="p-3">
                  {report.thread ? (
                    <Link
                      href={`/salons/${report.thread.salonId}/board/all/${report.thread.id}`}
                      className="text-indigo-600 hover:underline"
                    >
                      {report.thread.title}
                    </Link>
                  ) : (
                    <span className="text-slate-400">削除済</span>
                  )}
                </td>
                <td className="p-3">{report.reporter.displayName}</td>
                <td className="p-3">{report.reason}</td>
                <td className="p-3">
                  {report.resolved ? (
                    <span className="text-green-600">解決済</span>
                  ) : (
                    <span className="text-red-600">未解決</span>
                  )}
                </td>
                <td className="p-3">{report.createdAt.toLocaleDateString('ja-JP')}</td>
                <td className="p-3">
                  {!report.resolved && (
                    <form action={`/api/admin/reports/${report.id}/resolve`} method="post">
                      <SubmitButton className="btn-primary text-xs" loadingText="処理中...">
                        解決済にする
                      </SubmitButton>
                    </form>
                  )}
                </td>
              </tr>
            ))}
            {reports.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-slate-500">通報がありません</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
