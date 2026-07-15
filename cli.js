const readline = require("readline")
const { spawn } = require("child_process")
const fs = require("fs")
const path = require("path")
require("dotenv").config({ quiet: true })

const npm = process.platform === "win32" ? "npm.cmd" : "npm"
const npx = process.platform === "win32" ? "npx.cmd" : "npx"
const stripeCliVersion = "1.43.8"

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

const menu = `
=======================================================
              PoliCare — Setup & Start
=======================================================
1) TOTUL: install + DB + build + backend + Stripe
2) Development: Next.js
3) Development: Next.js + Stripe
4) Sincronizează baza de date și pornește development
5) Generează Prisma Client și pornește development
6) Ieșire
=======================================================
Alege opțiunea (1-6): `

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      stdio: "inherit",
      shell: false,
      env: { ...process.env, ...options.env },
    })
    proc.once("error", reject)
    proc.once("close", code => {
      if (code === 0) resolve()
      else reject(new Error(`${command} ${args.join(" ")} s-a oprit cu codul ${code}`))
    })
  })
}

function captureCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      shell: false,
      stdio: ["ignore", "pipe", "inherit"],
      env: { ...process.env, ...options.env },
    })
    let output = ""
    proc.stdout.on("data", chunk => { output += chunk.toString() })
    proc.once("error", reject)
    proc.once("close", code => {
      if (code === 0) resolve(output.trim())
      else reject(new Error(`${command} ${args.join(" ")} s-a oprit cu codul ${code}`))
    })
  })
}

async function ensureStripeCli() {
  const executable = process.platform === "win32" ? "stripe.exe" : "stripe"
  const localStripe = path.resolve(".tools", executable)
  if (fs.existsSync(localStripe)) {
    const installedVersion = await captureCommand(localStripe, ["version"])
    if (installedVersion.includes(stripeCliVersion)) return localStripe
    console.log(`\n>>> Actualizez Stripe CLI local la versiunea ${stripeCliVersion}...`)
  }

  try {
    await captureCommand("stripe", ["version"])
    return "stripe"
  } catch (error) {
    if (error.code !== "ENOENT") throw error
  }

  const platform = process.platform === "linux"
    ? "linux"
    : process.platform === "darwin"
      ? "mac-os"
      : null
  const architecture = process.arch === "x64" ? "x86_64" : process.arch === "arm64" ? "arm64" : null
  if (!platform || !architecture) {
    throw new Error(`Instalarea automată Stripe CLI nu suportă ${process.platform}/${process.arch}`)
  }

  const toolsDirectory = path.resolve(".tools")
  const archive = path.join(toolsDirectory, `stripe-${stripeCliVersion}.tar.gz`)
  const url = `https://github.com/stripe/stripe-cli/releases/download/v${stripeCliVersion}/stripe_${stripeCliVersion}_${platform}_${architecture}.tar.gz`
  fs.mkdirSync(toolsDirectory, { recursive: true })

  console.log(`\n>>> Stripe CLI lipsește; instalez local versiunea ${stripeCliVersion}...`)
  await runCommand("curl", ["--fail", "--location", url, "--output", archive])
  await runCommand("tar", ["--extract", "--gzip", "--file", archive, "--directory", toolsDirectory, executable])
  fs.chmodSync(localStripe, 0o755)
  fs.unlinkSync(archive)
  console.log(`>>> Stripe CLI instalat în ${localStripe}`)
  return localStripe
}

async function runServices({ production = false } = {}) {
  const children = []
  let stopping = false

  const stopAll = signal => {
    if (stopping) return
    stopping = true
    for (const child of children) {
      if (!child.killed) child.kill(signal)
    }
  }

  const stripeCommand = await ensureStripeCli()
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Lipsește STRIPE_SECRET_KEY din fișierul .env")
  }
  const stripeEnv = { STRIPE_API_KEY: process.env.STRIPE_SECRET_KEY }
  const webhookSecret = await captureCommand(stripeCommand, ["listen", "--print-secret"], { env: stripeEnv })
  if (!webhookSecret.startsWith("whsec_")) {
    throw new Error("Stripe CLI nu a returnat un webhook secret valid; rulează autentificarea Stripe")
  }

  console.log("\n>>> Webhook Stripe configurat automat pentru această sesiune.")
  console.log(">>> Aplicație: http://localhost:3000")
  console.log(">>> Apasă Ctrl+C pentru a opri ambele servicii.\n")

  const app = spawn(npm, ["run", production ? "start" : "dev"], {
    stdio: "inherit",
    shell: false,
    env: { ...process.env, STRIPE_WEBHOOK_SECRET: webhookSecret },
  })
  const stripe = spawn(stripeCommand, ["listen", "--forward-to", "localhost:3000/api/webhooks/stripe"], {
    stdio: "inherit",
    shell: false,
    env: { ...process.env, ...stripeEnv },
  })
  children.push(app, stripe)

  return new Promise((resolve, reject) => {
    const handleSignal = signal => {
      stopAll(signal)
      resolve()
    }
    process.once("SIGINT", () => handleSignal("SIGINT"))
    process.once("SIGTERM", () => handleSignal("SIGTERM"))

    for (const child of children) {
      child.once("error", error => {
        stopAll("SIGTERM")
        reject(error)
      })
      child.once("close", code => {
        if (!stopping) {
          stopAll("SIGTERM")
          if (code === 0 || code === null) resolve()
          else reject(new Error(`Un serviciu s-a oprit cu codul ${code}`))
        }
      })
    }
  })
}

async function fullSetupAndStart() {
  if (!fs.existsSync(".env")) {
    throw new Error("Lipsește fișierul .env din rădăcina proiectului")
  }

  console.log("\n[1/5] Instalare dependențe...")
  await runCommand(npm, ["install"])

  console.log("\n[2/5] Generare Prisma Client...")
  await runCommand(npx, ["prisma", "generate"])

  console.log("\n[3/5] Sincronizare schemă bază de date...")
  await runCommand(npx, ["prisma", "db", "push"])

  console.log("\n[4/5] Build aplicație...")
  await runCommand(npm, ["run", "build"])

  console.log("\n[5/5] Pornire backend și Stripe...")
  await runServices({ production: true })
}

rl.question(menu, async answer => {
  rl.close()

  try {
    switch (answer.trim()) {
      case "1":
        await fullSetupAndStart()
        break
      case "2":
        await runCommand(npm, ["run", "dev"])
        break
      case "3":
        await runServices()
        break
      case "4":
        await runCommand(npx, ["prisma", "db", "push"])
        await runCommand(npm, ["run", "dev"])
        break
      case "5":
        await runCommand(npx, ["prisma", "generate"])
        await runCommand(npm, ["run", "dev"])
        break
      case "6":
        console.log("\nLa revedere!")
        break
      default:
        throw new Error("Opțiune invalidă")
    }
  } catch (error) {
    console.error(`\nEroare: ${error.message}`)
    if (error.code === "ENOENT") {
      console.error("Verifică dacă Node.js/npm și Stripe CLI sunt instalate și disponibile în PATH.")
    }
    process.exitCode = 1
  }
})
