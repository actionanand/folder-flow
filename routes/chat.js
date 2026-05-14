const express = require('express');
const router = express.Router();
const config = require('../config');
const { requireAuth, isAdmin } = require('../middleware/auth');

// Chat page
router.get('/chat', requireAuth, (req, res) => {
  const admin = isAdmin(req);
  const messages = config.messages.filter(m => admin || m.visibility === 'all');
  res.render('chat', { messages, isAdmin: admin });
});

// Send message
router.post('/chat', requireAuth, (req, res) => {
  const { message, visibility } = req.body;
  if (!message || !message.trim()) return res.redirect('/chat');

  const admin = isAdmin(req);
  config.messages.push({
    id: Date.now(),
    text: message.trim().substring(0, 500),
    sender: admin ? 'admin' : 'user',
    visibility: admin && visibility === 'admin' ? 'admin' : 'all',
    createdAt: new Date(),
  });

  res.redirect('/chat');
});

module.exports = router;
