import { SubmitButton } from '@/components/SubmitButton';
import { prisma } from '@/lib/db';

export default async function VerifyPage({ searchParams }: { searchParams: { email?: string; next?: string; error?: string } }) {
  const email = searchParams.email ?? '';
  const next = searchParams.next ?? '';
  const err = searchParams.error;

  // ローカル開発時: DBから認証コードを取得して画面に表示
  const devCode = !process.env.RESEND_API_KEY && email
    ? (await prisma.emailVerification.findFirst({ where: { email }, orderBy: { createdAt: 'desc' } }))?.code ?? null
    : null;

  return (
    <div className="max-w-md mx-auto card p-6">
      <h1 className="text-xl font-bold mb-4">メール認証</h1>
      <p className="mb-4 text-sm text-gray-600">{email} に認証コードを送信しました</p>
      {devCode && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded text-sm">
          <span className="text-amber-700 font-bold">開発モード:</span> 認証コードは <span className="font-mono font-bold text-lg">{devCode}</span>
        </div>
      )}
      {err === 'invalid' && <p className="mb-3 text-sm text-red-600">認証コードが正しくないか、有効期限が切れています</p>}
      {err === 'rate' && <p className="mb-3 text-sm text-red-600">試行回数の上限に達しました。しばらくお待ちください</p>}
      {err === 'exists' && <p className="mb-3 text-sm text-red-600">このメールアドレスは既に登録されています</p>}
      <form action="/api/auth/verify" method="post" className="space-y-3">
        <input type="hidden" name="email" value={email} />
        {next && <input type="hidden" name="next" value={next} />}
        <div>
          <label className="label">認証コード (6桁)</label>
          <input className="input" name="code" type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required autoFocus />
        </div>
        <SubmitButton className="btn-primary w-full" loadingText="認証中...">認証する</SubmitButton>
      </form>
      <form action="/api/auth/resend-code" method="post" className="mt-4 text-center">
        <input type="hidden" name="email" value={email} />
        {next && <input type="hidden" name="next" value={next} />}
        <p className="text-sm text-gray-500">
          コードが届かない場合は <SubmitButton className="text-indigo-600 hover:underline" loadingText="送信中...">コードを再送信する</SubmitButton>
        </p>
      </form>
    </div>
  );
}
