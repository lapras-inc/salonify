import Link from 'next/link';
import { headers } from 'next/headers';
import { prisma } from '@/lib/db';
import { requireSalonOwner } from '@/lib/owner-guard';
import { FlashMessage } from '@/components/FlashMessage';
import { SubmitButton } from '@/components/SubmitButton';
import { ImageUpload } from '@/components/ImageUpload';

export default async function EditSalon({ params, searchParams }: { params: { id: string }; searchParams: { msg?: string } }) {
  const { salon } = await requireSalonOwner(params.id);
  const h = headers();
  const proto = h.get('x-forwarded-proto') ?? 'http';
  const host = h.get('host') ?? 'localhost:3001';
  const origin = `${proto}://${host}`;
  const plans = await prisma.plan.findMany({ where: { salonId: salon.id }, orderBy: { priceJpy: 'asc' } });
  const invites = await prisma.invite.findMany({ where: { salonId: salon.id }, orderBy: { createdAt: 'desc' } });

  return (
    <div className="max-w-2xl mx-auto">
      <FlashMessage code={searchParams.msg} />
      <Link href={`/owner/salons/${salon.id}/dashboard`} className="text-sm text-slate-500 hover:text-indigo-600 mb-2 inline-block">← ダッシュボード</Link>
      <h1 className="text-2xl font-bold mb-6">サロン設定</h1>

      <form action={`/api/owner/salons/${salon.id}/update`} method="post" className="card p-6 space-y-3">
        <div><label className="label">サロン名</label><input className="input" name="name" defaultValue={salon.name} required /></div>
        <div><label className="label">キャッチコピー</label><input className="input" name="tagline" defaultValue={salon.tagline} required /></div>
        <div><label className="label">説明</label><textarea className="input" name="description" rows={6} defaultValue={salon.description} required /></div>
        <ImageUpload name="coverUrl" currentUrl={salon.coverUrl} label="カバー画像" />
        <ImageUpload name="thumbUrl" currentUrl={salon.thumbUrl} label="サムネイル画像" />
        <div>
          <label className="label">カテゴリ</label>
          <select className="input" name="category" defaultValue={salon.category}>
            <option>ビジネス</option><option>趣味</option><option>アート</option>
            <option>テクノロジー</option><option>教育</option><option>その他</option>
          </select>
        </div>
        <div>
          <label className="label">公開設定</label>
          <select className="input" name="visibility" defaultValue={salon.visibility}>
            <option value="public">公開（誰でも参加できる）</option>
            <option value="invite">招待URL限定（URLを知っている人だけ参加できる）</option>
          </select>
        </div>
        <SubmitButton className="btn-primary" loadingText="保存中...">更新</SubmitButton>
      </form>

      {salon.visibility === 'invite' && (
        <div className="card p-6 mt-6">
          <h2 className="font-bold mb-3">招待URL</h2>
          <p className="text-sm text-slate-600 mb-3">このURLを共有した人だけがサロンに参加できます。</p>

          {invites.length > 0 && (
            <div className="space-y-3 mb-4">
              {invites.map(inv => {
                const expired = inv.expiresAt && inv.expiresAt < new Date();
                const exhausted = inv.maxUses > 0 && inv.uses >= inv.maxUses;
                const active = !inv.disabled && !expired && !exhausted;
                const fullUrl = `${origin}/salons/${salon.id}?invite=${inv.code}`;
                const statusText = inv.disabled ? '無効化済み' : expired ? '期限切れ' : exhausted ? '利用上限' : '有効';
                const statusColor = active ? 'text-green-600' : 'text-red-600';
                return (
                  <div key={inv.id} className={`border rounded p-3 text-sm ${active ? 'border-indigo-200 bg-indigo-50' : 'bg-slate-50 opacity-60'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium ${statusColor}`}>{statusText}</span>
                        {inv.label && <span className="text-xs text-slate-500">({inv.label})</span>}
                      </div>
                      {active && (
                        <form action={`/api/owner/salons/${salon.id}/invite/disable`} method="post">
                          <input type="hidden" name="inviteId" value={inv.id} />
                          <button className="text-xs text-red-600 hover:underline">無効にする</button>
                        </form>
                      )}
                    </div>
                    <input className="input text-xs font-mono bg-white select-all mb-1" readOnly value={fullUrl} />
                    <div className="text-xs text-slate-500">
                      利用: {inv.uses}{inv.maxUses > 0 ? ` / ${inv.maxUses}回` : '回 (無制限)'}
                      {inv.expiresAt && ` · 期限: ${inv.expiresAt.toLocaleDateString()}`}
                      {' · '}作成: {inv.createdAt.toLocaleDateString()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <details className="mt-2">
            <summary className="text-sm text-indigo-600 cursor-pointer">招待URLを追加発行する</summary>
            <form action={`/api/owner/salons/${salon.id}/invite/create`} method="post" className="grid grid-cols-3 gap-2 items-end mt-3">
              <div>
                <label className="label">用途メモ (任意)</label>
                <input className="input" name="label" placeholder="例: Twitter用" />
              </div>
              <div>
                <label className="label">利用回数上限 (0=無制限)</label>
                <input className="input" name="maxUses" type="number" min={0} defaultValue={0} />
              </div>
              <div>
                <label className="label">有効期限 日数 (0=無期限)</label>
                <input className="input" name="expDays" type="number" min={0} defaultValue={0} />
              </div>
              <div className="col-span-3"><SubmitButton className="btn-primary" loadingText="発行中...">発行する</SubmitButton></div>
            </form>
          </details>
        </div>
      )}

      <div className="card p-6 mt-6">
        <h2 className="font-bold mb-3">料金プラン</h2>
        {plans.map(p => (
          <form key={p.id} action={`/api/owner/salons/${salon.id}/plan/update`} method="post" className="border-t pt-3 mt-3 grid grid-cols-2 gap-2">
            <input type="hidden" name="planId" value={p.id} />
            <div><label className="label">名前</label><input className="input" name="name" defaultValue={p.name} /></div>
            <div><label className="label">月額</label><input className="input" name="priceJpy" type="number" defaultValue={p.priceJpy} /></div>
            <div><label className="label">トライアル日数</label><input className="input" name="trialDays" type="number" defaultValue={p.trialDays} /></div>
            <div><label className="label">初月割引</label><input className="input" name="introDiscount" type="number" defaultValue={p.introDiscount} /></div>
            <div className="col-span-2"><label className="label">説明</label><input className="input" name="description" defaultValue={p.description ?? ''} /></div>
            <div className="col-span-2 flex gap-2"><SubmitButton className="btn-primary" loadingText="保存中...">保存</SubmitButton></div>
          </form>
        ))}
        <form action={`/api/owner/salons/${salon.id}/plan/create`} method="post" className="border-t pt-3 mt-4 grid grid-cols-2 gap-2">
          <div className="col-span-2 font-medium text-sm">新規プランを追加</div>
          <div><label className="label">プラン名</label><input className="input" name="name" required /></div>
          <div><label className="label">月額 (円)</label><input className="input" name="priceJpy" type="number" min={0} required /></div>
          <div><label className="label">トライアル日数</label><input className="input" name="trialDays" type="number" min={0} max={30} defaultValue={0} /></div>
          <div><label className="label">初月割引 (円)</label><input className="input" name="introDiscount" type="number" min={0} defaultValue={0} /></div>
          <div className="col-span-2"><label className="label">説明</label><input className="input" name="description" /></div>
          <div className="col-span-2"><SubmitButton className="btn-ghost" loadingText="追加中...">+ 追加</SubmitButton></div>
        </form>
      </div>
    </div>
  );
}
