import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import db from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || 'admin123';
const EVENT_DURATION_SECONDS = 30 * 60; // 30 minutes

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploaded files
const uploadsDir = path.join(__dirname, '..', 'uploads');
app.use('/uploads', express.static(uploadsDir));

// Serve Vite production build static assets if dist exists
const distDir = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, 'ai-img-' + uniqueSuffix + ext);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExts = ['.jpg', '.jpeg', '.png', '.webp'];

  if (allowedTypes.includes(file.mimetype) || allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file format. Only JPG, JPEG, PNG, and WEBP files are allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
});

function generateParticipantId() {
  return 'PID-' + Math.floor(10000 + Math.random() * 90000);
}

// -------------------------------------------------------------
// STEP 1 & 2: PARTICIPANT REGISTRATION & DELAYED TIMER START
// -------------------------------------------------------------

app.post('/api/participant/register-start', (req, res) => {
  const {
    fullName,
    collegeName,
    department,
    yearOfStudy,
    email,
    mobileNumber,
    participantId: customPid,
  } = req.body;

  const errors = [];
  if (!fullName || !fullName.trim()) errors.push('Full Name is required.');
  if (!collegeName || !collegeName.trim()) errors.push('College Name is required.');
  if (!department) errors.push('Department is required.');
  if (!yearOfStudy) errors.push('Year of Study is required.');

  const mobileRegex = /^[6-9]\d{9}$/;
  if (!mobileNumber || !mobileRegex.test(mobileNumber.trim())) {
    errors.push('Enter a valid 10-digit Indian mobile number.');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email.trim())) {
    errors.push('Enter a valid email address.');
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join(' ') });
  }

  const finalParticipantId = customPid && customPid.trim() ? customPid.trim() : generateParticipantId();
  const startTime = Date.now();
  const createdAt = Date.now();

  db.get('SELECT * FROM participants WHERE participant_id = ?', [finalParticipantId], (err, existing) => {
    if (err) {
      return res.status(500).json({ error: 'Database error.' });
    }

    if (existing) {
      const elapsed = Math.floor((Date.now() - existing.start_time) / 1000);
      const remainingSeconds = Math.max(0, EVENT_DURATION_SECONDS - elapsed);

      db.get('SELECT * FROM submissions WHERE participant_id = ?', [finalParticipantId], (subErr, subRow) => {
        return res.json({
          participantId: existing.participant_id,
          fullName: existing.full_name,
          startTime: existing.start_time,
          remainingSeconds,
          isExpired: remainingSeconds <= 0,
          isSubmitted: Boolean(subRow),
          submissionDetails: subRow || null,
        });
      });
    } else {
      const sql = `
        INSERT INTO participants (
          participant_id, full_name, college_name, department, year_of_study,
          email, mobile_number, start_time, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const params = [
        finalParticipantId,
        fullName.trim(),
        collegeName.trim(),
        department,
        yearOfStudy,
        email.trim(),
        mobileNumber.trim(),
        startTime,
        createdAt,
      ];

      db.run(sql, params, function (insertErr) {
        if (insertErr) {
          console.error('Registration insert error:', insertErr);
          return res.status(500).json({ error: 'Failed to record participant details.' });
        }

        return res.json({
          success: true,
          participantId: finalParticipantId,
          startTime,
          remainingSeconds: EVENT_DURATION_SECONDS,
          isExpired: false,
          isSubmitted: false,
        });
      });
    }
  });
});

app.get('/api/participant/session/:participantId', (req, res) => {
  const { participantId } = req.params;

  db.get('SELECT * FROM participants WHERE participant_id = ?', [participantId], (err, participant) => {
    if (err || !participant) {
      return res.status(404).json({ error: 'Participant record not found.' });
    }

    const elapsed = Math.floor((Date.now() - participant.start_time) / 1000);
    const remainingSeconds = Math.max(0, EVENT_DURATION_SECONDS - elapsed);

    db.get('SELECT * FROM submissions WHERE participant_id = ?', [participantId], (subErr, subRow) => {
      return res.json({
        participant,
        remainingSeconds,
        isExpired: remainingSeconds <= 0,
        isSubmitted: Boolean(subRow),
        submissionDetails: subRow || null,
      });
    });
  });
});

// -------------------------------------------------------------
// STEP 3: IMAGE SUBMISSION ENDPOINT (WITH AI TOOL USED)
// -------------------------------------------------------------

app.post('/api/submissions', upload.single('image'), (req, res) => {
  const file = req.file;

  const cleanupFile = () => {
    if (file && fs.existsSync(file.path)) {
      try {
        fs.unlinkSync(file.path);
      } catch (e) {
        console.error('Failed to cleanup temp file:', e);
      }
    }
  };

  const { participantId, aiTool, prompt, concept } = req.body;

  if (!participantId) {
    cleanupFile();
    return res.status(400).json({ error: 'Participant ID is required.' });
  }

  db.get('SELECT * FROM participants WHERE participant_id = ?', [participantId], (err, participant) => {
    if (err || !participant) {
      cleanupFile();
      return res.status(400).json({ error: 'Participant registration not found. Please complete Step 1 first.' });
    }

    db.get('SELECT * FROM submissions WHERE participant_id = ?', [participantId], (subLookupErr, existingSub) => {
      if (existingSub) {
        cleanupFile();
        return res.status(400).json({ error: 'An image has already been submitted for this Participant ID.' });
      }

      const elapsed = Math.floor((Date.now() - participant.start_time) / 1000);
      if (elapsed > EVENT_DURATION_SECONDS + 10) {
        cleanupFile();
        return res.status(403).json({
          error: "TIME'S UP! Your 30-minute submission window has expired.",
        });
      }

      if (!file) {
        cleanupFile();
        return res.status(400).json({ error: 'AI-generated image file is required.' });
      }
      if (!prompt || !prompt.trim()) {
        cleanupFile();
        return res.status(400).json({ error: 'AI Prompt is required.' });
      }
      if (!concept || !concept.trim()) {
        cleanupFile();
        return res.status(400).json({ error: 'Image meaning/concept explanation is required.' });
      }

      const imageUrl = `/uploads/${file.filename}`;
      const uploadedAt = Date.now();
      const finalAiTool = aiTool && aiTool.trim() ? aiTool.trim() : 'Other AI Tool';

      const insertSubSql = `
        INSERT INTO submissions (
          participant_id, image_url, image_original_name, ai_tool, prompt, concept, uploaded_at, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'Submitted')
      `;

      const params = [
        participantId,
        imageUrl,
        file.originalname,
        finalAiTool,
        prompt.trim(),
        concept.trim(),
        uploadedAt,
      ];

      db.run(insertSubSql, params, function (subInsertErr) {
        if (subInsertErr) {
          cleanupFile();
          console.error('Error saving image submission:', subInsertErr);
          return res.status(500).json({ error: 'Failed to save image submission.' });
        }

        return res.json({
          success: true,
          submissionId: this.lastID,
          participantId,
          message: 'Image Submitted Successfully!',
          uploadedAt,
        });
      });
    });
  });
});

// -------------------------------------------------------------
// ADMIN ENDPOINTS
// -------------------------------------------------------------

function checkAdminAuth(req, res, next) {
  const token = req.headers['authorization'] || req.query.token;
  if (token === 'Bearer admin-authenticated' || token === 'admin-authenticated') {
    return next();
  }
  return res.status(401).json({ error: 'Unauthorized access.' });
}

app.post('/api/admin/login', (req, res) => {
  const { passcode } = req.body;
  if (passcode === ADMIN_PASSCODE) {
    return res.json({
      success: true,
      token: 'admin-authenticated',
    });
  }
  return res.status(401).json({ error: 'Invalid admin passcode.' });
});

// Admin Section 1: Fetch Participant Details Collection WITH Submission Timer Info
app.get('/api/admin/participants', checkAdminAuth, (req, res) => {
  const { search, department, year } = req.query;

  let query = `
    SELECT p.*, s.submission_id, s.uploaded_at, s.status as submission_status
    FROM participants p
    LEFT JOIN submissions s ON p.participant_id = s.participant_id
    WHERE 1=1
  `;
  const params = [];

  if (department && department !== 'ALL') {
    query += ' AND p.department = ?';
    params.push(department);
  }

  if (year && year !== 'ALL') {
    query += ' AND p.year_of_study = ?';
    params.push(year);
  }

  if (search && search.trim()) {
    const term = `%${search.trim()}%`;
    query += ' AND (p.participant_id LIKE ? OR p.full_name LIKE ? OR p.college_name LIKE ? OR p.email LIKE ? OR p.mobile_number LIKE ?)';
    params.push(term, term, term, term, term);
  }

  query += ' ORDER BY p.created_at DESC';

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch participant details.' });
    }
    return res.json({ participants: rows || [] });
  });
});

// Admin Section 2: Image Submissions Collection ONLY
app.get('/api/admin/submissions', checkAdminAuth, (req, res) => {
  const { search, status } = req.query;

  let query = `
    SELECT s.*, p.full_name as participant_name, p.start_time as participant_start_time
    FROM submissions s
    LEFT JOIN participants p ON s.participant_id = p.participant_id
    WHERE 1=1
  `;
  const params = [];

  if (status && status !== 'ALL') {
    query += ' AND s.status = ?';
    params.push(status);
  }

  if (search && search.trim()) {
    const term = `%${search.trim()}%`;
    query += ' AND (s.participant_id LIKE ? OR s.ai_tool LIKE ? OR s.prompt LIKE ? OR s.concept LIKE ? OR p.full_name LIKE ?)';
    params.push(term, term, term, term, term);
  }

  query += ' ORDER BY s.uploaded_at DESC';

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch image submissions.' });
    }
    return res.json({ submissions: rows || [] });
  });
});

app.delete('/api/admin/submissions/:id', checkAdminAuth, (req, res) => {
  const { id } = req.params;

  db.get('SELECT image_url FROM submissions WHERE submission_id = ?', [id], (err, row) => {
    if (err || !row) {
      return res.status(404).json({ error: 'Submission record not found.' });
    }

    if (row.image_url) {
      const filename = path.basename(row.image_url);
      const filePath = path.join(uploadsDir, filename);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          console.error('Failed deleting upload file:', e);
        }
      }
    }

    db.run('DELETE FROM submissions WHERE submission_id = ?', [id], function (delErr) {
      if (delErr) {
        return res.status(500).json({ error: 'Failed to delete submission record.' });
      }
      return res.json({ success: true, message: 'Submission deleted successfully.' });
    });
  });
});

app.delete('/api/admin/participants/:id', checkAdminAuth, (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM participants WHERE participant_id = ?', [id], function (err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete participant.' });
    }
    return res.json({ success: true, message: 'Participant record deleted.' });
  });
});

app.get('/api/admin/export-csv', checkAdminAuth, (req, res) => {
  const type = req.query.type || 'all';

  const escapeCsv = (str) => {
    if (!str) return '""';
    const cleanStr = String(str).replace(/"/g, '""');
    return `"${cleanStr}"`;
  };

  if (type === 'participants') {
    db.all('SELECT * FROM participants ORDER BY created_at DESC', [], (err, rows) => {
      if (err) return res.status(500).send('Error');
      const headers = ['Participant ID', 'Full Name', 'College Name', 'Department', 'Year of Study', 'Email', 'Mobile Number', 'Start Time'];
      let csv = headers.join(',') + '\n';
      rows.forEach((r) => {
        const timeStr = new Date(r.start_time).toLocaleString('en-IN');
        csv += [escapeCsv(r.participant_id), escapeCsv(r.full_name), escapeCsv(r.college_name), escapeCsv(r.department), escapeCsv(r.year_of_study), escapeCsv(r.email), escapeCsv(r.mobile_number), escapeCsv(timeStr)].join(',') + '\n';
      });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="participant_details.csv"');
      return res.send(csv);
    });
  } else {
    const sql = `
      SELECT p.participant_id, p.full_name, p.college_name, p.department, p.year_of_study, p.email, p.mobile_number, p.start_time,
             s.submission_id, s.image_url, s.ai_tool, s.prompt, s.concept, s.uploaded_at, s.status
      FROM participants p
      LEFT JOIN submissions s ON p.participant_id = s.participant_id
      ORDER BY p.created_at DESC
    `;
    db.all(sql, [], (err, rows) => {
      if (err) return res.status(500).send('Error');
      const headers = ['Participant ID', 'Full Name', 'College', 'Department', 'Year', 'Email', 'Phone', 'Start Time', 'Submission ID', 'AI Tool Used', 'Image Filename', 'AI Prompt', 'Concept', 'Uploaded At', 'Status'];
      let csv = headers.join(',') + '\n';
      rows.forEach((r) => {
        const startStr = new Date(r.start_time).toLocaleString('en-IN');
        const uploadStr = r.uploaded_at ? new Date(r.uploaded_at).toLocaleString('en-IN') : 'N/A';
        csv += [
          escapeCsv(r.participant_id),
          escapeCsv(r.full_name),
          escapeCsv(r.college_name),
          escapeCsv(r.department),
          escapeCsv(r.year_of_study),
          escapeCsv(r.email),
          escapeCsv(r.mobile_number),
          escapeCsv(startStr),
          escapeCsv(r.submission_id || 'N/A'),
          escapeCsv(r.ai_tool || 'N/A'),
          escapeCsv(r.image_url || 'N/A'),
          escapeCsv(r.prompt || 'N/A'),
          escapeCsv(r.concept || 'N/A'),
          escapeCsv(uploadStr),
          escapeCsv(r.status || 'Pending'),
        ].join(',') + '\n';
      });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="promptify_event_records.csv"');
      return res.send(csv);
    });
  }
});

app.get('*', (req, res) => {
  const distIndexPath = path.join(__dirname, '..', 'dist', 'index.html');
  if (fs.existsSync(distIndexPath)) {
    res.sendFile(distIndexPath);
  } else {
    res.send('Promptify Backend Server running.');
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Promptify Backend Server running on http://localhost:${PORT}`);
});
