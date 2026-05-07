# PoliCare

# PoliCare: Clinic Management System - Technical Documentation

## 1. Introduction & System Overview

PoliCare is a comprehensive, modern web application designed to digitalize and streamline the administrative and clinical operations of a medical facility. The system provides role-based access for clinic staff (Front Desk and Super Admin), enabling them to manage patients, medical personnel, appointments, medical records, and generate analytical reports.

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

## 4. Database Schema & Data Modeling

The relational database is structured to represent the complex relationships within a medical clinic. Key entities include:

*   **User:** Represents clinic staff. Includes role-based access control (e.g., `SUPER_ADMIN`, `FRONT_DESK`).
*   **Patient:** Stores patient demographics, contact info, and medical history. Linked to a primary doctor.
*   **Doctor:** Contains physician details, specialty, and availability status. Linked to a specific Department.
*   **Department & Service:** Hierarchical structure where Departments (e.g., Cardiology) offer specific Services (e.g., EKG, Consultation), each with a defined duration and price.
*   **Appointment:** The central entity linking a Patient, Doctor, Department, and Service at a specific date and time. It tracks the lifecycle status (`IN_ASTEPTARE`, `CONFIRMAT`, `FINALIZAT`, etc.).
*   **MedicalRecord:** Stores post-consultation details (symptoms, diagnosis, prescription) linked to an appointment and a patient.
*   **Document:** Represents files uploaded to Azure Blob Storage, linked to a patient or specific medical record.
*   **Notification:** An audit log of all communications (Email/SMS) sent regarding appointments.
*   **ActivityLog:** A system-wide audit trail recording critical actions (creates, updates, merges) performed by users.
*   **Settings:** A singleton table storing global clinic configurations (working hours, contact details, notification preferences).

## 5. Core Features & Implementation Details

### 5.1. Authentication and Role-Based Access Control (RBAC)
Security is implemented using `NextAuth.js`. Upon successful login (verified against hashed passwords in the database), a JWT is generated containing the user's ID and Role. The application uses Next.js Middleware and layout guards to restrict access to certain routes. For instance, the "Users" management module is strictly isolated to the `SUPER_ADMIN` role.

### 5.2. Smart Appointment Management
The appointment system includes a sophisticated booking wizard. 
*   **Conflict Detection:** Before an appointment is confirmed, the system queries the database to ensure the chosen time slot does not overlap with existing appointments for the selected doctor, factoring in the dynamic duration of the specific medical service.
*   **Schedule Validation:** The system strictly enforces the clinic's global working hours and working days, preventing bookings outside of operational times or when a doctor is marked as `IN_CONCEDIU` (On Leave).

### 5.3. Real-Time Notifications (Server-Sent Events)
To keep the front desk staff updated instantly, the application implements Server-Sent Events (SSE) via the `/api/notifications/stream` endpoint. This maintains an open HTTP connection to push real-time alerts whenever a new appointment is booked online, updating the notification bell and drop-down without requiring a page refresh.

### 5.4. Patient Record Merging
To handle data duplication (e.g., when a patient registers multiple times), a complex database transaction is implemented. The `merge` API route securely transfers all relations (Appointments, Medical Records, Documents) from a source profile to a target profile, concatenates medical notes, deletes the redundant profile, and logs the action in the system's audit trail, all within a single, atomic Prisma transaction to guarantee data integrity.

### 5.5. Automated Communication System
The application features an event-driven notification orchestrator. When an appointment status changes (e.g., is confirmed or canceled), the system asynchronously triggers email (via Resend) and SMS (via Twilio) communications based on HTML and plain-text templates, logging the success or failure of each delivery attempt.

### 5.6. Analytics and Reporting
The reporting module aggregates data across multiple entities to generate insights (e.g., attendance rates, departmental load). It supports exporting these datasets into various formats:
*   **CSV:** Generated natively on the server.
*   **Excel:** Created using the `xlsx` library for rich spreadsheet data.
*   **PDF:** Generated on the client-side using `jspdf` and `jspdf-autotable`, providing professionally formatted, printable clinical reports.
