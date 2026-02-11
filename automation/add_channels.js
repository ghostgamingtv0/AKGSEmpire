
const { Client, GatewayIntentBits, ChannelType, PermissionsBitField } = require('discord.js');
require('dotenv').config();

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

// New Structure to Add
const NEW_STRUCTURE = [
    {
        name: '📡 SOCIAL FEEDS',
        type: ChannelType.GuildCategory,
        channels: [
            { name: '📰-all-news', type: ChannelType.GuildText, topic: 'Latest gaming news' },
            { name: '🐦-twitter-x', type: ChannelType.GuildText, topic: 'Updates from X (Twitter)' },
            { name: '🟢-kick-live', type: ChannelType.GuildText, topic: 'Stream notifications' },
            { name: '📸-instagram', type: ChannelType.GuildText, topic: 'Instagram photos & reels' },
            { name: '▶️-youtube', type: ChannelType.GuildText, topic: 'New videos' }
        ]
    },
    {
        name: '🎮 GAMING ZONES',
        type: ChannelType.GuildCategory,
        channels: [
            { name: '⚔️-where-winds-meet', type: ChannelType.GuildText },
            { name: '🦸-marvel-rivals', type: ChannelType.GuildText },
            { name: '⚽-fc26-ultimate-team', type: ChannelType.GuildText },
            { name: '🥅-fc26-pro-club', type: ChannelType.GuildText },
            { name: '🤠-red-dead', type: ChannelType.GuildText }
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
                            // If it's a social feed, deny sending messages for everyone (only bot/admin can post)
                            deny: catData.name.includes('SOCIAL') ? [PermissionsBitField.Flags.SendMessages] : []
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
