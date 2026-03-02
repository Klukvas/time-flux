import { Client } from 'pg';
import { execSync } from 'child_process';
import path from 'path';

const TEST_DB = 'lifespan_test';
const PG_HOST = 'localhost';
const PG_PORT = 5433;
const PG_USER = 'postgres';
const PG_PASS = 'postgres';

export default async function globalSetup() {
  const adminClient = new Client({
    host: PG_HOST,
    port: PG_PORT,
    user: PG_USER,
    password: PG_PASS,
    database: 'postgres',
  });

  try {
    await adminClient.connect();

    const { rows } = await adminClient.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [TEST_DB],
    );

    if (rows.length === 0) {
      await adminClient.query(`CREATE DATABASE ${TEST_DB}`);
    }
  } finally {
    await adminClient.end();
  }

  // Run Prisma migrations against the test database
  const beDir = path.resolve(__dirname, '..');
  const databaseUrl = `postgresql://${PG_USER}:${PG_PASS}@${PG_HOST}:${PG_PORT}/${TEST_DB}?schema=public`;

  execSync(`npx prisma migrate deploy`, {
    cwd: beDir,
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'pipe',
  });
}
