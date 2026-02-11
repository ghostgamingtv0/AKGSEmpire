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
        // GatewayIntentBits.MessageContent, 
        // GatewayIntentBits.GuildMembers 
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

const TOKEN = process.env.DISCORD_BOT_TOKEN;

// BRANDING CONFIG
const THEME = {
    COLOR: '#53FC18', // Neon Green
    BG_COLOR: '#050505', // Dark Background
    LOGO: 'https://akgsempire.org/logo.png', // Placeholder
    FOOTER: 'AKGS Empire • Modern Luxury • فخامة عصرية',
    THUMBNAIL_VERIFY: 'https://i.imgur.com/8QZqZ9N.png', 
    THUMBNAIL_RULES: 'https://i.imgur.com/8QZqZ9N.png'
};

// 1. Define Structure (Merged Best of v12 & v13)
const STRUCTURE = {
    '⛩️ GATEWAY | البوابة': {
        channels: ['🔐-verify-تحقق'],
        type: 'text'
    },
    '📢 HEADQUARTERS | القيادة العامة': {
        channels: ['📢-announcements-إعلانات', '🆘-support-الدعم', '💸-withdrawals-السحوبات', '🤖-bot-commands-أوامر'],
        type: 'text'
    },
    '🌐 WEB3 HUB | مركز الويب 3': {
        channels: ['🪙-token-price-السعر', '📊-charts-المبيان', '🥞-buy-akgs-شراء', '💼-wallet-check-المحفظة'],
        type: 'text'
    },
    '🇬🇧 ENGLISH EMPIRE': {
        channels: ['📜-rules', '🔗-links', '💬-general-chat', '📸-media-gallery'],
        type: 'text'
    },
    '🇸🇦 الإمبراطورية العربية': {
        channels: ['📜-القوانين', '🔗-الروابط', '💬-شات-عام', '📸-معرض-الصور'],
        type: 'text'
    },
    '🎮 GAMING ZONES | مناطق الألعاب': {
        channels: ['🦸-marvel-rivals', '🌪️-where-winds-meet', '⚽-fc-26', '🎮-other-games'],
        type: 'text'
    },
    '🔊 VOICE LOUNGE | المجلس الصوتي': {
        channels: ['🔊 Lounge | المجلس', '🎧 Gaming | اللعب', '🎵 Music | موسيقى'],
        type: 'voice'
    },
    '📡 SOCIAL FEEDS': {
        channels: ['twitter-x', 'instagram', 'tiktok', 'threads'],
        type: 'news'
    }
};

client.once('ready', async () => {
    console.log(`✅ AKGS Bot Logged in as ${client.user.tag}`);
    
    // Run structure check on all guilds
    for (const guild of client.guilds.cache.values()) {
        try {
            console.log(`🚨 ACTIVE GUILD FOUND: ${guild.name} (ID: ${guild.id})`);
            
            // 1. CLEANUP FIRST (The Nuclear Option)
            console.log(`🧹 STARTING AGGRESSIVE CLEANUP ON: ${guild.name}`);
            // await cleanupGuild(guild); 
            console.log(`⚠️ CLEANUP SKIPPED FOR DEBUGGING`);

            // 2. BUILD STRUCTURE
            console.log(`🏗️ REBUILDING EMPIRE STRUCTURE...`);
            await setupGuildStructure(guild);
            
            // 3. SEND EMBEDS (Populate Content)
            console.log(`🎨 POPULATING CONTENT...`);
            await populateAllChannels(guild);
            console.log(`✅ GUILD SETUP COMPLETE: ${guild.name}`);
        } catch (e) {
            console.error(`❌ ERROR IN GUILD SETUP: ${e.message}`, e);
        }
    }
    
    console.log('🚀 Bot is Ready and Monitoring!');
    
    // Keep process alive just in case
    setInterval(() => {
        // console.log('❤️ Heartbeat...');
    }, 30000);

    // Periodic Member Count Update (Every 10 minutes)
    setInterval(() => {
        client.guilds.cache.forEach(async (guild) => {
             await updateMemberCount(guild);
        });
    }, 600000);
});

async function populateAllChannels(guild) {
    // Web3 Content
    await sendWeb3Content(guild);

    // Rules
    await sendRulesEmbed(guild);

    // Verify
    await sendVerifyEmbed(guild);

    // Links (New)
    await sendLinksEmbed(guild);

    // Update Member Count in DB
    await updateMemberCount(guild);

    // Gaming
    await populateGamingChannels(guild);
}

