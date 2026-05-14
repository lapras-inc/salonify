import Link from 'next/link';
import { headers } from 'next/headers';
import { prisma } from '@/lib/db';
import { requireSalonOwner } from '@/lib/owner-guard';
import { FlashMessage } from '@/components/FlashMessage';
import { SubmitButton } from '@/components/SubmitButton';

export default async function OwnerDashboard({ params, searchParams }: { params: { id: string }; searchParams: { msg?: string } }) {
  const { salon } = await requireSalonOwner(params.id);
  const plans = await prisma.plan.findMany({
    where: { salonId: salon.id },
    include: { _count: { select: { memberships: { where: { status: 'active' } } } } },
  });
  const monthlyRevenue = plans.reduce((s, p) => s + p.priceJpy * p._count.memberships, 0);
  const posts = await prisma.post.count({ where: { salonId: salon.id } });
  const threads = await prisma.thread.count({ where: { salonId: salon.id } });

  const h = await headers();
  const proto = h.get('x-forwarded-proto') ?? 'http';
  const host = h.get('host') ?? 'localhost:3001';
  const origin = `${proto}://${host}`;
  const invites = salon.visibility === 'invite'
    ? await prisma.invite.findMany({ where: { salonId: salon.id }, orderBy: { createdAt: 'desc' } })
    : [];

  return (
    <div>
      <FlashMessage code={searchParams.msg} />
      {salon.coverUrl && <img src={salon.coverUrl} alt="" className="w-full aspect-[4/1] object-cover rounded-lg mb-4" />}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{salon.name}</h1>
          <p className="text-sm text-slate-500">運営ダッシュボード</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/salons/${salon.id}`} className="btn-ghost">LP</Link>
          <Link href={`/owner/salons/${salon.id}/edit`} className="btn-ghost">設定</Link>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <Stat label="月次売上見込み" value={`¥${monthlyRevenue.toLocaleString()}`} />
        <Stat label="アクティブ会員" value={String(plans.reduce((s, p) => s + p._count.memberships, 0))} />
        <Stat label="投稿数" value={String(posts)} />
        <Stat label="スレッド数" value={String(threads)} />
      </div>

      <div className="card p-5 mb-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-bold">プラン別会員数</h2>
          <Link href={`/owner/salons/${salon.id}/edit`} className="text-sm text-indigo-600">プラン編集</Link>
        </div>
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500">
            <tr><th className="py-1">プラン</th><th>月額</th><th>会員数</th><th>月次売上</th></tr>
          </thead>
          <tbody>
            {plans.map(p => (
              <tr key={p.id} className="border-t">
                <td className="py-2">{p.name}</td>
                <td>¥{p.priceJpy.toLocaleString()}</td>
                <td>{p._count.memberships}</td>
                <td>¥{(p.priceJpy * p._count.memberships).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {salon.visibility === 'invite' && (
        <div className="card p-5 mb-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-bold">招待URL</h2>
            <Link href={`/owner/salons/${salon.id}/edit`} className="text-sm text-indigo-600">詳細設定</Link>
          </div>
          {(() => {
            const active = invites.filter(inv => {
              const expired = inv.expiresAt && inv.expiresAt < new Date();
              const exhausted = inv.maxUses > 0 && inv.uses >= inv.maxUses;
              return !inv.disabled && !expired && !exhausted;
            });
            return active.length > 0 ? (
              <div className="space-y-2 mb-3">
                {active.map(inv => {
                  const fullUrl = `${origin}/salons/${salon.id}?invite=${inv.code}`;
                  return (
                    <div key={inv.id} className="border border-indigo-200 bg-indigo-50 rounded p-2 text-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-green-600">有効</span>
                        {inv.label && <span className="text-xs text-slate-500">({inv.label})</span>}
                        <span className="text-xs text-slate-500">利用: {inv.uses}{inv.maxUses > 0 ? ` / ${inv.maxUses}回` : '回'}</span>
                      </div>
                      <input className="input text-xs font-mono bg-white select-all" readOnly value={fullUrl} />
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-500 mb-3">有効な招待URLがありません。発行してメンバーを招待しましょう。</p>
            );
          })()}
          <form action={`/api/owner/salons/${salon.id}/invite/create`} method="post" className="flex gap-2 items-end">
            <input type="hidden" name="redirect" value={`/owner/salons/${salon.id}/dashboard`} />
            <div className="flex-1">
              <label className="label">用途メモ (任意)</label>
              <input className="input" name="label" placeholder="例: Twitter用" />
            </div>
            <SubmitButton className="btn-primary" loadingText="発行中...">招待URLを発行</SubmitButton>
          </form>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <Link href={`/owner/salons/${salon.id}/members`} className="card p-5 hover:shadow">会員管理 →</Link>
        <Link href={`/owner/salons/${salon.id}/posts`} className="card p-5 hover:shadow">投稿管理 →</Link>
        <Link href={`/owner/salons/${salon.id}/revenue`} className="card p-5 hover:shadow">売上・振込 →</Link>
        <Link href={`/salons/${salon.id}/home`} className="card p-5 hover:shadow">サロンホームを見る →</Link>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}
