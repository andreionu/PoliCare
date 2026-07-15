# PoliCare — Clinic Management System

A full-stack clinic management web application built with Next.js. Provides dedicated portals for administrators, front-desk staff, doctors, and patients with role-based access control throughout.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router), React 18, TypeScript 5 |
| Styling | Tailwind CSS 4, shadcn/ui (Radix UI), Lucide icons, Framer Motion |
| Auth | NextAuth.js v4 — JWT sessions, credentials provider, bcryptjs |
| Database | PostgreSQL (Supabase) + Prisma ORM v7 |
| Email | Resend SDK |
| SMS | Twilio |
| File Storage | Azure Blob Storage (15-min SAS URL access) |
| Payments | Stripe (Checkout Sessions + Webhooks) |
| Charts | Recharts |
| Testing | Vitest 4 |

## Roles & Access

| Role | Portal |
|------|--------|
| `SUPER_ADMIN` | Full admin panel + user management |
| `FRONT_DESK` | Admin panel (no user management) |
| `DOCTOR` | Doctor portal only |
| `PATIENT` | Patient portal only |

## Features

### Admin Portal (`/`)

- **Dashboard** — live stats, 6-month appointment trend chart, real-time activity feed (SSE)
- **Patients** — list/search/add/delete; detail view with tabbed medical records, documents, and notes
- **Doctors** — list/add; detail with 7-day schedule management, patient list, recent appointments; provision login from admin panel
- **Appointments** — list + calendar view, add/edit/reschedule, confirm/decline, conflict detection, per-row notification badges and reminder buttons, bulk reminder dispatch
- **Departments** — full CRUD with color and icon; links to filtered doctor/appointment views
- **Services** — full CRUD; filter by name or department; price and duration per service
- **Users** — manage accounts, roles, and status; change password dialog
- **Reports** — live monthly stats, CSV/Excel/PDF export for patients, appointments, doctors, departments
- **Activity Log** — system-wide audit trail with today/week counts and active user stats
- **Settings** — clinic info, working hours, clickable working-day toggles, email/SMS notification toggles, reminder hours, change password

### Doctor Portal (`/doctor`)

- Dashboard with today's schedule and this week's overview
- Appointment list filtered to own appointments with status transitions (`CONFIRMAT → IN_DESFASURARE → FINALIZAT`)
- Patient list and read-only detail view per patient
- Add post-consultation medical records (symptoms, diagnosis, prescription, follow-up)

### Patient Portal (`/patient`)

- Dashboard with upcoming appointments and summary stats
- Appointment history; inline cancellation with confirmation step; 3-step booking dialog (department → doctor → timeslot)
- Document list with secure download via Azure SAS URLs (15-minute expiry)
- Billing — Stripe Checkout integration, payment status tracking

### Public Pages

- Landing page with clinic info, services overview, contact section
- 5-step public booking wizard (no login required)
- Patient self-registration (`/register`) — auto-links to existing patient record by email or phone

## Database Schema

```
User ──────────── Doctor (1:1 optional)
     └─────────── Patient (1:1 optional)

Department ──── Doctor ──── DoctorSchedule (7 days)
           ├── Service
           └── Appointment ─── Patient
                           ├── MedicalRecord ── Document
                           ├── Notification (Email/SMS log)
                           └── PaymentStatus (Stripe)

Settings  (singleton)
ActivityLog
```

**Key enums:**
- `AppointmentStatus`: `IN_ASTEPTARE` | `CONFIRMAT` | `IN_DESFASURARE` | `FINALIZAT` | `ANULAT` | `NEPREZENTARE`
- `PaymentStatus`: `UNPAID` | `PENDING` | `PAID` | `REFUNDED`
- `DoctorStatus`: `ACTIV` | `IN_CONCEDIU` | `INDISPONIBIL`
- `PatientStatus`: `NOU` | `ACTIV` | `PROGRAMAT` | `INACTIV`

## Environment Variables

Create a `.env` file in the project root:

