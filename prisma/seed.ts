import { PrismaClient } from "@prisma/client"
import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"
import * as dotenv from "dotenv"

dotenv.config()

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter } as any)

async function main() {
  console.log("🌱 Seeding database...")

  const adminPassword = await bcrypt.hash("admin123", 10)
  const frontDeskPassword = await bcrypt.hash("receptie123", 10)

  const admin = await prisma.user.upsert({
    where: { email: "admin@policare.ro" },
    update: {},
    create: { email: "admin@policare.ro", name: "Administrator", password: adminPassword, role: "SUPER_ADMIN", status: "ACTIVE" },
  })
  const frontDesk = await prisma.user.upsert({
    where: { email: "receptie@policare.ro" },
    update: {},
    create: { email: "receptie@policare.ro", name: "Recepție", password: frontDeskPassword, role: "FRONT_DESK", status: "ACTIVE" },
  })
  console.log(`✅ Users: ${admin.email}, ${frontDesk.email}`)

  // ── Departments ──────────────────────────────────────────────────────────────
  const deptData = [
    { name: "Cardiologie",  description: "Boli cardiovasculare și ale inimii",         color: "red",    icon: "Heart"    },
    { name: "ORL",          description: "Otorinolaringologie",                          color: "blue",   icon: "Ear"      },
    { name: "Oftalmologie", description: "Sănătatea ochilor și a vederii",               color: "green",  icon: "Eye"      },
    { name: "Dermatologie", description: "Afecțiuni cutanate și estetică medicală",      color: "purple", icon: "Hand"     },
    { name: "Pediatrie",    description: "Îngrijirea sănătății copiilor",                color: "yellow", icon: "Baby"     },
    { name: "Neurologie",   description: "Boli ale sistemului nervos central și periferic", color: "indigo", icon: "Brain" },
    { name: "Ortopedie",    description: "Afecțiuni ale sistemului osteoarticular",      color: "orange", icon: "Bone"     },
    { name: "Ginecologie",  description: "Sănătatea femeii și medicină reproductivă",   color: "pink",   icon: "Flower2"  },
  ]

  const departments = await Promise.all(
    deptData.map(d =>
      prisma.department.upsert({ where: { name: d.name }, update: {}, create: d })
    )
  )
  const [cardio, orl, oftalmo, derma, pediatrie, neuro, orto, gineco] = departments
  console.log(`✅ ${departments.length} departments`)

  // ── Services ─────────────────────────────────────────────────────────────────
  async function upsertService(data: { name: string; description?: string; duration: number; price: number; departmentId: string }) {
    const existing = await prisma.service.findFirst({ where: { name: data.name, departmentId: data.departmentId } })
    if (!existing) await prisma.service.create({ data: { ...data, isActive: true } })
  }

  await Promise.all([
    // Cardiologie
    upsertService({ name: "Consultație cardiologie",    duration: 30, price: 200, departmentId: cardio.id }),
    upsertService({ name: "EKG (electrocardiogramă)",   duration: 15, price:  80, departmentId: cardio.id }),
    upsertService({ name: "Ecocardiografie",            duration: 45, price: 300, departmentId: cardio.id }),
    upsertService({ name: "Holter EKG 24h",             duration: 20, price: 350, departmentId: cardio.id }),
    upsertService({ name: "Test de efort",              duration: 60, price: 400, departmentId: cardio.id }),
    upsertService({ name: "Monitorizare Holter tensiune 24h", duration: 20, price: 320, departmentId: cardio.id }),
    upsertService({ name: "Consult preventiv cardiovascular", duration: 45, price: 250, departmentId: cardio.id }),

    // ORL
    upsertService({ name: "Consultație ORL",            duration: 30, price: 150, departmentId: orl.id }),
    upsertService({ name: "Audiogramă",                 duration: 30, price: 120, departmentId: orl.id }),
    upsertService({ name: "Endoscopie nazală",          duration: 20, price: 180, departmentId: orl.id }),
    upsertService({ name: "Lavaj sinusal",              duration: 30, price: 200, departmentId: orl.id }),
    upsertService({ name: "Examinare laringoscopică",   duration: 20, price: 160, departmentId: orl.id }),
    upsertService({ name: "Timpanometrie",              duration: 15, price:  90, departmentId: orl.id }),
    upsertService({ name: "Excizie polip nazal",        duration: 40, price: 450, departmentId: orl.id }),

    // Oftalmologie
    upsertService({ name: "Consultație oftalmologie",   duration: 30, price: 150, departmentId: oftalmo.id }),
    upsertService({ name: "Refractometrie",             duration: 15, price:  80, departmentId: oftalmo.id }),
    upsertService({ name: "Tonometrie",                 duration: 15, price:  80, departmentId: oftalmo.id }),
    upsertService({ name: "Câmp vizual (perimetrie)",   duration: 20, price: 100, departmentId: oftalmo.id }),
    upsertService({ name: "OCT retină",                 duration: 30, price: 250, departmentId: oftalmo.id }),
    upsertService({ name: "Angiofluorografie retiniană", duration: 30, price: 300, departmentId: oftalmo.id }),
    upsertService({ name: "Adaptometrie",               duration: 20, price: 120, departmentId: oftalmo.id }),

    // Dermatologie
    upsertService({ name: "Consultație dermatologie",   duration: 30, price: 150, departmentId: derma.id }),
    upsertService({ name: "Dermoscopie",                duration: 20, price: 120, departmentId: derma.id }),
    upsertService({ name: "Crioterapie",                duration: 20, price: 180, departmentId: derma.id }),
    upsertService({ name: "Biopsie cutanată",           duration: 30, price: 250, departmentId: derma.id }),
    upsertService({ name: "Electrocoagulare",           duration: 20, price: 200, departmentId: derma.id }),
    upsertService({ name: "Peeling chimic",             duration: 45, price: 350, departmentId: derma.id }),
    upsertService({ name: "Tratament acnee",            duration: 30, price: 180, departmentId: derma.id }),

    // Pediatrie
    upsertService({ name: "Consultație pediatrie",      duration: 30, price: 150, departmentId: pediatrie.id }),
    upsertService({ name: "Consultație nou-născut",     duration: 30, price: 120, departmentId: pediatrie.id }),
    upsertService({ name: "Vaccinare",                  duration: 15, price:  50, departmentId: pediatrie.id }),
    upsertService({ name: "Control creștere și dezvoltare", duration: 30, price: 130, departmentId: pediatrie.id }),
    upsertService({ name: "Spirometrie pediatrică",     duration: 20, price: 100, departmentId: pediatrie.id }),
    upsertService({ name: "Evaluare psihomotorie",      duration: 45, price: 200, departmentId: pediatrie.id }),
    upsertService({ name: "Consult alergologie pediatrică", duration: 30, price: 160, departmentId: pediatrie.id }),

    // Neurologie
    upsertService({ name: "Consultație neurologie",     duration: 30, price: 200, departmentId: neuro.id }),
    upsertService({ name: "EEG (electroencefalogramă)", duration: 45, price: 300, departmentId: neuro.id }),
    upsertService({ name: "EMG (electromiografie)",     duration: 60, price: 400, departmentId: neuro.id }),
    upsertService({ name: "Doppler vascular cerebral",  duration: 30, price: 250, departmentId: neuro.id }),
    upsertService({ name: "Evaluare cognitivă",         duration: 60, price: 300, departmentId: neuro.id }),
    upsertService({ name: "Consult cefalee / migrenă",  duration: 30, price: 200, departmentId: neuro.id }),
    upsertService({ name: "Infiltrație nerv periferic", duration: 20, price: 350, departmentId: neuro.id }),

    // Ortopedie
    upsertService({ name: "Consultație ortopedie",      duration: 30, price: 180, departmentId: orto.id }),
    upsertService({ name: "Infiltrație articulară",     duration: 20, price: 280, departmentId: orto.id }),
    upsertService({ name: "Interpretare RMN / CT",      duration: 20, price: 150, departmentId: orto.id }),
    upsertService({ name: "Imobilizare gips / atele",   duration: 30, price: 200, departmentId: orto.id }),
    upsertService({ name: "Kinetoterapie – ședință",    duration: 45, price: 120, departmentId: orto.id }),
    upsertService({ name: "Tratament cu PRP",           duration: 45, price: 800, departmentId: orto.id }),
    upsertService({ name: "Consult coloană vertebrală", duration: 30, price: 180, departmentId: orto.id }),

    // Ginecologie
    upsertService({ name: "Consultație ginecologie",    duration: 30, price: 180, departmentId: gineco.id }),
    upsertService({ name: "Ecografie pelviană",         duration: 20, price: 150, departmentId: gineco.id }),
    upsertService({ name: "Ecografie transvaginală",    duration: 20, price: 180, departmentId: gineco.id }),
    upsertService({ name: "Testare Babeș-Papanicolaou", duration: 15, price: 100, departmentId: gineco.id }),
    upsertService({ name: "Colposcopie",                duration: 30, price: 250, departmentId: gineco.id }),
    upsertService({ name: "Monitorizare sarcină trim. I",  duration: 30, price: 200, departmentId: gineco.id }),
    upsertService({ name: "Inserare/Extragere sterilet",   duration: 20, price: 300, departmentId: gineco.id }),
  ])
  console.log("✅ Services created")

  // ── Doctors ──────────────────────────────────────────────────────────────────
  async function upsertDoctor(data: {
    name: string; email: string; phone: string; avatar?: string
    specialty: string; experience: string; rating: number; bio: string; departmentId: string
  }) {
    await prisma.doctor.upsert({
      where: { email: data.email },
      update: { avatar: data.avatar, status: "ACTIV" },
      create: { ...data, status: "ACTIV" },
    })
  }

  await Promise.all([
    // ── Cardiologie ──
    upsertDoctor({ name: "Dr. Mihai Popescu",    email: "mihai.popescu@policare.ro",    phone: "+40 700 111 222", avatar: "/male-doctor.png",    specialty: "Medic Primar Cardiologie",             experience: "15 ani", rating: 4.9, bio: "Specialist în ecocardiografie și patologie cardiovasculară complexă.", departmentId: cardio.id }),
    upsertDoctor({ name: "Dr. Cristina Marin",   email: "cristina.marin@policare.ro",   phone: "+40 700 112 223", avatar: "/female-doctor.png",  specialty: "Medic Specialist Cardiologie",          experience: "9 ani",  rating: 4.8, bio: "Expertiză în aritmologie și monitorizare Holter.", departmentId: cardio.id }),
    upsertDoctor({ name: "Dr. Bogdan Nistor",    email: "bogdan.nistor@policare.ro",    phone: "+40 700 113 224", avatar: "/male-doctor.png",    specialty: "Medic Specialist Cardiologie Intervențională", experience: "11 ani", rating: 4.7, bio: "Specializat în testul de efort și reabilitare cardiacă.", departmentId: cardio.id }),

    // ── ORL ──
    upsertDoctor({ name: "Dr. Elena Ionescu",    email: "elena.ionescu@policare.ro",    phone: "+40 700 222 333", avatar: "/female-doctor.png",  specialty: "Medic Specialist ORL",                 experience: "8 ani",  rating: 4.8, bio: "Experiență vastă în chirurgia endoscopică naso-sinusală.", departmentId: orl.id }),
    upsertDoctor({ name: "Dr. Radu Gheorghe",    email: "radu.gheorghe@policare.ro",    phone: "+40 700 223 334", avatar: "/male-doctor.png",    specialty: "Medic Primar ORL",                     experience: "14 ani", rating: 4.9, bio: "Specialist în patologia urechii și audiologie.", departmentId: orl.id }),
    upsertDoctor({ name: "Dr. Alina Petrescu",   email: "alina.petrescu@policare.ro",   phone: "+40 700 224 335", avatar: "/female-doctor.png",  specialty: "Medic Specialist ORL Pediatric",       experience: "7 ani",  rating: 4.6, bio: "Focusată pe afecțiunile ORL la copii și adolescenți.", departmentId: orl.id }),

    // ── Oftalmologie ──
    upsertDoctor({ name: "Dr. Andrei Radu",      email: "andrei.radu@policare.ro",      phone: "+40 700 333 444", avatar: "/male-doctor.png",    specialty: "Medic Primar Oftalmologie",            experience: "20 ani", rating: 5.0, bio: "Chirurg de pol anterior, specializat în chirurgia cataractei.", departmentId: oftalmo.id }),
    upsertDoctor({ name: "Dr. Simona Dănilă",    email: "simona.danila@policare.ro",    phone: "+40 700 334 445", avatar: "/female-doctor.png",  specialty: "Medic Specialist Oftalmologie",        experience: "10 ani", rating: 4.8, bio: "Expertă în patologia retinei și diagnosticul OCT.", departmentId: oftalmo.id }),
    upsertDoctor({ name: "Dr. Lucian Badea",     email: "lucian.badea@policare.ro",     phone: "+40 700 335 446", avatar: "/male-doctor.png",    specialty: "Medic Specialist Oftalmologie",        experience: "6 ani",  rating: 4.7, bio: "Specialist în refractometrie și adaptarea lentilelor de contact.", departmentId: oftalmo.id }),

    // ── Dermatologie ──
    upsertDoctor({ name: "Dr. Maria Dumitrescu", email: "maria.dumitrescu@policare.ro", phone: "+40 700 444 555", avatar: "/female-doctor.png",  specialty: "Medic Specialist Dermatologie",        experience: "10 ani", rating: 4.7, bio: "Expertiză în dermatoscopie digitală și dermatologie estetică.", departmentId: derma.id }),
    upsertDoctor({ name: "Dr. Florin Constantin", email: "florin.constantin@policare.ro", phone: "+40 700 445 556", avatar: "/male-doctor.png", specialty: "Medic Primar Dermatologie",            experience: "16 ani", rating: 4.9, bio: "Specialist în oncologie cutanată și chirurgie dermatologică.", departmentId: derma.id }),
    upsertDoctor({ name: "Dr. Ioana Vlad",       email: "ioana.vlad@policare.ro",       phone: "+40 700 446 557", avatar: "/female-doctor.png",  specialty: "Medic Specialist Dermatologie Estetică", experience: "8 ani", rating: 4.8, bio: "Specializată în tratamente laser și estetică medicală.", departmentId: derma.id }),

    // ── Pediatrie ──
    upsertDoctor({ name: "Dr. Ionuț Stan",       email: "ionut.stan@policare.ro",       phone: "+40 700 555 666", avatar: "/male-doctor.png",    specialty: "Medic Primar Pediatrie",               experience: "12 ani", rating: 4.9, bio: "Pasionat de pediatrie generală și explorare funcțională respiratorie.", departmentId: pediatrie.id }),
    upsertDoctor({ name: "Dr. Roxana Popa",      email: "roxana.popa@policare.ro",      phone: "+40 700 556 667", avatar: "/female-doctor.png",  specialty: "Medic Specialist Pediatrie",           experience: "7 ani",  rating: 4.7, bio: "Expertiză în alergologie pediatrică și boli infecțioase la copii.", departmentId: pediatrie.id }),
    upsertDoctor({ name: "Dr. Marius Luca",      email: "marius.luca@policare.ro",      phone: "+40 700 557 668", avatar: "/male-doctor.png",    specialty: "Medic Specialist Neonatologie",        experience: "9 ani",  rating: 4.8, bio: "Specialist în îngrijirea nou-născutului și evaluarea neurodezvoltării.", departmentId: pediatrie.id }),

    // ── Neurologie ──
    upsertDoctor({ name: "Dr. Daniela Stoica",   email: "daniela.stoica@policare.ro",   phone: "+40 700 666 777", avatar: "/female-doctor.png",  specialty: "Medic Primar Neurologie",              experience: "18 ani", rating: 4.9, bio: "Specialist în epileptologie și tulburări de mișcare.", departmentId: neuro.id }),
    upsertDoctor({ name: "Dr. Alexandru Ciobanu", email: "alex.ciobanu@policare.ro",    phone: "+40 700 667 778", avatar: "/male-doctor.png",    specialty: "Medic Specialist Neurologie",          experience: "10 ani", rating: 4.8, bio: "Expertiză în patologia cerebrovasculară și reabilitare neurologică.", departmentId: neuro.id }),
    upsertDoctor({ name: "Dr. Oana Marinescu",   email: "oana.marinescu@policare.ro",   phone: "+40 700 668 779", avatar: "/female-doctor.png",  specialty: "Medic Specialist Neurologie",          experience: "6 ani",  rating: 4.6, bio: "Focalizată pe cefaleea cronică, migrena și neuropatii periferice.", departmentId: neuro.id }),

    // ── Ortopedie ──
    upsertDoctor({ name: "Dr. Gheorghe Tănase",  email: "gheorghe.tanase@policare.ro",  phone: "+40 700 777 888", avatar: "/male-doctor.png",    specialty: "Medic Primar Ortopedie-Traumatologie", experience: "22 ani", rating: 5.0, bio: "Chirurg ortoped cu experiență în artroplastii și coloana vertebrală.", departmentId: orto.id }),
    upsertDoctor({ name: "Dr. Mihaela Drăgan",   email: "mihaela.dragan@policare.ro",   phone: "+40 700 778 889", avatar: "/female-doctor.png",  specialty: "Medic Specialist Ortopedie",           experience: "9 ani",  rating: 4.8, bio: "Expertă în patologia genunchiului și recuperare ortopedică.", departmentId: orto.id }),
    upsertDoctor({ name: "Dr. Sorin Apostol",    email: "sorin.apostol@policare.ro",    phone: "+40 700 779 890", avatar: "/male-doctor.png",    specialty: "Medic Specialist Ortopedie Pediatrică", experience: "11 ani", rating: 4.7, bio: "Specialist în deformările coloanei la copii și adolescenți.", departmentId: orto.id }),

    // ── Ginecologie ──
    upsertDoctor({ name: "Dr. Valentina Coman",  email: "valentina.coman@policare.ro",  phone: "+40 700 888 999", avatar: "/female-doctor.png",  specialty: "Medic Primar Ginecologie",             experience: "17 ani", rating: 4.9, bio: "Specialist în ecografie obstetricală și patologie cervicală.", departmentId: gineco.id }),
    upsertDoctor({ name: "Dr. Carmen Aldea",     email: "carmen.aldea@policare.ro",     phone: "+40 700 889 000", avatar: "/female-doctor.png",  specialty: "Medic Specialist Ginecologie",         experience: "8 ani",  rating: 4.8, bio: "Focalizată pe planificare familială și endocrinologie ginecologică.", departmentId: gineco.id }),
    upsertDoctor({ name: "Dr. Teodora Lungu",    email: "teodora.lungu@policare.ro",    phone: "+40 700 890 001", avatar: "/female-doctor.png",  specialty: "Medic Specialist Ginecologie Oncologică", experience: "13 ani", rating: 4.9, bio: "Expertă în colposcopie, biopsii și urmărirea leziunilor cervicale.", departmentId: gineco.id }),
  ])
  console.log("✅ Doctors created")

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
  console.log("✅ Settings created")
  console.log("\n🎉 Seeding complete!")
  console.log("   Admin:      admin@policare.ro / admin123")
  console.log("   Front Desk: receptie@policare.ro / receptie123")
}

main()
  .catch((e) => { console.error("❌ Seeding failed:", e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
