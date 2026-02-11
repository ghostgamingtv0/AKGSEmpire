const express = require('express');
const router = express.Router();

// Instagram Webhook Setup
// This is a draft implementation based on the master plan
// Goal: Handle Comment-to-Earn and Mention-to-Earn events

// 1. Verification Endpoint (Required by Meta)
router.get('/instagram-webhook', (req, res) => {
  const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || 'akgs_empire_secret_token';
  
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(400);
  }
});

// 2. Event Listener Endpoint
router.post('/instagram-webhook', (req, res) => {
  const body = req.body;

  console.log('Received Webhook:', JSON.stringify(body, null, 2));

  if (body.object === 'instagram') {
    body.entry.forEach(entry => {
      // Handle each change
      entry.changes.forEach(change => {
        const field = change.field;
        const value = change.value;

        if (field === 'comments') {
          console.log('New Comment:', value.text);
          // TODO: Add logic to reward user (Comment-to-Earn)
        } else if (field === 'mentions') {
          console.log('New Mention:', value.media_id);
          // TODO: Add logic to reward user (Mention-to-Earn)
        }
      });
    });
    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
});

module.exports = router;
