# Attendly

Attendly is a multi-tenant QR attendance and participation management SaaS scaffolded with Next.js App Router, TypeScript, and Tailwind CSS.

This initial architecture focuses on route organization, layout foundations, shared UI primitives, and placeholder pages. Auth, Prisma, QR scanning, attendance workflows, and reporting logic are intentionally left for later increments.

## Project Shape

- `app/(public)` contains public marketing and legal routes.
- `app/(auth)` contains authentication-facing routes.
- `app/(admin)`, `app/(instructor)`, and `app/(student)` contain role-oriented application areas.
- `components` contains reusable layout and UI foundations.
- `config`, `constants`, `lib`, and `types` hold shared product configuration and low-level helpers.
