import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    testTimeout: 60_000,
    hookTimeout: 60_000,
    fileParallelism: false,
    env: {
      GCLOUD_PROJECT: 'demo-zdoda',
      FIRESTORE_MODE: 'memory',
      STORAGE_MODE: 'local',
      STORAGE_LOCAL_DIR: '/tmp/zdoda-test-storage',
      FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9099',
      INGEST_MODE: 'inline',
      LLM_PROVIDER: 'mock',
      EMBEDDING_PROVIDER: 'mock',
      STRIPE_SECRET_KEY: '',
    },
  },
});
