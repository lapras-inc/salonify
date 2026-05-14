const MESSAGES: Record<string, string> = {
  cancelled: 'サロンを退会しました',
  joined: 'サロンに入会しました',
  'plan-changed': 'プランを変更しました',
  posted: '投稿しました',
  'thread-created': 'スレッドを作成しました',
  commented: 'コメントしました',
  reported: '通報を送信しました',
  'salon-created': 'サロンを開設しました',
  'salon-updated': 'サロン設定を更新しました',
  'plan-updated': 'プランを更新しました',
  'plan-added': 'プランを追加しました',
  'invite-created': '招待URLを発行しました',
  'invite-disabled': '招待URLを無効にしました',
  'member-removed': '会員を退会させました',
  'member-plan-changed': '会員のプランを変更しました',
  'account-updated': 'アカウント設定を更新しました',
  'payout-requested': '振込申請を受け付けました',
  'account-deleted': '退会しました',
  'card-declined': 'カードが拒否されました',
  'reset-sent': 'パスワードリセットコードを送信しました',
  'reset-complete': 'パスワードを変更しました',
  'user-suspended': 'ユーザーを停止しました',
  'admin-toggled': '管理者権限を変更しました',
  'salon-deleted': 'サロンを削除しました',
  'report-resolved': '通報を解決済にしました',
  'post-updated': '投稿を更新しました',
  'post-deleted': '投稿を削除しました',
};

export function FlashMessage({ code }: { code?: string | null }) {
  if (!code) return null;
  const text = MESSAGES[code] ?? code;
  const isError = code.includes('declined') || code.includes('error');
  return (
    <div className={`rounded-md px-4 py-3 text-sm mb-6 ${isError ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-green-50 text-green-800 border border-green-200'}`}>
      {text}
    </div>
  );
}
