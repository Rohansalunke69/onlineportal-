// Middleware to check if a user is logged in
function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
}

// Middleware factory to restrict a route to a specific role (student / teacher)
function requireRole(role) {
  return function (req, res, next) {
    if (!req.session.user) {
      return res.redirect('/login');
    }
    if (req.session.user.role !== role) {
      return res.status(403).send('Access denied: this page is only for ' + role + 's.');
    }
    next();
  };
}

module.exports = { requireLogin, requireRole };
