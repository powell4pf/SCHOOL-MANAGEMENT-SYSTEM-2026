import { Pool } from "pg";

const globalForPg = globalThis as typeof globalThis & { schoolPool?: Pool };

export const pool = globalForPg.schoolPool ?? new Pool({
  // The placeholder is never used for queries: protected code checks setup first.
  connectionString: process.env.DATABASE_URL ?? "postgresql://unconfigured:unconfigured@127.0.0.1:5432/edusync",
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

if (process.env.NODE_ENV !== "production") globalForPg.schoolPool = pool;
