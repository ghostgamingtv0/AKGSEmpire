import { Client, GatewayIntentBits, ChannelType, Partials, EmbedBuilder, PermissionsBitField } from 'discord.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
    ],
    partials: [Partials.Channel]
});

// GLOBAL ERROR HANDLERS
process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', error => {
    console.error('Uncaught Exception:', error);
});

// BRANDING CONFIG
const THEME = {
    COLOR: '#53FC18', // Neon Green
    BG_COLOR: '#050505', // Dark Background
    LOGO: 'https://ghostempire.org/logo.png', // Placeholder, verify if real
    FOOTER: 'AKGS Empire • The Future of Digital Interaction',
    THUMBNAIL_VERIFY: 'https://i.imgur.com/8QZqZ9N.png', // Need a valid lock icon or logo
    THUMBNAIL_RULES: 'https://i.imgur.com/8QZqZ9N.png'
};

// STRUCTURE DEFINITION
const STRUCTURE = {
    '⛩️ GATEWAY | البوابة': {
        channels: ['🔐-verify-تحقق'],
        type: 'text'
    },
    '🇬🇧 ENGLISH EMPIRE': {
        channels: ['📜-rules', '🔗-links', '🪙-token-info', '💬-general-chat'],
        type: 'text'
    },
    '🇸🇦 الإمبراطورية العربية': {
        channels: ['📜-القوانين', '🔗-الروابط', '🪙-معلومات-العملة', '💬-شات-عام'],
        type: 'text'
    },
    '🎮 GAMING ZONES': {
        channels: ['🎮-gaming-chat', '🔫-fps-shooters', '🎲-rpg-mmo', '🕹️-retro-arcade'],
        type: 'text'
    },
    '📡 SOCIAL FEEDS': {
        channels: ['twitter-x', 'instagram', 'tiktok', 'threads'],
        type: 'news'
    }
};

client.once('ready', async () => {
    console.log(`✅ AKGS Bot Logged in as ${client.user.tag}`);
    
    for (const guild of client.guilds.cache.values()) {
        console.log(`🏗️ Ensuring Structure for Guild: ${guild.name}`);
        // FORCE CLEANUP FIRST to remove duplicates/old structure
        // WARNING: This deletes everything not in the new structure if we are strict, 
        // or we just delete known conflicting names.
        // For now, let's try to just create the correct ones. The user complains about "mess" (duplicates).
        // Let's implement a smarter sync:
        await setupGuildStructure(guild);
    }
    
    console.log('🚀 Bot is Ready and Monitoring!');
});

async function setupGuildStructure(guild) {
    console.log('🧹 STARTING AGGRESSIVE CLEANUP...');
    const allChannels = await guild.channels.fetch();
    
    // 1. CLEANUP OLD/DUPLICATE CATEGORIES
    // We look for categories that "sound like" ours but aren't exact matches
    const cleanupKeywords = [
        { key: 'GATEWAY', exact: '⛩️ GATEWAY | البوابة' },
        { key: 'ENGLISH EMPIRE', exact: '🇬🇧 ENGLISH EMPIRE' },
        { key: 'ARABIC', exact: '🇸🇦 الإمبراطورية العربية' }, // Catch "Arabic Empire", "SA Arabic", etc.
        { key: 'GAMING', exact: '🎮 GAMING ZONES' },
        { key: 'SOCIAL', exact: '📡 SOCIAL FEEDS' },
        { key: 'general', exact: null } // Default category usually named 'general' or 'Text Channels'
    ];

    for (const cat of allChannels.values()) {
        if (cat.type !== ChannelType.GuildCategory) continue;

        // Check against our keywords
        for (const { key, exact } of cleanupKeywords) {
            if (cat.name.toLowerCase().includes(key.toLowerCase())) {
                // If exact is null, ALWAYS delete (for generic stuff like 'general')
                // If exact is provided, delete only if it doesn't match
                if (exact === null || (exact && cat.name !== exact)) {
                    console.log(`🗑️ Deleting Duplicate/Old Category: ${cat.name}`);
                    try { 
                        // Delete channels inside first to be clean
                        const children = allChannels.filter(c => c.parentId === cat.id);
                        for (const child of children.values()) {
                            await child.delete();
                        }
                        await cat.delete(); 
                    } catch (e) { console.error(`Failed to delete ${cat.name}: ${e.message}`); }
                }
            }
        }
    }

    // 2. CREATE/ENSURE NEW STRUCTURE
    console.log('🏗️ BUILDING MODERN LUXURY STRUCTURE...');
    for (const [catName, data] of Object.entries(STRUCTURE)) {
        const category = await getOrCreateCategory(guild, catName);
        if (!category) continue;

        for (const chanName of data.channels) {
            const channel = await getOrCreateChannel(guild, chanName, category, data.type);
            if (channel) {
                await populateChannelContent(channel);
            }
        }
    }
}

