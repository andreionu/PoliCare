# PoliCare

# PoliCare: Clinic Management System - Technical Documentation

## 1. Introduction & System Overview

PoliCare is a comprehensive, modern web application designed to digitalize and streamline the administrative and clinical operations of a medical facility. The system provides role-based access for four distinct user types — Super Admin, Front Desk staff, Doctors, and Patients — enabling each to interact with their own dedicated portal tailored to their responsibilities.

The application is built as a single-page application (SPA) with Server-Side Rendering (SSR) capabilities, leveraging a modern JavaScript/TypeScript ecosystem to ensure high performance, scalability, and an intuitive user experience.

## 2. Architecture

The project follows a monolithic architecture built on top of the **Next.js** framework, utilizing the modern **App Router** paradigm. This architecture allows for a seamless integration of frontend components and backend API routes within the same codebase, reducing network latency and simplifying deployment.

*   **Frontend (Client-Side):** Responsible for the user interface, state management, and real-time interactions. It uses React Server Components (RSC) where possible to reduce the client-side JavaScript bundle size, falling back to Client Components (`"use client"`) for interactive elements.
*   **Backend (Server-Side):** Comprises Next.js API Routes (`app/api/...`) which act as a RESTful API. These routes handle business logic, database transactions, third-party integrations (email, SMS, cloud storage), and authentication.
*   **Data Layer:** Connects the backend to the relational database using an Object-Relational Mapper (ORM), ensuring type safety and protecting against SQL injection attacks.

## 3. Technology Stack

The technology stack was carefully selected to meet modern industry standards, focusing on type safety, developer experience, and application performance.

### 3.1. Core Technologies
*   **Framework:** **Next.js 16.1** (React 18) - Chosen for its App Router, built-in API routes, and optimized rendering strategies (SSR/SSG).
*   **Language:** **TypeScript (v5)** - Enforces static typing across the entire stack, significantly reducing runtime errors and improving code maintainability.
*   **Runtime Environment:** Node.js.

### 3.2. Database & Data Management
*   **Database:** **PostgreSQL** - A robust, open-source relational database system used to store all application data securely.
*   **ORM:** **Prisma (v7.8)** - Provides a type-safe database client and schema migration tool. It bridges the gap between TypeScript objects and relational database tables.
*   **Connection Pooling:** `pg` and `@prisma/adapter-pg` are used to manage database connections efficiently, which is crucial for serverless or edge deployments.

### 3.3. Frontend & User Interface
*   **Styling:** **Tailwind CSS (v4)** - A utility-first CSS framework that allows for rapid, responsive, and consistent UI development without leaving the HTML/JSX.
*   **UI Components:** **Radix UI** primitives and custom components built with a design system approach (similar to `shadcn/ui`). These provide accessible, unstyled foundation components.
*   **Icons:** **Lucide React** - A comprehensive library of SVG icons.
*   **Animations:** **Framer Motion** - Used for fluid, hardware-accelerated micro-interactions and page transitions, enhancing the overall user experience (UX).
*   **Forms & Validation:** **React Hook Form** combined with **Zod** schema validation. This ensures that data is validated both on the client-side (for immediate feedback) and server-side (for security).
*   **Charts & Visualizations:** **Recharts** - A composable charting library built on React components, used for the administrative dashboard analytics.

### 3.4. Backend Services & Cloud Integrations
*   **Authentication:** **NextAuth.js** - Handles secure user authentication using a custom Credentials provider backed by JWT (JSON Web Tokens). Passwords are cryptographically hashed using `bcryptjs`.
*   **Email Notifications:** **Resend** - A modern email delivery API used to send appointment confirmations, cancellations, and reminders securely.
*   **SMS Notifications:** **Twilio** - Integrated to provide immediate SMS alerts to patients regarding their appointments.
*   **Cloud Storage:** **Azure Blob Storage** (`@azure/storage-blob`) - Utilized for secure, scalable storage of patient medical documents and attachments, ensuring sensitive files are not stored directly on the application server.
*   **Payments:** **Stripe** - Handles online appointment payments via Stripe Checkout Sessions (server-side), with webhook verification for reliable payment status updates.

