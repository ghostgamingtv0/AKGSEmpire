import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

const TOKEN = process.env.INSTAGRAM_OFFICIAL_TOKEN;

if (!TOKEN) {
    console.error('❌ Error: INSTAGRAM_OFFICIAL_TOKEN is missing in .env');
    process.exit(1);
}

// NOTE: This endpoint "me/messages" is for sending messages as the Page/User.
// You usually need a recipient PSID (Page Scoped ID).
// The user provided curl has "recipient": "{\"id\":\"\"}", which implies the user needs to fill this.
// For testing, we might need a valid PSID if this is for Messenger API for Instagram.

const sendMessage = async () => {
    try {
        console.log('🚀 Sending Test Message to Instagram...');
        
        // Use the curl command structure provided by the user
        // curl -X POST https://graph.instagram.com/v21.0/me/messages ...
        
        const url = 'https://graph.instagram.com/v21.0/me/messages';
        
        // Payload from user request
        const data = {
            message: JSON.stringify({ text: "Hello World welcome to ghost empire" }),
            recipient: JSON.stringify({ id: process.env.INSTAGRAM_USER_ID || "" }) 
        };

        // If the user wants to test exactly what was pasted, we send it.
        // However, with empty ID it will likely fail.
        // We will log the response to see what Instagram says.
        
        const response = await axios.post(url, data, {
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Success:', response.data);
    } catch (error) {
        if (error.response) {
            console.error('❌ API Error:', error.response.data);
        } else {
            console.error('❌ Request Error:', error.message);
        }
    }
};

sendMessage();
