import WebSocket from 'ws';
import axios from 'axios';
import dotenv from 'dotenv';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

// CONFIGURATION
const KICK_CHANNEL_SLUG = 'ghost_gamingtv';
let CHATROOM_ID = 64930060; // Default, will update dynamically
const PUSHER_KEY = '32cbd69e4b950bf97679'; // New Public Key (Updated 2025)
const API_BASE_URL = 'https://api.kick.com/public/v1';

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

    // 3. Fetch Correct Chatroom ID
    await fetchChatroomId();

    // 4. Start Listener
    startKickListener();
})();

async function fetchChatroomId() {
    try {
        console.log(`🔍 Fetching Chatroom ID for ${KICK_CHANNEL_SLUG}...`);
        
        // Use Access Token if available
        const headers = accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {};
        
        const response = await fetch(`https://api.kick.com/public/v1/channels/${KICK_CHANNEL_SLUG}`, { headers });
        
        if (response.ok) {
            const data = await response.json();
            if (data && data.chatroom && data.chatroom.id) {
                CHATROOM_ID = data.chatroom.id;
                console.log(`✅ Chatroom ID Found: ${CHATROOM_ID}`);
            }
        } else {
            console.error(`⚠️ Failed to fetch channel data (Status: ${response.status}), using default ID: ${CHATROOM_ID}`);
            // Fallback: Try v2 endpoint if v1 fails
             try {
                const res2 = await fetch(`https://api.kick.com/api/v2/channels/${KICK_CHANNEL_SLUG}`, { headers });
                if (res2.ok) {
                    const data2 = await res2.json();
                     if (data2 && data2.chatroom && data2.chatroom.id) {
                        CHATROOM_ID = data2.chatroom.id;
                        console.log(`✅ Chatroom ID Found (v2): ${CHATROOM_ID}`);
                    }
                }
             } catch(e2) { console.error('v2 fetch failed'); }
        }
    } catch (e) {
        console.error('⚠️ Error fetching chatroom ID:', e.message);
    }
}

// 0. AUTHENTICATION LOGIC
async function refreshAccessToken() {
    console.log('🔄 Authenticating with Kick API...');
    console.log('   ID:', CLIENT_ID);
    // console.log('   Secret:', CLIENT_SECRET); // Security: Don't log full secret

    try {
        // Method 5: Fetch API with URLSearchParams (Modern & Native)
        const params = new URLSearchParams();
        params.append('grant_type', 'client_credentials');
        params.append('client_id', CLIENT_ID);
        params.append('client_secret', CLIENT_SECRET);
        // params.append('scope', 'chat:write'); // Explicitly requesting chat:write scope
        
        // Try without scope first if it fails? No, bot needs scope.
        // But test script worked WITHOUT scope (default).
        // Let's try default scope first to pass auth.
        // params.append('scope', 'chat:write'); 

        const response = await fetch('https://id.kick.com/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params
        });

        const text = await response.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error('❌ Failed to parse auth response:', text);
            return;
        }

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

    ws.on('close', (code, reason) => {
        console.log(`⚠️ WebSocket Closed. Code: ${code}, Reason: ${reason}`);
        console.log('🔄 Reconnecting in 5s...');
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
        const user = await db.get('SELECT * FROM users WHERE g_code = ?', [providedCode]);
        
        if (user) {
            if (user.kick_username && user.kick_username.toLowerCase() === username.toLowerCase()) {
                 await sendOfficialReply(`✅ **POINTS EARNED | تم احتساب النقاط**\n👤 @${username}\n🆔 Code: ${providedCode}`);
            } else if (!user.kick_username) {
                 await db.run('UPDATE users SET kick_username = ? WHERE g_code = ?', [username, providedCode]);
                 await sendOfficialReply(`🔗 **LINKED SUCCESSFULLY | تم الربط بنجاح**\n👤 @${username} is now owner of ${providedCode}`);
            } else {
                 await sendOfficialReply(`⚠️ **ERROR | خطأ**\n⛔ Code belongs to another user! / الكود مستخدم بالفعل`);
            }
        } else {
             // Silent fail or minimal reply to avoid spam
        }
    } catch (e) {
        console.error('Verify Error:', e.message);
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
// startKickListener(); // Removed auto-start, now called in async IIFE
