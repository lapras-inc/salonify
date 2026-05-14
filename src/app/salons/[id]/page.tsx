import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';
import { FlashMessage } from '@/components/FlashMessage';
import { renderMarkdown } from '@/lib/sanitize';
import { SalonCoverPlaceholder } from '@/components/SalonCoverPlaceholder';

export default async function SalonLP({ params, searchParams }: { params: { id: string }; searchParams: { invite?: string; msg?: string } }) {
  const salon = await prisma.salon.findUnique({
    where: { id: params.id },
    include: {
      owner: true,
      plans: { orderBy: { priceJpy: 'asc' } },
      _count: { select: { memberships: { where: { status: 'active' } } } },
    },
  });
  if (!salon) notFound();
  const salonId = salon.id;

  // For private salons, only owner/members can view LP
  const user = await getCurrentUser();
  const membershipRecord = user ? await prisma.membership.findUnique({
    where: { userId_salonId: { userId: user.id, salonId: salonId } },
  }) : null;
  const membership = membershipRecord && membershipRecord.status === 'active' ? membershipRecord : null;
  const isOwner = user?.id === salon.ownerId;

  // private visibility removed — kept as fallback in case old data exists
  if (salon.visibility === 'private' && !isOwner && !membership) {
    return (
      <div className="max-w-md mx-auto card p-8 text-center">
        <h1 className="text-xl font-bold">招待URL限定サロン</h1>
        <p className="text-slate-600 mt-2 text-sm">このサロンはオーナーからの招待URLが必要です。</p>
      </div>
    );
  }

  // Validate invite code for invite-only salons
  const inviteCode = searchParams.invite ?? null;
  let validInvite = false;
  if (salon.visibility === 'invite' && inviteCode) {
    const inv = await prisma.invite.findUnique({ where: { code: inviteCode } });
    if (inv && inv.salonId === salonId) {
      const expired = inv.expiresAt && inv.expiresAt < new Date();
      const exhausted = inv.maxUses > 0 && inv.uses >= inv.maxUses;
      if (!inv.disabled && !expired && !exhausted) validInvite = true;
    }
  }
  const canJoin = salon.visibility !== 'invite' || isOwner || membership || validInvite;

  function joinUrl(planId: string) {
    const base = `/salons/${salonId}/join?plan=${planId}`;
    return inviteCode ? `${base}&invite=${inviteCode}` : base;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <FlashMessage code={searchParams.msg} />
      <div className="card overflow-hidden">
        {salon.coverUrl ? (
          <img src={salon.coverUrl} alt="" className="w-full aspect-[16/9] object-cover" />
        ) : (
          <SalonCoverPlaceholder title={salon.name} category={salon.category ?? undefined} />
        )}
        <div className="p-8">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs text-indigo-600">{salon.category}</span>
          {salon.visibility !== 'public' && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">招待URL限定</span>}
        </div>
        <h1 className="text-3xl font-bold">{salon.name}</h1>
        <p className="text-slate-600 mt-2">{salon.tagline}</p>
        <div className="mt-4 text-sm text-slate-500">会員 {salon._count.memberships}人</div>
        <div className="prose prose-sm mt-6" dangerouslySetInnerHTML={{ __html: renderMarkdown(salon.description) }} />
        </div>
      </div>

      <div className="card p-6 mt-6">
        <h2 className="font-bold text-lg mb-3">オーナー</h2>
        <div className="flex items-center gap-4">
          {salon.owner.avatarUrl ? (
            <img src={salon.owner.avatarUrl} alt="" className="w-14 h-14 rounded-full object-cover" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg">{salon.owner.displayName.charAt(0)}</div>
          )}
          <div>
            <div className="font-bold">{salon.owner.displayName}</div>
            {salon.owner.bio && <p className="text-sm text-slate-600 mt-1">{salon.owner.bio}</p>}
          </div>
        </div>
      </div>

      <div className="card p-6 mt-6">
        <h2 className="font-bold text-lg mb-3">料金プラン</h2>
        {salon.visibility === 'invite' && !canJoin && (
          <div className="bg-amber-50 border border-amber-200 rounded p-3 text-sm text-amber-800 mb-4">
            このサロンは招待制です。オーナーから招待リンクを受け取ってください。
          </div>
        )}
        <div className="grid md:grid-cols-2 gap-3">
          {salon.plans.map(p => (
            <div key={p.id} className="border border-slate-200 rounded-lg p-4">
              <div className="font-bold">{p.name}</div>
              <div className="text-2xl font-bold mt-1">¥{p.priceJpy.toLocaleString()}<span className="text-sm font-normal text-slate-500">/月</span></div>
              {p.trialDays > 0 && <div className="text-xs text-indigo-600 mt-1">{p.trialDays}日間無料トライアル</div>}
              {p.introDiscount > 0 && <div className="text-xs text-indigo-600">初月 ¥{p.introDiscount.toLocaleString()} 割引</div>}
              {p.description && <div className="text-xs text-slate-600 mt-2">{p.description}</div>}
              {isOwner ? (
                <div className="mt-3 text-xs text-slate-500">オーナーとして運営中</div>
              ) : membership && membership.planId === p.id ? (
                <div className="mt-3 text-xs text-green-600">✓ 現在のプラン</div>
              ) : membership ? (
                <Link href={joinUrl(p.id)} className="btn-ghost w-full mt-3">このプランに変更</Link>
              ) : canJoin ? (
                <Link href={joinUrl(p.id)} className="btn-primary w-full mt-3">このプランで入会</Link>
              ) : (
                <div className="btn w-full mt-3 bg-slate-100 text-slate-400 cursor-not-allowed">招待が必要です</div>
              )}
            </div>
          ))}
          {salon.plans.length === 0 && <p className="text-slate-500 text-sm">プランが未設定です</p>}
        </div>
      </div>

      {membership && (
        <div className="card p-6 mt-6 text-center">
          <p className="text-sm text-slate-600 mb-3">このサロンに参加しています</p>
          <Link href={`/salons/${salonId}/home`} className="btn-primary">サロンのメインページを表示</Link>
        </div>
      )}
      {isOwner && (
        <div className="mt-6 text-center">
          <Link href={`/owner/salons/${salonId}/dashboard`} className="btn-ghost">運営ダッシュボード</Link>
        </div>
      )}
    </div>
  );
}
