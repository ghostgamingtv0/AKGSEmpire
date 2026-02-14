const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Ensure .config directory exists to avoid EPERM
const configDir = path.resolve('.config');
if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
}

// Build Step: Run Vite and Esbuild
console.log('Building project...');
try {
    // 1. Build Frontend (Vite)
    console.log('Running Vite Build...');
    execSync(`"${process.execPath}" "node_modules/vite/bin/vite.js" build`, { stdio: 'inherit' });

    // 2. Build Worker (Esbuild)
    console.log('Running Worker Build...');
    execSync(`"${process.execPath}" "node_modules/esbuild/bin/esbuild" src/worker.js --bundle --outfile=dist/_worker.js --format=esm`, { stdio: 'inherit' });
    
    console.log('Build completed successfully.');
} catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
}

// Configuration for API Token (read from environment only)
if (!process.env.CLOUDFLARE_API_TOKEN || !process.env.CLOUDFLARE_ACCOUNT_ID) {
    console.warn('Cloudflare credentials not set in environment. Skipping Pages deploy step.');
    process.exit(0);
}

process.env.XDG_CONFIG_HOME = configDir;

const wrangler = path.resolve('node_modules/wrangler/bin/wrangler.js');
const logFile = path.resolve('deployment_log.txt');
const logStream = fs.createWriteStream(logFile, { flags: 'a' });

console.log('Deploying to Cloudflare using environment credentials...');
console.log(`Wrangler path: ${wrangler}`);

const child = spawn(process.execPath, [wrangler, 'pages', 'deploy', 'dist', '--project-name', 'akgsempire'], {
    stdio: ['ignore', 'pipe', 'pipe'], // Capture stdout and stderr
    env: process.env
});

child.stdout.on('data', (data) => {
    process.stdout.write(data);
    logStream.write(data);
});

child.stderr.on('data', (data) => {
    process.stderr.write(data);
    logStream.write(data);
});

child.on('close', (code) => {
    console.log(`Deployment process exited with code ${code}`);
    logStream.write(`Deployment process exited with code ${code}\n`);
    logStream.end();
    process.exit(code);
});
