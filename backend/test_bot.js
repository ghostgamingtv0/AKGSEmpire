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
        // GatewayIntentBits.MessageContent, // Privileged Intent - Enable in Dev Portal if needed
        // GatewayIntentBits.GuildMembers  // Privileged Intent - Enable in Dev Portal if needed
    ],
    partials: [Partials.Channel]
});

const TOKEN = process.env.DISCORD_BOT_TOKEN;

// 1. Define Structure
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
        type: 'news' // or text
    }
};

client.once('ready', async () => {
    console.log(`✅ AKGS Bot Logged in as ${client.user.tag}`);
    
    // Run structure check on all guilds
    for (const guild of client.guilds.cache.values()) {
        console.log(`🚨 ACTIVE GUILD FOUND: ${guild.name} (ID: ${guild.id})`);
        
        // 1. CLEANUP FIRST (The Nuclear Option)
        console.log(`🧹 STARTING AGGRESSIVE CLEANUP ON: ${guild.name}`);
        await cleanupGuild(guild);

        // 2. BUILD STRUCTURE
        console.log(`🏗️ REBUILDING EMPIRE STRUCTURE...`);
        await setupGuildStructure(guild);
        
        // 3. SEND EMBEDS
        await sendRulesEmbed(guild);
        await sendVerifyEmbed(guild);
        await sendWeb3Content(guild);
    }
    
    console.log('🚀 Bot is Ready and Monitoring!');
});

// --- NEW: WEB3 CONTENT POPULATOR ---
async function sendWeb3Content(guild) {
    // 1. Token Price (Dummy Data for now, can be hooked to API later)
    const priceChannel = guild.channels.cache.find(c => c.name === '🪙-token-price-السعر');
    if (priceChannel && priceChannel.isTextBased()) {
        const msgs = await priceChannel.messages.fetch({ limit: 1 });
        if (msgs.size === 0) {
            const embed = new EmbedBuilder()
                .setColor('#53FC18')
                .setTitle('🪙 AKGS Token Price | سعر العملة')
                .addFields(
                    { name: '💰 Price (USD)', value: '$0.00042', inline: true },
                    { name: '💎 Market Cap', value: '$180,000', inline: true },
                    { name: '📉 24h Change', value: '+5.2%', inline: true }
                )
                .setFooter({ text: 'Live Data (Simulated) • بيانات حية' })
                .setTimestamp();
            await priceChannel.send({ embeds: [embed] });
        }
    }

    // 2. Charts
    const chartsChannel = guild.channels.cache.find(c => c.name === '📊-charts-المبيان');
    if (chartsChannel && chartsChannel.isTextBased()) {
        const msgs = await chartsChannel.messages.fetch({ limit: 1 });
        if (msgs.size === 0) {
            const embed = new EmbedBuilder()
                .setColor('#00ff00') // Gecko Green
                .setTitle('📊 Live Charts | المبيان المباشر')
                .setDescription('**Track the AKGS performance on GeckoTerminal**\nتابع أداء العملة مباشرة على جيكو تيرمينال')
                .setURL('https://www.geckoterminal.com/polygon_pos/pools/0x7c763071271630773d328b97d3967073d207d7a3')
                .setThumbnail('https://i.imgur.com/example_gecko.png');
            await chartsChannel.send({ content: 'https://www.geckoterminal.com/polygon_pos/pools/0x7c763071271630773d328b97d3967073d207d7a3', embeds: [embed] });
        }
    }

    // 3. Buy AKGS
    const buyChannel = guild.channels.cache.find(c => c.name === '🥞-buy-akgs-شراء');
    if (buyChannel && buyChannel.isTextBased()) {
        const msgs = await buyChannel.messages.fetch({ limit: 1 });
        if (msgs.size === 0) {
            const embed = new EmbedBuilder()
                .setColor('#FF007A') // Uniswap Pink
                .setTitle('🥞 Buy on Uniswap | شراء عبر يونيسواب')
                .setDescription('**Official Contract Address (Polygon):**\n`0xYourTokenAddressHere`\n\n**Click below to swap POL for AKGS**\nاضغط بالأسفل لاستبدال POL بعملة AKGS');
            await buyChannel.send({ content: 'https://app.uniswap.org/#/swap?chain=polygon', embeds: [embed] });
        }
    }

    // 4. Wallet Check
    const walletChannel = guild.channels.cache.find(c => c.name === '💼-wallet-check-المحفظة');
    if (walletChannel && walletChannel.isTextBased()) {
        const msgs = await walletChannel.messages.fetch({ limit: 1 });
        if (msgs.size === 0) {
            const embed = new EmbedBuilder()
                .setColor('#53FC18')
                .setTitle('💼 Wallet Security | أمان المحفظة')
                .setDescription('To see your AKGS balance, add the token to MetaMask:\n\n**Network:** Polygon POS\n**Contract:** `0x...`\n**Decimals:** 18\n\n⚠️ Never share your seed phrase!');
            await walletChannel.send({ embeds: [embed] });
        }
    }
}

