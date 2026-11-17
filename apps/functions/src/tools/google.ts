import { createHmac } from 'node:crypto';
import { config } from '../config.js';
import { paths } from '../firebase.js';
import { decrypt, encrypt } from '../lib/util.js';

export const googleConfigured = () => Boolean(config.googleClientId && config.googleClientSecret);
const SCOPES = ['https://www.googleapis.com/auth/calendar.events', 'https://www.googleapis.com/auth/calendar.readonly', 'https://www.googleapis.com/auth/spreadsheets'];
export const googleRedirectUri = () => `${config.publicApiUrl}/api/v1/oauth/google/callback`;

const sign = (s: string) => createHmac('sha256', config.encryptionKey || 'zdoda-dev-only-key').update(s).digest('base64url');

export function googleAuthUrl(ws: string, toolId: string) {
  const state = Buffer.from(JSON.stringify({ ws, toolId, t: Date.now() })).toString('base64url');
  const q = new URLSearchParams({
    client_id: config.googleClientId,
    redirect_uri: googleRedirectUri(),
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES.join(' '),
    state: `${state}.${sign(state)}`,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${q}`;
}

export function verifyState(raw: string): { ws: string; toolId: string } {
  const [state, sig] = raw.split('.');
  if (!state || sig !== sign(state)) throw new Error('Invalid state');
  const data = JSON.parse(Buffer.from(state, 'base64url').toString('utf8'));
  if (Date.now() - data.t > 15 * 60_000) throw new Error('Link expired');
  return data;
}

export async function exchangeCode(code: string) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ code, client_id: config.googleClientId, client_secret: config.googleClientSecret, redirect_uri: googleRedirectUri(), grant_type: 'authorization_code' }),
  });
  const json: any = await res.json();
  if (!res.ok || !json.refresh_token) throw new Error(json.error_description || 'Google did not return a refresh token');
  return json.refresh_token as string;
}

export async function saveGoogleToken(ws: string, toolId: string, refreshToken: string) {
  await paths.secrets(ws).doc(`tool_${toolId}`).set({ value: encrypt(refreshToken), kind: 'google_refresh_token' });
  await paths.tools(ws).doc(toolId).update({ connected: true, lastError: null });
}

async function accessToken(ws: string, toolId: string) {
  const s = await paths.secrets(ws).doc(`tool_${toolId}`).get();
  if (!s.exists) throw new Error('Google account not connected');
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ refresh_token: decrypt(s.get('value')), client_id: config.googleClientId, client_secret: config.googleClientSecret, grant_type: 'refresh_token' }),
  });
  const json: any = await res.json();
  if (!res.ok) throw new Error(json.error_description || 'Google token refresh failed');
  return json.access_token as string;
}

async function gapi(ws: string, toolId: string, url: string, init: RequestInit = {}) {
  const token = await accessToken(ws, toolId);
  const res = await fetch(url, { ...init, headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json', ...(init.headers || {}) }, signal: AbortSignal.timeout(15_000) });
  const json: any = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error?.message || `Google API ${res.status}`);
  return json;
}

export async function calendarAvailability(ws: string, toolId: string, cfg: Record<string, any>, date: string) {
  const tz = cfg.timezone || 'UTC';
  const start = new Date(`${date}T00:00:00`);
  if (isNaN(start.getTime())) throw new Error('Date must look like 2026-12-01');
  const end = new Date(start.getTime() + 86400_000);
  const json = await gapi(ws, toolId, 'https://www.googleapis.com/calendar/v3/freeBusy', {
    method: 'POST',
    body: JSON.stringify({ timeMin: start.toISOString(), timeMax: end.toISOString(), timeZone: tz, items: [{ id: cfg.calendarId || 'primary' }] }),
  });
  const busy: { start: string; end: string }[] = json.calendars?.[cfg.calendarId || 'primary']?.busy || [];
  const [oh, om] = String(cfg.openTime || '09:00').split(':').map(Number);
  const [ch, cm] = String(cfg.closeTime || '17:00').split(':').map(Number);
  const dur = Number(cfg.durationMin || 30);
  const slots: string[] = [];
  for (let m = oh * 60 + om; m + dur <= ch * 60 + cm; m += dur) {
    const s = new Date(start.getTime() + m * 60_000);
    const e = new Date(s.getTime() + dur * 60_000);
    if (!busy.some((b) => new Date(b.start) < e && new Date(b.end) > s)) slots.push(`${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`);
  }
  return slots.length ? `Free ${dur}-minute slots on ${date} (${tz}): ${slots.slice(0, 12).join(', ')}` : `No free slots on ${date}.`;
}

export async function calendarBook(ws: string, toolId: string, cfg: Record<string, any>, args: Record<string, any>) {
  const dur = Number(cfg.durationMin || 30);
  const start = new Date(args.start_time);
  if (isNaN(start.getTime())) throw new Error('start_time must be an ISO date-time like 2026-12-01T10:30');
  const end = new Date(start.getTime() + dur * 60_000);
  const ev = await gapi(ws, toolId, `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(cfg.calendarId || 'primary')}/events`, {
    method: 'POST',
    body: JSON.stringify({
      summary: `${cfg.eventTitle || 'Appointment'} — ${args.name || 'Customer'}`,
      description: [args.phone && `Phone: ${args.phone}`, args.email && `Email: ${args.email}`, args.notes && `Notes: ${args.notes}`, 'Booked by Zdoda AI agent'].filter(Boolean).join('\n'),
      start: { dateTime: start.toISOString(), timeZone: cfg.timezone || 'UTC' },
      end: { dateTime: end.toISOString(), timeZone: cfg.timezone || 'UTC' },
      ...(args.email ? { attendees: [{ email: args.email }] } : {}),
    }),
  });
  return `Booked: ${ev.summary} at ${start.toISOString()} (${cfg.timezone || 'UTC'}).`;
}

export async function sheetsAppend(ws: string, toolId: string, cfg: Record<string, any>, args: Record<string, any>, columns: string[]) {
  const range = encodeURIComponent(`${cfg.sheetName || 'Sheet1'}!A1`);
  const row = [new Date().toISOString(), ...columns.map((c) => (args[c] === undefined ? '' : String(args[c])))];
  await gapi(ws, toolId, `https://sheets.googleapis.com/v4/spreadsheets/${cfg.spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED`, {
    method: 'POST',
    body: JSON.stringify({ values: [row] }),
  });
  return 'Saved to the spreadsheet.';
}
