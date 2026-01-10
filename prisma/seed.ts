import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding database...")

  // Hash passwords (never store plain text!)
  const adminPassword = await bcrypt.hash("admin123", 10)
  const frontDeskPassword = await bcrypt.hash("receptie123", 10)

  // Create Super Admin user
  const admin = await prisma.user.upsert({
    where: { email: "admin@policare.ro" },
    update: {},
    create: {
      email: "admin@policare.ro",
      name: "Administrator",
      password: adminPassword,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
    },
  })

  // Create Front Desk user
  const frontDesk = await prisma.user.upsert({
    where: { email: "receptie@policare.ro" },
    update: {},
    create: {
      email: "receptie@policare.ro",
      name: "Recepție",
      password: frontDeskPassword,
      role: "FRONT_DESK",
      status: "ACTIVE",
    },
  })

  console.log("✅ Created users:")
  console.log(`   - ${admin.email} (${admin.role})`)
  console.log(`   - ${frontDesk.email} (${frontDesk.role})`)

  // Create some departments
  const departments = await Promise.all([
    prisma.department.upsert({
      where: { name: "Cardiologie" },
      update: {},
      create: {
        name: "Cardiologie",
        description: "Departamentul de cardiologie",
        color: "red",
        icon: "Heart",
      },
    }),
    prisma.department.upsert({
      where: { name: "ORL" },
      update: {},
      create: {
        name: "ORL",
        description: "Otorinolaringologie",
        color: "blue",
        icon: "Ear",
      },
    }),
    prisma.department.upsert({
      where: { name: "Oftalmologie" },
      update: {},
      create: {
        name: "Oftalmologie",
        description: "Departamentul de oftalmologie",
        color: "green",
        icon: "Eye",
      },
    }),
    prisma.department.upsert({
      where: { name: "Dermatologie" },
      update: {},
      create: {
        name: "Dermatologie",
        description: "Departamentul de dermatologie",
        color: "purple",
        icon: "Hand",
      },
    }),
    prisma.department.upsert({
      where: { name: "Pediatrie" },
      update: {},
      create: {
        name: "Pediatrie",
        description: "Departamentul de pediatrie",
        color: "yellow",
        icon: "Baby",
      },
    }),
  ])

  console.log(`✅ Created ${departments.length} departments`)

  // Create clinic settings
  await prisma.settings.upsert({
    where: { id: "clinic_settings" },
    update: {},
    create: {
      id: "clinic_settings",
      clinicName: "Policare",
      clinicPhone: "+40 123 456 789",
      clinicEmail: "contact@policare.ro",
      clinicAddress: "Strada Exemplu nr. 1, București",
    },
  })

  console.log("✅ Created clinic settings")
  console.log("")
  console.log("🎉 Seeding complete!")
  console.log("")
  console.log("You can now login with:")
  console.log("   Admin: admin@policare.ro / admin123")
  console.log("   Front Desk: receptie@policare.ro / receptie123")
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
