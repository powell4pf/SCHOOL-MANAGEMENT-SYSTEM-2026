import { betterAuth } from "better-auth";
import { admin as adminPlugin } from "better-auth/plugins";
import { createAccessControl } from "better-auth/plugins/access";
import { adminAc, defaultStatements, userAc } from "better-auth/plugins/admin/access";
import { pool } from "@/lib/database";

const schoolStatements = {
  ...defaultStatements,
  student: ["create", "read", "update", "delete"],
} as const;

const schoolAccess = createAccessControl(schoolStatements);

export const schoolRoles = {
  admin: schoolAccess.newRole({
    ...adminAc.statements,
    student: ["create", "read", "update", "delete"],
  }),
  teacher: schoolAccess.newRole({
    ...userAc.statements,
    student: ["read"],
  }),
};

const localOnlySecret = "local-development-secret-set-a-random-production-secret";

export const auth = betterAuth({
  appName: "Edusync School Management",
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET ?? localOnlySecret,
  trustedOrigins: [process.env.BETTER_AUTH_URL ?? "http://localhost:3000"],
  database: pool,
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    autoSignIn: false,
    minPasswordLength: 12,
    maxPasswordLength: 128,
  },
  session: {
    expiresIn: 60 * 60 * 12,
    updateAge: 60 * 60 * 4,
  },
  advanced: {
    database: { generateId: "uuid" },
    useSecureCookies: process.env.NODE_ENV === "production",
  },
  plugins: [adminPlugin({
    ac: schoolAccess,
    roles: schoolRoles,
    defaultRole: "teacher",
    adminRoles: ["admin"],
  })],
});

export function isAuthConfigured() {
  const databaseUrl = process.env.DATABASE_URL;
  const secret = process.env.BETTER_AUTH_SECRET;
  const baseUrl = process.env.BETTER_AUTH_URL;
  if (!databaseUrl || !secret || secret.length < 32 || !baseUrl) return false;
  try {
    const parsedDatabaseUrl = new URL(databaseUrl);
    const parsedBaseUrl = new URL(baseUrl);
    return ["postgres:", "postgresql:"].includes(parsedDatabaseUrl.protocol)
      && ["http:", "https:"].includes(parsedBaseUrl.protocol);
  } catch {
    return false;
  }
}

export type SchoolRole = keyof typeof schoolRoles;
