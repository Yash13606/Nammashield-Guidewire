import "server-only";
import { Pool, type PoolClient, type QueryResultRow } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __nammaShieldPgPool: Pool | undefined;
}

function resolveDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for server database access");
  }
  return databaseUrl;
}

function isLocalDatabase(url: string) {
  return url.includes("localhost") || url.includes("127.0.0.1");
}

function createPool() {
  const databaseUrl = resolveDatabaseUrl();
  return new Pool({
    connectionString: databaseUrl,
    max: Number(process.env.PG_POOL_MAX ?? 10),
    idleTimeoutMillis: 30_000,
    ssl: isLocalDatabase(databaseUrl) ? undefined : { rejectUnauthorized: false },
  });
}

const pool = globalThis.__nammaShieldPgPool ?? createPool();
if (!globalThis.__nammaShieldPgPool) {
  globalThis.__nammaShieldPgPool = pool;
}

export async function queryRows<T extends QueryResultRow>(
  text: string,
  params: ReadonlyArray<unknown> = []
) {
  const result = await pool.query<T>(text, [...params]);
  return result.rows;
}

export async function queryMaybeOne<T extends QueryResultRow>(
  text: string,
  params: ReadonlyArray<unknown> = []
) {
  const rows = await queryRows<T>(text, params);
  return rows[0] ?? null;
}

export async function queryOne<T extends QueryResultRow>(
  text: string,
  params: ReadonlyArray<unknown> = []
) {
  const row = await queryMaybeOne<T>(text, params);
  if (!row) {
    throw new Error("Expected one row but got none");
  }
  return row;
}

export async function execute(
  text: string,
  params: ReadonlyArray<unknown> = []
) {
  const result = await pool.query(text, [...params]);
  return result.rowCount ?? 0;
}

export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
