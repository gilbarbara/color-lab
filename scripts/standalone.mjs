/* eslint-disable no-console */
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, rmSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const outputDirectory = path.join(root, 'standalone');
const standaloneSource = path.join(root, '.next', 'standalone');
const staticDirectory = path.join(root, '.next', 'static');
const publicDirectory = path.join(root, 'public');

function run(label, fn) {
  console.log(`\n▶ ${label}`);

  try {
    fn();
  } catch (error) {
    console.error(`\n✖ ${label} failed:`, error.message);
    process.exit(1);
  }
}

if (!existsSync(standaloneSource)) {
  console.error('✖ .next/standalone is missing. Run next build first.');
  process.exit(1);
}

run('Assemble standalone/', () => {
  rmSync(outputDirectory, { recursive: true, force: true });
  // Mirror Dockerfile: standalone root, then public/ and .next/static/ alongside it.
  cpSync(standaloneSource, outputDirectory, { recursive: true });
  cpSync(publicDirectory, path.join(outputDirectory, 'public'), { recursive: true });
  cpSync(staticDirectory, path.join(outputDirectory, '.next', 'static'), { recursive: true });
});

const port = process.env.PORT ?? '3000';
const hostname = process.env.HOSTNAME ?? '0.0.0.0';

console.log(`\n▶ Serving standalone/ at http://${hostname}:${port}`);

const server = spawnSync('node', ['server.js'], {
  cwd: outputDirectory,
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'production', PORT: port, HOSTNAME: hostname },
});

process.exit(server.status ?? 0);
