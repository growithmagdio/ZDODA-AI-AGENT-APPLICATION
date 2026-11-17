// One command for local development without Java:
//   Auth emulator (Node) + API with in-memory Firestore + Vite.
// Requires firebase-tools on PATH (npm i -g firebase-tools).
import { spawn } from 'node:child_process';

const env = { ...process.env, LOCAL_DATA: 'memory' };
const run = (name, cmd, args, opts = {}) => {
  const p = spawn(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32', env, ...opts });
  p.on('exit', (code) => {
    console.log(`[${name}] exited with ${code}`);
    process.exit(code ?? 0);
  });
  return p;
};

run('auth-emulator', 'firebase', ['emulators:start', '--only', 'auth', '--project', 'demo-zdoda']);
setTimeout(() => {
  const seed = spawn('pnpm', ['--filter', '@zdoda/functions', 'seed'], { stdio: 'inherit', env, shell: process.platform === 'win32' });
  seed.on('exit', () => {
    run('api', 'pnpm', ['--filter', '@zdoda/functions', 'dev']);
    run('web', 'pnpm', ['--filter', '@zdoda/web', 'dev']);
  });
}, 6000);
