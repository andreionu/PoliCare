const readline = require('readline');
const { spawn } = require('child_process');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const menu = `
=========================================
      Clinic Admin Setup & Start
=========================================
Please select an option:
1) Push DB to Supabase & Start Project
2) Just Start Project (npm run dev)
3) Generate Prisma Client & Start
4) Start with Stripe CLI (dev + webhook listener)
5) Exit
=========================================
Enter your choice (1-5): `;

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, { stdio: 'inherit', shell: true });
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Command failed with exit code ${code}`));
    });
  });
}

function runParallel(commands) {
  const procs = commands.map(({ command, args }) =>
    spawn(command, args, { stdio: 'inherit', shell: true })
  );
  return new Promise((resolve, reject) => {
    procs.forEach((proc) => {
      proc.on('close', (code) => {
        procs.forEach((p) => { try { p.kill(); } catch (_) {} });
        if (code === 0 || code === null) resolve();
        else reject(new Error(`Process exited with code ${code}`));
      });
    });
  });
}

rl.question(menu, async (answer) => {
  rl.close();
  const choice = answer.trim();

  try {
    switch (choice) {
      case '1':
        console.log('\n>>> Pushing DB to Supabase...');
        await runCommand('npx', ['prisma', 'db', 'push']);
        console.log('\n>>> Starting Next.js Dev Server...');
        await runCommand('npm', ['run', 'dev']);
        break;
      case '2':
        console.log('\n>>> Starting Next.js Dev Server...');
        await runCommand('npm', ['run', 'dev']);
        break;
      case '3':
        console.log('\n>>> Generating Prisma Client...');
        await runCommand('npx', ['prisma', 'generate']);
        console.log('\n>>> Starting Next.js Dev Server...');
        await runCommand('npm', ['run', 'dev']);
        break;
      case '4':
        console.log('\n>>> Starting Next.js Dev Server + Stripe CLI...');
        await runParallel([
          { command: 'npm', args: ['run', 'dev'] },
          { command: 'stripe', args: ['listen', '--forward-to', 'localhost:3000/api/webhooks/stripe'] },
        ]);
        break;
      case '5':
        console.log('\nExiting...');
        process.exit(0);
      default:
        console.log('\nInvalid choice. Exiting...');
        process.exit(1);
    }
  } catch (error) {
    console.error('\nAn error occurred:', error.message);
    process.exit(1);
  }
});
