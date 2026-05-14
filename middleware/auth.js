const config = require('../config');

function requireAuth(req, res, next) {
  if (req.session && req.session.authenticated) {
    return next();
  }
  return res.redirect('/login');
}

function requireAdmin(req, res, next) {
  if (req.session && req.session.authenticated && req.session.role === 'admin') {
    return next();
  }
  return res.status(403).render('error', { message: 'Admin access required' });
}

function isAdmin(req) {
  return req.session && req.session.role === 'admin';
}

module.exports = { requireAuth, requireAdmin, isAdmin };
