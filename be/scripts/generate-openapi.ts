/**
 * Headless OpenAPI spec generator.
 *
 * Bootstraps the NestJS app metadata (no live DB) and writes the
 * Swagger/OpenAPI document to `be/openapi.json`.
 *
 * Usage: npm run openapi:generate
 *
 * How it works:
 *  1. `nest build` compiles src/ (including generate-openapi.entry.ts) to dist/
 *  2. This wrapper runs the compiled entry from dist/
 */
import { execSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

async function main() {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const root = resolve(__dirname, '..');

  // Step 1: Build with NestJS SWC builder (handles decorator metadata)
  console.log('Building project...');
  execSync('npx nest build', { cwd: root, stdio: 'inherit' });

  // Step 2: Run the compiled entry
  console.log('Generating OpenAPI spec...');
  const entry = resolve(root, 'dist', 'generate-openapi.entry.js');
  await import(entry);
}

main().catch((err) => {
  console.error('Failed to generate OpenAPI spec:', err);
  process.exit(1);
});
