import { config } from '../config.js';

/** Minimal Twilio REST client (no SDK) for number search, purchase, trunk attach and release. */
export const twilioConfigured = () => Boolean(config.twilioSid && config.twilioToken);

async function tw(method: 'GET' | 'POST' | 'DELETE', path: string, form?: Record<string, string>, base = 'https://api.twilio.com/2010-04-01') {
  const url = `${base}${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      authorization: 'Basic ' + Buffer.from(`${config.twilioSid}:${config.twilioToken}`).toString('base64'),
      ...(form ? { 'content-type': 'application/x-www-form-urlencoded' } : {}),
    },
    body: form ? new URLSearchParams(form).toString() : undefined,
    signal: AbortSignal.timeout(20_000),
  });
  if (method === 'DELETE' && res.status === 204) return {};
  const json: any = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Twilio: ${json?.message || res.statusText}`);
  return json;
}

export async function searchNumbers(country: string, opts: { areaCode?: string; contains?: string; limit?: number } = {}) {
  const q = new URLSearchParams({ VoiceEnabled: 'true', PageSize: String(opts.limit || 10) });
  if (opts.areaCode) q.set('AreaCode', opts.areaCode);
  if (opts.contains) q.set('Contains', opts.contains);
  const json = await tw('GET', `/Accounts/${config.twilioSid}/AvailablePhoneNumbers/${encodeURIComponent(country)}/Local.json?${q}`);
  return (json.available_phone_numbers || []).map((n: any) => ({
    number: n.phone_number as string,
    friendlyName: n.friendly_name as string,
    locality: [n.locality, n.region].filter(Boolean).join(', '),
    country,
  }));
}

export async function buyNumber(number: string, trunkSid?: string) {
  const json = await tw('POST', `/Accounts/${config.twilioSid}/IncomingPhoneNumbers.json`, {
    PhoneNumber: number,
    FriendlyName: `Zdoda ${number}`,
    ...(trunkSid ? { TrunkSid: trunkSid } : {}),
  });
  return { sid: json.sid as string, number: json.phone_number as string, friendlyName: json.friendly_name as string };
}

export async function releaseNumber(sid: string) {
  await tw('DELETE', `/Accounts/${config.twilioSid}/IncomingPhoneNumbers/${sid}.json`);
}

const TRUNKING = 'https://trunking.twilio.com/v1';

/** Creates the platform's Elastic SIP trunk: inbound calls → LiveKit SIP, outbound with credentials. */
export async function createSipTrunk(livekitSipUri: string, username: string, password: string) {
  const trunk = await tw('POST', '/Trunks', { FriendlyName: 'Zdoda Voice', DomainName: `zdoda-${Date.now().toString(36)}.pstn.twilio.com` }, TRUNKING);
  await tw('POST', `/Trunks/${trunk.sid}/OriginationUrls`, { FriendlyName: 'LiveKit', SipUrl: livekitSipUri, Priority: '1', Weight: '1', Enabled: 'true' }, TRUNKING);
  const credList = await tw('POST', `/Accounts/${config.twilioSid}/SIP/CredentialLists.json`, { FriendlyName: 'Zdoda LiveKit outbound' });
  await tw('POST', `/Accounts/${config.twilioSid}/SIP/CredentialLists/${credList.sid}/Credentials.json`, { Username: username, Password: password });
  await tw('POST', `/Trunks/${trunk.sid}/CredentialLists`, { CredentialListSid: credList.sid }, TRUNKING);
  return { trunkSid: trunk.sid as string, terminationHost: trunk.domain_name as string };
}
