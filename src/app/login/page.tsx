import { FlashMessage } from '@/components/FlashMessage';
import { SubmitButton } from '@/components/SubmitButton';

export default function LoginPage({ searchParams }: { searchParams: { error?: string; next?: string; msg?: string } }) {
  const next = searchParams.next ?? '';
  return (
    <div className="max-w-md mx-auto card p-6">
      <h1 className="text-xl font-bold mb-4">ログイン</h1>
      <FlashMessage code={searchParams.msg} />
      {searchParams.error && <p className="mb-3 text-sm text-red-600">メールアドレスまたはパスワードが正しくありません</p>}
      <form action="/api/auth/login" method="post" className="space-y-3">
        {next && <input type="hidden" name="next" value={next} />}
        <div><label className="label">メールアドレス</label><input className="input" name="email" type="email" required /></div>
        <div><label className="label">パスワード</label><input className="input" name="password" type="password" required /></div>
        <SubmitButton className="btn-primary w-full" loadingText="ログイン中...">ログイン</SubmitButton>
      </form>
      <p className="text-sm text-slate-500 mt-4"><a href="/forgot-password" className="text-indigo-600">パスワードをお忘れの方</a></p>
      <p className="text-sm text-slate-500 mt-2">アカウントをお持ちでない方は <a href={`/signup${next ? `?next=${encodeURIComponent(next)}` : ''}`} className="text-indigo-600">新規登録</a></p>
    </div>
  );
}
