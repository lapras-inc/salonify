import { SubmitButton } from '@/components/SubmitButton';

export default function SignupPage({ searchParams }: { searchParams: { error?: string; next?: string } }) {
  const err = searchParams.error;
  const next = searchParams.next ?? '';
  return (
    <div className="max-w-md mx-auto card p-6">
      <h1 className="text-xl font-bold mb-4">新規登録</h1>
      {err === 'exists' && <p className="mb-3 text-sm text-red-600">このメールアドレスは既に登録されています</p>}
      {err === 'invalid' && <p className="mb-3 text-sm text-red-600">入力内容を確認してください（パスワードは8文字以上）</p>}
      <form action="/api/auth/signup" method="post" className="space-y-3">
        {next && <input type="hidden" name="next" value={next} />}
        <div><label className="label">表示名</label><input className="input" name="displayName" required maxLength={40} /></div>
        <div><label className="label">メールアドレス</label><input className="input" name="email" type="email" required /></div>
        <div><label className="label">パスワード (8文字以上)</label><input className="input" name="password" type="password" minLength={8} required /></div>
        <SubmitButton className="btn-primary w-full" loadingText="登録中...">登録する</SubmitButton>
      </form>
    </div>
  );
}
