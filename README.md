# Online Assignment Submission Portal

A simple full-stack web app where **teachers** can create assignments and **students** can submit their work, built with **HTML/CSS/JS (EJS templates)**, **Node.js + Express**, and **MongoDB**.

## Features

- Student & Teacher registration/login (passwords hashed with bcrypt)
- Role-based dashboards
- Teachers: create, edit, delete assignments; view submissions; grade & give feedback
- Students: view assignments, upload submission files, see status (Pending / Submitted / Late / Graded), view grade & feedback
- File uploads handled with Multer (stored in `/uploads`)

## Folder Structure

```
assignment-portal/
├── server.js              # App entry point
├── package.json
├── .env.example           # Copy to .env and fill in values
├── models/                 # Mongoose schemas (User, Assignment, Submission)
├── routes/                  # auth.js, student.js, teacher.js
├── middleware/              # auth.js (login/role checks), upload.js (multer)
├── views/                   # EJS templates
│   ├── partials/            # header.ejs, footer.ejs
│   ├── student/
│   └── teacher/
├── public/css/style.css     # Styling
└── uploads/                  # Uploaded assignment files (created automatically)
```

## Setup Instructions

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [MongoDB](https://www.mongodb.com/try/download/community) running locally, OR a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster

### 2. Install dependencies
```bash
cd assignment-portal
npm install
```

### 3. Configure environment variables
Copy `.env.example` to `.env` and update the values:
```bash
cp .env.example .env
```

Edit `.env`:
```
MONGO_URI=mongodb://127.0.0.1:27017/assignment_portal
SESSION_SECRET=any_long_random_string
PORT=3000
```

If using MongoDB Atlas, replace `MONGO_URI` with your Atlas connection string.

### 4. Run the app
```bash
npm start
```
or, for auto-restart during development:
```bash
npm run dev
```

The app will run at: **http://localhost:3000**

## Usage

1. Go to `/register` and create two accounts: one as **Teacher**, one as **Student**.
2. Log in as the **Teacher** → click "New Assignment" → create an assignment with title, subject, description, and due date.
3. Log in as the **Student** (use a different browser or incognito window) → you'll see the assignment on your dashboard → click "View" → upload a file to submit.
4. Log back in as the **Teacher** → go to "Submissions" for that assignment → enter a grade and feedback.
5. Log in as the **Student** again → the assignment status will now show "Graded" along with the grade and feedback.

## Notes for Viva / Presentation

- Authentication uses `express-session` + `bcryptjs` for password hashing.
- File uploads are validated by type (pdf, doc, docx, txt, zip, images, ppt, xls) and size (max 10MB) using Multer.
- A submission's `status` field automatically becomes `late` if uploaded after the assignment's due date.
- One submission per student per assignment is enforced using a unique compound index (`assignmentId + studentId`); re-uploading replaces the previous submission.

## Possible Future Enhancements
- Email notifications for new assignments / grades
- Admin panel for managing users
- Plagiarism check integration
- Class/section-based assignment filtering