// --- DB SYNC ---
import sqlite3 from 'sqlite3';
import { join } from 'path';
const dbPath = join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

async function updateMemberCount(guild) {
    const count = guild.memberCount;
    db.run('INSERT OR REPLACE INTO system_stats (key, value) VALUES (?, ?)', ['discord_members', count.toString()], (err) => {
        if (err) console.error('Failed to update Discord stats:', err);
        else console.log(`Updated Discord Member Count: ${count}`);
    });
}

// --- CLEANUP FUNCTION ---
async function cleanupGuild(guild) {
    const allowedNames = new Set();
    Object.keys(STRUCTURE).forEach(name => allowedNames.add(name));
    Object.values(STRUCTURE).forEach(data => {
        data.channels.forEach(channel => allowedNames.add(channel));
    });

    const channels = await guild.channels.fetch();
    for (const [id, channel] of channels) {
        if (allowedNames.has(channel.name)) continue;
        try {
            console.log(`🗑️ DELETING UNAUTHORIZED ITEM: ${channel.name} (${channel.type})`);
            await channel.delete('Cleanup Protocol: Unauthorized Channel');
        } catch (e) {
            console.error(`❌ Failed to delete ${channel.name}: ${e.message}`);
        }
    }
}

async function setupGuildStructure(guild) {
    for (const [catName, data] of Object.entries(STRUCTURE)) {
        console.log(`🔹 Processing Category: ${catName}`);
        const category = await getOrCreateCategory(guild, catName);
        if (!category) continue;

        for (const chanName of data.channels) {
            await getOrCreateChannel(guild, chanName, category, data.type);
        }
    }
}

async function getOrCreateCategory(guild, name) {
    console.log(`🔍 Checking Category: ${name}`);
    try {
        // Try cache first
        let category = guild.channels.cache.find(c => c.type === ChannelType.GuildCategory && c.name === name);
        
        if (!category) {
            console.log(`📡 Cache miss for ${name}, fetching...`);
            const channels = await guild.channels.fetch();
            category = channels.find(c => c.type === ChannelType.GuildCategory && c.name === name);
        }

        if (!category) {
            console.log(`🆕 Creating Category: ${name}`);
            category = await guild.channels.create({ name: name, type: ChannelType.GuildCategory });
        }
        return category;
    } catch (e) {
        console.error(`❌ Failed to get/create category ${name}: ${e.message}`);
        return null;
    }
}

async function getOrCreateChannel(guild, name, parent, typeStr) {
    try {
        let channel = guild.channels.cache.find(c => c.name === name && c.parentId === parent.id);
        
        if (!channel) {
             const channels = await guild.channels.fetch();
             channel = channels.find(c => c.name === name && c.parentId === parent.id);
        }

        if (!channel) {
            console.log(`🔨 Creating Channel: ${name}`);
            const type = typeStr === 'news' ? ChannelType.GuildAnnouncement : 
                         typeStr === 'voice' ? ChannelType.GuildVoice : ChannelType.GuildText;
            channel = await guild.channels.create({ name: name, type: type, parent: parent.id });
        }
        return channel;
    } catch (e) {
        console.error(`❌ Failed to create channel ${name}: ${e.message}`);
        return null;
    }
}

// --- CONTENT FUNCTIONS ---