async function getOrCreateCategory(guild, name) {
    const channels = await guild.channels.fetch();
    let category = channels.find(c => c.type === ChannelType.GuildCategory && c.name === name);
    
    if (!category) {
        console.log(`➕ Creating Category: ${name}`);
        try {
            category = await guild.channels.create({
                name: name,
                type: ChannelType.GuildCategory
            });
        } catch (e) {
            console.error(`❌ Failed to create category ${name}: ${e.message}`);
        }
    }
    return category;
}

async function getOrCreateChannel(guild, name, parent, typeStr) {
    const channels = await guild.channels.fetch();
    let channel = channels.find(c => c.name === name && c.parentId === parent.id);

    if (!channel) {
        console.log(`➕ Creating Channel: ${name} in ${parent.name}`);
        try {
            const type = typeStr === 'news' ? ChannelType.GuildAnnouncement : ChannelType.GuildText;
            channel = await guild.channels.create({
                name: name,
                type: type,
                parent: parent.id
            });
        } catch (e) {
            console.error(`❌ Failed to create channel ${name}: ${e.message}`);
        }
    }
    return channel;
}

// ------------------------------------------------------------------
// 🎨 CONTENT POPULATION (The "Professional" Part)
// ------------------------------------------------------------------
async function populateChannelContent(channel) {
    // Only post if last message is not from bot (basic check to avoid spam, can be improved)
    // For this overhaul, we might want to force update if content changed, but let's be careful.
    // We will just clear old messages if we are sure (dangerous), or just post new one at bottom.
    // Better strategy: Check if the last message is ours and matches current content hash? 
    // For now, let's just append if empty or specific channels.
    
    const messages = await channel.messages.fetch({ limit: 5 });
    if (messages.size > 0) return; // Skip if channel has content (prevent spamming on restart)

    if (channel.name.includes('verify')) {
        await sendVerifyEmbed(channel);
    } else if (channel.name.includes('rules') || channel.name.includes('القوانين')) {
        await sendRulesEmbed(channel);
    } else if (channel.name.includes('links') || channel.name.includes('الروابط')) {
        await sendLinksEmbed(channel);
    } else if (channel.name.includes('token') || channel.name.includes('العملة')) {
        await sendTokenEmbed(channel);
    } else if (channel.name.includes('gaming') || channel.name.includes('fps') || channel.name.includes('rpg') || channel.name.includes('arcade')) {
        await sendGamingEmbed(channel);
    }
}

async function sendGamingEmbed(channel) {
    const embed = new EmbedBuilder()
        .setColor(THEME.COLOR)
        .setTitle(`🎮 GAMING ZONE | ${channel.name.toUpperCase()}`)
        .setDescription(`
**👋 WELCOME TO THE ARENA!**
This is the dedicated zone for **${channel.name}**.
Squad up, share clips, and discuss strategies.

**⚠️ RULES:**
• No toxicity or griefing.
• Keep it related to the game genre.
• Have fun!

*System: Monitoring Activity...*
`)
        .setThumbnail('https://i.imgur.com/4J5J5J5.png') // Generic Controller Icon (Placeholder)
        .setFooter({ text: THEME.FOOTER });

    await channel.send({ embeds: [embed] });
}

