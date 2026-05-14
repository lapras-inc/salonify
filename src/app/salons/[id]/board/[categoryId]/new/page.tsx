import { requireSalonMember } from '@/lib/owner-guard';
import { SubmitButton } from '@/components/SubmitButton';

export default async function NewThread({ params }: { params: { id: string; categoryId: string } }) {
  const { salon } = await requireSalonMember(params.id);
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{salon.name} / 新規スレッド</h1>
      <form action={`/api/salons/${salon.id}/threads/create`} method="post" className="card p-6 space-y-3">
        <input type="hidden" name="categoryId" value={params.categoryId} />
        <div><label className="label">タイトル</label><input className="input" name="title" required maxLength={200} /></div>
        <div><label className="label">本文</label><textarea className="input" name="body" rows={8} required /></div>
        <SubmitButton className="btn-primary" loadingText="投稿中...">投稿する</SubmitButton>
      </form>
    </div>
  );
}