## 4. Database Schema & Data Modeling

The relational database is structured to represent the complex relationships within a medical clinic. Key entities include:

*   **User:** Represents any authenticated system user across all four roles (`SUPER_ADMIN`, `FRONT_DESK`, `DOCTOR`, `PATIENT`). Doctor and Patient records carry an optional `userId` foreign key to link their domain profile to a login account.
*   **Patient:** Stores patient demographics, contact info, and medical history. Linked to a primary doctor. Can self-register and log in via the patient portal.
*   **Doctor:** Contains physician details, specialty, and availability status. Linked to a specific Department. Login credentials are provisioned by a Super Admin.
*   **Department & Service:** Hierarchical structure where Departments (e.g., Cardiology) offer specific Services (e.g., EKG, Consultation), each with a defined duration and price.
*   **Appointment:** The central entity linking a Patient, Doctor, Department, and Service at a specific date and time. It tracks the lifecycle status (`IN_ASTEPTARE`, `CONFIRMAT`, `FINALIZAT`, etc.) and payment status (`UNPAID`, `PENDING`, `PAID`, `REFUNDED`) with an optional Stripe session reference.
*   **MedicalRecord:** Stores post-consultation details (symptoms, diagnosis, prescription) linked to an appointment and a patient.
*   **Document:** Represents files uploaded to Azure Blob Storage, linked to a patient or specific medical record.
*   **Notification:** An audit log of all communications (Email/SMS) sent regarding appointments.
*   **ActivityLog:** A system-wide audit trail recording critical actions (creates, updates, merges) performed by users.
*   **Settings:** A singleton table storing global clinic configurations (working hours, contact details, notification preferences).

## 5. Core Features & Implementation Details

### 5.1. Authentication and Role-Based Access Control (RBAC)
Security is implemented using `NextAuth.js`. Upon successful login (verified against hashed passwords in the database), a JWT is generated containing the user's ID and Role. The application uses Next.js Middleware (`middleware.ts`) with `getToken` from `next-auth/jwt` and layout guards to restrict access to routes server-side. The full role hierarchy is:

| Role | Access |
|---|---|
| `SUPER_ADMIN` | Full admin panel + user management |
| `FRONT_DESK` | Admin panel (no user management) |
| `DOCTOR` | Doctor portal only |
| `PATIENT` | Patient portal only |

Doctor and Patient records are linked to their corresponding User accounts (`userId` field), allowing the JWT to carry `doctorId` / `patientId` for scoped API access. Admin staff can provision a login account for any doctor directly from the admin panel.

### 5.2. Multi-Role Portals

#### Doctor Portal (`/doctor/...`)
A dedicated interface for physicians, accessible only with the `DOCTOR` role:
*   **Dashboard** — overview of today's appointments and this week's schedule at a glance.
*   **Appointments** — full list with date/status filters and inline status transition buttons (`CONFIRMAT → IN_DESFASURARE → FINALIZAT`), each guarded so a doctor can only update their own appointments.
*   **My Patients** — list of patients linked via primary doctor assignment or appointment history, with a read-only detail view per patient.
*   **Schedule Management** — a 7-day grid where the doctor can toggle working days and set start/end hours; changes are saved via `PUT /api/doctors/[id]/schedules` with ownership verification.
*   **Medical Record Creation** — doctors can add post-consultation records (symptoms, diagnosis, treatment, prescription, follow-up) directly from a patient's profile.

#### Patient Portal (`/patient/...`)
A self-service interface for patients:
*   **Dashboard** — upcoming appointments and recent notifications.
*   **My Appointments** — full history with status filter, inline appointment cancellation (with confirmation step), and a 3-step booking dialog (department → doctor → date/time slot → summary) that checks schedule and conflict rules in real time.
*   **My Documents** — list of uploaded medical documents with secure download via time-limited Azure SAS URLs (15-minute expiry, role-checked).
*   **My Profile** — view and edit personal details (name, phone, email, address) and change password.

