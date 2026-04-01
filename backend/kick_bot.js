import WebSocket from 'ws';
import axios from 'axios';
import dotenv from 'dotenv';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// CONFIGURATION
const KICK_CHANNEL_SLUG = 'ghost_gamingtv';
const CHATROOM_ID = 64930060; 
const PUSHER_KEY = 'eb1d5f283081a78b932c'; // Public Key for listening
const API_BASE_URL = 'https://api.kick.com/public/v1';
const CF_BASE_URL = process.env.CF_BASE_URL || process.env.PUBLIC_BASE_URL || 'https://ghostempire.org';

// OAUTH CREDENTIALS (Load from .env or file)
const CLIENT_ID = process.env.KICK_CLIENT_ID || '01KH3T8WNDZ269403HKC17JN7X';
const CLIENT_SECRET = process.env.KICK_CLIENT_SECRET || 'c23959f212aca21f06584f80029291f71d4b26b537e21c1e1b8865737791f7ba';

let db;
let accessToken = null; // Will be fetched via OAuth

(async () => {
    // 1. Connect to DB
    try {
        db = await open({
            filename: join(__dirname, 'database.sqlite'),
            driver: sqlite3.Database
        });
        console.log('📂 Database connected for Kick Bot');
    } catch (e) {
        console.error('❌ Database Connection Error:', e);
    }

    // 2. Authenticate with Kick API
    await refreshAccessToken();

})();

// 0. AUTHENTICATION LOGIC
async function refreshAccessToken() {
    console.log('🔄 Authenticating with Kick API...');
    try {
        // Method 5: Fetch API with URLSearchParams (Modern & Native)
        const params = new URLSearchParams();
        params.append('grant_type', 'client_credentials');
        params.append('client_id', CLIENT_ID);
        params.append('client_secret', CLIENT_SECRET);
        // params.append('scope', 'chat:write'); // Uncomment if needed, but start without

        const response = await fetch('https://id.kick.com/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params
        });

        const data = await response.json();

        if (response.ok && data.access_token) {
            accessToken = data.access_token;
            console.log('🔑 Authentication Successful! Token acquired.');
        } else {
            console.error('❌ Authentication Failed:', data);
        }
    } catch (e) {
        console.error('❌ Authentication Error:', e.message);
    }
}

// 1. LISTEN TO CHAT (Using Pusher WebSocket - Standard method for reading)
async function startKickListener() {
    console.log(`🎧 Starting Chat Listener for: ${KICK_CHANNEL_SLUG}`);

    // Periodic Announcement (Every 10 minutes)
    setInterval(async () => {
        await sendOfficialReply(`🤖 **AKGS SYSTEM:**\n🇬🇧 To earn points, type your **G-Code** below! (Found on Dashboard)\n🇸🇦 لربح النقاط، اكتب كود **G-Code** الخاص بك هنا! (تجده في لوحة التحكم)\n🔗 ghostempire.org`);
    }, 10 * 60 * 1000);
    
    // Try US2 cluster as fallback if default fails
    const wsUrl = `wss://ws-us2.pusher.com/app/${PUSHER_KEY}?protocol=7&client=js&version=8.4.0&flash=false`;
    const ws = new WebSocket(wsUrl);

    ws.on('open', () => {
        console.log('✅ WebSocket Connected');
    });

    ws.on('message', (data) => {
        try {
            const msg = JSON.parse(data);
            
            if (msg.event === 'pusher:connection_established') {
                console.log('🔗 Connection Established. Subscribing...');
                ws.send(JSON.stringify({
                    event: 'pusher:subscribe',
                    data: { auth: '', channel: `chatrooms.${CHATROOM_ID}.v2` }
                }));
            }

            if (msg.event === 'App\\Events\\ChatMessageEvent') {
                const chatData = JSON.parse(msg.data);
                const sender = chatData.sender.username;
                const content = chatData.content.trim();
                
                console.log(`💬 ${sender}: ${content}`);
                handleCommand(sender, content);
            }
            
            if (msg.event === 'pusher:ping') {
                ws.send(JSON.stringify({ event: 'pusher:pong' }));
            }

        } catch (e) {
            console.error('Parse Error:', e.message);
        }
    });

    ws.on('close', () => {
        console.log('⚠️ WebSocket Closed. Reconnecting...');
        setTimeout(startKickListener, 5000);
    });
}