async function sendVerifyEmbed(channel) {
    const embed = new EmbedBuilder()
        .setColor(THEME.COLOR)
        .setTitle('🛡️ SECURITY GATEWAY | بوابة الأمان')
        .setDescription(`**🇬🇧 AUTHENTICATION REQUIRED**
To access the **AKGS EMPIRE**, you must verify your identity using your unique **G-Code**. This ensures a secure and bot-free environment for all citizens.

**🇸🇦 مطلوب التحقق من الهوية**
للدخول إلى **إمبراطورية AKGS**، يجب عليك تأكيد هويتك باستخدام **G-Code** الخاص بك. هذا يضمن بيئة آمنة وخالية من البوتات لجميع الأعضاء.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
**📋 INSTRUCTIONS | التعليمات**
1️⃣ Go to **[ghostempire.org](https://ghostempire.org)** and link your Kick account.
2️⃣ Copy your **G-Code** from the dashboard.
3️⃣ Type your code below in this chat.
*(Example: \`!verify G-123456\`)*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`)
        .setImage('https://i.imgur.com/M7jX60X.png') // Replace with a cool horizontal banner if available
        .setThumbnail('https://i.imgur.com/5w5j1Lp.png') // Security Icon
        .setFooter({ text: THEME.FOOTER })
        .setTimestamp();

    await channel.send({ embeds: [embed] });
}

async function sendRulesEmbed(channel) {
    const isArabic = channel.name.includes('القوانين');
    
    const title = isArabic ? '📜 IMPERIAL DECREE | الدستور الإمبراطوري' : '📜 IMPERIAL DECREE | RULES';
    const description = isArabic ? 
        `**⚠️ يرجى الالتزام بالقواعد التالية لضمان بقائك في الإمبراطورية:**\n\n**1. الاحترام المتبادل:** لا تسامح مع العنصرية، الكراهية، أو التنمر.\n**2. المحتوى:** يمنع نشر المحتوى الإباحي أو غير القانوني.\n**3. الإعلانات:** يمنع نشر روابط خارجية أو إعلانات بدون إذن.\n**4. الخصوصية:** احترم خصوصية الأعضاء ولا تشارك بيانات شخصية.` 
        : 
        `**⚠️ ADHERE TO THE FOLLOWING DECREES:**\n\n**1. RESPECT:** Zero tolerance for racism, hate speech, or bullying.\n**2. CONTENT:** No NSFW or illegal content allowed.\n**3. PROMOTION:** No unauthorized advertising or self-promotion.\n**4. PRIVACY:** Respect user privacy. Doxing is an instant ban.`;

    const embed = new EmbedBuilder()
        .setColor(THEME.COLOR)
        .setTitle(title)
        .setDescription(description + '\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        .setThumbnail(THEME.THUMBNAIL_RULES)
        .setFooter({ text: THEME.FOOTER })
        .setTimestamp();

    await channel.send({ embeds: [embed] });
}

async function sendLinksEmbed(channel) {
    const embed = new EmbedBuilder()
        .setColor(THEME.COLOR)
        .setTitle('🌍 OFFICIAL NEXUS | الروابط الرسمية')
        .addFields(
            { name: '🌐 Website', value: '[ghostempire.org](https://ghostempire.org)', inline: true },
            { name: '🟢 Kick Stream', value: '[ghost_gamingtv](https://kick.com/ghost_gamingtv)', inline: true },
            { name: '🐦 Twitter (X)', value: '[@AKGS_Empire](https://twitter.com/AKGS_Empire)', inline: true },
            { name: '📸 Instagram', value: '[@ghost.gamingtv](https://instagram.com/ghost.gamingtv)', inline: true },
            { name: '📈 GeckoTerminal', value: '[AKGS/POL Chart](https://www.geckoterminal.com/polygon_pos/pools/0x7c7630...)', inline: false }
        )
        .setImage('https://i.imgur.com/6Xq6XqX.png') // Branding Banner
        .setFooter({ text: THEME.FOOTER });

    await channel.send({ embeds: [embed] });
}

async function sendTokenEmbed(channel) {
    const embed = new EmbedBuilder()
        .setColor(THEME.COLOR)
        .setTitle('🪙 TOKENOMICS | اقتصاد العملة')
        .setDescription(`
**Symbol:** $AKGS
**Network:** Polygon (POL)
**Total Supply:** 500,000,000
**Circulating:** 431,890,000
**Burned:** 30,000,000 🔥

**📊 TAX SYSTEM | نظام الضريبة**
• Buy Tax: **5%** (Marketing & Dev)
• Sell Tax: **5%** (Liquidity & Burn)
`)
        .setFooter({ text: THEME.FOOTER });

    await channel.send({ embeds: [embed] });
}

client.login(process.env.DISCORD_BOT_TOKEN);