// --- CLEANUP FUNCTION ---
async function cleanupGuild(guild) {
    // Collect all valid names from STRUCTURE
    const allowedNames = new Set();
    
    // Add Category Names
    Object.keys(STRUCTURE).forEach(name => allowedNames.add(name));
    
    // Add Channel Names
    Object.values(STRUCTURE).forEach(data => {
        data.channels.forEach(channel => allowedNames.add(channel));
    });

    // Fetch all channels
    const channels = await guild.channels.fetch();
    
    for (const [id, channel] of channels) {
        // Skip if channel name is in allowed list
        if (allowedNames.has(channel.name)) continue;
        
        // Skip system channels (if any needed) or specific ignored ones
        // But user said "Delete Garbage", so we delete everything else.
        
        try {
            console.log(`🗑️ DELETING UNAUTHORIZED ITEM: ${channel.name} (${channel.type})`);
            await channel.delete('Cleanup Protocol: Unauthorized Channel');
        } catch (e) {
            console.error(`❌ Failed to delete ${channel.name}: ${e.message}`);
        }
    }
}

async function setupGuildStructure(guild) {
    // 1. Create/Check Categories and Channels
    for (const [catName, data] of Object.entries(STRUCTURE)) {
        const category = await getOrCreateCategory(guild, catName);
        if (!category) continue;

        for (const chanName of data.channels) {
            await getOrCreateChannel(guild, chanName, category, data.type);
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
            const type = typeStr === 'news' ? ChannelType.GuildAnnouncement : 
                         typeStr === 'voice' ? ChannelType.GuildVoice : ChannelType.GuildText;
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

// --- NEW: BILINGUAL RULES EMBED ---
async function sendRulesEmbed(guild) {
    // English Rules
    const channelEn = guild.channels.cache.find(c => c.name === '📜-rules');
    if (channelEn && channelEn.isTextBased()) {
        const messages = await channelEn.messages.fetch({ limit: 5 });
        if (messages.size === 0) {
            const embedEn = new EmbedBuilder()
                .setColor('#53FC18')
                .setTitle('📜 THE IMPERIAL CONSTITUTION')
                .setDescription(
                    `**1. 🚫 Absolute Integrity (Zero Tolerance)**\n> **Use of Bots, Scripts, or any manipulation of the Watch2Earn system results in immediate "Digital Execution" (Permanent Ban) and wallet wipe.** We are building a real empire; fakes are not welcome.\n\n` +
                    `**2. 👁️ The Watch Protocol**\n> Our system is sentient. Views must be organic and interactive. Multi-tabbing or using fake browsers will not be counted and flags your account.\n\n` +
                    `**3. 🤝 Loyalty & Respect**\n> We are an elite society. Racism, toxicity, or disrespect is strictly prohibited. Respect the hierarchy, the members, and your own time.\n\n` +
                    `**4. 🔐 Digital Identity**\n> Your Kick account is your ID. Link it correctly to generate your G-Code. Never share your secret code.\n\n` +
                    `**5. 🛡️ Empire Security**\n> No suspicious links, unauthorized ads, or exploit attempts. Protect the realm.`
                )
                .setFooter({ text: 'AKGS Empire • Modern Luxury', iconURL: 'https://i.imgur.com/8Q9Q9.png' }) // Placeholder icon
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
                .setColor('#53FC18')
                .setTitle('📜 الدستور الإمبراطوري | AKGS EMPIRE LAWS')
                .setDescription(
                    `**1. 🚫 قانون النزاهة المطلقة (Zero Tolerance Policy)**\n> **أي استخدام لبرامج البوت (Bots)، السكريبتات، أو محاولات التلاعب بنظام النقاط (Watch2Earn) سيؤدي إلى "الإعدام الرقمي" (Permanent Ban) وتصفير المحفظة فوراً.** نحن نبني إمبراطورية حقيقية، لا مكان للمزيفين.\n\n` +
                    `**2. 👁️ بروتوكول المشاهدة (The Watch Protocol)**\n> نظامنا ذكي. المشاهدة يجب أن تكون حقيقية وتفاعلية. فتح علامات تبويب متعددة (Multi-tabs) أو استخدام متصفحات وهمية لن يحتسب وسيعرض حسابك للخطر.\n\n` +
                    `**3. 🤝 الولاء والاحترام (Loyalty & Respect)**\n> نحن مجتمع نخبة. العنصرية، التنمر، أو قلة الاحترام غير مقبولة. احترم التراتبية، احترم الأعضاء، واحترم وقتك.\n\n` +
                    `**4. 🔐 الهوية الرقمية (Digital Identity)**\n> حساب Kick الخاص بك هو هويتك. يجب ربطه بشكل صحيح للحصول على الـ G-Code. لا تشارك كودك السري مع أحد.\n\n` +
                    `**5. 🛡️ أمن الإمبراطورية (Empire Security)**\n> يمنع نشر الروابط المشبوهة، الإعلانات غير المصرح بها، أو محاولة استغلال ثغرات السيرفر.`
                )
                .setFooter({ text: 'إمبراطورية AKGS • فخامة عصرية', iconURL: 'https://i.imgur.com/8Q9Q9.png' })
                .setTimestamp();
            await channelAr.send({ embeds: [embedAr] });
        }
    }
}

// --- NEW: BILINGUAL VERIFY EMBED ---
async function sendVerifyEmbed(guild) {
    const channel = guild.channels.cache.find(c => c.name === '🔐-verify-تحقق');
    if (channel && channel.isTextBased()) {
        const messages = await channel.messages.fetch({ limit: 5 });
        if (messages.size === 0) {
            const embed = new EmbedBuilder()
                .setColor('#53FC18')
                .setTitle('⛩️ GATEWAY TO THE EMPIRE | بوابة الإمبراطورية')
                .setDescription(
                    `**🇬🇧 ACCESS REQUIRED**\nTo enter the AKGS Empire and access the gaming zones, you must verify your identity. This is a manual check to ensure quality.\n\n` +
                    `**🇸🇦 الدخول مطلوب**\nلدخول إمبراطورية AKGS والوصول إلى مناطق الألعاب، يجب عليك تأكيد هويتك. هذا فحص يدوي لضمان الجودة.\n\n` +
                    `✅ **Type /verify to start | اكتب /verify للبدء**`
                )
                .setImage('https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3Z5Z3Z5Z3Z5Z3Z5Z3Z5Z3Z5Z3Z5Z3Z5Z3Z5Z3Z5/xT9IgzoKnwFNmISR8I/giphy.gif') // Matrix/Cyberpunk GIF
                .setFooter({ text: 'AKGS System Security' });
            
            await channel.send({ embeds: [embed] });
        }
    }
}

client.login(TOKEN);
