const { Client, GatewayIntentBits, ChannelType, PermissionsBitField } = require('discord.js');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages
    ]
});

const GUILD_ID = process.env.DISCORD_GUILD_ID;
const TOKEN = process.env.DISCORD_BOT_TOKEN;

if (!TOKEN || !GUILD_ID) {
    console.error('❌ Error: Please set DISCORD_BOT_TOKEN and DISCORD_GUILD_ID in .env file');
    process.exit(1);
}

const STRUCTURE = [
    {
        name: '📂 INFORMATION',
        type: ChannelType.GuildCategory,
        channels: [
            { 
                name: '📢-announcements', 
                type: ChannelType.GuildText,
                permissionOverwrites: [
                    {
                        id: 'EVERYONE', // Placeholder, will be replaced by guild.id (everyone role)
                        deny: [PermissionsBitField.Flags.SendMessages]
                    }
                ]
            },
            { 
                name: '🔗-official-links', 
                type: ChannelType.GuildText,
                permissionOverwrites: [
                    {
                        id: 'EVERYONE',
                        deny: [PermissionsBitField.Flags.SendMessages]
                    }
                ]
            },
            { 
                name: '📜-rules', 
                type: ChannelType.GuildText,
                permissionOverwrites: [
                    {
                        id: 'EVERYONE',
                        deny: [PermissionsBitField.Flags.SendMessages]
                    }
                ]
            }
        ]
    },
    {
        name: '📂 COMMUNITY',
        type: ChannelType.GuildCategory,
        channels: [
            { name: '💬-general-chat', type: ChannelType.GuildText },
            { name: '🚀-shill-zone', type: ChannelType.GuildText },
            { name: '🐸-memes', type: ChannelType.GuildText }
        ]
    },
    {
        name: '📂 SUPPORT',
        type: ChannelType.GuildCategory,
        channels: [
            { name: '🎫-open-ticket', type: ChannelType.GuildText },
            { name: '💡-suggestions', type: ChannelType.GuildText }
        ]
    }
];

client.once('ready', async () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
    
    try {
        const guild = await client.guilds.fetch(GUILD_ID);
        if (!guild) {
            console.error('❌ Guild not found!');
            process.exit(1);
        }
        console.log(`🎯 Targeted Server: ${guild.name}`);

        // Get @everyone role ID
        const everyoneRole = guild.roles.everyone;

        for (const categoryData of STRUCTURE) {
            console.log(`\nCreating Category: ${categoryData.name}...`);
            
            // Create Category
            const category = await guild.channels.create({
                name: categoryData.name,
                type: categoryData.type
            });

            // Create Channels in Category
            for (const channelData of categoryData.channels) {
                console.log(`  - Creating Channel: ${channelData.name}`);
                
                // Prepare permissions
                let permissionOverwrites = [];
                if (channelData.permissionOverwrites) {
                    permissionOverwrites = channelData.permissionOverwrites.map(po => ({
                        id: po.id === 'EVERYONE' ? everyoneRole.id : po.id,
                        deny: po.deny,
                        allow: po.allow
                    }));
                }

                await guild.channels.create({
                    name: channelData.name,
                    type: channelData.type,
                    parent: category.id,
                    permissionOverwrites: permissionOverwrites
                });
            }
        }

        console.log('\n✅ Server setup complete! You can close this window.');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error during setup:', error);
        process.exit(1);
    }
});

client.login(TOKEN);
