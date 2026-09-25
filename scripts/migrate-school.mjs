import nextEnv from "@next/env";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { Pool } from "pg";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is missing. Set it in .env.local first.");
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1, connectionTimeoutMillis: 5000 });
try {
  const sql = await readFile(join(process.cwd(), "db", "migrations", "0002_school_modules.sql"), "utf8");
  await pool.query(sql);
  console.log("Teacher, staff, schedule, exam, and notice tables are ready.");
} catch (error) {
  console.error("School modules migration failed. Confirm PostgreSQL is running and the auth tables exist.");
  console.error(error instanceof Error ? error.message : "Unknown database error.");
  process.exitCode = 1;
} finally {
  await pool.end();
}
