
const { Client, GatewayIntentBits, ChannelType, PermissionsBitField } = require('discord.js');
require('dotenv').config();

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

const GUILD_ID = process.env.DISCORD_GUILD_ID || '1427171466276900897';

// Channels that must be READ-ONLY for everyone (except Admin/Bot)
const READ_ONLY_CATEGORIES = [
    '📂 INFORMATION',
    '📡 SOCIAL FEEDS',
    '📊 CRYPTO & WEB3 HUB',
    '🏆 HALL OF FAME (قاعة المشاهير)',
    '🎁 REWARDS & DROPS (الجوائز)'
];

client.once('ready', async () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
    const guild = await client.guilds.fetch(GUILD_ID);
    
    if (!guild) {
        console.error('❌ Server not found!');
        process.exit(1);
    }
    
    console.log(`🔒 Securing Channels in ${guild.name}...`);

    // 1. Lock down categories
    const categories = guild.channels.cache.filter(c => c.type === ChannelType.GuildCategory);
    
    for (const [id, category] of categories) {
        if (READ_ONLY_CATEGORIES.some(name => category.name.includes(name.split(' ')[1]))) { // Loose match
            console.log(`🔒 Locking Category: ${category.name}`);
            
            // Apply permission overwrite
            await category.permissionOverwrites.edit(guild.roles.everyone, {
                SendMessages: false,
                AddReactions: true, // Allow reactions
                ViewChannel: true
            });

            // Sync children
            category.children.cache.forEach(async (channel) => {
                await channel.lockPermissions();
                console.log(`  - 🔒 Locked: ${channel.name}`);
            });
        }
    }

    // 2. Create Private Admin Logs Channel
    console.log('🛡️ Setting up Admin Logs...');
    let adminCat = guild.channels.cache.find(c => c.name === '🛡️ ADMIN CONTROL' && c.type === ChannelType.GuildCategory);
    
    if (!adminCat) {
        adminCat = await guild.channels.create({
            name: '🛡️ ADMIN CONTROL',
            type: ChannelType.GuildCategory,
            permissionOverwrites: [
                {
                    id: guild.roles.everyone,
                    deny: [PermissionsBitField.Flags.ViewChannel] // Hide from everyone
                }
            ]
        });
    }

    const logChannelName = '🔒-website-alerts';
    let logChannel = guild.channels.cache.find(c => c.name === logChannelName);

    if (!logChannel) {
        logChannel = await guild.channels.create({
            name: logChannelName,
            type: ChannelType.GuildText,
            parent: adminCat.id
        });
        console.log(`✅ Created Secret Channel: ${logChannelName}`);
    } else {
        console.log(`ℹ️ Secret Channel '${logChannelName}' already exists.`);
    }

    // 3. Post a Webhook URL (Simulation) or Instruction
    const webhook = await logChannel.createWebhook({
        name: 'Ghost Empire Website',
        avatar: 'https://i.imgur.com/AfFp7pu.png', // Placeholder
    });

    console.log(`🔗 Webhook Created: ${webhook.url}`);
    console.log('⚠️ SAVE THIS URL! You will use it to send alerts from the website.');
    
    // Save webhook to .env for backend usage
    const fs = require('fs');
    const envPath = '../backend/.env';
    
    if (fs.existsSync(envPath)) {
        let envContent = fs.readFileSync(envPath, 'utf8');
        if (!envContent.includes('DISCORD_WEBHOOK_URL')) {
            fs.appendFileSync(envPath, `\nDISCORD_WEBHOOK_URL=${webhook.url}\n`);
            console.log('✅ Webhook saved to backend/.env');
        } else {
            console.log('ℹ️ Webhook already in .env (Check if it needs updating)');
        }
    }

    console.log('✅ Security & Admin Setup Complete!');
    process.exit(0);
});

client.login(process.env.DISCORD_BOT_TOKEN);
