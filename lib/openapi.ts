type OpenApiSpec = {
  openapi: string
  info: object
  servers: object[]
  components: object
  security: object[]
  tags: object[]
  paths: Record<string, object>
}

export const openApiSpec: OpenApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "PoliCare Clinic API",
    version: "1.0.0",
    description:
      "REST API for the PoliCare clinic management system. " +
      "Authentication uses NextAuth.js session cookies (JWT strategy, 24h). " +
      "Log in via POST /api/auth/callback/credentials to obtain the session cookie, " +
      "then use 'Try it out' in the same browser session.",
    contact: { name: "PoliCare Dev Team" },
  },
  servers: [{ url: "/api", description: "Current server" }],
  security: [{ cookieAuth: [] }],
  tags: [
    { name: "Patients", description: "Patient management" },
    { name: "Doctors", description: "Doctor profiles and schedules" },
    { name: "Appointments", description: "Appointment booking and management" },
    { name: "Services", description: "Medical services catalog" },
    { name: "Departments", description: "Clinic departments" },
    { name: "Medical Records", description: "Patient medical history" },
    { name: "Documents", description: "Patient document storage (Azure Blob)" },
    { name: "Users", description: "User account management" },
    { name: "Reports", description: "CSV/Excel report generation and analytics" },
    { name: "Activity", description: "Audit activity log" },
    { name: "Settings", description: "Clinic settings" },
    { name: "Notifications", description: "Notification logs and reminders" },
    { name: "Payments", description: "Payment tracking (Stripe)" },
    { name: "Auth", description: "Authentication and registration" },
    { name: "Prescriptions", description: "Medical prescriptions (Rețete medicale)" },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "next-auth.session-token",
        description: "NextAuth.js JWT session cookie. Log in via the app UI first, then use Try It Out in the same browser session.",
      },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          error: { type: "string", example: "Not found" },
        },
      },
      Medication: {
        type: "object",
        properties: {
          name: { type: "string", example: "Amlodipina" },
          concentration: { type: "string", example: "10mg tablete" },
          quantity: { type: "string", example: "2 cutii" },
          dosage: { type: "string", example: "1 cp/zi dimineața" },
          duration: { type: "string", example: "30 zile" },
        },
      },
      Prescription: {
        type: "object",
        properties: {
          id: { type: "string", example: "clxyz1234" },
          number: { type: "string", example: "RX-2026-0001" },
          patientId: { type: "string" },
          doctorId: { type: "string" },
          appointmentId: { type: "string", nullable: true },
          diagnosis: { type: "string", example: "Hipertensiune arterială grad II" },
          medications: { type: "array", items: { "$ref": "#/components/schemas/Medication" } },
          notes: { type: "string", nullable: true },
          status: { type: "string", enum: ["ACTIVA", "EXPIRATA", "ANULATA"] },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      PrescriptionInput: {
        type: "object",
        required: ["patientId", "diagnosis", "medications"],
        properties: {
          patientId: { type: "string" },
          appointmentId: { type: "string" },
          diagnosis: { type: "string" },
          medications: { type: "array", items: { "$ref": "#/components/schemas/Medication" }, minItems: 1 },
          notes: { type: "string" },
        },
      },
      Patient: {
        type: "object",
        properties: {
          id: { type: "string", example: "clxyz1234" },
          name: { type: "string", example: "Ion Popescu" },
          email: { type: "string", format: "email", nullable: true },
          phone: { type: "string", nullable: true, example: "0721000001" },
          cnp: { type: "string", nullable: true, example: "1900101123456" },
          dateOfBirth: { type: "string", format: "date-time", nullable: true },
          age: { type: "integer", nullable: true },
          gender: { type: "string", enum: ["MASCULIN", "FEMININ", "ALTUL"], nullable: true },
          address: { type: "string", nullable: true },
          status: { type: "string", enum: ["NOU", "ACTIV", "PROGRAMAT", "INACTIV"] },
          notes: { type: "string", nullable: true },
          primaryDoctorId: { type: "string", nullable: true },
          userId: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      PatientInput: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string" },
          email: { type: "string", format: "email" },
          phone: { type: "string" },
          cnp: { type: "string" },
          dateOfBirth: { type: "string", format: "date-time" },
          age: { type: "integer" },
          gender: { type: "string", enum: ["MASCULIN", "FEMININ", "ALTUL"] },
          address: { type: "string" },
          status: { type: "string", enum: ["NOU", "ACTIV", "PROGRAMAT", "INACTIV"] },
          notes: { type: "string" },
          primaryDoctorId: { type: "string" },
        },
      },
      Doctor: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string", example: "Dr. Maria Ionescu" },
          email: { type: "string", format: "email", nullable: true },
          phone: { type: "string", nullable: true },
          avatar: { type: "string", nullable: true },
          gender: { type: "string", enum: ["MASCULIN", "FEMININ", "ALTUL"], nullable: true },
          specialty: { type: "string", nullable: true },
          experience: { type: "integer", nullable: true },
          rating: { type: "number", nullable: true },
          status: { type: "string", enum: ["ACTIV", "IN_CONCEDIU", "INDISPONIBIL"] },
          bio: { type: "string", nullable: true },
          departmentId: { type: "string", nullable: true },
          userId: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      DoctorInput: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string" },
          email: { type: "string", format: "email" },
          phone: { type: "string" },
          gender: { type: "string", enum: ["MASCULIN", "FEMININ", "ALTUL"] },
          specialty: { type: "string" },
          experience: { type: "integer" },
          bio: { type: "string" },
          avatar: { type: "string" },
          status: { type: "string", enum: ["ACTIV", "IN_CONCEDIU", "INDISPONIBIL"] },
          departmentId: { type: "string" },
        },
      },
      DoctorSchedule: {
        type: "object",
        properties: {
          id: { type: "string" },
          doctorId: { type: "string" },
          dayOfWeek: { type: "integer", minimum: 0, maximum: 6, description: "0=Sun, 1=Mon, ..., 6=Sat" },
          startTime: { type: "string", example: "09:00" },
          endTime: { type: "string", example: "17:00" },
          isActive: { type: "boolean" },
        },
      },
      Appointment: {
        type: "object",
        properties: {
          id: { type: "string" },
          patientId: { type: "string" },
          doctorId: { type: "string" },
          departmentId: { type: "string", nullable: true },
          serviceId: { type: "string", nullable: true },
          date: { type: "string", format: "date-time" },
          startTime: { type: "string", example: "09:00", nullable: true },
          endTime: { type: "string", example: "09:30", nullable: true },
          duration: { type: "integer", description: "Duration in minutes" },
          status: {
            type: "string",
            enum: ["IN_ASTEPTARE", "CONFIRMAT", "IN_DESFASURARE", "FINALIZAT", "ANULAT", "NEPREZENTARE"],
          },
          type: { type: "string", nullable: true },
          notes: { type: "string", nullable: true },
          paymentStatus: { type: "string", enum: ["UNPAID", "PENDING", "PAID", "REFUNDED"], nullable: true },
          stripeSessionId: { type: "string", nullable: true },
          stripePaymentIntentId: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      AppointmentInput: {
        type: "object",
        required: ["patientId", "doctorId", "date"],
        properties: {
          patientId: { type: "string" },
          doctorId: { type: "string" },
          departmentId: { type: "string" },
          serviceId: { type: "string" },
          date: { type: "string", format: "date-time" },
          startTime: { type: "string", example: "09:00" },
          endTime: { type: "string", example: "09:30" },
          duration: { type: "integer" },
          status: { type: "string", enum: ["IN_ASTEPTARE", "CONFIRMAT", "IN_DESFASURARE", "FINALIZAT", "ANULAT", "NEPREZENTARE"] },
          type: { type: "string" },
          notes: { type: "string" },
          sendEmail: { type: "boolean", description: "Send email notification on status change" },
          sendSMS: { type: "boolean", description: "Send SMS notification on status change" },
        },
      },
      Department: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          description: { type: "string", nullable: true },
          color: { type: "string", nullable: true },
          icon: { type: "string", nullable: true },
          status: { type: "string", enum: ["ACTIV", "INACTIV"], nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      DepartmentInput: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          color: { type: "string" },
          icon: { type: "string" },
          status: { type: "string", enum: ["ACTIV", "INACTIV"] },
        },
      },
      Service: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          description: { type: "string", nullable: true },
          duration: { type: "integer", description: "Duration in minutes" },
          price: { type: "number", nullable: true },
          isActive: { type: "boolean" },
          departmentId: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      ServiceInput: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          duration: { type: "integer" },
          price: { type: "number" },
          isActive: { type: "boolean" },
          departmentId: { type: "string" },
        },
      },
      MedicalRecord: {
        type: "object",
        properties: {
          id: { type: "string" },
          patientId: { type: "string" },
          appointmentId: { type: "string", nullable: true },
          visitDate: { type: "string", format: "date-time", nullable: true },
          symptoms: { type: "string", nullable: true },
          diagnosis: { type: "string", nullable: true },
          treatment: { type: "string", nullable: true },
          prescription: { type: "string", nullable: true },
          notes: { type: "string", nullable: true },
          followUpRequired: { type: "boolean" },
          followUpDate: { type: "string", format: "date-time", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      MedicalRecordInput: {
        type: "object",
        required: ["patientId"],
        properties: {
          patientId: { type: "string" },
          appointmentId: { type: "string" },
          visitDate: { type: "string", format: "date-time" },
          symptoms: { type: "string" },
          diagnosis: { type: "string" },
          treatment: { type: "string" },
          prescription: { type: "string" },
          notes: { type: "string" },
          followUpRequired: { type: "boolean" },
          followUpDate: { type: "string", format: "date-time" },
        },
      },
      Document: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          url: { type: "string", nullable: true },
          blobName: { type: "string", nullable: true },
          type: { type: "string", nullable: true },
          size: { type: "integer", nullable: true },
          patientId: { type: "string" },
          medicalRecordId: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      User: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string", nullable: true },
          email: { type: "string", format: "email" },
          phone: { type: "string", nullable: true },
          role: { type: "string", enum: ["SUPER_ADMIN", "FRONT_DESK", "DOCTOR", "PATIENT", "MARKETING"] },
          status: { type: "string", enum: ["ACTIVE", "INACTIVE"] },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      UserInput: {
        type: "object",
        required: ["email"],
        properties: {
          name: { type: "string" },
          email: { type: "string", format: "email" },
          phone: { type: "string" },
          password: { type: "string", format: "password" },
          role: { type: "string", enum: ["SUPER_ADMIN", "FRONT_DESK", "DOCTOR", "PATIENT", "MARKETING"] },
          status: { type: "string", enum: ["ACTIVE", "INACTIVE"] },
        },
      },
      Notification: {
        type: "object",
        properties: {
          id: { type: "string" },
          type: { type: "string", enum: ["EMAIL", "SMS"] },
          event: { type: "string", enum: ["CONFIRMATION", "CANCELLATION", "REMINDER", "CUSTOM", "BOOKING_RECEIVED"] },
          status: { type: "string", enum: ["SENT", "FAILED"] },
          recipient: { type: "string" },
          message: { type: "string", nullable: true },
          error: { type: "string", nullable: true },
          appointmentId: { type: "string", nullable: true },
          sentAt: { type: "string", format: "date-time" },
        },
      },
      Settings: {
        type: "object",
        properties: {
          id: { type: "string" },
          clinicName: { type: "string", nullable: true },
          clinicPhone: { type: "string", nullable: true },
          clinicEmail: { type: "string", nullable: true },
          clinicAddress: { type: "string", nullable: true },
          emailNotifications: { type: "boolean" },
          smsNotifications: { type: "boolean" },
          defaultAppointmentDuration: { type: "integer" },
          workdayStart: { type: "string", example: "08:00" },
          workdayEnd: { type: "string", example: "18:00" },
          workingDays: { type: "string", nullable: true },
          reminderEnabled: { type: "boolean" },
          reminderHoursBefore: { type: "integer" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      ActivityLog: {
        type: "object",
        properties: {
          id: { type: "string" },
          action: { type: "string" },
          entity: { type: "string", nullable: true },
          entityId: { type: "string", nullable: true },
          description: { type: "string", nullable: true },
          metadata: { type: "object", nullable: true },
          ipAddress: { type: "string", nullable: true },
          userId: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
        },
      },
    },
  },
  paths: {
    // ── Patients ──────────────────────────────────────────────────────────────
    "/patients": {
      get: {
        tags: ["Patients"],
        summary: "List all patients",
        description: "Returns patients. When `page` is supplied, returns paginated response; otherwise returns a flat array.",
        parameters: [
          { name: "search", in: "query", schema: { type: "string" }, description: "Search by name, email, or phone" },
          { name: "phone", in: "query", schema: { type: "string" } },
          { name: "email", in: "query", schema: { type: "string" } },
          { name: "doctorId", in: "query", schema: { type: "string" } },
          { name: "page", in: "query", schema: { type: "integer", minimum: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 20 } },
        ],
        responses: {
          "200": {
            description: "Patients list",
            content: {
              "application/json": {
                schema: {
                  oneOf: [
                    { type: "array", items: { "$ref": "#/components/schemas/Patient" } },
                    {
                      type: "object",
                      properties: {
                        data: { type: "array", items: { "$ref": "#/components/schemas/Patient" } },
                        total: { type: "integer" },
                        page: { type: "integer" },
                        totalPages: { type: "integer" },
                      },
                    },
                  ],
                },
              },
            },
          },
          "500": { description: "Server error", content: { "application/json": { schema: { "$ref": "#/components/schemas/Error" } } } },
        },
      },
      post: {
        tags: ["Patients"],
        summary: "Create a patient",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { "$ref": "#/components/schemas/PatientInput" } } },
        },
        responses: {
          "201": { description: "Created", content: { "application/json": { schema: { "$ref": "#/components/schemas/Patient" } } } },
          "409": {
            description: "CNP conflict",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: { type: "string" },
                    existingPatientId: { type: "string" },
                    isConflict: { type: "boolean" },
                  },
                },
              },
            },
          },
          "500": { description: "Server error", content: { "application/json": { schema: { "$ref": "#/components/schemas/Error" } } } },
        },
      },
    },
    "/patients/merge": {
      post: {
        tags: ["Patients"],
        summary: "Merge two patient records",
        description: "Moves all appointments, medical records and documents from source to target patient, then deletes the source.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["sourcePatientId", "targetPatientId"],
                properties: {
                  sourcePatientId: { type: "string" },
                  targetPatientId: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Merged", content: { "application/json": { schema: { type: "object", properties: { message: { type: "string" } } } } } },
          "400": { description: "Same patient or missing params", content: { "application/json": { schema: { "$ref": "#/components/schemas/Error" } } } },
          "404": { description: "Patient not found", content: { "application/json": { schema: { "$ref": "#/components/schemas/Error" } } } },
        },
      },
    },
    "/patients/{id}": {
      get: {
        tags: ["Patients"],
        summary: "Get a patient",
        description: "PATIENT role can only see own record. DOCTOR can only see their own patients.",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Patient with appointments, medical records, and documents", content: { "application/json": { schema: { "$ref": "#/components/schemas/Patient" } } } },
          "401": { description: "Unauthorized" },
          "403": { description: "Forbidden" },
          "404": { description: "Not found", content: { "application/json": { schema: { "$ref": "#/components/schemas/Error" } } } },
        },
      },
      put: {
        tags: ["Patients"],
        summary: "Update a patient",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { "$ref": "#/components/schemas/PatientInput" } } },
        },
        responses: {
          "200": { description: "Updated", content: { "application/json": { schema: { "$ref": "#/components/schemas/Patient" } } } },
          "409": { description: "CNP conflict", content: { "application/json": { schema: { "$ref": "#/components/schemas/Error" } } } },
          "500": { description: "Server error", content: { "application/json": { schema: { "$ref": "#/components/schemas/Error" } } } },
        },
      },
      delete: {
        tags: ["Patients"],
        summary: "Delete a patient",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Deleted", content: { "application/json": { schema: { type: "object", properties: { message: { type: "string" } } } } } },
          "500": { description: "Server error", content: { "application/json": { schema: { "$ref": "#/components/schemas/Error" } } } },
        },
      },
    },
    "/patients/{id}/documents": {
      get: {
        tags: ["Patients"],
        summary: "List documents for a patient",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Documents", content: { "application/json": { schema: { type: "array", items: { "$ref": "#/components/schemas/Document" } } } } },
          "401": { description: "Unauthorized" },
        },
      },
    },

    // ── Doctors ──────────────────────────────────────────────────────────────
    "/doctors": {
      get: {
        tags: ["Doctors"],
        summary: "List all doctors",
        parameters: [
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "departmentId", in: "query", schema: { type: "string" } },
          { name: "status", in: "query", schema: { type: "string", enum: ["ACTIV", "IN_CONCEDIU", "INDISPONIBIL"] } },
          { name: "page", in: "query", schema: { type: "integer" } },
          { name: "limit", in: "query", schema: { type: "integer" } },
        ],
        responses: {
          "200": { description: "Doctors list", content: { "application/json": { schema: { type: "array", items: { "$ref": "#/components/schemas/Doctor" } } } } },
          "500": { description: "Server error", content: { "application/json": { schema: { "$ref": "#/components/schemas/Error" } } } },
        },
      },
      post: {
        tags: ["Doctors"],
        summary: "Create a doctor",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { "$ref": "#/components/schemas/DoctorInput" } } },
        },
        responses: {
          "201": { description: "Created", content: { "application/json": { schema: { "$ref": "#/components/schemas/Doctor" } } } },
          "500": { description: "Server error", content: { "application/json": { schema: { "$ref": "#/components/schemas/Error" } } } },
        },
      },
    },
    "/doctors/{id}": {
      get: {
        tags: ["Doctors"],
        summary: "Get a doctor",
        description: "Returns doctor with department, schedules, and recent appointments.",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Doctor", content: { "application/json": { schema: { "$ref": "#/components/schemas/Doctor" } } } },
          "404": { description: "Not found", content: { "application/json": { schema: { "$ref": "#/components/schemas/Error" } } } },
        },
      },
      put: {
        tags: ["Doctors"],
        summary: "Update a doctor",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { "$ref": "#/components/schemas/DoctorInput" } } },
        },
        responses: {
          "200": { description: "Updated", content: { "application/json": { schema: { "$ref": "#/components/schemas/Doctor" } } } },
          "500": { description: "Server error", content: { "application/json": { schema: { "$ref": "#/components/schemas/Error" } } } },
        },
      },
      delete: {
        tags: ["Doctors"],
        summary: "Delete a doctor",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Deleted", content: { "application/json": { schema: { type: "object", properties: { message: { type: "string" } } } } } },
          "500": { description: "Server error", content: { "application/json": { schema: { "$ref": "#/components/schemas/Error" } } } },
        },
      },
    },
    "/doctors/{id}/account": {
      post: {
        tags: ["Doctors"],
        summary: "Create login account for a doctor",
        description: "SUPER_ADMIN only. Creates a User linked to the doctor and sends credentials.",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "temporaryPassword"],
                properties: {
                  email: { type: "string", format: "email" },
                  temporaryPassword: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Account created", content: { "application/json": { schema: { type: "object", properties: { message: { type: "string" }, email: { type: "string" } } } } } },
          "409": { description: "Doctor already has an account" },
          "500": { description: "Server error", content: { "application/json": { schema: { "$ref": "#/components/schemas/Error" } } } },
        },
      },
    },
    "/doctors/{id}/schedules": {
      get: {
        tags: ["Doctors"],
        summary: "Get doctor schedule",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Schedules for all 7 days", content: { "application/json": { schema: { type: "array", items: { "$ref": "#/components/schemas/DoctorSchedule" } } } } },
        },
      },
      put: {
        tags: ["Doctors"],
        summary: "Upsert doctor schedule",
        description: "Replaces all 7 day entries. Auth: SUPER_ADMIN, FRONT_DESK, or the doctor themselves.",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  schedules: { type: "array", items: { "$ref": "#/components/schemas/DoctorSchedule" } },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Updated schedules", content: { "application/json": { schema: { type: "array", items: { "$ref": "#/components/schemas/DoctorSchedule" } } } } },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/doctor/dashboard": {
      get: {
        tags: ["Doctors"],
        summary: "Doctor portal dashboard",
        description: "DOCTOR role only. Returns today's and this week's appointment counts.",
        responses: {
          "200": {
            description: "Dashboard data",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    todayCount: { type: "integer" },
                    weekCount: { type: "integer" },
                    todayAppointments: { type: "array", items: { "$ref": "#/components/schemas/Appointment" } },
                  },
                },
              },
            },
          },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/doctor/appointments": {
      get: {
        tags: ["Doctors"],
        summary: "Doctor's own appointments",
        description: "DOCTOR role only. Returns appointments for the authenticated doctor.",
        parameters: [
          { name: "status", in: "query", schema: { type: "string" } },
          { name: "date", in: "query", schema: { type: "string", format: "date" } },
          { name: "page", in: "query", schema: { type: "integer" } },
        ],
        responses: {
          "200": {
            description: "Paginated appointments",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    appointments: { type: "array", items: { "$ref": "#/components/schemas/Appointment" } },
                    total: { type: "integer" },
                    page: { type: "integer" },
                    pageSize: { type: "integer" },
                  },
                },
              },
            },
          },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/doctor/patients": {
      get: {
        tags: ["Doctors"],
        summary: "Doctor's own patients",
        description: "DOCTOR role only. Returns patients who have had appointments with the authenticated doctor.",
        responses: {
          "200": { description: "Patients", content: { "application/json": { schema: { type: "array", items: { "$ref": "#/components/schemas/Patient" } } } } },
          "401": { description: "Unauthorized" },
        },
      },
    },

    // ── Appointments ─────────────────────────────────────────────────────────
    "/appointments": {
      get: {
        tags: ["Appointments"],
        summary: "List appointments",
        parameters: [
          { name: "status", in: "query", schema: { type: "string", enum: ["IN_ASTEPTARE", "CONFIRMAT", "IN_DESFASURARE", "FINALIZAT", "ANULAT", "NEPREZENTARE"] } },
          { name: "doctorId", in: "query", schema: { type: "string" } },
          { name: "patientId", in: "query", schema: { type: "string" } },
          { name: "date", in: "query", schema: { type: "string", format: "date" }, description: "Filter by exact date (YYYY-MM-DD)" },
          { name: "from", in: "query", schema: { type: "string", format: "date" } },
          { name: "to", in: "query", schema: { type: "string", format: "date" } },
          { name: "page", in: "query", schema: { type: "integer" } },
          { name: "limit", in: "query", schema: { type: "integer" } },
        ],
        responses: {
          "200": { description: "Appointments list", content: { "application/json": { schema: { type: "array", items: { "$ref": "#/components/schemas/Appointment" } } } } },
          "500": { description: "Server error", content: { "application/json": { schema: { "$ref": "#/components/schemas/Error" } } } },
        },
      },
      post: {
        tags: ["Appointments"],
        summary: "Create an appointment",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { "$ref": "#/components/schemas/AppointmentInput" } } },
        },
        responses: {
          "201": { description: "Created", content: { "application/json": { schema: { "$ref": "#/components/schemas/Appointment" } } } },
          "409": {
            description: "Scheduling conflict (doctor unavailable, outside working hours, or slot overlap)",
            content: { "application/json": { schema: { type: "object", properties: { error: { type: "string" }, isConflict: { type: "boolean" } } } } },
          },
          "500": { description: "Server error", content: { "application/json": { schema: { "$ref": "#/components/schemas/Error" } } } },
        },
      },
    },
    "/appointments/check": {
      get: {
        tags: ["Appointments"],
        summary: "Check appointment availability",
        description: "Detects slot conflicts for a given doctor, date, and time range.",
        parameters: [
          { name: "doctorId", in: "query", required: true, schema: { type: "string" } },
          { name: "date", in: "query", required: true, schema: { type: "string", format: "date" } },
          { name: "startTime", in: "query", required: true, schema: { type: "string", example: "09:00" } },
          { name: "endTime", in: "query", required: true, schema: { type: "string", example: "09:30" } },
          { name: "excludeId", in: "query", schema: { type: "string" }, description: "Appointment ID to exclude (for rescheduling)" },
        ],
        responses: {
          "200": {
            description: "Availability result",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    available: { type: "boolean" },
                    reason: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/appointments/{id}": {
      get: {
        tags: ["Appointments"],
        summary: "Get an appointment",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Appointment with patient, doctor, department, service, medical record", content: { "application/json": { schema: { "$ref": "#/components/schemas/Appointment" } } } },
          "404": { description: "Not found", content: { "application/json": { schema: { "$ref": "#/components/schemas/Error" } } } },
        },
      },
      put: {
        tags: ["Appointments"],
        summary: "Update / reschedule an appointment",
        description: "Also triggers email/SMS notifications when sendEmail/sendSMS are true.",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { "$ref": "#/components/schemas/AppointmentInput" } } },
        },
        responses: {
          "200": { description: "Updated", content: { "application/json": { schema: { "$ref": "#/components/schemas/Appointment" } } } },
          "409": { description: "Conflict", content: { "application/json": { schema: { "$ref": "#/components/schemas/Error" } } } },
          "500": { description: "Server error", content: { "application/json": { schema: { "$ref": "#/components/schemas/Error" } } } },
        },
      },
      delete: {
        tags: ["Appointments"],
        summary: "Delete an appointment",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Deleted", content: { "application/json": { schema: { type: "object", properties: { message: { type: "string" } } } } } },
          "500": { description: "Server error", content: { "application/json": { schema: { "$ref": "#/components/schemas/Error" } } } },
        },
      },
    },

    // ── Services ─────────────────────────────────────────────────────────────
    "/services": {
      get: {
        tags: ["Services"],
        summary: "List all services",
        responses: {
          "200": { description: "Services", content: { "application/json": { schema: { type: "array", items: { "$ref": "#/components/schemas/Service" } } } } },
        },
      },
      post: {
        tags: ["Services"],
        summary: "Create a service",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { "$ref": "#/components/schemas/ServiceInput" } } },
        },
        responses: {
          "201": { description: "Created", content: { "application/json": { schema: { "$ref": "#/components/schemas/Service" } } } },
          "500": { description: "Server error", content: { "application/json": { schema: { "$ref": "#/components/schemas/Error" } } } },
        },
      },
    },
    "/services/{id}": {
      get: {
        tags: ["Services"],
        summary: "Get a service",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Service", content: { "application/json": { schema: { "$ref": "#/components/schemas/Service" } } } },
          "404": { description: "Not found", content: { "application/json": { schema: { "$ref": "#/components/schemas/Error" } } } },
        },
      },
      put: {
        tags: ["Services"],
        summary: "Update a service",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { "$ref": "#/components/schemas/ServiceInput" } } },
        },
        responses: {
          "200": { description: "Updated", content: { "application/json": { schema: { "$ref": "#/components/schemas/Service" } } } },
        },
      },
      delete: {
        tags: ["Services"],
        summary: "Delete a service",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Deleted", content: { "application/json": { schema: { type: "object", properties: { message: { type: "string" } } } } } },
        },
      },
    },

    // ── Departments ──────────────────────────────────────────────────────────
    "/departments": {
      get: {
        tags: ["Departments"],
        summary: "List all departments",
        description: "Returns departments with doctor count and appointment count (_count).",
        responses: {
          "200": { description: "Departments", content: { "application/json": { schema: { type: "array", items: { "$ref": "#/components/schemas/Department" } } } } },
        },
      },
      post: {
        tags: ["Departments"],
        summary: "Create a department",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { "$ref": "#/components/schemas/DepartmentInput" } } },
        },
        responses: {
          "201": { description: "Created", content: { "application/json": { schema: { "$ref": "#/components/schemas/Department" } } } },
          "500": { description: "Server error", content: { "application/json": { schema: { "$ref": "#/components/schemas/Error" } } } },
        },
      },
    },
    "/departments/{id}": {
      get: {
        tags: ["Departments"],
        summary: "Get a department",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Department", content: { "application/json": { schema: { "$ref": "#/components/schemas/Department" } } } },
          "404": { description: "Not found" },
        },
      },
      put: {
        tags: ["Departments"],
        summary: "Update a department",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { "$ref": "#/components/schemas/DepartmentInput" } } },
        },
        responses: {
          "200": { description: "Updated", content: { "application/json": { schema: { "$ref": "#/components/schemas/Department" } } } },
        },
      },
      delete: {
        tags: ["Departments"],
        summary: "Delete a department",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Deleted", content: { "application/json": { schema: { type: "object", properties: { message: { type: "string" } } } } } },
        },
      },
    },

    // ── Medical Records ──────────────────────────────────────────────────────
    "/medical-records": {
      get: {
        tags: ["Medical Records"],
        summary: "List medical records",
        parameters: [{ name: "patientId", in: "query", schema: { type: "string" } }],
        responses: {
          "200": { description: "Medical records", content: { "application/json": { schema: { type: "array", items: { "$ref": "#/components/schemas/MedicalRecord" } } } } },
        },
      },
      post: {
        tags: ["Medical Records"],
        summary: "Create a medical record",
        description: "Auth required. DOCTOR role: can only create for their own patients.",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { "$ref": "#/components/schemas/MedicalRecordInput" } } },
        },
        responses: {
          "201": { description: "Created", content: { "application/json": { schema: { "$ref": "#/components/schemas/MedicalRecord" } } } },
          "401": { description: "Unauthorized" },
          "403": { description: "Forbidden (DOCTOR accessing another doctor's patient)" },
          "500": { description: "Server error", content: { "application/json": { schema: { "$ref": "#/components/schemas/Error" } } } },
        },
      },
    },
    "/medical-records/{id}": {
      get: {
        tags: ["Medical Records"],
        summary: "Get a medical record",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Medical record", content: { "application/json": { schema: { "$ref": "#/components/schemas/MedicalRecord" } } } },
          "404": { description: "Not found" },
        },
      },
      put: {
        tags: ["Medical Records"],
        summary: "Update a medical record",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { "$ref": "#/components/schemas/MedicalRecordInput" } } },
        },
        responses: {
          "200": { description: "Updated", content: { "application/json": { schema: { "$ref": "#/components/schemas/MedicalRecord" } } } },
        },
      },
      delete: {
        tags: ["Medical Records"],
        summary: "Delete a medical record",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Deleted", content: { "application/json": { schema: { type: "object", properties: { message: { type: "string" } } } } } },
        },
      },
    },

    // ── Documents ────────────────────────────────────────────────────────────
    "/documents": {
      post: {
        tags: ["Documents"],
        summary: "Upload a patient document",
        description: "Auth required. Roles: SUPER_ADMIN, FRONT_DESK, DOCTOR. Max 10MB. Types: PDF, JPG, PNG.",
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["file", "patientId"],
                properties: {
                  file: { type: "string", format: "binary", description: "PDF, JPG, or PNG, max 10MB" },
                  patientId: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Created", content: { "application/json": { schema: { "$ref": "#/components/schemas/Document" } } } },
          "400": { description: "Invalid file type or missing fields" },
          "401": { description: "Unauthorized" },
          "403": { description: "Forbidden" },
        },
      },
    },
    "/documents/{id}": {
      delete: {
        tags: ["Documents"],
        summary: "Delete a document",
        description: "Removes blob from Azure Storage and record from DB.",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Deleted", content: { "application/json": { schema: { type: "object", properties: { message: { type: "string" } } } } } },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/documents/{id}/url": {
      get: {
        tags: ["Documents"],
        summary: "Generate a 15-minute SAS URL for a document",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": {
            description: "Temporary download URL",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    url: { type: "string", format: "uri" },
                    expiresAt: { type: "string", format: "date-time", nullable: true },
                  },
                },
              },
            },
          },
          "401": { description: "Unauthorized" },
          "404": { description: "Document not found" },
        },
      },
    },
    "/patient/documents": {
      get: {
        tags: ["Documents"],
        summary: "List patient's own documents",
        description: "PATIENT role only.",
        responses: {
          "200": { description: "Documents", content: { "application/json": { schema: { type: "array", items: { "$ref": "#/components/schemas/Document" } } } } },
          "401": { description: "Unauthorized" },
        },
      },
    },

    // ── Patient portal ───────────────────────────────────────────────────────
    "/patient/dashboard": {
      get: {
        tags: ["Patients"],
        summary: "Patient portal dashboard",
        description: "PATIENT role only.",
        responses: {
          "200": { description: "Dashboard data with upcoming appointments and account info" },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/patient/appointments": {
      get: {
        tags: ["Appointments"],
        summary: "Patient's own appointments",
        description: "PATIENT role only.",
        responses: {
          "200": { description: "Appointments", content: { "application/json": { schema: { type: "array", items: { "$ref": "#/components/schemas/Appointment" } } } } },
          "401": { description: "Unauthorized" },
        },
      },
    },

    // ── Dashboard ────────────────────────────────────────────────────────────
    "/dashboard/stats": {
      get: {
        tags: ["Reports"],
        summary: "Admin dashboard statistics",
        responses: {
          "200": {
            description: "Live stats",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    totalPatients: { type: "integer" },
                    totalDoctors: { type: "integer" },
                    todayAppointments: { type: "integer" },
                    weekAppointments: { type: "integer" },
                  },
                },
              },
            },
          },
        },
      },
    },

    // ── Reports ──────────────────────────────────────────────────────────────
    "/reports": {
      get: {
        tags: ["Reports"],
        summary: "Export reports as CSV",
        parameters: [
          { name: "type", in: "query", schema: { type: "string", enum: ["patients", "appointments", "doctors", "departments"] } },
          { name: "period", in: "query", schema: { type: "string", enum: ["current-month", "last-month", "last-3-months", "last-6-months", "this-year"] } },
          { name: "format", in: "query", schema: { type: "string", enum: ["csv", "json"] } },
        ],
        responses: {
          "200": {
            description: "CSV file download or JSON array",
            content: {
              "text/csv": { schema: { type: "string" } },
              "application/json": { schema: { type: "array", items: { type: "object" } } },
            },
          },
        },
      },
    },
    "/reports/stats": {
      get: {
        tags: ["Reports"],
        summary: "Monthly statistics and trends",
        responses: {
          "200": {
            description: "Stats object",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    patientsThisMonth: { type: "integer" },
                    appointmentsThisMonth: { type: "integer" },
                    completionRate: { type: "number" },
                    monthlyTrend: { type: "array", items: { type: "object" } },
                    servicePopularity: { type: "array", items: { type: "object" } },
                    peakHours: { type: "array", items: { type: "object" } },
                    demographics: { type: "array", items: { type: "object" } },
                    doctorPerformance: { type: "array", items: { type: "object" } },
                    totalRevenue: { type: "number" },
                  },
                },
              },
            },
          },
        },
      },
    },

    // ── Activity ─────────────────────────────────────────────────────────────
    "/activity": {
      get: {
        tags: ["Activity"],
        summary: "Get audit activity log",
        parameters: [
          { name: "action", in: "query", schema: { type: "string" } },
          { name: "from", in: "query", schema: { type: "string", format: "date" } },
          { name: "to", in: "query", schema: { type: "string", format: "date" } },
        ],
        responses: {
          "200": {
            description: "Activity feed with stats",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    activities: { type: "array", items: { "$ref": "#/components/schemas/ActivityLog" } },
                    todayCount: { type: "integer" },
                    weekCount: { type: "integer" },
                    activeUsers: { type: "integer" },
                  },
                },
              },
            },
          },
        },
      },
    },

    // ── Settings ─────────────────────────────────────────────────────────────
    "/settings": {
      get: {
        tags: ["Settings"],
        summary: "Get clinic settings",
        description: "Creates default settings record on first access (upsert).",
        responses: {
          "200": { description: "Settings", content: { "application/json": { schema: { "$ref": "#/components/schemas/Settings" } } } },
        },
      },
      put: {
        tags: ["Settings"],
        summary: "Update clinic settings",
        description: "All fields are optional — only supplied fields are updated.",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { "$ref": "#/components/schemas/Settings" } } },
        },
        responses: {
          "200": { description: "Updated settings", content: { "application/json": { schema: { "$ref": "#/components/schemas/Settings" } } } },
        },
      },
    },

    // ── Users ────────────────────────────────────────────────────────────────
    "/users": {
      get: {
        tags: ["Users"],
        summary: "List all users",
        description: "Passwords are never returned.",
        responses: {
          "200": { description: "Users", content: { "application/json": { schema: { type: "array", items: { "$ref": "#/components/schemas/User" } } } } },
        },
      },
      post: {
        tags: ["Users"],
        summary: "Create a user",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { "$ref": "#/components/schemas/UserInput" } } },
        },
        responses: {
          "201": { description: "Created", content: { "application/json": { schema: { "$ref": "#/components/schemas/User" } } } },
          "409": { description: "Email already exists" },
        },
      },
    },
    "/users/{id}": {
      get: {
        tags: ["Users"],
        summary: "Get a user",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "User", content: { "application/json": { schema: { "$ref": "#/components/schemas/User" } } } },
          "404": { description: "Not found" },
        },
      },
      put: {
        tags: ["Users"],
        summary: "Update a user",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { "$ref": "#/components/schemas/UserInput" } } },
        },
        responses: {
          "200": { description: "Updated", content: { "application/json": { schema: { "$ref": "#/components/schemas/User" } } } },
        },
      },
      delete: {
        tags: ["Users"],
        summary: "Delete a user",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Deleted", content: { "application/json": { schema: { type: "object", properties: { message: { type: "string" } } } } } },
        },
      },
    },
    "/users/change-password": {
      post: {
        tags: ["Users"],
        summary: "Change user password",
        description: "Verifies current password with bcrypt before updating.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "currentPassword", "newPassword"],
                properties: {
                  email: { type: "string", format: "email" },
                  currentPassword: { type: "string" },
                  newPassword: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Password updated", content: { "application/json": { schema: { type: "object", properties: { message: { type: "string" } } } } } },
          "401": { description: "Wrong current password" },
          "404": { description: "User not found" },
        },
      },
    },

    // ── Auth ─────────────────────────────────────────────────────────────────
    "/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Public patient self-registration",
        description: "No auth required. If a patient record with matching email or phone exists, the new account is linked to it.",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password"],
                properties: {
                  name: { type: "string" },
                  email: { type: "string", format: "email" },
                  phone: { type: "string" },
                  password: { type: "string", format: "password" },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Registered", content: { "application/json": { schema: { type: "object", properties: { message: { type: "string" } } } } } },
          "409": { description: "Email already has an account" },
        },
      },
    },

    // ── Notifications ────────────────────────────────────────────────────────
    "/notifications": {
      get: {
        tags: ["Notifications"],
        summary: "List notifications",
        parameters: [{ name: "appointmentId", in: "query", schema: { type: "string" } }],
        responses: {
          "200": { description: "Notifications", content: { "application/json": { schema: { type: "array", items: { "$ref": "#/components/schemas/Notification" } } } } },
          "500": { description: "Server error", content: { "application/json": { schema: { "$ref": "#/components/schemas/Error" } } } },
        },
      },
    },
    "/notifications/reminders": {
      post: {
        tags: ["Notifications"],
        summary: "Send appointment reminders",
        description: "If appointmentId is supplied, sends reminder for that appointment only. Otherwise sends bulk reminders for all CONFIRMAT appointments today.",
        requestBody: {
          required: false,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  appointmentId: { type: "string" },
                  sendEmail: { type: "boolean" },
                  sendSMS: { type: "boolean" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Sent",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    sent: { type: "integer" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/notifications/stream": {
      get: {
        tags: ["Notifications"],
        summary: "Server-Sent Events stream",
        description:
          "Persistent SSE connection. Pushes `notifications`, `appointments_updated`, `payment_updated`, `stats_updated`, and `heartbeat` events. " +
          "**This endpoint cannot be tested via Swagger UI.** Use `new EventSource('/api/notifications/stream')` in the browser console.",
        responses: {
          "200": {
            description: "SSE stream",
            content: { "text/event-stream": { schema: { type: "string" } } },
          },
        },
      },
    },

    // ── Payments ─────────────────────────────────────────────────────────────
    "/payments": {
      get: {
        tags: ["Payments"],
        summary: "List appointments with payment status",
        description: "Roles: SUPER_ADMIN, FRONT_DESK, MARKETING.",
        parameters: [
          { name: "status", in: "query", schema: { type: "string", enum: ["UNPAID", "PENDING", "PAID", "REFUNDED", "all"] } },
          { name: "period", in: "query", schema: { type: "string", enum: ["current-month", "last-month", "last-3-months", "this-year"] } },
          { name: "page", in: "query", schema: { type: "integer" } },
          { name: "pageSize", in: "query", schema: { type: "integer" } },
        ],
        responses: {
          "200": {
            description: "Paginated payments with stats",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    appointments: { type: "array", items: { "$ref": "#/components/schemas/Appointment" } },
                    total: { type: "integer" },
                    page: { type: "integer" },
                    pageSize: { type: "integer" },
                    pageCount: { type: "integer" },
                    stats: {
                      type: "object",
                      properties: {
                        totalRevenue: { type: "number" },
                        paidCount: { type: "integer" },
                        pendingCount: { type: "integer" },
                        unpaidCount: { type: "integer" },
                        refundedCount: { type: "integer" },
                      },
                    },
                  },
                },
              },
            },
          },
          "401": { description: "Unauthorized" },
          "403": { description: "Forbidden" },
        },
      },
      patch: {
        tags: ["Payments"],
        summary: "Manually update payment status",
        description: "Roles: SUPER_ADMIN, FRONT_DESK. For REFUNDED with stripePaymentIntentId, calls stripe.refunds.create() real refund.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["appointmentId", "paymentStatus"],
                properties: {
                  appointmentId: { type: "string" },
                  paymentStatus: { type: "string", enum: ["UNPAID", "PENDING", "PAID", "REFUNDED"] },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Updated",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    paymentStatus: { type: "string" },
                  },
                },
              },
            },
          },
          "401": { description: "Unauthorized" },
          "403": { description: "Forbidden" },
        },
      },
    },
    "/checkout": {
      post: {
        tags: ["Payments"],
        summary: "Create Stripe Checkout session (admin)",
        description: "Roles: SUPER_ADMIN, FRONT_DESK. Creates a Stripe Checkout URL for an appointment.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["appointmentId"],
                properties: { appointmentId: { type: "string" } },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Stripe Checkout URL",
            content: {
              "application/json": {
                schema: { type: "object", properties: { url: { type: "string", format: "uri" } } },
              },
            },
          },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/checkout/send-link": {
      post: {
        tags: ["Payments"],
        summary: "Send payment link by email",
        description: "Creates a Stripe session and emails the patient a payment link. Useful for phone bookings.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["appointmentId"],
                properties: { appointmentId: { type: "string" } },
              },
            },
          },
        },
        responses: {
          "200": { description: "Email sent", content: { "application/json": { schema: { type: "object", properties: { sent: { type: "boolean" } } } } } },
        },
      },
    },
    "/payments/checkout": {
      post: {
        tags: ["Payments"],
        summary: "Create Stripe Checkout session (patient)",
        description: "PATIENT role only. Creates a checkout session for the patient's own appointment.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["appointmentId"],
                properties: { appointmentId: { type: "string" } },
              },
            },
          },
        },
        responses: {
          "200": { description: "Stripe Checkout URL", content: { "application/json": { schema: { type: "object", properties: { url: { type: "string", format: "uri" } } } } } },
          "401": { description: "Unauthorized" },
          "403": { description: "Patient can only pay for own appointments" },
        },
      },
    },
    "/webhooks/stripe": {
      post: {
        tags: ["Payments"],
        summary: "Stripe webhook receiver",
        description:
          "Handles `checkout.session.completed` (marks PAID, auto-confirms appointment), " +
          "`checkout.session.expired` (resets PENDING→UNPAID), and `charge.refunded` (marks REFUNDED). " +
          "No session cookie required — validated via Stripe signature.",
        security: [],
        parameters: [
          {
            name: "stripe-signature",
            in: "header",
            required: true,
            schema: { type: "string" },
            description: "Stripe webhook signature for HMAC verification",
          },
        ],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", description: "Stripe Event object" } } },
        },
        responses: {
          "200": { description: "Received", content: { "application/json": { schema: { type: "object", properties: { received: { type: "boolean" } } } } } },
          "400": { description: "Invalid signature" },
        },
      },
    },
    "/prescriptions": {
      get: {
        tags: ["Prescriptions"],
        summary: "List prescriptions for a patient",
        description: "Returns all prescriptions for the given patientId. DOCTOR role is scoped to own patients.",
        parameters: [
          { name: "patientId", in: "query", required: true, schema: { type: "string" }, description: "Patient ID" },
        ],
        responses: {
          "200": { description: "List of prescriptions", content: { "application/json": { schema: { type: "array", items: { "$ref": "#/components/schemas/Prescription" } } } } },
          "401": { description: "Unauthorized" },
          "403": { description: "Forbidden (DOCTOR accessing another doctor's patient)" },
        },
      },
      post: {
        tags: ["Prescriptions"],
        summary: "Create a prescription",
        description: "DOCTOR only. Auto-generates prescription number (RX-YYYY-NNNN). DoctorId is inferred from session.",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { "$ref": "#/components/schemas/PrescriptionInput" } } },
        },
        responses: {
          "201": { description: "Created prescription", content: { "application/json": { schema: { "$ref": "#/components/schemas/Prescription" } } } },
          "400": { description: "Missing required fields or empty medications list" },
          "401": { description: "Unauthorized" },
          "403": { description: "Not a DOCTOR role, or patient not accessible" },
        },
      },
    },
    "/prescriptions/{id}": {
      get: {
        tags: ["Prescriptions"],
        summary: "Get a single prescription",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Prescription", content: { "application/json": { schema: { "$ref": "#/components/schemas/Prescription" } } } },
          "401": { description: "Unauthorized" },
          "403": { description: "Forbidden (PATIENT accessing another patient's prescription)" },
          "404": { description: "Not found" },
        },
      },
      put: {
        tags: ["Prescriptions"],
        summary: "Update a prescription",
        description: "DOCTOR (own prescriptions only) or SUPER_ADMIN. Supports partial updates: status, diagnosis, medications, notes.",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string", enum: ["ACTIVA", "EXPIRATA", "ANULATA"] },
                  diagnosis: { type: "string" },
                  medications: { type: "array", items: { "$ref": "#/components/schemas/Medication" } },
                  notes: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Updated prescription", content: { "application/json": { schema: { "$ref": "#/components/schemas/Prescription" } } } },
          "401": { description: "Unauthorized" },
          "403": { description: "Forbidden" },
          "404": { description: "Not found" },
        },
      },
      delete: {
        tags: ["Prescriptions"],
        summary: "Delete a prescription",
        description: "DOCTOR (own prescriptions only) or SUPER_ADMIN.",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Deleted", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" } } } } } },
          "401": { description: "Unauthorized" },
          "403": { description: "Forbidden" },
          "404": { description: "Not found" },
        },
      },
    },
    "/patient/prescriptions": {
      get: {
        tags: ["Prescriptions"],
        summary: "Get authenticated patient's own prescriptions",
        description: "PATIENT role only. Returns prescriptions for the currently logged-in patient.",
        responses: {
          "200": { description: "List of prescriptions", content: { "application/json": { schema: { type: "array", items: { "$ref": "#/components/schemas/Prescription" } } } } },
          "401": { description: "Unauthorized" },
          "403": { description: "Forbidden (not a PATIENT)" },
          "404": { description: "Patient profile not found" },
        },
      },
    },
  },
}
