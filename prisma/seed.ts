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

  // Helper: create service only if it doesn't already exist
  async function upsertService(data: {
    name: string
    description?: string
    duration: number
    price: number
    departmentId: string
  }) {
    const existing = await prisma.service.findFirst({
      where: { name: data.name, departmentId: data.departmentId },
    })
    if (!existing) {
      await prisma.service.create({ data: { ...data, isActive: true } })
    }
  }

  const [cardio, orl, oftalmo, derma, pediatrie] = departments

  // Cardiologie
  await Promise.all([
    upsertService({ name: "Consultație cardiologie", description: "Consultație standard cu cardiolog", duration: 30, price: 200, departmentId: cardio.id }),
    upsertService({ name: "EKG (electrocardiogramă)", description: "Înregistrare activitate electrică a inimii", duration: 15, price: 80, departmentId: cardio.id }),
    upsertService({ name: "Ecocardiografie", description: "Ecografie cardiacă transtoracică", duration: 45, price: 300, departmentId: cardio.id }),
    upsertService({ name: "Holter EKG 24h", description: "Monitorizare EKG continuă 24 de ore", duration: 20, price: 350, departmentId: cardio.id }),
    upsertService({ name: "Test de efort", description: "Electrocardiogramă la efort pe covor rulant", duration: 60, price: 400, departmentId: cardio.id }),
  ])

  // ORL
  await Promise.all([
    upsertService({ name: "Consultație ORL", description: "Consultație otorinolaringologie", duration: 30, price: 150, departmentId: orl.id }),
    upsertService({ name: "Audiogramă", description: "Evaluarea acuității auditive", duration: 30, price: 120, departmentId: orl.id }),
    upsertService({ name: "Endoscopie nazală", description: "Examinare endoscopică a foselor nazale", duration: 20, price: 180, departmentId: orl.id }),
    upsertService({ name: "Lavaj sinusal", description: "Spălătură sinusală terapeutică", duration: 30, price: 200, departmentId: orl.id }),
    upsertService({ name: "Examinare laringoscopică", description: "Evaluare laringe și corzi vocale", duration: 20, price: 160, departmentId: orl.id }),
  ])

  // Oftalmologie
  await Promise.all([
    upsertService({ name: "Consultație oftalmologie", description: "Consultație standard cu oftalmolog", duration: 30, price: 150, departmentId: oftalmo.id }),
    upsertService({ name: "Refractometrie", description: "Determinarea dioptricilor necesare", duration: 15, price: 80, departmentId: oftalmo.id }),
    upsertService({ name: "Tonometrie", description: "Măsurarea presiunii intraoculare", duration: 15, price: 80, departmentId: oftalmo.id }),
    upsertService({ name: "Câmp vizual (perimetrie)", description: "Evaluarea câmpului vizual periferic", duration: 20, price: 100, departmentId: oftalmo.id }),
    upsertService({ name: "OCT retină", description: "Tomografie în coerență optică a retinei", duration: 30, price: 250, departmentId: oftalmo.id }),
  ])

  // Dermatologie
  await Promise.all([
    upsertService({ name: "Consultație dermatologie", description: "Consultație standard cu dermatolog", duration: 30, price: 150, departmentId: derma.id }),
    upsertService({ name: "Dermoscopie", description: "Analiza leziunilor cutanate cu dermatoscop", duration: 20, price: 120, departmentId: derma.id }),
    upsertService({ name: "Crioterapie", description: "Tratament prin congelare cu azot lichid", duration: 20, price: 180, departmentId: derma.id }),
    upsertService({ name: "Biopsie cutanată", description: "Recoltare probă tisulară pentru analiză histologică", duration: 30, price: 250, departmentId: derma.id }),
    upsertService({ name: "Electrocoagulare", description: "Îndepărtare formațiuni cutanate benigne", duration: 20, price: 200, departmentId: derma.id }),
  ])

  // Pediatrie
  await Promise.all([
    upsertService({ name: "Consultație pediatrie", description: "Consultație standard cu pediatru", duration: 30, price: 150, departmentId: pediatrie.id }),
    upsertService({ name: "Consultație nou-născut", description: "Examinare completă nou-născut", duration: 30, price: 120, departmentId: pediatrie.id }),
    upsertService({ name: "Vaccinare", description: "Administrare vaccin conform schemei naționale", duration: 15, price: 50, departmentId: pediatrie.id }),
    upsertService({ name: "Control creștere și dezvoltare", description: "Evaluare antropometrică și neuromotorie", duration: 30, price: 130, departmentId: pediatrie.id }),
    upsertService({ name: "Spirometrie pediatrică", description: "Testarea funcției pulmonare la copii", duration: 20, price: 100, departmentId: pediatrie.id }),
  ])

  console.log("✅ Created services for all departments")

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
