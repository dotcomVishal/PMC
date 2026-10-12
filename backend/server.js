const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const archiver = require('archiver');
const { run, get, all, paths } = require('./db');
const { signToken, verifyToken, verifyAdmin, ADMIN_EMAILS } = require('./auth');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Multer Storage Configuration
// 1. Slides storage
const slidesStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, paths.slidesDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safeName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${crypto.randomUUID()}-${safeName}${ext}`);
  }
});

const uploadSlides = multer({
  storage: slidesStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.pptx', '.ppt', '.odp', '.zip'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid slide format. Permitted formats: PDF, PPTX, PPT, ODP, ZIP'));
    }
  }
});

// 2. Submissions storage
const submissionsStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, paths.submissionsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safeName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${crypto.randomUUID()}-${safeName}${ext}`);
  }
});

const uploadSubmissions = multer({
  storage: submissionsStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB per file
  fileFilter: (req, file, cb) => {
    // Whitelist safe extensions; disallow executables and scripts
    const forbidden = ['.exe', '.sh', '.bat', '.cmd', '.php', '.js', '.py', '.pl', '.cgi', '.msi'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (forbidden.includes(ext)) {
      cb(new Error(`File type ${ext} is not allowed for security reasons.`));
    } else {
      cb(null, true);
    }
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Root check
app.get('/', (req, res) => {
  res.status(200).send('PMC Learning Fest API');
});

// -------------------------------------------------------------
// USER / PARTICIPANT ROUTES
// -------------------------------------------------------------

// Institute Email Login (Direct authentication for IIT Mandi emails)
app.post('/auth/login', (req, res) => {
  const { email } = req.body;
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Please enter your institute email.' });
  }

  let cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail.includes('@')) {
    cleanEmail = `${cleanEmail}@students.iitmandi.ac.in`;
  }

  if (!cleanEmail.endsWith('@students.iitmandi.ac.in') && !cleanEmail.endsWith('@iitmandi.ac.in')) {
    return res.status(400).json({
      error: 'Access restricted: Only @students.iitmandi.ac.in or @iitmandi.ac.in emails are allowed.'
    });
  }

  const rollNumber = cleanEmail.split('@')[0].toUpperCase();
  const isAdmin = ADMIN_EMAILS.includes(cleanEmail);

  const token = signToken({
    email: cleanEmail,
    rollNumber,
    name: rollNumber,
    isAdmin
  });

  res.json({
    token,
    user: {
      email: cleanEmail,
      rollNumber,
      name: rollNumber,
      isAdmin
    }
  });
});

// Get current user profile & admin state
app.get('/auth/me', verifyToken, (req, res) => {
  res.json({
    email: req.user.email,
    name: req.user.name,
    rollNumber: req.user.rollNumber,
    isAdmin: req.user.isAdmin
  });
});

// Get all events
app.get('/events', verifyToken, async (req, res) => {
  try {
    const events = await all(`
      SELECT 
        id, 
        name, 
        description, 
        event_date, 
        slides_filename,
        slides_original_name,
        submission_start, 
        submission_end, 
        created_at 
      FROM events 
      ORDER BY event_date ASC
    `);

    const formatted = events.map(e => ({
      id: e.id,
      name: e.name,
      description: e.description,
      eventDate: e.event_date,
      hasSlides: Boolean(e.slides_filename),
      slidesOriginalName: e.slides_original_name,
      submissionStart: e.submission_start,
      submissionEnd: e.submission_end,
      createdAt: e.created_at
    }));

    res.json(formatted);
  } catch (err) {
    console.error('Failed to fetch events:', err);
    res.status(500).json({ error: 'Failed to fetch events.' });
  }
});

// Download slide for an event
app.get('/events/:id/slides', verifyToken, async (req, res) => {
  try {
    const event = await get('SELECT slides_filename, slides_original_name FROM events WHERE id = ?', [req.params.id]);
    if (!event || !event.slides_filename) {
      return res.status(404).json({ error: 'Slides not found for this event.' });
    }

    const filePath = path.join(paths.slidesDir, event.slides_filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Slide file is missing on server storage.' });
    }

    res.download(filePath, event.slides_original_name || 'slides.pdf');
  } catch (err) {
    console.error('Failed to download slides:', err);
    res.status(500).json({ error: 'Failed to download slides.' });
  }
});

// Get user's existing submission for an event
app.get('/events/:id/my-submission', verifyToken, async (req, res) => {
  try {
    const submission = await get(
      'SELECT id, roll_number, user_email, submitted_at, updated_at FROM submissions WHERE event_id = ? AND roll_number = ?',
      [req.params.id, req.user.rollNumber]
    );

    if (!submission) {
      return res.json(null);
    }

    const files = await all(
      'SELECT id, original_name, file_size, mime_type FROM submission_files WHERE submission_id = ?',
      [submission.id]
    );

    res.json({
      id: submission.id,
      rollNumber: submission.roll_number,
      email: submission.user_email,
      submittedAt: submission.submitted_at,
      updatedAt: submission.updated_at,
      files: files.map(f => ({
        id: f.id,
        originalName: f.original_name,
        fileSize: f.file_size,
        mimeType: f.mime_type
      }))
    });
  } catch (err) {
    console.error('Failed to get submission:', err);
    res.status(500).json({ error: 'Failed to retrieve submission.' });
  }
});

// Submit / Update multi-file submission for an event
app.post('/events/:id/submissions', verifyToken, (req, res) => {
  uploadSubmissions.array('files', 20)(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    try {
      const eventId = req.params.id;
      const event = await get('SELECT * FROM events WHERE id = ?', [eventId]);
      if (!event) {
        return res.status(404).json({ error: 'Event not found.' });
      }

      // Check submission window
      const now = new Date();
      const startDate = new Date(event.submission_start);
      const endDate = new Date(event.submission_end);

      if (now < startDate) {
        // Cleanup uploaded files
        if (req.files) req.files.forEach(f => fs.unlink(f.path, () => {}));
        return res.status(400).json({
          error: `Submissions have not started yet. Submission window opens on ${event.submission_start}.`
        });
      }

      if (now > endDate) {
        // Cleanup uploaded files
        if (req.files) req.files.forEach(f => fs.unlink(f.path, () => {}));
        return res.status(400).json({
          error: `Submissions closed on ${event.submission_end}.`
        });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'Please select at least one file to submit.' });
      }

      // Safety: Total file size capped at 50 MB
      const totalSize = req.files.reduce((sum, f) => sum + f.size, 0);
      if (totalSize > 50 * 1024 * 1024) {
        req.files.forEach(f => fs.unlink(f.path, () => {}));
        return res.status(400).json({
          error: `Total submission size exceeds 50 MB limit. (Selected: ${(totalSize / (1024 * 1024)).toFixed(2)} MB)`
        });
      }

      // Check if existing submission exists
      const existing = await get(
        'SELECT id FROM submissions WHERE event_id = ? AND roll_number = ?',
        [eventId, req.user.rollNumber]
      );

      let submissionId = existing ? existing.id : crypto.randomUUID();

      if (existing) {
        // Delete previous files from disk
        const oldFiles = await all('SELECT stored_filename FROM submission_files WHERE submission_id = ?', [existing.id]);
        oldFiles.forEach(f => {
          const oldPath = path.join(paths.submissionsDir, f.stored_filename);
          if (fs.existsSync(oldPath)) fs.unlink(oldPath, () => {});
        });

        // Delete old rows
        await run('DELETE FROM submission_files WHERE submission_id = ?', [existing.id]);
        await run('UPDATE submissions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [existing.id]);
      } else {
        await run(
          'INSERT INTO submissions (id, event_id, roll_number, user_email, user_name) VALUES (?, ?, ?, ?, ?)',
          [submissionId, eventId, req.user.rollNumber, req.user.email, req.user.name]
        );
      }

      // Insert new files
      for (const file of req.files) {
        await run(
          'INSERT INTO submission_files (id, submission_id, original_name, stored_filename, file_size, mime_type) VALUES (?, ?, ?, ?, ?, ?)',
          [crypto.randomUUID(), submissionId, file.originalname, file.filename, file.size, file.mimetype || 'application/octet-stream']
        );
      }

      res.status(200).json({
        success: true,
        message: 'Submission uploaded successfully!',
        submissionId,
        filesCount: req.files.length,
        totalSize
      });
    } catch (dbErr) {
      console.error('Submission storage error:', dbErr);
      if (req.files) req.files.forEach(f => fs.unlink(f.path, () => {}));
      res.status(500).json({ error: 'Failed to record submission in database.' });
    }
  });
});

