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
  const demoPassword = await bcrypt.hash("Demo2026!", 10)

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
  const marketing = await prisma.user.upsert({
    where: { email: "marketing@policare.ro" },
    update: {},
    create: { email: "marketing@policare.ro", name: "Echipa Marketing", password: demoPassword, role: "MARKETING", status: "ACTIVE" },
  })
  console.log(`✅ Users: ${admin.email}, ${frontDesk.email}, ${marketing.email}`)

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

  // Demo doctor account linked to Dr. Mihai Popescu
  const drMihai = await prisma.doctor.findFirst({ where: { email: "mihai.popescu@policare.ro" } })
  if (drMihai) {
    const demoDoctor = await prisma.user.upsert({
      where: { email: "demo.doctor@policare.ro" },
      update: {},
      create: { email: "demo.doctor@policare.ro", name: drMihai.name, password: demoPassword, role: "DOCTOR", status: "ACTIVE" },
    })
    if (!drMihai.userId) {
      await prisma.doctor.update({ where: { id: drMihai.id }, data: { userId: demoDoctor.id } })
    }
    console.log(`✅ Demo doctor: ${demoDoctor.email}`)
  }

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

  // ── Doctor Schedules ─────────────────────────────────────────────────────────
  async function upsertSchedule(doctorId: string, day: number, start: string, end: string) {
    await prisma.doctorSchedule.upsert({
      where: { doctorId_dayOfWeek: { doctorId, dayOfWeek: day } },
      update: { startTime: start, endTime: end, isActive: true },
      create: { doctorId, dayOfWeek: day, startTime: start, endTime: end, isActive: true },
    })
  }
  const scheduleDoctors = await prisma.doctor.findMany({
    where: { email: { in: ["mihai.popescu@policare.ro", "elena.ionescu@policare.ro", "andrei.radu@policare.ro", "ionut.stan@policare.ro", "daniela.stoica@policare.ro"] } },
    select: { id: true, email: true },
  })
  for (const doc of scheduleDoctors) {
    for (const day of [0, 1, 2, 3, 4]) {
      await upsertSchedule(doc.id, day, "08:00", "17:00")
    }
  }
  console.log(`✅ Schedules created for ${scheduleDoctors.length} doctors`)

  // ── Demo Patient Accounts ────────────────────────────────────────────────────
  const patientPassword  = await bcrypt.hash("Pacient2026!", 10)
  const testPassword     = await bcrypt.hash("Test2026!", 10)

  const patientUser = await prisma.user.upsert({
    where: { email: "pacient@policare.ro" },
    update: {},
    create: { email: "pacient@policare.ro", name: "Maria Ionescu", password: patientPassword, role: "PATIENT", status: "ACTIVE" },
  })
  const testUser = await prisma.user.upsert({
    where: { email: "test@policare.ro" },
    update: {},
    create: { email: "test@policare.ro", name: "Alexandru Dima", password: testPassword, role: "PATIENT", status: "ACTIVE" },
  })

  const mariaPatient = await prisma.patient.upsert({
    where: { userId: patientUser.id },
    update: {},
    create: {
      name: "Maria Ionescu", email: "pacient@policare.ro", phone: "0744 123 456",
      cnp: "2890315251234", birthDate: new Date("1989-03-15"), age: 35,
      gender: "FEMININ", address: "Str. Florilor nr. 12, București", status: "ACTIV",
      userId: patientUser.id,
    },
  })
  const alexandruPatient = await prisma.patient.upsert({
    where: { userId: testUser.id },
    update: {},
    create: {
      name: "Alexandru Dima", email: "test@policare.ro", phone: "0755 987 654",
      cnp: "1920420214567", birthDate: new Date("1992-04-20"), age: 32,
      gender: "MASCULIN", address: "Bd. Unirii nr. 8, Cluj-Napoca", status: "ACTIV",
      userId: testUser.id,
    },
  })
  console.log(`✅ Demo patients: ${mariaPatient.name}, ${alexandruPatient.name}`)

  // ── Additional Patients ──────────────────────────────────────────────────────
  const patientData = [
    { name: "Ion Popescu",       email: "ion.popescu@gmail.com",      phone: "0722 111 222", cnp: "1750612034567", birthDate: new Date("1975-06-12"), age: 50, gender: "MASCULIN" as const, address: "Str. Republicii nr. 5, Ploiești",         status: "ACTIV" as const  },
    { name: "Ana Constantin",    email: "ana.constantin@yahoo.com",    phone: "0733 222 333", cnp: "2830218154321", birthDate: new Date("1983-02-18"), age: 41, gender: "FEMININ" as const,   address: "Calea Victoriei nr. 88, București",     status: "ACTIV" as const  },
    { name: "George Radu",       email: "george.radu@gmail.com",       phone: "0744 333 444", cnp: "1910905325678", birthDate: new Date("1991-09-05"), age: 33, gender: "MASCULIN" as const, address: "Str. Mihai Viteazul nr. 3, Brașov",     status: "PROGRAMAT" as const },
    { name: "Elena Dumitrescu",  email: "elena.d@gmail.com",           phone: "0755 444 555", cnp: "2680423456789", birthDate: new Date("1968-04-23"), age: 56, gender: "FEMININ" as const,   address: "Bd. Decebal nr. 14, Iași",              status: "ACTIV" as const  },
    { name: "Mihai Popa",        email: "mihai.popa@outlook.com",      phone: "0766 555 666", cnp: "1851130567890", birthDate: new Date("1985-11-30"), age: 39, gender: "MASCULIN" as const, address: "Str. Eminescu nr. 22, Timișoara",       status: "ACTIV" as const  },
    { name: "Cristina Marin",    email: "cristina.marin@gmail.com",    phone: "0777 666 777", cnp: "2970714678901", birthDate: new Date("1997-07-14"), age: 27, gender: "FEMININ" as const,   address: "Str. Libertății nr. 7, Constanța",     status: "NOU" as const    },
    { name: "Bogdan Stoica",     email: "bogdan.stoica@yahoo.com",     phone: "0788 777 888", cnp: "1800325789012", birthDate: new Date("1980-03-25"), age: 44, gender: "MASCULIN" as const, address: "Calea Floreasca nr. 55, București",     status: "ACTIV" as const  },
    { name: "Ioana Gheorghe",    email: "ioana.g@gmail.com",           phone: "0799 888 999", cnp: "2950811890123", birthDate: new Date("1995-08-11"), age: 29, gender: "FEMININ" as const,   address: "Str. Cetății nr. 9, Cluj-Napoca",       status: "PROGRAMAT" as const },
    { name: "Radu Vasilescu",    email: "radu.vasilescu@gmail.com",    phone: "0700 123 456", cnp: "1720418901234", birthDate: new Date("1972-04-18"), age: 52, gender: "MASCULIN" as const, address: "Str. Dorobanți nr. 31, București",      status: "ACTIV" as const  },
    { name: "Alina Tudose",      email: "alina.tudose@outlook.com",    phone: "0711 234 567", cnp: "2881225012345", birthDate: new Date("1988-12-25"), age: 36, gender: "FEMININ" as const,   address: "Bd. Tomis nr. 48, Constanța",           status: "ACTIV" as const  },
    { name: "Florin Niculae",    email: "florin.n@gmail.com",          phone: "0722 345 678", cnp: "1640707123456", birthDate: new Date("1964-07-07"), age: 60, gender: "MASCULIN" as const, address: "Str. Andrei Mureșanu nr. 4, Sibiu",     status: "INACTIV" as const },
    { name: "Carmen Oprea",      email: "carmen.oprea@gmail.com",      phone: "0733 456 789", cnp: "2790516234567", birthDate: new Date("1979-05-16"), age: 45, gender: "FEMININ" as const,   address: "Str. Progresului nr. 11, Pitești",      status: "ACTIV" as const  },
    { name: "Andrei Barbu",      email: "andrei.barbu@yahoo.com",      phone: "0744 567 890", cnp: "1930122345678", birthDate: new Date("1993-01-22"), age: 31, gender: "MASCULIN" as const, address: "Calea Moșilor nr. 72, București",       status: "ACTIV" as const  },
    { name: "Simona Dinu",       email: "simona.dinu@gmail.com",       phone: "0755 678 901", cnp: "2010930456789", birthDate: new Date("2001-09-30"), age: 23, gender: "FEMININ" as const,   address: "Str. Traian nr. 5, Galați",             status: "NOU" as const    },
    { name: "Liviu Moldovan",    email: "liviu.moldovan@outlook.com",  phone: "0766 789 012", cnp: "1771015567890", birthDate: new Date("1977-10-15"), age: 47, gender: "MASCULIN" as const, address: "Bd. Revoluției nr. 20, Arad",           status: "ACTIV" as const  },
  ]
  const createdPatients: typeof mariaPatient[] = []
  for (const p of patientData) {
    const existing = await prisma.patient.findFirst({ where: { email: p.email } })
    if (!existing) {
      const created = await prisma.patient.create({ data: p })
      createdPatients.push(created)
    } else {
      createdPatients.push(existing)
    }
  }
  console.log(`✅ ${createdPatients.length} additional patients`)

  // ── Appointments ─────────────────────────────────────────────────────────────
  const allPatients = [mariaPatient, alexandruPatient, ...createdPatients]
  const drPopescu  = await prisma.doctor.findUnique({ where: { email: "mihai.popescu@policare.ro" } })
  const drIonescu  = await prisma.doctor.findUnique({ where: { email: "elena.ionescu@policare.ro" } })
  const drRadu     = await prisma.doctor.findUnique({ where: { email: "andrei.radu@policare.ro" } })
  const drStan     = await prisma.doctor.findUnique({ where: { email: "ionut.stan@policare.ro" } })
  const drStoica   = await prisma.doctor.findUnique({ where: { email: "daniela.stoica@policare.ro" } })
  const deptCardio   = await prisma.department.findFirst({ where: { name: "Cardiologie" } })
  const deptORL      = await prisma.department.findFirst({ where: { name: "ORL" } })
  const deptOftalmo  = await prisma.department.findFirst({ where: { name: "Oftalmologie" } })
  const deptPediatrie = await prisma.department.findFirst({ where: { name: "Pediatrie" } })
  const deptNeuro    = await prisma.department.findFirst({ where: { name: "Neurologie" } })

  const svcCardio  = await prisma.service.findFirst({ where: { name: "Consultație cardiologie" } })
  const svcORL     = await prisma.service.findFirst({ where: { name: "Consultație ORL" } })
  const svcOftalmo = await prisma.service.findFirst({ where: { name: "Consultație oftalmologie" } })
  const svcPediatrie = await prisma.service.findFirst({ where: { name: "Consultație pediatrie" } })
  const svcNeuro   = await prisma.service.findFirst({ where: { name: "Consultație neurologie" } })
  const svcEKG     = await prisma.service.findFirst({ where: { name: "EKG (electrocardiogramă)" } })
  const svcEcho    = await prisma.service.findFirst({ where: { name: "Ecocardiografie" } })

  function daysFromNow(n: number, hour = 10, minute = 0): Date {
    const d = new Date()
    d.setDate(d.getDate() + n)
    d.setHours(hour, minute, 0, 0)
    return d
  }
  function endTime(startHour: number, startMin: number, durationMin: number): string {
    const total = startHour * 60 + startMin + durationMin
    return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`
  }

  type ApptSeed = {
    date: Date; startTime: string; endTime: string; duration: number
    status: "IN_ASTEPTARE"|"CONFIRMAT"|"IN_DESFASURARE"|"FINALIZAT"|"ANULAT"|"NEPREZENTARE"
    paymentStatus: "UNPAID"|"PAID"|"PENDING"|"REFUNDED"
    patientId: string; doctorId: string; departmentId: string; serviceId?: string; notes?: string
  }

  const apptSeeds: ApptSeed[] = [
    // ── Past FINALIZAT (for medical records) ────────────────────────────────
    { date: daysFromNow(-28, 9),  startTime: "09:00", endTime: endTime(9,0,30),  duration: 30, status: "FINALIZAT", paymentStatus: "PAID",   patientId: mariaPatient.id,     doctorId: drPopescu!.id, departmentId: deptCardio!.id,   serviceId: svcCardio?.id  },
    { date: daysFromNow(-25, 10), startTime: "10:00", endTime: endTime(10,0,30), duration: 30, status: "FINALIZAT", paymentStatus: "PAID",   patientId: allPatients[2].id,   doctorId: drIonescu!.id, departmentId: deptORL!.id,      serviceId: svcORL?.id     },
    { date: daysFromNow(-22, 11), startTime: "11:00", endTime: endTime(11,0,30), duration: 30, status: "FINALIZAT", paymentStatus: "UNPAID", patientId: allPatients[3].id,   doctorId: drRadu!.id,    departmentId: deptOftalmo!.id,  serviceId: svcOftalmo?.id },
    { date: daysFromNow(-20, 9),  startTime: "09:00", endTime: endTime(9,0,45),  duration: 45, status: "FINALIZAT", paymentStatus: "PAID",   patientId: alexandruPatient.id, doctorId: drStoica!.id,  departmentId: deptNeuro!.id,    serviceId: svcNeuro?.id   },
    { date: daysFromNow(-18, 14), startTime: "14:00", endTime: endTime(14,0,30), duration: 30, status: "FINALIZAT", paymentStatus: "PAID",   patientId: allPatients[4].id,   doctorId: drPopescu!.id, departmentId: deptCardio!.id,   serviceId: svcEKG?.id     },
    { date: daysFromNow(-15, 10), startTime: "10:00", endTime: endTime(10,0,30), duration: 30, status: "FINALIZAT", paymentStatus: "PAID",   patientId: allPatients[5].id,   doctorId: drStan!.id,    departmentId: deptPediatrie!.id, serviceId: svcPediatrie?.id },
    // ── Past FINALIZAT + ANULAT ──────────────────────────────────────────────
    { date: daysFromNow(-12, 11), startTime: "11:00", endTime: endTime(11,0,30), duration: 30, status: "FINALIZAT", paymentStatus: "PAID",   patientId: allPatients[6].id,   doctorId: drPopescu!.id, departmentId: deptCardio!.id,   serviceId: svcCardio?.id  },
    { date: daysFromNow(-10, 9),  startTime: "09:00", endTime: endTime(9,0,30),  duration: 30, status: "FINALIZAT", paymentStatus: "UNPAID", patientId: allPatients[7].id,   doctorId: drIonescu!.id, departmentId: deptORL!.id,      serviceId: svcORL?.id     },
    { date: daysFromNow(-8,  15), startTime: "15:00", endTime: endTime(15,0,30), duration: 30, status: "ANULAT",   paymentStatus: "UNPAID", patientId: allPatients[8].id,   doctorId: drRadu!.id,    departmentId: deptOftalmo!.id,  serviceId: svcOftalmo?.id, notes: "Pacient indisponibil" },
    { date: daysFromNow(-5,  10), startTime: "10:00", endTime: endTime(10,0,45), duration: 45, status: "ANULAT",   paymentStatus: "UNPAID", patientId: allPatients[9].id,   doctorId: drStoica!.id,  departmentId: deptNeuro!.id,    serviceId: svcNeuro?.id,   notes: "Reprogramare solicitată" },
    { date: daysFromNow(-3,  13), startTime: "13:00", endTime: endTime(13,0,45), duration: 45, status: "FINALIZAT", paymentStatus: "PAID",   patientId: allPatients[10].id,  doctorId: drPopescu!.id, departmentId: deptCardio!.id,   serviceId: svcEcho?.id    },
    { date: daysFromNow(-1,  9),  startTime: "09:00", endTime: endTime(9,0,30),  duration: 30, status: "FINALIZAT", paymentStatus: "PAID",   patientId: alexandruPatient.id, doctorId: drIonescu!.id, departmentId: deptORL!.id,      serviceId: svcORL?.id     },
    // ── Today ────────────────────────────────────────────────────────────────
    { date: daysFromNow(0, 9),    startTime: "09:00", endTime: endTime(9,0,30),  duration: 30, status: "CONFIRMAT",        paymentStatus: "UNPAID", patientId: mariaPatient.id,     doctorId: drPopescu!.id, departmentId: deptCardio!.id,   serviceId: svcCardio?.id  },
    { date: daysFromNow(0, 10),   startTime: "10:00", endTime: endTime(10,0,30), duration: 30, status: "IN_DESFASURARE",   paymentStatus: "UNPAID", patientId: allPatients[11].id,  doctorId: drPopescu!.id, departmentId: deptCardio!.id,   serviceId: svcEKG?.id     },
    { date: daysFromNow(0, 14),   startTime: "14:00", endTime: endTime(14,0,30), duration: 30, status: "CONFIRMAT",        paymentStatus: "UNPAID", patientId: alexandruPatient.id, doctorId: drStoica!.id,  departmentId: deptNeuro!.id,    serviceId: svcNeuro?.id   },
    // ── Near future: next 7 days ─────────────────────────────────────────────
    { date: daysFromNow(1, 9),    startTime: "09:00", endTime: endTime(9,0,30),  duration: 30, status: "CONFIRMAT",   paymentStatus: "UNPAID", patientId: allPatients[12].id,  doctorId: drIonescu!.id, departmentId: deptORL!.id,      serviceId: svcORL?.id     },
    { date: daysFromNow(2, 11),   startTime: "11:00", endTime: endTime(11,0,30), duration: 30, status: "IN_ASTEPTARE", paymentStatus: "UNPAID", patientId: allPatients[0].id,   doctorId: drRadu!.id,    departmentId: deptOftalmo!.id,  serviceId: svcOftalmo?.id },
    { date: daysFromNow(3, 10),   startTime: "10:00", endTime: endTime(10,0,30), duration: 30, status: "CONFIRMAT",   paymentStatus: "UNPAID", patientId: allPatients[1].id,   doctorId: drPopescu!.id, departmentId: deptCardio!.id,   serviceId: svcCardio?.id  },
    { date: daysFromNow(4, 9),    startTime: "09:00", endTime: endTime(9,0,30),  duration: 30, status: "IN_ASTEPTARE", paymentStatus: "UNPAID", patientId: mariaPatient.id,     doctorId: drPopescu!.id, departmentId: deptCardio!.id,   serviceId: svcEKG?.id,    notes: "Control tensiune" },
    { date: daysFromNow(5, 14),   startTime: "14:00", endTime: endTime(14,0,45), duration: 45, status: "IN_ASTEPTARE", paymentStatus: "UNPAID", patientId: allPatients[13].id,  doctorId: drStan!.id,    departmentId: deptPediatrie!.id, serviceId: svcPediatrie?.id },
    { date: daysFromNow(5, 15),   startTime: "15:00", endTime: endTime(15,0,30), duration: 30, status: "IN_ASTEPTARE", paymentStatus: "UNPAID", patientId: alexandruPatient.id, doctorId: drPopescu!.id, departmentId: deptCardio!.id,   serviceId: svcCardio?.id  },
    { date: daysFromNow(6, 10),   startTime: "10:00", endTime: endTime(10,0,30), duration: 30, status: "IN_ASTEPTARE", paymentStatus: "UNPAID", patientId: allPatients[14].id,  doctorId: drStoica!.id,  departmentId: deptNeuro!.id,    serviceId: svcNeuro?.id   },
    { date: daysFromNow(7, 11),   startTime: "11:00", endTime: endTime(11,0,30), duration: 30, status: "IN_ASTEPTARE", paymentStatus: "UNPAID", patientId: allPatients[2].id,   doctorId: drIonescu!.id, departmentId: deptORL!.id,      serviceId: svcORL?.id     },
    // ── Further future: +8 to +30 days ──────────────────────────────────────
    { date: daysFromNow(10, 9),   startTime: "09:00", endTime: endTime(9,0,30),  duration: 30, status: "IN_ASTEPTARE", paymentStatus: "UNPAID", patientId: allPatients[3].id,   doctorId: drRadu!.id,    departmentId: deptOftalmo!.id,  serviceId: svcOftalmo?.id },
    { date: daysFromNow(12, 10),  startTime: "10:00", endTime: endTime(10,0,30), duration: 30, status: "IN_ASTEPTARE", paymentStatus: "UNPAID", patientId: allPatients[4].id,   doctorId: drPopescu!.id, departmentId: deptCardio!.id,   serviceId: svcCardio?.id  },
    { date: daysFromNow(14, 11),  startTime: "11:00", endTime: endTime(11,0,30), duration: 30, status: "IN_ASTEPTARE", paymentStatus: "UNPAID", patientId: allPatients[5].id,   doctorId: drStan!.id,    departmentId: deptPediatrie!.id, serviceId: svcPediatrie?.id },
    { date: daysFromNow(17, 14),  startTime: "14:00", endTime: endTime(14,0,45), duration: 45, status: "IN_ASTEPTARE", paymentStatus: "UNPAID", patientId: allPatients[6].id,   doctorId: drStoica!.id,  departmentId: deptNeuro!.id,    serviceId: svcNeuro?.id   },
    { date: daysFromNow(20, 9),   startTime: "09:00", endTime: endTime(9,0,30),  duration: 30, status: "IN_ASTEPTARE", paymentStatus: "UNPAID", patientId: allPatients[7].id,   doctorId: drIonescu!.id, departmentId: deptORL!.id,      serviceId: svcORL?.id     },
    { date: daysFromNow(22, 10),  startTime: "10:00", endTime: endTime(10,0,30), duration: 30, status: "IN_ASTEPTARE", paymentStatus: "UNPAID", patientId: allPatients[8].id,   doctorId: drPopescu!.id, departmentId: deptCardio!.id,   serviceId: svcEcho?.id    },
    { date: daysFromNow(25, 11),  startTime: "11:00", endTime: endTime(11,0,30), duration: 30, status: "IN_ASTEPTARE", paymentStatus: "UNPAID", patientId: allPatients[9].id,   doctorId: drRadu!.id,    departmentId: deptOftalmo!.id,  serviceId: svcOftalmo?.id },
    { date: daysFromNow(28, 15),  startTime: "15:00", endTime: endTime(15,0,30), duration: 30, status: "IN_ASTEPTARE", paymentStatus: "UNPAID", patientId: allPatients[10].id,  doctorId: drStoica!.id,  departmentId: deptNeuro!.id,    serviceId: svcNeuro?.id   },
  ]

  const createdAppts: { id: string; patientId: string; date: Date; startTime: string; status: string; doctorId: string }[] = []
  for (const appt of apptSeeds) {
    const existing = await prisma.appointment.findFirst({
      where: { patientId: appt.patientId, doctorId: appt.doctorId, date: appt.date, startTime: appt.startTime },
    })
    if (!existing) {
      const created = await prisma.appointment.create({ data: appt, select: { id: true, patientId: true, date: true, startTime: true, status: true, doctorId: true } })
      createdAppts.push(created)
    } else {
      createdAppts.push(existing)
    }
  }
  console.log(`✅ ${createdAppts.length} appointments`)

  // ── Medical Records ──────────────────────────────────────────────────────────
  const finishedAppts = createdAppts.filter(a => a.status === "FINALIZAT")
  const medicalRecordData = [
    { symptoms: "Palpitații, oboseală la efort, amețeli",         diagnosis: "Hipertensiune arterială stadiu II",    treatment: "Losartan 50mg, Amlodipina 5mg, regim hiposodat",          notes: "Control la 3 luni" },
    { symptoms: "Durere în gât, congestie nazală, secreție nazală", diagnosis: "Rinită alergică sezonieră și faringită", treatment: "Aerius 5mg, spray nazal corticosteroid Flixonase",         notes: "Evitarea alergenilor" },
    { symptoms: "Vedere neclară de aproape, oboseală oculară",    diagnosis: "Astigmatism miopic OD -1.75/-0.50",    treatment: "Prescripție ochelari, control la 6 luni",                  notes: "Recomandare lentile de contact" },
    { symptoms: "Cefalee, vertij, tulburări de echilibru",        diagnosis: "Migrenă cu aură",                       treatment: "Sumatriptan 50mg la criză, Topiramat 25mg profilactic",   notes: "Jurnal cefalee recomandat" },
    { symptoms: "Palpitații episodice, discomfort precordial",    diagnosis: "Tahicardie sinusală funcțională + EKG normal", treatment: "Reducerea stresului, magnezeniu B6, reevaluare la nevoie", notes: "Monitorizare Holter programată" },
    { symptoms: "Febră 38.5°C, tuse, secretii nasofaringiene",   diagnosis: "Infecție virală a căilor respiratorii superioare", treatment: "Ibuprofen 400mg, xilometazolina spray, vitamina C", notes: "Repaus la domiciliu 3 zile" },
  ]
  let recordsCreated = 0
  for (let i = 0; i < Math.min(finishedAppts.length, medicalRecordData.length); i++) {
    const appt = finishedAppts[i]
    const existing = await prisma.medicalRecord.findFirst({ where: { appointmentId: appt.id } })
    if (!existing) {
      await prisma.medicalRecord.create({
        data: {
          visitDate: appt.date,
          patientId: appt.patientId,
          appointmentId: appt.id,
          followUpRequired: i % 2 === 0,
          ...medicalRecordData[i],
        },
      })
      recordsCreated++
    }
  }
  console.log(`✅ ${recordsCreated} medical records`)

  // ── Prescriptions ────────────────────────────────────────────────────────────
  type MedItem = { name: string; concentration: string; dosage: string; duration: string; notes?: string }
  async function upsertRx(number: string, patientId: string, diagnosis: string, medications: MedItem[], status: "ACTIVA"|"EXPIRATA"|"ANULATA", appointmentId?: string) {
    const exists = await prisma.prescription.findUnique({ where: { number } })
    if (!exists) {
      await prisma.prescription.create({
        data: { number, patientId, doctorId: drPopescu!.id, appointmentId: appointmentId ?? null, diagnosis, medications, status },
      })
    }
  }

  // Maria Ionescu — 3 prescriptions
  const mariaFinishedAppt = createdAppts.find(a => a.patientId === mariaPatient.id && a.status === "FINALIZAT")
  await upsertRx("RX-2026-0091", mariaPatient.id, "Hipertensiune arterială stadiu II",
    [{ name: "Losartan", concentration: "50mg", dosage: "1 comprimat/zi", duration: "30 zile", notes: "Dimineața" },
     { name: "Amlodipina", concentration: "5mg", dosage: "1 comprimat/zi", duration: "30 zile", notes: "Seara" }],
    "ACTIVA", mariaFinishedAppt?.id)
  await upsertRx("RX-2026-0092", mariaPatient.id, "Anxietate generalizată",
    [{ name: "Alprazolam", concentration: "0.25mg", dosage: "½ comprimat seara", duration: "14 zile", notes: "Înainte de culcare" }],
    "ACTIVA")
  await upsertRx("RX-2026-0093", mariaPatient.id, "Infecție urinară acută",
    [{ name: "Norfloxacin", concentration: "400mg", dosage: "1 comprimat la 12h", duration: "7 zile", notes: "Cu 1h înainte sau 2h după mese" }],
    "EXPIRATA")

  // Alexandru Dima — 2 prescriptions
  await upsertRx("RX-2026-0094", alexandruPatient.id, "Migrenă cu aură",
    [{ name: "Sumatriptan", concentration: "50mg", dosage: "1 comprimat la criză", duration: "La nevoie", notes: "Max 2/zi" },
     { name: "Topiramat", concentration: "25mg", dosage: "1 comprimat/zi", duration: "90 zile", notes: "Profilactic, seara" }],
    "ACTIVA")
  await upsertRx("RX-2026-0095", alexandruPatient.id, "Insomnie acută",
    [{ name: "Melatonina", concentration: "3mg", dosage: "1 comprimat cu 30min înainte de culcare", duration: "30 zile" }],
    "ACTIVA")

  // 3 other patients — 1 prescription each
  await upsertRx("RX-2026-0096", allPatients[2].id, "Rinită alergică sezonieră",
    [{ name: "Cetirizina", concentration: "10mg", dosage: "1 comprimat/zi", duration: "30 zile", notes: "Seara" }],
    "ACTIVA")
  await upsertRx("RX-2026-0097", allPatients[4].id, "Hipertensiune arterială stadiu I",
    [{ name: "Perindopril", concentration: "5mg", dosage: "1 comprimat/zi", duration: "60 zile", notes: "Dimineața pe nemâncate" }],
    "ACTIVA")
  await upsertRx("RX-2026-0098", allPatients[6].id, "Gastroesofagită de reflux",
    [{ name: "Omeprazol", concentration: "20mg", dosage: "1 comprimat/zi", duration: "30 zile", notes: "Dimineața cu 30min înainte de masă" }],
    "ACTIVA")
  console.log("✅ Prescriptions created")

  // ── Notifications ────────────────────────────────────────────────────────────
  type NotifEvent = "BOOKING_RECEIVED"|"CONFIRMATION"|"REMINDER"|"CANCELLATION"|"CUSTOM"
  async function upsertNotif(appointmentId: string, event: NotifEvent, recipient: string, message: string) {
    const exists = await prisma.notification.findFirst({ where: { appointmentId, event } })
    if (!exists) {
      await prisma.notification.create({
        data: { appointmentId, event, type: "EMAIL", status: "SENT", recipient, message,
                sentAt: new Date(Date.now() - Math.floor(Math.random() * 86400000)) },
      })
    }
  }

  // Maria Ionescu notifications
  const mariaPastAppt    = createdAppts.find(a => a.patientId === mariaPatient.id && a.status === "FINALIZAT")
  const mariaTodayAppt   = createdAppts.find(a => a.patientId === mariaPatient.id && a.status === "CONFIRMAT")
  const mariaFutureAppt  = createdAppts.find(a => a.patientId === mariaPatient.id && a.status === "IN_ASTEPTARE")
  if (mariaPastAppt) {
    await upsertNotif(mariaPastAppt.id, "BOOKING_RECEIVED", mariaPatient.email!, "Cererea dvs. de programare a fost primită.")
    await upsertNotif(mariaPastAppt.id, "CONFIRMATION",     mariaPatient.email!, "Programarea dvs. a fost confirmată.")
  }
  if (mariaTodayAppt) {
    await upsertNotif(mariaTodayAppt.id, "BOOKING_RECEIVED", mariaPatient.email!, "Cererea dvs. de programare a fost primită.")
    await upsertNotif(mariaTodayAppt.id, "REMINDER",         mariaPatient.email!, "Reminder: aveți o programare astăzi.")
  }
  if (mariaFutureAppt)  await upsertNotif(mariaFutureAppt.id,  "BOOKING_RECEIVED", mariaPatient.email!, "Cererea dvs. de programare a fost primită.")

  // Alexandru Dima notifications
  const alexPastAppt   = createdAppts.find(a => a.patientId === alexandruPatient.id && a.status === "FINALIZAT")
  const alexTodayAppt  = createdAppts.find(a => a.patientId === alexandruPatient.id && a.status === "CONFIRMAT")
  const alexFutureAppt = createdAppts.find(a => a.patientId === alexandruPatient.id && a.status === "IN_ASTEPTARE")
  if (alexPastAppt) {
    await upsertNotif(alexPastAppt.id, "BOOKING_RECEIVED", alexandruPatient.email!, "Cererea dvs. de programare a fost primită.")
    await upsertNotif(alexPastAppt.id, "CONFIRMATION",     alexandruPatient.email!, "Programarea dvs. a fost confirmată.")
  }
  if (alexTodayAppt) {
    await upsertNotif(alexTodayAppt.id, "BOOKING_RECEIVED", alexandruPatient.email!, "Cererea dvs. de programare a fost primită.")
    await upsertNotif(alexTodayAppt.id, "REMINDER",         alexandruPatient.email!, "Reminder: aveți o programare astăzi.")
  }
  if (alexFutureAppt) await upsertNotif(alexFutureAppt.id, "BOOKING_RECEIVED", alexandruPatient.email!, "Cererea dvs. de programare a fost primită.")
  console.log("✅ Notifications created")

  // ── Documents for client test account (Alexandru Dima) ───────────────────────
  const alexDocs = [
    { name: "Analize de sânge — hemogramă completă",   type: "application/pdf", size: 184320,  url: "https://mockstorage.blob.core.windows.net/documents/alex-dima/analize-sange-2026-04.pdf",    createdAt: daysFromNow(-45) },
    { name: "Ecografie abdominală",                     type: "application/pdf", size: 2621440, url: "https://mockstorage.blob.core.windows.net/documents/alex-dima/ecografie-abdomen-2026-03.pdf", createdAt: daysFromNow(-72) },
    { name: "Radiografie torace față",                 type: "application/pdf", size: 1572864, url: "https://mockstorage.blob.core.windows.net/documents/alex-dima/radiografie-torace-2026-02.pdf", createdAt: daysFromNow(-90) },
    { name: "Scrisoare medicală — Dr. Stoica",          type: "application/pdf", size: 98304,   url: "https://mockstorage.blob.core.windows.net/documents/alex-dima/scrisoare-medicala-2026-05.pdf", createdAt: daysFromNow(-10) },
    { name: "Buletin identitate (copie)",               type: "image/png",       size: 512000,  url: "https://mockstorage.blob.core.windows.net/documents/alex-dima/buletin-identitate.png",         createdAt: daysFromNow(-120) },
  ]
  for (const doc of alexDocs) {
    const existing = await prisma.document.findFirst({ where: { patientId: alexandruPatient.id, name: doc.name } })
    if (!existing) {
      await prisma.document.create({ data: { ...doc, patientId: alexandruPatient.id } })
    }
  }
  console.log(`✅ ${alexDocs.length} documents for Alexandru Dima`)

  console.log("\n🎉 Seeding complete!")
  console.log("   Admin:         admin@policare.ro / admin123")
  console.log("   Front Desk:    receptie@policare.ro / receptie123")
  console.log("   Dr. Popescu:   demo.doctor@policare.ro / Demo2026!")
  console.log("   Marketing:     marketing@policare.ro / Demo2026!")
  console.log("   Pacient demo:  pacient@policare.ro / Pacient2026!")
  console.log("   Cont test:     test@policare.ro / Test2026!")
}

main()
  .catch((e) => { console.error("❌ Seeding failed:", e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
