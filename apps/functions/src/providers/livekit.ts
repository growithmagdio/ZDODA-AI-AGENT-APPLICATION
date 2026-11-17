import { AccessToken, RoomAgentDispatch, RoomConfiguration, RoomServiceClient, SipClient, EgressClient, EncodedFileOutput, GCPUpload, EncodedFileType, WebhookReceiver } from 'livekit-server-sdk';
import { config } from '../config.js';

export const livekitConfigured = () => Boolean(config.livekitUrl && config.livekitApiKey && config.livekitApiSecret);

const httpUrl = () => config.livekitUrl.replace(/^wss:/, 'https:').replace(/^ws:/, 'http:');
export const roomClient = () => new RoomServiceClient(httpUrl(), config.livekitApiKey, config.livekitApiSecret);
export const sipClient = () => new SipClient(httpUrl(), config.livekitApiKey, config.livekitApiSecret);
export const egressClient = () => new EgressClient(httpUrl(), config.livekitApiKey, config.livekitApiSecret);
export const webhookReceiver = () => new WebhookReceiver(config.livekitApiKey, config.livekitApiSecret);

export interface CallMetadata {
  workspaceId: string;
  agentId: string;
  callId: string;
  channel: 'web' | 'test' | 'phone';
  direction: 'inbound' | 'outbound' | 'web';
  to?: string | null;
  from?: string | null;
  campaignId?: string | null;
  contactId?: string | null;
}

/**
 * Creates a participant token for a browser call. The token carries a room configuration
 * that dispatches the Zdoda voice worker into the room with the call metadata.
 */
export async function createWebCallToken(meta: CallMetadata, identity: string, ttlSeconds = 20 * 60) {
  const room = `web-${meta.callId}`;
  const at = new AccessToken(config.livekitApiKey, config.livekitApiSecret, { identity, ttl: ttlSeconds, name: 'Visitor' });
  at.addGrant({ room, roomJoin: true, canPublish: true, canSubscribe: true, canPublishData: true });
  at.roomConfig = new RoomConfiguration({
    agents: [new RoomAgentDispatch({ agentName: config.voiceAgentName, metadata: JSON.stringify(meta) })],
    emptyTimeout: 60,
    maxParticipants: 4,
  });
  return { serverUrl: config.livekitUrl, room, token: await at.toJwt() };
}

/** Starts an audio-only recording of the room to Google Cloud Storage (optional). */
export async function startRecording(room: string, path: string): Promise<string | null> {
  if (!config.recordingBucket || !config.recordingGcpCredentials) return null;
  const output = new EncodedFileOutput({
    fileType: EncodedFileType.OGG,
    filepath: path,
    output: { case: 'gcp', value: new GCPUpload({ bucket: config.recordingBucket, credentials: config.recordingGcpCredentials }) },
  });
  const info = await egressClient().startRoomCompositeEgress(room, { file: output }, { audioOnly: true });
  return info.egressId;
}