// -------------------------------------------------------------
// ADMIN PORTAL ROUTES
// -------------------------------------------------------------

// Admin: Create Event
app.post('/admin/events', verifyToken, verifyAdmin, (req, res) => {
  uploadSlides.single('slide')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    try {
      const { name, description, eventDate, submissionStart, submissionEnd } = req.body;

      if (!name || !description || !eventDate || !submissionStart || !submissionEnd) {
        if (req.file) fs.unlink(req.file.path, () => {});
        return res.status(400).json({ error: 'All fields (Name, Description, Event Date, Submission Start, Submission End) are required.' });
      }

      const id = crypto.randomUUID();
      const slideFilename = req.file ? req.file.filename : null;
      const slideOriginalName = req.file ? req.file.originalname : null;

      await run(
        `INSERT INTO events (id, name, description, event_date, slides_filename, slides_original_name, submission_start, submission_end)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, name, description, eventDate, slideFilename, slideOriginalName, submissionStart, submissionEnd]
      );

      res.status(201).json({
        success: true,
        message: 'Event created successfully!',
        id
      });
    } catch (createErr) {
      console.error('Event creation failed:', createErr);
      if (req.file) fs.unlink(req.file.path, () => {});
      res.status(500).json({ error: 'Failed to create event in database.' });
    }
  });
});

// Admin: Edit Event
app.put('/admin/events/:id', verifyToken, verifyAdmin, (req, res) => {
  uploadSlides.single('slide')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    try {
      const eventId = req.params.id;
      const existing = await get('SELECT * FROM events WHERE id = ?', [eventId]);
      if (!existing) {
        if (req.file) fs.unlink(req.file.path, () => {});
        return res.status(404).json({ error: 'Event not found.' });
      }

      const { name, description, eventDate, submissionStart, submissionEnd } = req.body;
      let slideFilename = existing.slides_filename;
      let slideOriginalName = existing.slides_original_name;

      if (req.file) {
        // Delete old slide if replaced
        if (existing.slides_filename) {
          const oldPath = path.join(paths.slidesDir, existing.slides_filename);
          if (fs.existsSync(oldPath)) fs.unlink(oldPath, () => {});
        }
        slideFilename = req.file.filename;
        slideOriginalName = req.file.originalname;
      }

      await run(
        `UPDATE events 
         SET name = ?, description = ?, event_date = ?, slides_filename = ?, slides_original_name = ?, submission_start = ?, submission_end = ?
         WHERE id = ?`,
        [
          name || existing.name,
          description || existing.description,
          eventDate || existing.event_date,
          slideFilename,
          slideOriginalName,
          submissionStart || existing.submission_start,
          submissionEnd || existing.submission_end,
          eventId
        ]
      );

      res.json({ success: true, message: 'Event updated successfully.' });
    } catch (updateErr) {
      console.error('Event update failed:', updateErr);
      if (req.file) fs.unlink(req.file.path, () => {});
      res.status(500).json({ error: 'Failed to update event.' });
    }
  });
});

// Admin: Delete Event
app.delete('/admin/events/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const eventId = req.params.id;
    const event = await get('SELECT slides_filename FROM events WHERE id = ?', [eventId]);
    if (!event) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    // Delete slide file
    if (event.slides_filename) {
      const slidePath = path.join(paths.slidesDir, event.slides_filename);
      if (fs.existsSync(slidePath)) fs.unlink(slidePath, () => {});
    }

    // Delete submission files for this event
    const subFiles = await all(
      `SELECT sf.stored_filename FROM submission_files sf
       JOIN submissions s ON sf.submission_id = s.id
       WHERE s.event_id = ?`,
      [eventId]
    );
    subFiles.forEach(f => {
      const p = path.join(paths.submissionsDir, f.stored_filename);
      if (fs.existsSync(p)) fs.unlink(p, () => {});
    });

    await run('DELETE FROM events WHERE id = ?', [eventId]);
    res.json({ success: true, message: 'Event deleted successfully.' });
  } catch (err) {
    console.error('Failed to delete event:', err);
    res.status(500).json({ error: 'Failed to delete event.' });
  }
});

// Admin: Get all submissions for an event
app.get('/admin/events/:id/submissions', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const eventId = req.params.id;
    const submissions = await all(
      `SELECT id, roll_number, user_email, user_name, submitted_at, updated_at
       FROM submissions
       WHERE event_id = ?
       ORDER BY roll_number ASC`,
      [eventId]
    );

    const result = [];
    for (const sub of submissions) {
      const files = await all(
        'SELECT id, original_name, file_size, mime_type FROM submission_files WHERE submission_id = ?',
        [sub.id]
      );
      result.push({
        id: sub.id,
        rollNumber: sub.roll_number,
        email: sub.user_email,
        name: sub.user_name,
        submittedAt: sub.submitted_at,
        updatedAt: sub.updated_at,
        files: files.map(f => ({
          id: f.id,
          originalName: f.original_name,
          fileSize: f.file_size,
          mimeType: f.mime_type
        }))
      });
    }

    res.json(result);
  } catch (err) {
    console.error('Failed to fetch admin submissions:', err);
    res.status(500).json({ error: 'Failed to fetch submissions.' });
  }
});

// View individual submission file in place (Images, PDF, etc.)
app.get('/submissions/files/:fileId/view', verifyToken, async (req, res) => {
  try {
    const file = await get(
      `SELECT sf.id, sf.original_name, sf.stored_filename, sf.mime_type, s.roll_number
       FROM submission_files sf
       JOIN submissions s ON sf.submission_id = s.id
       WHERE sf.id = ?`,
      [req.params.fileId]
    );

    if (!file) {
      return res.status(404).json({ error: 'File record not found.' });
    }

    if (!req.user.isAdmin && file.roll_number !== req.user.rollNumber) {
      return res.status(403).json({ error: 'Access denied: You can only view your own submission files.' });
    }

    const filePath = path.join(paths.submissionsDir, file.stored_filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File missing from storage disk.' });
    }

    if (file.mime_type) {
      res.setHeader('Content-Type', file.mime_type);
    }
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.original_name)}"`);
    res.sendFile(filePath);
  } catch (err) {
    console.error('Failed to view submission file:', err);
    res.status(500).json({ error: 'Failed to retrieve file.' });
  }
});

