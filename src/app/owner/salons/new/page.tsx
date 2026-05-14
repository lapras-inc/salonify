import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/session';
import { SubmitButton } from '@/components/SubmitButton';
import { ImageUpload } from '@/components/ImageUpload';

export default async function NewSalon() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">サロンを新規開設</h1>
      <form action="/api/owner/salons/create" method="post" className="card p-6 space-y-4">
        <div><label className="label">サロン名</label><input className="input" name="name" required maxLength={80} /></div>
        <div><label className="label">キャッチコピー</label><input className="input" name="tagline" required maxLength={140} /></div>
        <div><label className="label">詳細説明</label><textarea className="input" name="description" rows={6} required /></div>
        <div>
          <label className="label">カテゴリ</label>
          <select className="input" name="category" required>
            <option>ビジネス</option><option>趣味</option><option>アート</option>
            <option>テクノロジー</option><option>教育</option><option>その他</option>
          </select>
        </div>
        <div>
          <label className="label">公開設定</label>
          <select className="input" name="visibility" defaultValue="public">
            <option value="public">公開（誰でも参加できる）</option>
            <option value="invite">招待URL限定（URLを知っている人だけ参加できる）</option>
          </select>
        </div>
        <ImageUpload name="coverUrl" label="カバー画像 (任意)" />
        <ImageUpload name="thumbUrl" label="サムネイル画像 (任意)" />
        <div className="border-t pt-4">
          <h2 className="font-bold mb-2">初期プラン</h2>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">プラン名</label><input className="input" name="planName" defaultValue="スタンダード" required /></div>
            <div><label className="label">月額(円)</label><input className="input" name="planPrice" type="number" min={0} max={100000} defaultValue={980} required /></div>
            <div><label className="label">無料トライアル日数</label><input className="input" name="planTrial" type="number" min={0} max={30} defaultValue={0} /></div>
            <div><label className="label">初月割引(円)</label><input className="input" name="planDiscount" type="number" min={0} defaultValue={0} /></div>
          </div>
        </div>
        <SubmitButton className="btn-primary" loadingText="開設中...">開設する</SubmitButton>
      </form>
    </div>
  );
}
