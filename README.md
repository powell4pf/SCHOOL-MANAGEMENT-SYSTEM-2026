# School Management System 2026

Edusync is a school administration web app built with Next.js, React, TypeScript, Better Auth, and PostgreSQL.

## Run the preview

```powershell
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Until a database is configured, the dashboard and Students page use clearly marked fictional preview data. Preview changes are not saved.

## Configure PostgreSQL and staff sign-in

1. Create a PostgreSQL database and a private connection string. The Better Auth and student migrations use this same database.
2. Copy the example environment file:

   ```powershell
   Copy-Item .env.example .env.local
   ```

3. Set `DATABASE_URL` in `.env.local`. Set `BETTER_AUTH_SECRET` to a random value with at least 32 characters. Generate one with:

   ```powershell
   node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
   ```

   Keep `.env.local` private and never commit it. Keep `BETTER_AUTH_URL=http://localhost:3000` for local development.

4. Apply the Better Auth tables, then the student tables:

   ```powershell
   npm run db:auth
   npm run db:students
   npm run db:school
   ```

5. Create the first administrator. The command prompts for the account details and password; it does not use a built-in default:

   ```powershell
   npm run db:create-admin
   ```

6. Start the app again with `npm run dev`, then sign in at [http://localhost:3000/sign-in](http://localhost:3000/sign-in).

### Staff roles

- **Admin** can read student records, see guardian contact details, add students, and manage staff accounts through the protected Better Auth admin API.
- **Teacher** can read the school student list and academic details. Guardian contact details and birth dates are withheld, and student records cannot be added or changed.
- Public account sign-up is disabled. Only an administrator should provision staff accounts.
- Admins can create and update teacher and staff directory entries, schedule events, exams, and school notices from the corresponding workspace pages. The dashboard reads live PostgreSQL counts and latest records and refreshes every 15 seconds.

To create a Teacher account from the trusted project machine, run `npm run db:create-teacher`. The Better Auth CLI prompts for the account details and password.

The database scripts require `.env.local` and a reachable PostgreSQL database. They fail with a clear message when the connection or required auth secret is missing.
