/** Filesystem stand-in for Cloud Storage in local dev/tests (STORAGE_MODE=local). Never used in production. */
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, normalize } from 'node:path';

export class LocalBucket {
  name = 'local-bucket';
  constructor(private root: string) {}
  private resolve(p: string) {
    const full = normalize(join(this.root, p));
    if (!full.startsWith(normalize(this.root))) throw new Error('Invalid path');
    return full;
  }
  file(path: string) {
    const full = this.resolve(path);
    return {
      save: async (buf: Buffer, opts?: { contentType?: string }) => {
        await mkdir(dirname(full), { recursive: true });
        await writeFile(full, buf);
        await writeFile(full + '.meta.json', JSON.stringify({ contentType: opts?.contentType || 'application/octet-stream' }));
      },
      download: async () => [await readFile(full)] as [Buffer],
      delete: async () => {
        await rm(full, { force: true });
        await rm(full + '.meta.json', { force: true });
      },
      contentType: async () => JSON.parse(await readFile(full + '.meta.json', 'utf8').catch(() => '{}')).contentType as string | undefined,
    };
  }
}
