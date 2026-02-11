const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

const TOKEN = process.env.DISCORD_BOT_TOKEN;

if (!TOKEN) {
    console.error('❌ Error: No Token found in .env');
    process.exit(1);
}

client.once('ready', async () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
    console.log('🔍 Scanning servers...');

    const guilds = await client.guilds.fetch();
    
    if (guilds.size === 0) {
        console.log('⚠️ The bot is not in any server yet.');
        console.log('👉 Please invite the bot using this link:');
        console.log(`https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot`);
    } else {
        console.log(`🎉 Found ${guilds.size} server(s):`);
        guilds.forEach(guild => {
            console.log(`- Name: ${guild.name} | ID: ${guild.id}`);
        });
    }

    process.exit(0);
});

client.login(TOKEN).catch(err => {
    console.error('❌ Login Failed:', err.message);
    process.exit(1);
});