```env
# Database (PostgreSQL / Supabase)
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_SECRET="your-secret"
NEXTAUTH_URL="http://localhost:3000"

# Email (Resend)
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="Clinica <noreply@yourdomain.com>"

# SMS (Twilio)
TWILIO_ACCOUNT_SID="AC..."
TWILIO_AUTH_TOKEN="..."
TWILIO_PHONE_NUMBER="+1..."

# Azure Blob Storage
AZURE_STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=https;..."
AZURE_STORAGE_CONTAINER_NAME="documents"
AZURE_STORAGE_ACCOUNT_NAME="your-account-name"
AZURE_STORAGE_ACCOUNT_KEY="your-account-key"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

## Getting Started

```bash
# Install dependencies
npm install

# Push schema to database
npx prisma db push

# Seed the database
npm run seed

# Start development server
npm run dev
```

App runs at [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run seed` | Seed database with sample data |
| `npm run menu` | Interactive launcher; option 1 installs, syncs DB, builds, and starts Next.js + Stripe |
| `npm test` | Run all tests |
| `npm run test:watch` | Vitest watch mode |
| `npm run test:coverage` | Coverage report |

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| GET, POST | `/api/patients` | List (search/filter) / create patients |
| GET, PUT, DELETE | `/api/patients/[id]` | Patient detail — role-gated |
| GET | `/api/patients/[id]/documents` | Patient documents |
| GET, POST | `/api/doctors` | List / create doctors |
| GET, PUT, DELETE | `/api/doctors/[id]` | Doctor detail |
| PUT | `/api/doctors/[id]/schedules` | Upsert 7-day schedule |
| POST | `/api/doctors/[id]/account` | Provision doctor login (SUPER_ADMIN) |
| GET, POST | `/api/appointments` | List / create appointments |
| GET, PUT, DELETE | `/api/appointments/[id]` | Appointment detail |
| GET | `/api/appointments/check` | Conflict detection |
| GET, POST | `/api/departments` | Departments CRUD |
| GET, PUT, DELETE | `/api/departments/[id]` | Department detail |
| GET, POST | `/api/services` | Services CRUD |
| GET, PUT, DELETE | `/api/services/[id]` | Service detail |
| GET, POST | `/api/medical-records` | Medical records CRUD |
| GET, PUT, DELETE | `/api/medical-records/[id]` | Medical record detail |
| GET, POST | `/api/users` | Users CRUD |
| GET, PUT, DELETE | `/api/users/[id]` | User detail |
| POST | `/api/users/change-password` | Change own password (verifies old) |
| GET, PUT | `/api/settings` | Clinic settings (singleton) |
| GET | `/api/reports/stats` | Live monthly stats + 6-month trend |
| GET | `/api/reports` | CSV export (patients/appointments/doctors/departments) |
| GET | `/api/activity` | Activity feed with counts |
| GET, POST | `/api/notifications` | Notification log |
| POST | `/api/notifications/reminders` | Send reminders (single `{appointmentId}` or bulk `{}`) |
| GET | `/api/notifications/stream` | SSE stream for real-time push |
| POST | `/api/auth/register` | Public patient self-registration |
| GET | `/api/documents/[id]/url` | Generate 15-min Azure SAS URL |
| DELETE | `/api/documents/[id]` | Delete document from Azure + DB |
| POST | `/api/payments/checkout` | Create Stripe Checkout Session |
| POST | `/api/payments/webhook` | Stripe webhook — update payment status |
| GET | `/api/doctor/dashboard` | Doctor portal dashboard data |
| GET | `/api/doctor/appointments` | Doctor's own appointments |
| GET | `/api/doctor/patients` | Doctor's patient list |
| GET | `/api/patient/dashboard` | Patient portal dashboard data |
| GET | `/api/patient/appointments` | Patient's own appointments |
| GET | `/api/patient/documents` | Patient's documents |

## Testing

81 tests with Vitest and mocked Prisma covering:

- Business logic — attendance rate, time calculations, input validation
- API routes — patients, appointments (conflict detection), departments, settings, notifications

```bash
npm test
```

## Mobile

Doctor and Patient portals are built mobile-first:
- Fixed top header with logo and user avatar
- Hamburger slide-down navigation menu
- Bottom tab bar with shortcuts to the most-used sections

Admin panel and landing page are fully responsive across all breakpoints.
