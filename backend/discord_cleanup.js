import { Client, GatewayIntentBits, ChannelType, Partials, EmbedBuilder } from 'discord.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const client = new Client({
    intents: [GatewayIntentBits.Guilds],
    partials: [Partials.Channel]
});

const TOKEN = process.env.DISCORD_BOT_TOKEN;

// ALLOWED CONFIGURATION
const ALLOWED_STRUCTURE = {
    '⛩️ GATEWAY | البوابة': ['🔐-verify-تحقق'],
    '🇬🇧 ENGLISH EMPIRE': ['📜-rules', '🔗-links', '🪙-token-info', '💬-general-chat'],
    '🇸🇦 الإمبراطورية العربية': ['📜-القوانين', '🔗-الروابط', '🪙-معلومات-العملة', '💬-شات-عام'],
    '📡 SOCIAL FEEDS': ['twitter-x', 'instagram', 'tiktok', 'threads']
};

client.once('ready', async () => {
    console.log(`🧹 CLEANUP BOT Logged in as ${client.user.tag}`);
    
    for (const guild of client.guilds.cache.values()) {
        console.log(`🔍 Scanning Guild: ${guild.name}`);
        await cleanupGuild(guild);
    }

    console.log('✅ Cleanup Complete. Exiting...');
    process.exit(0);
});

async function cleanupGuild(guild) {
    const channels = await guild.channels.fetch();
    const categories = channels.filter(c => c.type === ChannelType.GuildCategory);
    
    // 1. Check Categories
    for (const [id, category] of categories) {
        if (!Object.keys(ALLOWED_STRUCTURE).includes(category.name)) {
            console.log(`🗑️ Deleting Unknown Category: ${category.name}`);
            try {
                // Delete children first? Discord usually handles this or moves them.
                // Better to delete channels first if we want to be sure.
                const children = channels.filter(c => c.parentId === category.id);
                for (const [childId, child] of children) {
                    await child.delete();
                }
                await category.delete();
            } catch (e) {
                console.error(`❌ Failed to delete ${category.name}: ${e.message}`);
            }
        } else {
            // Category is valid, check its children
            const allowedChildren = ALLOWED_STRUCTURE[category.name];
            const children = channels.filter(c => c.parentId === category.id);
            
            for (const [childId, child] of children) {
                if (!allowedChildren.includes(child.name)) {
                    console.log(`🗑️ Deleting Unknown Channel in ${category.name}: ${child.name}`);
                    await child.delete().catch(e => console.error(e.message));
                }
            }
        }
    }

    // 2. Check Orphan Channels (No Category)
    const orphans = channels.filter(c => !c.parentId && c.type !== ChannelType.GuildCategory);
    for (const [id, channel] of orphans) {
        console.log(`🗑️ Deleting Orphan Channel: ${channel.name}`);
        await channel.delete().catch(e => console.error(e.message));
    }
}

client.login(TOKEN);
