import { mkdir, copyFile, rm } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const outDir = path.join(root, 'dist', 'public');
const files = ['index.html', 'app.js', 'styles.css'];

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });

for (const file of files) {
  await copyFile(path.join(root, file), path.join(outDir, file));
}

console.log(`Prepared Cloudflare assets in ${outDir}`);
