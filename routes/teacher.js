const express = require('express');
const router = express.Router();
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const { requireRole } = require('../middleware/auth');

// ---------- Teacher dashboard: list assignments created by this teacher ----------
router.get('/dashboard', requireRole('teacher'), async (req, res) => {
  try {
    const assignments = await Assignment.find({ createdBy: req.session.user.id })
      .sort({ dueDate: 1 })
      .lean();

    // Count submissions for each assignment
    for (const a of assignments) {
      a.submissionCount = await Submission.countDocuments({ assignmentId: a._id });
      a.gradedCount = await Submission.countDocuments({ assignmentId: a._id, status: 'graded' });
    }

    res.render('teacher/dashboard', { user: req.session.user, assignments });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// ---------- Show "create assignment" form ----------
router.get('/assignment/new', requireRole('teacher'), (req, res) => {
  res.render('teacher/new-assignment', { user: req.session.user, error: null });
});

// ---------- Handle "create assignment" form submission ----------
router.post('/assignment/new', requireRole('teacher'), async (req, res) => {
  try {
    const { title, description, subject, dueDate } = req.body;

    if (!title || !description || !subject || !dueDate) {
      return res.render('teacher/new-assignment', { user: req.session.user, error: 'All fields are required.' });
    }

    await Assignment.create({
      title,
      description,
      subject,
      dueDate: new Date(dueDate),
      createdBy: req.session.user.id
    });

    res.redirect('/teacher/dashboard');
  } catch (err) {
    console.error(err);
    res.render('teacher/new-assignment', { user: req.session.user, error: 'Something went wrong. Please try again.' });
  }
});

// ---------- Show edit assignment form ----------
router.get('/assignment/:id/edit', requireRole('teacher'), async (req, res) => {
  try {
    const assignment = await Assignment.findOne({ _id: req.params.id, createdBy: req.session.user.id }).lean();
    if (!assignment) return res.status(404).send('Assignment not found');

    res.render('teacher/edit-assignment', { user: req.session.user, assignment, error: null });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// ---------- Handle edit assignment form submission ----------
router.post('/assignment/:id/edit', requireRole('teacher'), async (req, res) => {
  try {
    const { title, description, subject, dueDate } = req.body;

    const assignment = await Assignment.findOne({ _id: req.params.id, createdBy: req.session.user.id });
    if (!assignment) return res.status(404).send('Assignment not found');

    if (!title || !description || !subject || !dueDate) {
      return res.render('teacher/edit-assignment', { user: req.session.user, assignment, error: 'All fields are required.' });
    }

    assignment.title = title;
    assignment.description = description;
    assignment.subject = subject;
    assignment.dueDate = new Date(dueDate);
    await assignment.save();

    res.redirect('/teacher/dashboard');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// ---------- Delete an assignment ----------
router.post('/assignment/:id/delete', requireRole('teacher'), async (req, res) => {
  try {
    const assignment = await Assignment.findOneAndDelete({ _id: req.params.id, createdBy: req.session.user.id });
    if (assignment) {
      await Submission.deleteMany({ assignmentId: assignment._id });
    }
    res.redirect('/teacher/dashboard');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// ---------- View all submissions for one assignment ----------
router.get('/assignment/:id/submissions', requireRole('teacher'), async (req, res) => {
  try {
    const assignment = await Assignment.findOne({ _id: req.params.id, createdBy: req.session.user.id }).lean();
    if (!assignment) return res.status(404).send('Assignment not found');

    const submissions = await Submission.find({ assignmentId: assignment._id })
      .populate('studentId', 'name email')
      .sort({ submittedAt: 1 })
      .lean();

    res.render('teacher/submissions', { user: req.session.user, assignment, submissions });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// ---------- Grade a submission ----------
router.post('/submission/:id/grade', requireRole('teacher'), async (req, res) => {
  try {
    const { grade, feedback } = req.body;
    const submission = await Submission.findById(req.params.id);
    if (!submission) return res.status(404).send('Submission not found');

    submission.grade = grade;
    submission.feedback = feedback;
    submission.status = 'graded';
    await submission.save();

    res.redirect('/teacher/assignment/' + submission.assignmentId + '/submissions');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
