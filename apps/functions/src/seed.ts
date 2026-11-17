/**
 * Seeds the "Smile Dental Clinic" demo workspace.
 *   pnpm --filter @zdoda/functions seed            (local: Auth emulator + memory/emulator Firestore)
 * Demo login: owner@smiledental.com / Password123!
 * Refuses to run against a real project unless SEED_ALLOW_PRODUCTION=true.
 */
export {};
process.env.GCLOUD_PROJECT ??= 'demo-zdoda';
if (process.env.LOCAL_DATA === 'memory') {
  process.env.FIRESTORE_MODE ??= 'memory';
  process.env.FIRESTORE_MEMORY_FILE ??= '.emulator-data/firestore.json';
  process.env.STORAGE_MODE ??= 'local';
}
if (process.env.USE_EMULATORS !== 'false') {
  process.env.FIREBASE_AUTH_EMULATOR_HOST ??= '127.0.0.1:9099';
  if (process.env.FIRESTORE_MODE !== 'memory') process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8080';
}
if (!process.env.FIREBASE_AUTH_EMULATOR_HOST && process.env.SEED_ALLOW_PRODUCTION !== 'true') {
  console.error('Refusing to seed a real Firebase project. Set SEED_ALLOW_PRODUCTION=true if you really mean it.');
  process.exit(1);
}

const { FieldValue, Timestamp } = await import('firebase-admin/firestore');
const { auth, paths } = await import('./firebase.js');
const { createWorkspace } = await import('./lib/workspace.js');
const { processSource } = await import('./rag/ingest.js');
const { runTurn } = await import('./chat/engine.js');

const EMAIL = 'owner@smiledental.com';
const PASSWORD = 'Password123!';

let user = await auth().getUserByEmail(EMAIL).catch(() => null);
if (!user) user = await auth().createUser({ email: EMAIL, password: PASSWORD, displayName: 'Dr. Maya Lee', emailVerified: true });
const existing = await paths.memberships().where('uid', '==', user.uid).limit(1).get();
if (!existing.empty) {
  console.log(`Demo workspace already exists (${existing.docs[0].get('workspaceId')}). Login: ${EMAIL} / ${PASSWORD}`);
  process.exit(0);
}

await paths.users().doc(user.uid).set({ email: EMAIL, name: 'Dr. Maya Lee', createdAt: FieldValue.serverTimestamp() }, { merge: true });
const { wsId, agentId, widgetId } = await createWorkspace(
  { uid: user.uid, email: EMAIL, name: 'Dr. Maya Lee', emailVerified: true },
  { name: 'Smile Dental Clinic', category: 'Dental', websiteUrl: 'https://smiledental.example' },
  {
    agent: {
      name: 'Dental Assistant',
      description: 'Answers questions about treatments, prices and hours, and books check-ups',
      systemPrompt:
        'You are the friendly front-desk assistant of Smile Dental Clinic. Help patients with treatments, prices, insurance and opening hours, and encourage them to book. Never diagnose — for pain or emergencies, share the emergency number.',
      greeting: "Hi! 👋 I'm the Smile Dental assistant. Ask me about treatments, prices or booking a visit.",
      bookingUrl: 'https://cal.com/smile-dental/checkup',
    },
  }
);

const add = async (data: Record<string, unknown>) => {
  const ref = await paths.sources(wsId).add({ ...data, status: 'queued', chunkCount: 0, charCount: 0, createdBy: user!.uid, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
  await processSource(wsId, ref.id);
};
await add({
  type: 'faq',
  name: 'Clinic FAQ',
  items: [
    { q: 'What are your opening hours?', a: 'We are open Monday to Friday 9am–6pm and Saturday 9am–1pm. We are closed on Sundays and public holidays.' },
    { q: 'How much does a check-up and cleaning cost?', a: 'A check-up with professional cleaning costs $89. New patients get a free first consultation.' },
    { q: 'How much is teeth whitening?', a: 'In-clinic teeth whitening costs $299 and takes about one hour. Take-home kits are $149.' },
    { q: 'Do you accept insurance?', a: 'Yes. We accept Delta Dental, Cigna, Aetna, MetLife and most PPO plans. We file the claim for you.' },
    { q: 'Do you offer Invisalign?', a: 'Yes. Invisalign treatment starts at $3,500 and includes a free 3D scan. Payment plans from $99/month are available.' },
    { q: 'What should I do in a dental emergency?', a: 'Call our emergency line at +1 (555) 010-2020. Same-day emergency appointments are available on weekdays.' },
    { q: 'Where are you located?', a: 'We are at 120 Market Street, Suite 4, next to Central Park station. Free parking is available behind the building.' },
  ],
});
await add({
  type: 'text',
  name: 'Policies',
  text: 'Cancellation policy: please give at least 24 hours notice to cancel or reschedule. Late cancellations may be charged $40.\n\nPayment: we accept cards, Apple Pay and HSA/FSA cards. Payment is due at the time of the visit.\n\nChildren: we see children from age 3. Kids check-ups cost $59.',
});

await paths.agents(wsId).doc(agentId).update({ status: 'published', publishedAt: FieldValue.serverTimestamp() });
const w = await paths.widgets(wsId).doc(widgetId).get();
await paths.widgets(wsId).doc(widgetId).update({ publishedConfig: w.get('draftConfig'), publishedVersion: 1, publishedAt: FieldValue.serverTimestamp() });
await paths.widgets(wsId).doc(widgetId).collection('versions').doc('1').set({ version: 1, config: w.get('draftConfig'), publishedBy: user.uid, publishedByEmail: EMAIL, createdAt: FieldValue.serverTimestamp() });

const chats = [
  ['How much is teeth whitening?', 'Is the take-home kit as good?'],
  ['What are your opening hours?', 'My name is Sarah, email sarah.m@example.com — can someone call me about booking?'],
  ['Do you accept Delta Dental insurance?'],
  ['Can I talk to a real person please?'],
  ['Do you offer Invisalign?', 'I want to book a free scan'],
  ['Where are you located?'],
];
for (const turns of chats) {
  let conversationId: string | null = null;
  for (const text of turns) {
    const out = await runTurn({ ws: wsId, agentId, channel: 'web', text, conversationId, widgetId, visitor: { visitorId: 'seed-' + Math.random().toString(36).slice(2), pageUrl: 'https://smiledental.example/' } });
    conversationId = out.conversationId;
  }
}
// Spread the demo conversations over the last two weeks so charts have shape.
const convs = await paths.conversations(wsId).get();
await Promise.all(
  convs.docs.map((d, i) => {
    const t = Timestamp.fromMillis(Date.now() - (i * 2 + 1) * 86400_000 - i * 3600_000);
    return d.ref.update({ createdAt: t, lastMessageAt: t });
  })
);

await new Promise((r) => setTimeout(r, 800)); // let the memory store flush to disk
console.log(`Seeded Smile Dental Clinic (${wsId}). Login: ${EMAIL} / ${PASSWORD}`);
process.exit(0);
