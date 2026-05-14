import Link from 'next/link';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-guard';
import { FlashMessage } from '@/components/FlashMessage';

export default async function AdminDashboard({ searchParams }: { searchParams: { msg?: string } }) {
  await requireAdmin();

  const [userCount, salonCount, activeMembershipCount, revenueResult] = await Promise.all([
    prisma.user.count(),
    prisma.salon.count(),
    prisma.membership.count({ where: { status: 'active' } }),
    prisma.invoice.aggregate({ where: { status: 'paid' }, _sum: { amountJpy: true } }),
  ]);

  const totalRevenue = revenueResult._sum.amountJpy ?? 0;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">管理ダッシュボード</h1>
      <FlashMessage code={searchParams.msg} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="card p-4">
          <div className="text-sm text-slate-500">ユーザー数</div>
          <div className="text-2xl font-bold">{userCount.toLocaleString()}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-slate-500">サロン数</div>
          <div className="text-2xl font-bold">{salonCount.toLocaleString()}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-slate-500">有効メンバーシップ</div>
          <div className="text-2xl font-bold">{activeMembershipCount.toLocaleString()}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-slate-500">総売上</div>
          <div className="text-2xl font-bold">¥{totalRevenue.toLocaleString()}</div>
        </div>
      </div>

      <div className="flex gap-4">
        <Link href="/admin/users" className="btn-primary">ユーザー管理</Link>
        <Link href="/admin/salons" className="btn-primary">サロン管理</Link>
        <Link href="/admin/reports" className="btn-primary">通報管理</Link>
      </div>
    </div>
  );
}
