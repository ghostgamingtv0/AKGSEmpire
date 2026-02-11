
const { Client, GatewayIntentBits, ChannelType, PermissionsBitField } = require('discord.js');
require('dotenv').config();

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

// New Structure to Add (Crypto, Hall of Fame, Rewards)
const NEW_STRUCTURE = [
    {
        name: '📊 CRYPTO & WEB3 HUB',
        type: ChannelType.GuildCategory,
        channels: [
            { name: '🪙-crypto-info', type: ChannelType.GuildText, topic: 'General Crypto Information | معلومات العملات الرقمية | Infos Crypto' },
            { name: '📰-crypto-news', type: ChannelType.GuildText, topic: 'Latest Market News | آخر أخبار السوق | Dernières nouvelles du marché' },
            { name: '🌐-web3-all-news', type: ChannelType.GuildText, topic: 'Everything Web3 | كل ما يخص الويب 3 | Tout sur le Web3' }
        ]
    },
    {
        name: '🏆 HALL OF FAME (قاعة المشاهير)',
        type: ChannelType.GuildCategory,
        channels: [
            { name: '🖼️-nft-winners', type: ChannelType.GuildText, topic: 'NFT Winners | الفائزون بـ NFT | Gagnants NFT' },
            { name: '🐳-top-investors', type: ChannelType.GuildText, topic: 'Biggest Investors | أكبر المستثمرين | Plus gros investisseurs' },
            { name: '💰-top-token-holders', type: ChannelType.GuildText, topic: 'Top Token Holders | أكثر حاملي العملة | Détenteurs de jetons principaux' },
            { name: '🎁-airdrop-kings', type: ChannelType.GuildText, topic: 'Biggest Airdrop Winners | أكبر الرابحين في الإيردروب | Gagnants Airdrop' }
        ]
    },
    {
        name: '🎁 REWARDS & DROPS (الجوائز)',
        type: ChannelType.GuildCategory,
        channels: [
            { name: '🪂-airdrop-alerts', type: ChannelType.GuildText, topic: 'Airdrop Dates & Info | تواريخ وتفاصيل الإيردروب | Dates et infos Airdrop' },
            { name: '🖼️-nft-drops', type: ChannelType.GuildText, topic: 'Upcoming NFT Drops | جديد الـ NFT | Nouveaux drops NFT' },
            { name: '🪙-token-rewards', type: ChannelType.GuildText, topic: 'Token Prizes & Events | جوائز العملات والمسابقات | Prix en jetons et événements' }
        ]
    }
];

const GUILD_ID = process.env.DISCORD_GUILD_ID || '1427171466276900897';

client.once('ready', async () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
    const guild = await client.guilds.fetch(GUILD_ID);
    
    if (!guild) {
        console.error('❌ Server not found! Check ID.');
        process.exit(1);
    }
    
    console.log(`🎯 Targeted Server: ${guild.name}`);

    for (const catData of NEW_STRUCTURE) {
        // Check if category exists
        let category = guild.channels.cache.find(c => c.name === catData.name && c.type === ChannelType.GuildCategory);
        
        if (!category) {
            console.log(`Creating Category: ${catData.name}...`);
            category = await guild.channels.create({
                name: catData.name,
                type: catData.type
            });
        } else {
            console.log(`ℹ️ Category '${catData.name}' already exists.`);
        }

        // Create channels inside
        for (const chanData of catData.channels) {
            const exists = guild.channels.cache.find(c => c.name === chanData.name && c.parentId === category.id);
            if (!exists) {
                console.log(`  - Creating Channel: ${chanData.name}`);
                await guild.channels.create({
                    name: chanData.name,
                    type: chanData.type,
                    parent: category.id,
                    topic: chanData.topic || '',
                    permissionOverwrites: [
                        {
                            id: guild.roles.everyone,
                            // Deny sending messages for everyone in these specific informational channels
                            deny: [PermissionsBitField.Flags.SendMessages] 
                        }
                    ]
                });
            } else {
                console.log(`  - ℹ️ Channel '${chanData.name}' already exists.`);
            }
        }
    }

    console.log('✅ Update complete!');
    process.exit(0);
});

client.login(process.env.DISCORD_BOT_TOKEN);