// 2. HANDLE COMMANDS
async function handleCommand(sender, content) {
    const cmd = content.toLowerCase();
    
    // G-Code Auto-Detection (Format: G-XXXXXX)
    const gcodeMatch = content.match(/G-[A-Za-z0-9]+/);
    if (gcodeMatch) {
        const extractedCode = gcodeMatch[0];
        console.log(`🔎 Detected G-Code in chat: ${extractedCode} from ${sender}`);
        await verifyUserGCode(sender, extractedCode);
        return;
    }

    if (cmd === '!gcode') {
        await handleGCode(sender);
    } else if (cmd === '!socials') {
        await sendOfficialReply(`🌍 **AKGS OFFICIAL LINKS | الروابط الرسمية:**\n🐦 **X (Twitter):** @AKGS_Empire\n📸 **Instagram:** @ghost.gamingtv\n🌐 **Website:** ghostempire.org`);
    } else if (cmd === '!help') {
        await sendOfficialReply(`🤖 **COMMANDS | الأوامر:**\n!gcode - Check Status (التحقق من الحالة)\n!socials - Official Links (الروابط الرسمية)\nJust type your **G-Code** to verify! (فقط اكتب الكود للتحقق)`);
    }
}

async function handleGCode(username) {
    console.log(`🔍 Checking G-Code for ${username}...`);
    try {
        const user = await db.get('SELECT g_code FROM users WHERE kick_username = ? COLLATE NOCASE', [username]);
        if (user && user.g_code) {
            await sendOfficialReply(`🔐 **VERIFIED | تم التحقق**\n👤 User: @${username}\n🆔 G-CODE: || ${user.g_code} ||\n✅ Access Granted.`);
        } else {
            await sendOfficialReply(`🚫 **ACCESS DENIED | خطأ**\n⚠️ Account Not Linked / غير مرتبط\n🔗 Link now at: ghostempire.org`);
        }
    } catch (e) {
        console.error('DB Error:', e.message);
    }
}

async function verifyUserGCode(username, providedCode) {
    try {
        const payload = {
            kick_username: username,
            g_code: providedCode
        };

        const response = await axios.post(`${CF_BASE_URL}/api/kick/mining/verify`, payload, {
            timeout: 8000
        });

        const data = response.data || {};

        if (data.success) {
            await sendOfficialReply(
                `✅ **MINING UNLOCKED | تم فتح التعدين**\n👤 @${username}\n🆔 Code: ${providedCode}`
            );
        } else {
            await sendOfficialReply(
                `⚠️ **ERROR | خطأ**\n${data.message || 'Verification failed / فشل التحقق'}`
            );
        }
    } catch (e) {
        if (e.response) {
            const status = e.response.status;
            if (status === 404) {
                await sendOfficialReply(
                    `🚫 **INVALID CODE | كود غير صالح**\n🆔 ${providedCode}`
                );
            } else if (status === 409) {
                await sendOfficialReply(
                    `⛔ **CODE IN USE | الكود مرتبط بحساب آخر**\n🆔 ${providedCode}`
                );
            } else {
                await sendOfficialReply(
                    `⚠️ **SERVER ERROR | خطأ في الخادم**\nStatus: ${status}`
                );
            }
        } else {
            console.error('Verify Error:', e.message);
            await sendOfficialReply('⚠️ Temporary verification error / خطأ مؤقت في التحقق');
        }
    }
}

// 3. SEND MESSAGE (Using Official API)
async function sendOfficialReply(content) {
    if (!accessToken) {
        console.error('❌ Cannot reply: No Access Token. Run auth flow first.');
        return;
    }

    try {
        // Note: Official API endpoint for sending chat might differ slightly.
        // Based on search, standard is POST /chat/messages or similar.
        // For now, we use the standard structure. If it fails, we need the exact endpoint from docs.
        // Assuming: POST /public/v1/chatrooms/{id}/messages
        
        await axios.post(`${API_BASE_URL}/chatrooms/${CHATROOM_ID}/messages`, {
            content: content,
            type: 'message'
        }, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });
        console.log(`✅ Sent Reply: ${content.substring(0, 20)}...`);
    } catch (e) {
        console.error('❌ Failed to send (API):', e.response ? e.response.data : e.message);
        
        // Auto-Refresh Token on 401
        if (e.response && e.response.status === 401) {
            console.log('🔄 Token expired? Refreshing...');
            await refreshAccessToken();
        }
    }
}

// EXPORT FUNCTION TO SET TOKEN
export function setAccessToken(token) {
    accessToken = token;
    console.log('🔑 Access Token Set! Bot is ready to reply.');
}

// START LISTENER
startKickListener();
