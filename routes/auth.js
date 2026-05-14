const express = require('express');
const router = express.Router();
const config = require('../config');

router.get('/login', (req, res) => {
  res.render('login', { error: null });
});

router.post('/login', (req, res) => {
  const { pin } = req.body;
  if (pin === config.adminPin) {
    req.session.authenticated = true;
    req.session.role = 'admin';
    return res.redirect('/');
  }
  if (pin === config.userPin) {
    req.session.authenticated = true;
    req.session.role = 'user';
    return res.redirect('/');
  }
  res.render('login', { error: 'Invalid PIN. Try again.' });
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

module.exports = router;
