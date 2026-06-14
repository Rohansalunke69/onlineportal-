const express = require('express');
const router = express.Router();
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const { requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

// ---------- Student dashboard ----------
router.get('/dashboard', requireRole('student'), async (req, res) => {
  try {
    const studentId = req.session.user.id;
    const assignments = await Assignment.find().sort({ dueDate: 1 }).lean();
    const submissions = await Submission.find({ studentId }).lean();

    const submissionMap = {};
    submissions.forEach(sub => { submissionMap[sub.assignmentId.toString()] = sub; });

    const now = new Date();
    const assignmentList = assignments.map(a => {
      const sub = submissionMap[a._id.toString()];
      let status = 'Pending';
      if (sub) {
        status = sub.status === 'graded' ? 'Graded' : (sub.status === 'late' ? 'Submitted (Late)' : 'Submitted');
      } else if (new Date(a.dueDate) < now) {
        status = 'Missed';
      }
      return { ...a, status, submission: sub || null };
    });

    res.render('student/dashboard', { user: req.session.user, assignments: assignmentList });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// ---------- View a single assignment ----------
router.get('/assignment/:id', requireRole('student'), async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id).lean();
    if (!assignment) return res.status(404).render('404', { user: req.session.user });

    const submission = await Submission.findOne({
      assignmentId: assignment._id,
      studentId: req.session.user.id
    }).lean();

    res.render('student/assignment', { user: req.session.user, assignment, submission, error: null });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// ---------- Submit / re-submit an assignment ----------
router.post('/assignment/:id/submit', requireRole('student'), (req, res) => {
  upload.single('file')(req, res, async (err) => {
    try {
      const assignment = await Assignment.findById(req.params.id).lean();
      if (!assignment) return res.status(404).render('404', { user: req.session.user });

      if (err) {
        const submission = await Submission.findOne({ assignmentId: assignment._id, studentId: req.session.user.id }).lean();
        return res.render('student/assignment', { user: req.session.user, assignment, submission, error: err.message });
      }

      if (!req.file) {
        const submission = await Submission.findOne({ assignmentId: assignment._id, studentId: req.session.user.id }).lean();
        return res.render('student/assignment', { user: req.session.user, assignment, submission, error: 'Please choose a file to upload.' });
      }

      const now = new Date();
      const status = now > new Date(assignment.dueDate) ? 'late' : 'submitted';

      await Submission.findOneAndUpdate(
        { assignmentId: assignment._id, studentId: req.session.user.id },
        { fileUrl: '/uploads/' + req.file.filename, originalName: req.file.originalname, submittedAt: now, status, grade: null, feedback: null },
        { upsert: true, new: true }
      );

      const msg = status === 'late'
        ? '⚠️ Assignment submitted (late) — your teacher has been notified.'
        : '✅ Assignment submitted successfully!';
      req.flash('success', msg);
      res.redirect('/student/dashboard');
    } catch (e) {
      console.error(e);
      res.status(500).send('Server error');
    }
  });
});

module.exports = router;