// 1. WEB3 CONTENT
async function sendWeb3Content(guild) {
    const priceChannel = guild.channels.cache.find(c => c.name === '🪙-token-price-السعر');
    if (priceChannel && priceChannel.isTextBased()) {
        const msgs = await priceChannel.messages.fetch({ limit: 1 });
        if (msgs.size === 0) {
            const embed = new EmbedBuilder()
                .setColor(THEME.COLOR)
                .setTitle('🪙 AKGS Token Stats | إحصائيات العملة')
                .addFields(
                    { name: '💰 Total Supply', value: '500,000,000 AKGS', inline: true },
                    { name: '🔥 Burned', value: '30,000,000 AKGS', inline: true },
                    { name: '💎 Circulating', value: '431,890,000 AKGS', inline: true },
                    { name: '📈 Live Price', value: '[Check GeckoTerminal](https://www.geckoterminal.com/polygon_pos/pools/0xd3bfe6273c8a2aecff5d1fdea6827c70478ccb4a7e25259b5f0e3933af3c573f)', inline: false }
                )
                .setFooter({ text: 'Live Data on GeckoTerminal • بيانات حية' })
                .setTimestamp();
            await priceChannel.send({ embeds: [embed] });
        }
    }

    const chartsChannel = guild.channels.cache.find(c => c.name === '📊-charts-المبيان');
    if (chartsChannel && chartsChannel.isTextBased()) {
        const msgs = await chartsChannel.messages.fetch({ limit: 1 });
        if (msgs.size === 0) {
            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('📊 Live Charts | المبيان المباشر')
                .setDescription('**Track the AKGS performance on GeckoTerminal**\nتابع أداء العملة مباشرة على جيكو تيرمينال')
                .setURL('https://www.geckoterminal.com/polygon_pos/pools/0xd3bfe6273c8a2aecff5d1fdea6827c70478ccb4a7e25259b5f0e3933af3c573f')
                .setThumbnail('https://i.imgur.com/example_gecko.png');
            await chartsChannel.send({ content: 'https://www.geckoterminal.com/polygon_pos/pools/0xd3bfe6273c8a2aecff5d1fdea6827c70478ccb4a7e25259b5f0e3933af3c573f', embeds: [embed] });
        }
    }

    const buyChannel = guild.channels.cache.find(c => c.name === '🥞-buy-akgs-شراء');
    if (buyChannel && buyChannel.isTextBased()) {
        const msgs = await buyChannel.messages.fetch({ limit: 1 });
        if (msgs.size === 0) {
            const embed = new EmbedBuilder()
                .setColor('#FF007A')
                .setTitle('🥞 Buy on Uniswap | شراء عبر يونيسواب')
                .setDescription('**Official Contract Address (Polygon):**\n`0xc291F63681Cd76383c3bDabE0B8E4bb072B4DF65`\n\n**Click below to swap POL for AKGS**\nاضغط بالأسفل لاستبدال POL بعملة AKGS');
            await buyChannel.send({ content: 'https://app.uniswap.org/#/swap?chain=polygon&outputCurrency=0xc291F63681Cd76383c3bDabE0B8E4bb072B4DF65', embeds: [embed] });
        }
    }

    const walletChannel = guild.channels.cache.find(c => c.name === '💼-wallet-check-المحفظة');
    if (walletChannel && walletChannel.isTextBased()) {
        const msgs = await walletChannel.messages.fetch({ limit: 1 });
        if (msgs.size === 0) {
            const embed = new EmbedBuilder()
                .setColor(THEME.COLOR)
                .setTitle('💼 Wallet Security | أمان المحفظة')
                .setDescription('To see your AKGS balance, add the token to MetaMask:\n\n**Network:** Polygon POS\n**Contract:** `0xc291F63681Cd76383c3bDabE0B8E4bb072B4DF65`\n**Decimals:** 18\n\n⚠️ Never share your seed phrase!');
            await walletChannel.send({ embeds: [embed] });
        }
    }
}