### 5.3. Patient Self-Registration
Patients can create their own account from the landing page without admin involvement:
*   Public `POST /api/auth/register` endpoint validates input, hashes the password with `bcryptjs`, and creates a `User` with the `PATIENT` role.
*   If a `Patient` record with matching email or phone already exists in the system (e.g. created by front desk), the new user account is automatically linked to it — no duplicate records are created.
*   A login/register modal on the landing page provides a smooth in-page authentication experience without a full navigation away, while the standalone `/login` and `/register` pages remain available for direct URL access.

### 5.4. Smart Appointment Management
The appointment system includes a sophisticated booking wizard.
*   **Conflict Detection:** Before an appointment is confirmed, the system queries the database to ensure the chosen time slot does not overlap with existing appointments for the selected doctor, factoring in the dynamic duration of the specific medical service.
*   **Schedule Validation:** The system strictly enforces the clinic's global working hours and working days, preventing bookings outside of operational times or when a doctor is marked as `IN_CONCEDIU` (On Leave).

### 5.5. Stripe Payment Integration
Patients can pay for appointments directly from their portal:
*   A `POST /api/payments/checkout` route creates a Stripe Checkout Session in RON for the appointment's service price and returns a redirect URL.
*   The appointment's `paymentStatus` field (`UNPAID → PENDING → PAID`) is updated via a Stripe webhook (`/api/payments/webhook`) that verifies the request signature before processing.
*   If a checkout session expires without payment, the status is reset to `UNPAID` automatically.
*   Payment status is surfaced in both the patient portal and the admin appointments list with colour-coded badges.

### 5.6. Real-Time Notifications (Server-Sent Events)
To keep the front desk staff updated instantly, the application implements Server-Sent Events (SSE) via the `/api/notifications/stream` endpoint. This maintains an open HTTP connection to push real-time alerts whenever a new appointment is booked online, updating the notification bell and drop-down without requiring a page refresh.

### 5.7. Patient Record Merging
To handle data duplication (e.g., when a patient registers multiple times), a complex database transaction is implemented. The `merge` API route securely transfers all relations (Appointments, Medical Records, Documents) from a source profile to a target profile, concatenates medical notes, deletes the redundant profile, and logs the action in the system's audit trail, all within a single, atomic Prisma transaction to guarantee data integrity.

### 5.8. Automated Communication System
The application features an event-driven notification orchestrator. When an appointment status changes (e.g., is confirmed or canceled), the system asynchronously triggers email (via Resend) and SMS (via Twilio) communications based on HTML and plain-text templates, logging the success or failure of each delivery attempt. Global toggles and reminder timing are configurable from the admin Settings page.

### 5.9. Secure Document Storage
Patient medical documents are stored in **Azure Blob Storage**. Access is never direct — the backend generates short-lived SAS (Shared Access Signature) URLs valid for 15 minutes, tied to the requesting user's role and patient relationship, ensuring documents cannot be shared or hotlinked beyond their intended recipient. Documents can be uploaded by admin/front-desk staff and deleted with simultaneous blob + database record removal.

### 5.10. Analytics and Reporting
The reporting module aggregates data across multiple entities to generate insights (e.g., attendance rates, departmental load). It supports exporting these datasets into various formats:
*   **CSV:** Generated natively on the server.
*   **Excel:** Created using the `xlsx` library for rich spreadsheet data.
*   **PDF:** Generated on the client-side using `jspdf` and `jspdf-autotable`, providing professionally formatted, printable clinical reports.

## 6. Mobile Experience

Both the Doctor and Patient portals are built mobile-first with a three-layer navigation pattern:
*   **Fixed top header** — logo, portal name, and user avatar.
*   **Slide-down menu** — full nav list revealed by the hamburger button, auto-closes on route change.
*   **Bottom tab bar** — persistent shortcuts to the most-used sections (Dashboard, Appointments, Patients/Documents), matching native mobile app conventions.

The admin panel and public landing page are fully responsive using Tailwind CSS breakpoints, with the landing page header collapsing to a mobile drawer containing nav links, auth buttons, and the quick-booking CTA.
