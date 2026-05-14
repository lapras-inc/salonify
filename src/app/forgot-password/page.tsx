import { SubmitButton } from '@/components/SubmitButton';

export default function ForgotPasswordPage({ searchParams }: { searchParams: { msg?: string } }) {
  const msg = searchParams.msg;
  return (
    <div className="max-w-md mx-auto card p-6">
      <h1 className="text-xl font-bold mb-4">パスワードリセット</h1>
      {msg === 'sent' && <p className="mb-3 text-sm text-green-600">パスワードリセットコードを送信しました</p>}
      {msg === 'not-found' && <p className="mb-3 text-sm text-red-600">このメールアドレスは登録されていません</p>}
      {msg === 'rate' && <p className="mb-3 text-sm text-red-600">試行回数の上限に達しました。しばらくお待ちください</p>}
      <form action="/api/auth/forgot-password" method="post" className="space-y-3">
        <div><label className="label">メールアドレス</label><input className="input" name="email" type="email" required /></div>
        <SubmitButton className="btn-primary w-full" loadingText="送信中...">リセットコードを送信</SubmitButton>
      </form>
      <p className="text-sm text-slate-500 mt-4"><a href="/login" className="text-indigo-600">ログインに戻る</a></p>
    </div>
  );
}
