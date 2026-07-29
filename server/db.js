// Pooled Postgres connection via Supabase's transaction pooler (port 6543).
// All queries are parameterized — no string-built SQL.

import pg from 'pg';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export function query(text, params) {
  return pool.query(text, params);
}
