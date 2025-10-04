import { config } from 'dotenv';
import { spawnSync } from 'node:child_process';
import { URL } from 'node:url';
import process from 'node:process';

config({ path: '.env.test' });

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not defined. Check .env.test');
  process.exit(1);
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: 'inherit', shell: false, ...options });
  if (result.status !== 0) {
    throw new Error('Command failed: ' + command + ' ' + args.join(' '));
  }
}

function ensureTestDatabase() {
  const url = new URL(process.env.DATABASE_URL);
  const dbName = url.pathname.replace('/', '');
  if (!dbName) {
    throw new Error('DATABASE_URL must include a database name.');
  }

  const dbUser = url.username || 'postgres';
  const dbPassword = url.password || '';
  const query = "SELECT 1 FROM pg_database WHERE datname='" + dbName + "'";

  const checkResult = spawnSync(
    'docker',
    ['compose', 'exec', '-T', '-e', 'PGPASSWORD=' + dbPassword, 'postgres', 'psql', '-U', dbUser, '-tAc', query],
    { encoding: 'utf-8' }
  );

  if (checkResult.status !== 0) {
    throw new Error('Failed to verify existence of test database.');
  }

  const hasDatabase = typeof checkResult.stdout === 'string' && checkResult.stdout.trim().length > 0;
  if (!hasDatabase) {
    const createResult = spawnSync(
      'docker',
      ['compose', 'exec', '-T', '-e', 'PGPASSWORD=' + dbPassword, 'postgres', 'createdb', '-U', dbUser, dbName],
      { stdio: 'inherit' }
    );

    if (createResult.status !== 0) {
      throw new Error('Failed to create test database.');
    }
  }
}

try {
  run('docker', ['compose', '--profile', 'full', 'up', '-d']);
  ensureTestDatabase();
  run('pnpm', ['prisma', 'migrate', 'deploy', '--schema', 'prisma/schema.prisma']);
  run('pnpm', ['vitest', 'run', '--config', 'vitest.config.ts', 'tests/e2e']);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  try {
    run('docker', ['compose', 'down', '--remove-orphans']);
  } catch (cleanupError) {
    console.error(cleanupError instanceof Error ? cleanupError.message : cleanupError);
  }
}
