const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const User = require('../models/User');
const { requireLogin } = require('../middleware/auth');

// ---------- Show profile page ----------
router.get('/profile', requireLogin, async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id).lean();
    if (!user) return res.redirect('/login');
    res.render('profile', { user: req.session.user, dbUser: user, error: null, success: null });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// ---------- Update name ----------
router.post('/profile/name', requireLogin, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      const dbUser = await User.findById(req.session.user.id).lean();
      return res.render('profile', { user: req.session.user, dbUser, error: 'Name cannot be empty.', success: null });
    }

    await User.findByIdAndUpdate(req.session.user.id, { name: name.trim() });

    // Update session too
    req.session.user.name = name.trim();

    req.flash('success', '✅ Your name has been updated!');
    res.redirect('/profile');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// ---------- Change password ----------
router.post('/profile/password', requireLogin, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    const user = await User.findById(req.session.user.id);
    if (!user) return res.redirect('/login');

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      const dbUser = user.toObject();
      return res.render('profile', { user: req.session.user, dbUser, error: 'Current password is incorrect.', success: null });
    }

    if (newPassword.length < 6) {
      const dbUser = user.toObject();
      return res.render('profile', { user: req.session.user, dbUser, error: 'New password must be at least 6 characters.', success: null });
    }

    if (newPassword !== confirmPassword) {
      const dbUser = user.toObject();
      return res.render('profile', { user: req.session.user, dbUser, error: 'Passwords do not match.', success: null });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    req.flash('success', '🔒 Password changed successfully!');
    res.redirect('/profile');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
