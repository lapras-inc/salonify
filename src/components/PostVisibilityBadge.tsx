import type { Plan } from '@prisma/client';

export function canViewPost(visibility: string, currentPlanId: string | null, isOwner: boolean): boolean {
  if (isOwner) return true;
  if (visibility === 'all') return true;
  if (visibility.startsWith('plan:')) {
    return currentPlanId === visibility.slice(5);
  }
  return true;
}

export function PostVisibilityBadge({
  visibility,
  plans,
  canView,
}: {
  visibility: string;
  plans: Pick<Plan, 'id' | 'name'>[];
  canView: boolean;
}) {
  if (visibility === 'all') {
    return <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">全会員</span>;
  }
  if (visibility.startsWith('plan:')) {
    const id = visibility.slice(5);
    const name = plans.find(p => p.id === id)?.name ?? 'プラン限定';
    return (
      <span className={`text-[10px] px-1.5 py-0.5 rounded ${canView ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'}`}>
        {canView ? `${name}限定` : `🔒 ${name}限定`}
      </span>
    );
  }
  return null;
}
