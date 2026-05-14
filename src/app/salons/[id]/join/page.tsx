import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { SubmitButton } from '@/components/SubmitButton';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';

export default async function JoinPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { plan?: string; error?: string; invite?: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/salons/${params.id}/join`);

  const salon = await prisma.salon.findUnique({ where: { id: params.id }, include: { plans: true } });
  if (!salon) notFound();

  // Invite-only guard
  const inviteCode = searchParams.invite ?? '';
  if (salon.visibility === 'invite') {
    if (!inviteCode) redirect(`/salons/${params.id}`);
    const inv = await prisma.invite.findUnique({ where: { code: inviteCode } });
    const expired = inv?.expiresAt && inv.expiresAt < new Date();
    const exhausted = inv && inv.maxUses > 0 && inv.uses >= inv.maxUses;
    if (!inv || inv.salonId !== params.id || inv.disabled || expired || exhausted) {
      redirect(`/salons/${params.id}`);
    }
  }

  const plan = salon.plans.find(p => p.id === searchParams.plan) ?? salon.plans[0];
  if (!plan) return <p className="text-slate-500">プランが設定されていません</p>;

  const firstMonth = Math.max(0, plan.priceJpy - plan.introDiscount);

  return (
    <div className="max-w-md mx-auto card p-6">
      <Link href={`/salons/${params.id}`} className="text-sm text-slate-500 hover:text-indigo-600 mb-2 inline-block">← サロンページ</Link>
      <h1 className="text-xl font-bold mb-2">入会手続き</h1>
      <div className="text-sm text-slate-600 mb-4">{salon.name} / {plan.name}</div>

      <div className="border border-slate-200 rounded p-3 text-sm mb-4 space-y-1">
        <div className="flex justify-between"><span>月額</span><b>¥{plan.priceJpy.toLocaleString()}</b></div>
        {plan.introDiscount > 0 && <div className="flex justify-between text-indigo-600"><span>初月割引</span>-¥{plan.introDiscount.toLocaleString()}</div>}
        {plan.trialDays > 0 && <div className="flex justify-between text-indigo-600"><span>トライアル</span>{plan.trialDays}日間無料</div>}
        <hr className="my-1" />
        <div className="flex justify-between"><span>初回請求額</span><b>¥{(plan.trialDays > 0 ? 0 : firstMonth).toLocaleString()}</b></div>
      </div>

      {searchParams.error && <p className="text-sm text-red-600 mb-3">{searchParams.error}</p>}

      <form action="/api/join" method="post" className="space-y-3">
        <input type="hidden" name="salonId" value={salon.id} />
        <input type="hidden" name="planId" value={plan.id} />
        {inviteCode && <input type="hidden" name="invite" value={inviteCode} />}
        <SubmitButton className="btn-primary w-full" loadingText="処理中...">入会する</SubmitButton>
      </form>
    </div>
  );
}
