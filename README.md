# Attendly

Attendly is a multi-tenant QR attendance and participation management SaaS built with Next.js App Router, TypeScript, Prisma, and Tailwind CSS.

The demo flow proves the core attendance loop: an admin or instructor starts an attendance session, generates a time-limited QR code, a student scans it, shares location, and the system records attendance only when the student is inside the configured geofence.

## Project Shape

- `app/(public)` contains public marketing and legal routes.
- `app/(auth)` contains authentication-facing routes.
- `app/(admin)`, `app/(instructor)`, and `app/(student)` contain role-oriented application areas.
- `components` contains reusable layout and UI foundations.
- `config`, `constants`, `lib`, and `types` hold shared product configuration and low-level helpers.

## Local Database Bootstrap

```bash
npm install
cp .env.example .env
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

Set `NEXT_PUBLIC_APP_URL` in `.env` to the origin students will open from QR codes. For local development, the default is:

```env
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

The seed creates one organization and three development users:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@attendly.local` | `AttendlyDev123!` |
| Instructor | `instructor@attendly.local` | `AttendlyDev123!` |
| Student | `student@attendly.local` | `AttendlyDev123!` |

Seed data also includes a demo organization, instructor, student, course, section, enrollment, room geofence, and one active attendance session named `Demo Yoklama Oturumu`.

## Demo Checklist

1. Sign in as `admin@attendly.local` or `instructor@attendly.local`.
2. Open an attendance session and start it if it is not active.
3. Generate the QR code from the session detail page.
4. Sign in as `student@attendly.local` on a phone and scan the QR code.
5. Tap `Yoklamaya Katıl` and allow location access.
6. Refresh the admin or instructor session detail page to see the attendance result, distance, and geofence status.
