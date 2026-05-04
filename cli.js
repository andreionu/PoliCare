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
4) Exit
=========================================
Enter your choice (1-4): `;

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, { stdio: 'inherit', shell: true });
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Command failed with exit code ${code}`));
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
