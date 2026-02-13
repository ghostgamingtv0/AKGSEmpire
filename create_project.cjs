const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Ensure .config directory exists
const configDir = path.resolve('.config');
if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
}

// Configuration
process.env.CLOUDFLARE_API_TOKEN = 'R76B-1FQYEi6BDYPGw-yD4NB-tK2q50_iar4uacU';
process.env.CLOUDFLARE_ACCOUNT_ID = 'f139034ef7924a1d387c88f394b535a2';
process.env.XDG_CONFIG_HOME = configDir;

const wrangler = path.resolve('node_modules/wrangler/bin/wrangler.js');

console.log('Creating Cloudflare Pages project: akgsempire...');

const child = spawn(process.execPath, [wrangler, 'pages', 'project', 'create', 'akgsempire', '--production-branch', 'main'], {
    stdio: 'inherit',
    env: process.env
});

child.on('close', (code) => {
    console.log(`Process exited with code ${code}`);
});
