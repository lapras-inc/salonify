import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 'dummy');

export async function sendVerificationEmail(to: string, code: string) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[DEV] Verification code for ${to}: ${code}`);
    return;
  }
  await resend.emails.send({
    from: 'Salonify <noreply@xxxxxxxx.com>',
    to,
    subject: 'メール認証コード',
    text: `認証コード: ${code}\n\n10分以内に入力してください。`,
  });
}

export async function sendPasswordResetEmail(to: string, code: string) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[DEV] Password reset code for ${to}: ${code}`);
    return;
  }
  await resend.emails.send({
    from: 'Salonify <noreply@xxxxxxxx.com>',
    to,
    subject: 'パスワードリセット',
    text: `パスワードリセットコード: ${code}\n\n10分以内に入力してください。`,
  });
}
