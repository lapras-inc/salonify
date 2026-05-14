import './globals.css';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/session';

export const metadata = {
  title: 'Salonify — オンラインサロンプラットフォーム',
  description: '誰でもオンラインサロンを開設・運営できるプラットフォーム',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  return (
    <html lang="ja">
      <body>
        <header className="bg-white border-b border-slate-200">
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link href="/" className="font-bold text-lg text-indigo-600">Salonify</Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/salons" className="hover:text-indigo-600">サロンを探す</Link>
              {user ? (
                <>
                  <Link href="/dashboard" className="hover:text-indigo-600">マイページ</Link>
                  <Link href="/owner/salons/new" className="hover:text-indigo-600">サロン開設</Link>
                  {user.isAdmin && <Link href="/admin" className="hover:text-indigo-600">管理</Link>}
                  <Link href="/account" className="hover:text-indigo-600 flex items-center gap-1.5">{user.avatarUrl && <img src={user.avatarUrl} alt="" className="w-6 h-6 rounded-full object-cover" />}{user.displayName}</Link>
                  <form action="/api/auth/logout" method="post"><button className="text-slate-500 hover:text-red-600">ログアウト</button></form>
                </>
              ) : (
                <>
                  <Link href="/login" className="hover:text-indigo-600">ログイン</Link>
                  <Link href="/signup" className="btn-primary">新規登録</Link>
                </>
              )}
            </nav>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
        <footer className="mt-16 border-t border-slate-200 bg-white">
          <div className="max-w-6xl mx-auto px-4 py-6 text-xs text-slate-500">
            © Salonify · プラットフォーム手数料5% · 決済はモック実装
          </div>
        </footer>
      </body>
    </html>
  );
}