// 2. RULES EMBED (NEW APPROVED BILINGUAL)
async function sendRulesEmbed(guild) {
    // English Rules
    const channelEn = guild.channels.cache.find(c => c.name === '📜-rules');
    if (channelEn && channelEn.isTextBased()) {
        const messages = await channelEn.messages.fetch({ limit: 5 });
        if (messages.size === 0) {
            const embedEn = new EmbedBuilder()
                .setColor(THEME.COLOR)
                .setTitle('📜 THE IMPERIAL CONSTITUTION | دستور الإمبراطورية')
                .setDescription(
                    `**1. 🚫 The Zero-Tolerance Decree (Anti-Bot) | قانون النزاهة المطلقة**\n` +
                    `> **EN:** Usage of bots, scripts, multi-tabbing, or emulators to farm the Social2Earn system is strictly forbidden.\n` +
                    `> **AR:** يمنع منعاً باتاً استخدام البوتات، السكريبتات، أو فتح نوافذ متعددة للتلاعب بنظام الربح.\n` +
                    `> **💀 PENALTY:** Immediate **"Digital Execution"** (Permanent Ban) & Asset Forfeiture.\n\n` +

                    `**2. 👁️ The Watch Protocol (Real Eyes Only) | بروتوكول المراقبة**\n` +
                    `> **EN:** Our Sentinel System tracks "Visitor IDs". Interactions must be human and organic. Fake engagement is detected instantly.\n` +
                    `> **AR:** نظام الحراسة يتتبع "بصمة الزائر". يجب أن يكون التفاعل حقيقياً وبشرياً. التفاعل المزيف يتم كشفه فوراً.\n\n` +

                    `**3. ⚖️ Terms of Service Integration | الالتزام بشروط الموقع**\n` +
                    `> **EN:** By remaining here, you accept the **Website Terms (Section 2: Social2Earn)**. We reserve the right to disqualify suspicious accounts.\n` +
                    `> **AR:** ببقائك هنا، أنت توافق على **شروط الموقع (البند 2)**. نحتفظ بالحق في إقصاء أي حساب مشبوه دون إنذار.\n\n` +

                    `**4. 🛡️ Data & Privacy Shield | حماية الخصوصية**\n` +
                    `> **EN:** Your data (Kick ID, Wallet) is used *solely* for verification and rewards. We protect the Empire's citizens.\n` +
                    `> **AR:** بياناتك (هوية كيك، المحفظة) تستخدم *فقط* للتحقق وتوزيع الجوائز. نحن نحمي مواطني الإمبراطورية.\n\n` +

                    `**5. 🤝 Code of Honor (Community) | ميثاق الشرف**\n` +
                    `> **EN:** Respect the hierarchy. Racism, toxicity, or FUD results in immediate exile.\n` +
                    `> **AR:** احترم التراتبية. العنصرية، التنمر، أو نشر السلبية يؤدي إلى النفي الفوري.`
                )
                .setImage('https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3Z5Z3Z5Z3Z5Z3Z5Z3Z5Z3Z5Z3Z5Z3Z5Z3Z5Z3Z5/xT9IgzoKnwFNmISR8I/giphy.gif')
                .setFooter({ text: THEME.FOOTER, iconURL: THEME.LOGO })
                .setTimestamp();
            await channelEn.send({ embeds: [embedEn] });
        }
    }

    // Arabic Rules
    const channelAr = guild.channels.cache.find(c => c.name === '📜-القوانين');
    if (channelAr && channelAr.isTextBased()) {
        const messages = await channelAr.messages.fetch({ limit: 5 });
        if (messages.size === 0) {
            const embedAr = new EmbedBuilder()
                .setColor(THEME.COLOR)
                .setTitle('📜 الدستور الإمبراطوري | AKGS EMPIRE LAWS')
                .setDescription(
                    `**1. 🚫 قانون النزاهة المطلقة (Zero Tolerance Policy)**\n` +
                    `> **أي استخدام لبرامج البوت (Bots)، السكريبتات، أو محاولات التلاعب بنظام النقاط (Watch2Earn) سيؤدي إلى "الإعدام الرقمي" (Permanent Ban) وتصفير المحفظة فوراً.** نحن نبني إمبراطورية حقيقية، لا مكان للمزيفين.\n\n` +
                    
                    `**2. 👁️ بروتوكول المشاهدة (The Watch Protocol)**\n` +
                    `> نظامنا ذكي. المشاهدة يجب أن تكون حقيقية وتفاعلية. فتح علامات تبويب متعددة (Multi-tabs) أو استخدام متصفحات وهمية لن يحتسب وسيعرض حسابك للخطر.\n\n` +
                    
                    `**3. ⚖️ شروط الخدمة (Terms of Service)**\n` +
                    `> استخدامك للسيرفر يعني موافقتك الكاملة على شروط الموقع الرسمية. أي انتهاك يعني الطرد المباشر.\n\n` +

                    `**4. 🔐 الهوية الرقمية (Digital Identity)**\n` +
                    `> حساب Kick الخاص بك هو هويتك. يجب ربطه بشكل صحيح للحصول على الـ G-Code. لا تشارك كودك السري مع أحد.\n\n` +
                    
                    `**5. 🤝 الولاء والاحترام (Loyalty & Respect)**\n` +
                    `> نحن مجتمع نخبة. العنصرية، التنمر، أو قلة الاحترام غير مقبولة. احترم التراتبية، احترم الأعضاء، واحترم وقتك.`
                )
                .setImage('https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3Z5Z3Z5Z3Z5Z3Z5Z3Z5Z3Z5Z3Z5Z3Z5Z3Z5Z3Z5/xT9IgzoKnwFNmISR8I/giphy.gif')
                .setFooter({ text: THEME.FOOTER, iconURL: THEME.LOGO })
                .setTimestamp();
            await channelAr.send({ embeds: [embedAr] });
        }
    }
}