// Download individual submission file (Participant or Admin)
app.get('/submissions/files/:fileId/download', verifyToken, async (req, res) => {
  try {
    const file = await get(
      `SELECT sf.id, sf.original_name, sf.stored_filename, s.roll_number
       FROM submission_files sf
       JOIN submissions s ON sf.submission_id = s.id
       WHERE sf.id = ?`,
      [req.params.fileId]
    );

    if (!file) {
      return res.status(404).json({ error: 'File record not found.' });
    }

    if (!req.user.isAdmin && file.roll_number !== req.user.rollNumber) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const filePath = path.join(paths.submissionsDir, file.stored_filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File missing from storage disk.' });
    }

    res.download(filePath, file.original_name);
  } catch (err) {
    console.error('Failed to download submission file:', err);
    res.status(500).json({ error: 'Failed to download file.' });
  }
});

// Admin: Download individual submission file (Legacy alias)
app.get('/admin/submissions/files/:fileId', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const file = await get(
      'SELECT original_name, stored_filename FROM submission_files WHERE id = ?',
      [req.params.fileId]
    );

    if (!file) {
      return res.status(404).json({ error: 'File record not found.' });
    }

    const filePath = path.join(paths.submissionsDir, file.stored_filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File missing from storage disk.' });
    }

    res.download(filePath, file.original_name);
  } catch (err) {
    console.error('Failed to download submission file:', err);
    res.status(500).json({ error: 'Failed to download file.' });
  }
});

// Admin: Download all submissions for an event as a ZIP archive
app.get('/admin/events/:id/download-all', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const event = await get('SELECT name FROM events WHERE id = ?', [req.params.id]);
    if (!event) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    const submissions = await all(
      `SELECT s.roll_number, sf.original_name, sf.stored_filename
       FROM submissions s
       JOIN submission_files sf ON s.id = sf.submission_id
       WHERE s.event_id = ?`,
      [req.params.id]
    );

    const safeEventName = event.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    res.attachment(`${safeEventName}_all_submissions.zip`);

    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.on('error', (err) => {
      console.error('Archive error:', err);
      res.status(500).end();
    });

    archive.pipe(res);

    submissions.forEach(sub => {
      const filePath = path.join(paths.submissionsDir, sub.stored_filename);
      if (fs.existsSync(filePath)) {
        // Folder by roll number: e.g. "B25339/my_photo.jpg"
        archive.file(filePath, { name: `${sub.roll_number}/${sub.original_name}` });
      }
    });

    archive.finalize();
  } catch (err) {
    console.error('Failed to create ZIP archive:', err);
    res.status(500).json({ error: 'Failed to generate archive.' });
  }
});

app.listen(port, () => {
  console.log(`PMC Backend listening on port ${port}`);
});
