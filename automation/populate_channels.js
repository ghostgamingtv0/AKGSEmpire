
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const GUILD_ID = process.env.DISCORD_GUILD_ID || '1427171466276900897';

const EMBEDS = [
    {
        channelName: '🎫-open-ticket',
        embed: new EmbedBuilder()
            .setColor(0x53FC18) // Imperial Green
            .setTitle('🎟️ GHOST EMPIRE SUPPORT')
            .setDescription(
                "Need to claim a reward? Found a bug? Want to collaborate?\n\n" +
                "**HOW TO CLAIM REWARDS:**\n" +
                "1️⃣ Create a Ticket.\n" +
                "2️⃣ Send your Wallet Address & Proof (Screenshot).\n" +
                "3️⃣ Wait for Admin verification (Manual Process).\n\n" +
                "⚠️ **NOTE:** We will NEVER ask for your Private Key."
            )
            .setFooter({ text: 'Ghost Empire Support System' })
    },
    {
        channelName: '🪙-crypto-info',
        embed: new EmbedBuilder()
            .setColor(0xFFD700) // Gold
            .setTitle('🪙 $AKGS TOKEN INFORMATION')
            .addFields(
                { name: 'Contract Address (Polygon)', value: '`0x...COMING_SOON...`' },
                { name: 'Total Supply', value: '431,890,000 AKGS' },
                { name: 'Burned', value: '🔥 30,000,000 AKGS' },
                { name: 'Tax', value: '5% (Reflected to Marketing & Dev)' }
            )
    },
    {
        channelName: '🏆-hall-of-fame', // Updated channel name match
        fallbackName: 'hall-of-fame', // Fallback if emoji mismatch
        embed: new EmbedBuilder()
            .setColor(0x9932CC) // Purple
            .setTitle('🏆 WALL OF FAME 🏆')
            .setDescription('Celebrating the legends of the Ghost Empire.')
            .addFields(
                { name: '🥇 Top Holder', value: '---' },
                { name: '🥈 Top Investor', value: '---' },
                { name: '🥉 Top Supporter', value: '---' }
            )
            .setImage('https://i.imgur.com/example-banner.png') // Placeholder
    },
    {
        channelName: '📜-rules',
        embed: new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('📜 SERVER RULES')
            .setDescription(
                "1. Respect everyone.\n" +
                "2. No spam or self-promotion.\n" +
                "3. Listen to the Admin.\n" +
                "4. **No begging for tokens.**\n" +
                "5. Have fun and earn!"
            )
    }
];

client.once('ready', async () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
    const guild = await client.guilds.fetch(GUILD_ID);
    
    if (!guild) { console.error('❌ Guild not found'); process.exit(1); }

    for (const item of EMBEDS) {
        // Try finding channel by exact name or partial match
        const channel = guild.channels.cache.find(c => c.name === item.channelName || c.name.includes(item.fallbackName || 'hjklhkjl'));
        
        if (channel && channel.isTextBased()) {
            console.log(`📨 Sending embed to: ${channel.name}`);
            
            // Fetch last messages to avoid spamming if already there (optional check)
            const messages = await channel.messages.fetch({ limit: 5 });
            const alreadyPosted = messages.some(m => m.author.id === client.user.id && m.embeds.length > 0);
            
            if (!alreadyPosted) {
                await channel.send({ embeds: [item.embed] });
            } else {
                console.log(`  - ℹ️ Embed already exists in ${channel.name}`);
            }
        } else {
            console.log(`⚠️ Channel not found: ${item.channelName}`);
        }
    }

    console.log('✅ Channels Populated!');
    process.exit(0);
});

client.login(process.env.DISCORD_BOT_TOKEN);
