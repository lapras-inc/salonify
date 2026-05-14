import Link from 'next/link';
import { prisma } from '@/lib/db';
import { requireSalonOwner } from '@/lib/owner-guard';
import { platformFee, ownerNet, PLATFORM_FEE_RATE } from '@/lib/payment';
import { FlashMessage } from '@/components/FlashMessage';
import { SubmitButton } from '@/components/SubmitButton';

const MIN_PAYOUT = 3000;

export default async function Revenue({ params, searchParams }: { params: { id: string }; searchParams: { msg?: string } }) {
  const { salon } = await requireSalonOwner(params.id);
  const invoices = await prisma.invoice.findMany({
    where: { membership: { salonId: salon.id }, status: 'paid' },
    orderBy: { createdAt: 'desc' },
  });
  const gross = invoices.reduce((s, i) => s + i.amountJpy, 0);
  const fee = invoices.reduce((s, i) => s + platformFee(i.amountJpy), 0);
  const net = invoices.reduce((s, i) => s + ownerNet(i.amountJpy), 0);

  return (
    <div>
      <FlashMessage code={searchParams.msg} />
      <Link href={`/owner/salons/${salon.id}/dashboard`} className="text-sm text-slate-500 hover:text-indigo-600 mb-2 inline-block">← ダッシュボード</Link>
      <h1 className="text-2xl font-bold mb-6">{salon.name} / 売上・振込</h1>
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="card p-5"><div className="text-xs text-slate-500">累計売上 (総額)</div><div className="text-2xl font-bold">¥{gross.toLocaleString()}</div></div>
        <div className="card p-5"><div className="text-xs text-slate-500">プラットフォーム手数料 ({(PLATFORM_FEE_RATE*100)}%)</div><div className="text-2xl font-bold text-slate-500">-¥{fee.toLocaleString()}</div></div>
        <div className="card p-5"><div className="text-xs text-slate-500">振込可能額</div><div className="text-2xl font-bold text-indigo-600">¥{net.toLocaleString()}</div></div>
      </div>

      <div className="card p-5 mb-6">
        <h2 className="font-bold mb-3">振込申請</h2>
        <p className="text-sm text-slate-600 mb-3">最低振込額 ¥{MIN_PAYOUT.toLocaleString()} · 月次処理</p>
        <form action={`/api/owner/salons/${salon.id}/payout`} method="post">
          {net < MIN_PAYOUT ? (
            <button className="btn-primary" disabled>¥{MIN_PAYOUT.toLocaleString()}未満</button>
          ) : (
            <SubmitButton className="btn-primary" loadingText="申請中...">振込申請する</SubmitButton>
          )}
        </form>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500"><tr><th className="p-3">日付</th><th>金額</th><th>手数料</th><th>振込額</th></tr></thead>
          <tbody>
            {invoices.map(i => (
              <tr key={i.id} className="border-t">
                <td className="p-3">{i.createdAt.toLocaleDateString()}</td>
                <td>¥{i.amountJpy.toLocaleString()}</td>
                <td className="text-slate-500">-¥{platformFee(i.amountJpy).toLocaleString()}</td>
                <td className="text-indigo-600">¥{ownerNet(i.amountJpy).toLocaleString()}</td>
              </tr>
            ))}
            {invoices.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-slate-500">まだ売上がありません</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
