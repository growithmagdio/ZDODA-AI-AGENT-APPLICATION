import { initializeApp, getApps, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';
import { MemoryFirestore } from './lib/memory-firestore.js';
import { LocalBucket } from './lib/local-bucket.js';

let app: App;
function adminApp(): App {
  if (!app) {
    app =
      getApps()[0] ||
      (process.env.FIREBASE_CONFIG
        ? initializeApp() // Cloud Functions provides project + bucket via FIREBASE_CONFIG
        : initializeApp({
            projectId: process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID || 'demo-zdoda',
            storageBucket:
              process.env.FIREBASE_STORAGE_BUCKET ||
              `${process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID || 'demo-zdoda'}.appspot.com`,
          }));
  }
  return app;
}

let firestore: Firestore | undefined;
export function db(): Firestore {
  if (!firestore) {
    if (process.env.FIRESTORE_MODE === 'memory') {
      // Local dev/tests without the Java-based Firestore emulator. Never used in production.
      if (process.env.NODE_ENV === 'production') throw new Error('FIRESTORE_MODE=memory is not allowed in production');
      firestore = new MemoryFirestore(process.env.FIRESTORE_MEMORY_FILE || undefined) as unknown as Firestore;
    } else {
      firestore = getFirestore(adminApp());
      firestore.settings({ ignoreUndefinedProperties: true });
    }
  }
  return firestore;
}
export const auth = () => getAuth(adminApp());
let localBucket: LocalBucket | undefined;
export const storageMode = () => (process.env.STORAGE_MODE === 'local' ? 'local' : 'firebase');
/** Cloud Storage bucket (or a local folder when STORAGE_MODE=local for dev/tests). */
export const bucket = (): ReturnType<ReturnType<typeof getStorage>['bucket']> => {
  if (storageMode() === 'local') {
    localBucket ??= new LocalBucket(process.env.STORAGE_LOCAL_DIR || '.emulator-data/storage');
    return localBucket as any;
  }
  return getStorage(adminApp()).bucket();
};
export const isEmulator = () =>
  Boolean(process.env.FUNCTIONS_EMULATOR || process.env.FIRESTORE_EMULATOR_HOST || process.env.FIREBASE_AUTH_EMULATOR_HOST);

/** Firestore path helpers. Every tenant document lives under workspaces/{wsId}. */
export const paths = {
  workspace: (ws: string) => db().collection('workspaces').doc(ws),
  agents: (ws: string) => db().collection('workspaces').doc(ws).collection('agents'),
  sources: (ws: string) => db().collection('workspaces').doc(ws).collection('knowledgeSources'),
  chunks: (ws: string) => db().collection('workspaces').doc(ws).collection('knowledgeChunks'),
  widgets: (ws: string) => db().collection('workspaces').doc(ws).collection('widgets'),
  conversations: (ws: string) => db().collection('workspaces').doc(ws).collection('conversations'),
  messages: (ws: string, conv: string) =>
    db().collection('workspaces').doc(ws).collection('conversations').doc(conv).collection('messages'),
  leads: (ws: string) => db().collection('workspaces').doc(ws).collection('leads'),
  integrations: (ws: string) => db().collection('workspaces').doc(ws).collection('integrations'),
  usage: (ws: string) => db().collection('workspaces').doc(ws).collection('usage'),
  audit: (ws: string) => db().collection('workspaces').doc(ws).collection('auditLog'),
  // Server-only secrets (never readable by clients — see firestore.rules)
  secrets: (ws: string) => db().collection('workspaceSecrets').doc(ws).collection('items'),
  memberships: () => db().collection('memberships'),
  membership: (ws: string, uid: string) => db().collection('memberships').doc(`${ws}_${uid}`),
  users: () => db().collection('users'),
  invites: () => db().collection('invites'),
  widgetKeys: () => db().collection('widgetKeys'),
};
