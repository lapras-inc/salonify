import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/session';
import { FlashMessage } from '@/components/FlashMessage';
import { SubmitButton } from '@/components/SubmitButton';
import { ImageUpload } from '@/components/ImageUpload';

export default async function Account({ searchParams }: { searchParams: { msg?: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  return (
    <div className="max-w-lg mx-auto">
      <FlashMessage code={searchParams.msg} />
      <h1 className="text-2xl font-bold mb-6">アカウント設定</h1>
      <div className="card p-6 space-y-3">
        <form action="/api/account/update" method="post" className="space-y-3">
          <div><label className="label">表示名</label><input className="input" name="displayName" defaultValue={user.displayName} required /></div>
          <div><label className="label">自己紹介</label><textarea className="input" name="bio" rows={3} defaultValue={user.bio ?? ''} /></div>
          <ImageUpload name="avatarUrl" currentUrl={user.avatarUrl} label="アイコン画像" />
          <SubmitButton className="btn-primary" loadingText="保存中...">保存</SubmitButton>
        </form>
      </div>
      <div className="card p-6 mt-4">
        <h2 className="font-bold mb-3">支払い・課金</h2>
        <Link href="/account/billing" className="text-indigo-600 text-sm">支払い履歴・課金管理へ</Link>
      </div>
      <div className="card p-6 mt-4 border-red-200">
        <h2 className="font-bold text-red-600 mb-2">退会</h2>
        <p className="text-sm text-slate-600 mb-3">全てのサブスクリプションが解約されます。</p>
        <form action="/api/account/delete" method="post">
          <SubmitButton confirmMessage="本当に退会しますか？全てのサブスクリプションが解約され、アカウントは復元できません。" className="btn-danger" loadingText="退会中...">退会する</SubmitButton>
        </form>
      </div>
    </div>
  );
}
