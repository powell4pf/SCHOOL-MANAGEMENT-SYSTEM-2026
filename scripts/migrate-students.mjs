import { loadEnvConfig } from "@next/env";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { Pool } from "pg";

loadEnvConfig(process.cwd());

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is missing. Set it in .env.local first.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1,
  connectionTimeoutMillis: 5_000,
});

try {
  const migration = await readFile(join(process.cwd(), "db", "migrations", "0001_students.sql"), "utf8");
  await pool.query(migration);
  console.log("Student tables and indexes are ready.");
} catch (error) {
  console.error("Student migration failed. Confirm the database is reachable and Better Auth tables have been created.");
  console.error(error instanceof Error ? error.message : "Unknown database error.");
  process.exitCode = 1;
} finally {
  await pool.end();
}
