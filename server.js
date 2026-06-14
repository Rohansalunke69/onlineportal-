require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const path = require('path');

const authRoutes    = require('./routes/auth');
const studentRoutes = require('./routes/student');
const teacherRoutes = require('./routes/teacher');
const profileRoutes = require('./routes/profile');
const { requireLogin } = require('./middleware/auth');

const app = express();

// ---------- View engine ----------
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ---------- Middleware ----------
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback_secret_change_me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 4, // 4 hours
    httpOnly: true,
    sameSite: 'lax'
  }
}));

// ── Flash message middleware ──────────────────────────────────
app.use((req, res, next) => {
  res.locals.flash = req.session.flash || null;
  if (req.session.flash) delete req.session.flash;

  req.flash = function (type, message) {
    req.session.flash = { type, message };
  };
  next();
});

// Make logged-in user available in all views
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// ---------- Routes ----------
app.use('/', authRoutes);
app.use('/student', studentRoutes);
app.use('/teacher', teacherRoutes);
app.use('/', profileRoutes);

// Home -> render landing page
app.get('/', (req, res) => {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }
  res.render('landing');
});

// Generic dashboard redirect based on role
app.get('/dashboard', requireLogin, (req, res) => {
  if (req.session.user.role === 'teacher') {
    return res.redirect('/teacher/dashboard');
  }
  res.redirect('/student/dashboard');
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('404', { user: req.session.user || null });
});

// ---------- Connect to MongoDB and start server ----------
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/assignment_portal';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log('Server running on http://localhost:' + PORT);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
  });
