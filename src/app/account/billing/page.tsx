import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';
import { stripe } from '@/lib/stripe';
import { FlashMessage } from '@/components/FlashMessage';
import { SubmitButton } from '@/components/SubmitButton';

export default async function Billing({ searchParams }: { searchParams: { msg?: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const memberships = await prisma.membership.findMany({
    where: { userId: user.id },
    include: { salon: true, plan: true, invoices: { orderBy: { createdAt: 'desc' } } },
  });

  // Fetch Stripe invoices if user has a Stripe customer
  let stripeInvoices: { id: string; date: number; amount: number; status: string | null; url: string | null; pdf: string | null }[] = [];
  if (user.stripeCustomerId && process.env.STRIPE_SECRET_KEY) {
    try {
      const invoices = await stripe.invoices.list({ customer: user.stripeCustomerId, limit: 50 });
      stripeInvoices = invoices.data.map(inv => ({
        id: inv.id,
        date: inv.created,
        amount: inv.amount_paid ?? 0,
        status: inv.status,
        url: inv.hosted_invoice_url ?? null,
        pdf: inv.invoice_pdf ?? null,
      }));
    } catch {
      // Stripe not available, show DB invoices only
    }
  }

  return (
    <div>
      <FlashMessage code={searchParams.msg} />
      <h1 className="text-2xl font-bold mb-6">支払い・課金管理</h1>
      {memberships.length === 0 ? (
        <p className="text-slate-500 text-sm">契約中のサロンはありません</p>
      ) : memberships.map(m => (
        <div key={m.id} className="card p-5 mb-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="font-bold">{m.salon.name}</div>
              <div className="text-sm text-slate-600">{m.plan.name} ¥{m.plan.priceJpy.toLocaleString()}/月 · {m.status === 'active' ? `次回請求: ${m.nextBillAt.toLocaleDateString()}` : m.status}</div>
            </div>
            {m.status === 'active' && (
              <form action="/api/membership/cancel" method="post">
                <input type="hidden" name="membershipId" value={m.id} />
                <SubmitButton confirmMessage={`${m.salon.name} を解約しますか？`} className="btn-ghost text-red-600" loadingText="解約中...">解約</SubmitButton>
              </form>
            )}
          </div>
        </div>
      ))}

      <div className="card p-5 mt-6">
        <h2 className="font-bold mb-3">請求書・領収書</h2>
        {stripeInvoices.length === 0 ? (
          <p className="text-slate-500 text-sm">請求履歴はまだありません</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500">
              <tr><th className="py-1">日付</th><th>金額</th><th>ステータス</th><th></th></tr>
            </thead>
            <tbody>
              {stripeInvoices.map(inv => (
                <tr key={inv.id} className="border-t">
                  <td className="py-2">{new Date(inv.date * 1000).toLocaleDateString()}</td>
                  <td>¥{inv.amount.toLocaleString()}</td>
                  <td><span className={inv.status === 'paid' ? 'text-green-600' : 'text-slate-500'}>{inv.status === 'paid' ? '支払済' : inv.status === 'open' ? '未払い' : inv.status ?? ''}</span></td>
                  <td className="text-right space-x-2">
                    {inv.url && <a href={inv.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline text-xs">詳細</a>}
                    {inv.pdf && <a href={inv.pdf} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline text-xs">PDF</a>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
