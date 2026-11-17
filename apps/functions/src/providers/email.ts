import { config } from '../config.js';

export const emailLive = () => Boolean(config.resendKey);

/** Sends via Resend when RESEND_API_KEY is set; otherwise logs (dev/demo). Returns whether it was really sent. */
export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (!config.resendKey) {
    console.info(`[email:log] to=${to} subject="${subject}"\n${html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 400)}`);
    return false;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${config.resendKey}` },
    body: JSON.stringify({ from: config.emailFrom, to, subject, html }),
  });
  if (!res.ok) console.error('[email] send failed', res.status, await res.text().catch(() => ''));
  return res.ok;
}
