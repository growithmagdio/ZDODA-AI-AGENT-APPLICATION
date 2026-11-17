/** Local API server for development against the Firebase emulators (ingestion runs inline). */
export {};
process.env.INGEST_MODE ??= 'inline';
process.env.GCLOUD_PROJECT ??= process.env.FIREBASE_PROJECT_ID || 'demo-zdoda';
// Local modes (see README → "Run locally"):
//   default  → Auth emulator + Firestore emulator + Storage emulator (firebase emulators:start)
//   LOCAL_DATA=memory → Auth emulator only; Firestore in memory (persisted to .emulator-data) + local files
if (process.env.LOCAL_DATA === 'memory') {
  process.env.FIRESTORE_MODE ??= 'memory';
  process.env.FIRESTORE_MEMORY_FILE ??= '.emulator-data/firestore.json';
  process.env.STORAGE_MODE ??= 'local';
}
if (process.env.USE_EMULATORS !== 'false') {
  if (process.env.FIRESTORE_MODE !== 'memory') process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8080';
  if (process.env.STORAGE_MODE !== 'local') process.env.FIREBASE_STORAGE_EMULATOR_HOST ??= '127.0.0.1:9199';
  process.env.FIREBASE_AUTH_EMULATOR_HOST ??= '127.0.0.1:9099';
}

const { createApp } = await import('./app.js');
const port = Number(process.env.PORT || 4000);
createApp().listen(port, () => console.log(`[zdoda-api] http://localhost:${port}/api/v1 (project ${process.env.GCLOUD_PROJECT}${process.env.FIRESTORE_EMULATOR_HOST ? ', emulators' : ''})`));
