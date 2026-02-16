const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Ensure .config directory exists
const configDir = path.resolve('.config');
if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
}

// Configuration (must be provided via environment)
process.env.XDG_CONFIG_HOME = configDir;

const wrangler = path.resolve('node_modules/wrangler/bin/wrangler.js');

if (!process.env.CLOUDFLARE_API_TOKEN || !process.env.CLOUDFLARE_ACCOUNT_ID) {
    console.error('Missing CLOUDFLARE_API_TOKEN or CLOUDFLARE_ACCOUNT_ID in environment.');
    process.exit(1);
}

console.log('Creating Cloudflare Pages project: akgsempire...');

const child = spawn(process.execPath, [wrangler, 'pages', 'project', 'create', 'akgsempire', '--production-branch', 'main'], {
    stdio: 'inherit',
    env: process.env
});

child.on('close', (code) => {
    console.log(`Process exited with code ${code}`);
});