// 3. VERIFY EMBED (PROFESSIONAL)
async function sendVerifyEmbed(guild) {
    const channel = guild.channels.cache.find(c => c.name === '🔐-verify-تحقق');
    if (channel && channel.isTextBased()) {
        const messages = await channel.messages.fetch({ limit: 5 });
        if (messages.size === 0) {
            const embed = new EmbedBuilder()
                .setColor(THEME.COLOR)
                .setTitle('🛡️ SECURITY GATEWAY | بوابة الأمان')
                .setDescription(`**🇬🇧 AUTHENTICATION REQUIRED**
To access the **AKGS EMPIRE**, you must verify your identity using your unique **G-Code**. This ensures a secure and bot-free environment for all citizens.

**🇸🇦 مطلوب التحقق من الهوية**
للدخول إلى **إمبراطورية AKGS**، يجب عليك تأكيد هويتك باستخدام **G-Code** الخاص بك. هذا يضمن بيئة آمنة وخالية من البوتات لجميع الأعضاء.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
**📋 INSTRUCTIONS | التعليمات**
1️⃣ Go to **[akgsempire.org](https://akgsempire.org)** and link your Kick account.
2️⃣ Copy your **G-Code** from the dashboard.
3️⃣ Type your code below in this chat.
*(Example: \`!verify G-123456\`)*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`)
                .setImage('https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3Z5Z3Z5Z3Z5Z3Z5Z3Z5Z3Z5Z3Z5Z3Z5Z3Z5Z3Z5/xT9IgzoKnwFNmISR8I/giphy.gif') 
                .setThumbnail(THEME.THUMBNAIL_VERIFY)
                .setFooter({ text: THEME.FOOTER })
                .setTimestamp();
            
            await channel.send({ embeds: [embed] });
        }
    }
}

// 4. LINKS EMBED
async function sendLinksEmbed(guild) {
    const channels = ['🔗-links', '🔗-الروابط'];
    for (const name of channels) {
        const channel = guild.channels.cache.find(c => c.name === name);
        if (channel && channel.isTextBased()) {
            const msgs = await channel.messages.fetch({ limit: 1 });
            if (msgs.size === 0) {
                const embed = new EmbedBuilder()
                    .setColor(THEME.COLOR)
                    .setTitle('🌍 OFFICIAL NEXUS | الروابط الرسمية')
                    .addFields(
                        { name: '🌐 Website', value: '[akgsempire.org](https://akgsempire.org)', inline: true },
                        { name: '🟢 Kick Stream', value: '[ghost_gamingtv](https://kick.com/ghost_gamingtv)', inline: true },
                        { name: '🐦 Twitter (X)', value: '[@tv_ghostgaming](https://x.com/tv_ghostgaming)', inline: true },
                        { name: '📸 Instagram', value: '[@ghost.gamingtv](https://instagram.com/ghost.gamingtv)', inline: true },
                        { name: '🎵 TikTok', value: '[@ghost.gamingtv](https://tiktok.com/@ghost.gamingtv)', inline: true },
                        { name: '📘 Facebook', value: '[@ghost.gamingtv](https://facebook.com/ghost.gamingtv)', inline: true },
                        { name: '🧵 Threads', value: '[@ghost.gamingtv](https://threads.net/@ghost.gamingtv)', inline: true },
                        { name: '✈️ Telegram', value: '[ghost_gamingtv](https://t.me/ghost_gamingtv)', inline: true },
                        { name: '📈 GeckoTerminal', value: '[AKGS/POL Chart](https://www.geckoterminal.com/polygon_pos/pools/0xd3bfe6273c8a2aecff5d1fdea6827c70478ccb4a7e25259b5f0e3933af3c573f)', inline: false }
                    )
                    .setFooter({ text: THEME.FOOTER });
                await channel.send({ embeds: [embed] });
            }
        }
    }
}

// 5. GAMING CHANNELS POPULATION
async function populateGamingChannels(guild) {
    const gamingChannels = ['🦸-marvel-rivals', '🌪️-where-winds-meet', '⚽-fc-26', '🎮-other-games'];
    for (const name of gamingChannels) {
        const channel = guild.channels.cache.find(c => c.name === name);
        if (channel && channel.isTextBased()) {
            const msgs = await channel.messages.fetch({ limit: 1 });
            if (msgs.size === 0) {
                const embed = new EmbedBuilder()
                    .setColor(THEME.COLOR)
                    .setTitle(`🎮 GAMING ZONE | ${name.replace(/-/g, ' ').toUpperCase()}`)
                    .setDescription(`
**👋 WELCOME TO THE ARENA!**
This is the dedicated zone for **${name.replace(/-/g, ' ')}**.
Squad up, share clips, and discuss strategies.

**⚠️ RULES:**
• No toxicity or griefing.
• Keep it related to the game genre.
• Have fun!

*System: Monitoring Activity...*
`)
                    .setFooter({ text: THEME.FOOTER });
                await channel.send({ embeds: [embed] });
            }
        }
    }
}

client.login(TOKEN);
