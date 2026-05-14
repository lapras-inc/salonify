import Link from 'next/link';
import { prisma } from '@/lib/db';
import { requireSalonOwner } from '@/lib/owner-guard';
import { FlashMessage } from '@/components/FlashMessage';
import { SubmitButton } from '@/components/SubmitButton';

export default async function Members({ params, searchParams }: { params: { id: string }; searchParams: { msg?: string } }) {
  const { salon } = await requireSalonOwner(params.id);
  const members = await prisma.membership.findMany({
    where: { salonId: salon.id },
    include: { user: true, plan: true, invoices: { orderBy: { createdAt: 'desc' }, take: 1 } },
    orderBy: { joinedAt: 'desc' },
  });
  const plans = await prisma.plan.findMany({ where: { salonId: salon.id } });

  return (
    <div>
      <FlashMessage code={searchParams.msg} />
      <Link href={`/owner/salons/${salon.id}/dashboard`} className="text-sm text-slate-500 hover:text-indigo-600 mb-2 inline-block">← ダッシュボード</Link>
      <h1 className="text-2xl font-bold mb-6">{salon.name} / 会員管理</h1>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="p-3">会員</th><th>入会日</th><th>プラン</th><th>ステータス</th><th>直近決済</th><th></th>
            </tr>
          </thead>
          <tbody>
            {members.map(m => (
              <tr key={m.id} className="border-t">
                <td className="p-3">{m.user.displayName}<div className="text-xs text-slate-500">{m.user.email}</div></td>
                <td>{m.joinedAt.toLocaleDateString()}</td>
                <td>
                  <form action={`/api/owner/salons/${salon.id}/members/change-plan`} method="post" className="flex gap-1">
                    <input type="hidden" name="membershipId" value={m.id} />
                    <select name="planId" defaultValue={m.planId} className="text-xs border rounded px-1">
                      {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <SubmitButton className="text-xs text-indigo-600" loadingText="変更中...">変更</SubmitButton>
                  </form>
                </td>
                <td>
                  <span className={
                    m.status === 'active' ? 'text-green-600' :
                    m.status === 'past_due' ? 'text-orange-600' :
                    'text-slate-500'
                  }>{m.status}</span>
                </td>
                <td className="text-xs">
                  {m.invoices[0] ? (
                    <>
                      ¥{m.invoices[0].amountJpy.toLocaleString()} / <span className={m.invoices[0].status === 'paid' ? 'text-green-600' : 'text-red-600'}>{m.invoices[0].status}</span>
                    </>
                  ) : '—'}
                </td>
                <td className="p-3">
                  <form action={`/api/owner/salons/${salon.id}/members/remove`} method="post">
                    <input type="hidden" name="membershipId" value={m.id} />
                    <SubmitButton confirmMessage={`${m.user.displayName} をこのサロンから退会させますか？`} className="text-xs text-red-600" loadingText="処理中...">退会させる</SubmitButton>
                  </form>
                </td>
              </tr>
            ))}
            {members.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-slate-500">会員がいません</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
