import { SubmitButton } from '@/components/SubmitButton';
import { prisma } from '@/lib/db';

export default async function ResetVerifyPage({ searchParams }: { searchParams: { email?: string; error?: string } }) {
  const email = searchParams.email ?? '';
  const err = searchParams.error;

  const devCode = !process.env.RESEND_API_KEY && email
    ? (await prisma.passwordReset.findFirst({ where: { email }, orderBy: { createdAt: 'desc' } }))?.code ?? null
    : null;

  return (
    <div className="max-w-md mx-auto card p-6">
      <h1 className="text-xl font-bold mb-4">パスワードリセット</h1>
      <p className="mb-4 text-sm text-gray-600">{email} にリセットコードを送信しました</p>
      {devCode && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded text-sm">
          <span className="text-amber-700 font-bold">開発モード:</span> リセットコードは <span className="font-mono font-bold text-lg">{devCode}</span>
        </div>
      )}
      {err === 'invalid' && <p className="mb-3 text-sm text-red-600">コードが正しくないか、有効期限が切れています</p>}
      {err === 'rate' && <p className="mb-3 text-sm text-red-600">試行回数の上限に達しました。しばらくお待ちください</p>}
      {err === 'mismatch' && <p className="mb-3 text-sm text-red-600">パスワードが一致しません</p>}
      {err === 'short' && <p className="mb-3 text-sm text-red-600">パスワードは8文字以上で入力してください</p>}
      <form action="/api/auth/reset-password" method="post" className="space-y-3">
        <input type="hidden" name="email" value={email} />
        <div>
          <label className="label">リセットコード (6桁)</label>
          <input className="input" name="code" type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required autoFocus />
        </div>
        <div>
          <label className="label">新しいパスワード (8文字以上)</label>
          <input className="input" name="password" type="password" minLength={8} required />
        </div>
        <div>
          <label className="label">新しいパスワード (確認)</label>
          <input className="input" name="confirmPassword" type="password" minLength={8} required />
        </div>
        <SubmitButton className="btn-primary w-full" loadingText="変更中...">パスワードを変更</SubmitButton>
      </form>
    </div>
  );
}
