const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const userAuth = require('../middlewares/auth');

const uploadRouter = express.Router();

// ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// ⚙️ Configure Multer storage
const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, uploadDir);
  },
  filename: function (_req, file, cb) {
    // give unique name like 1707463232-random.png
    const ext = path.extname(file.originalname);
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + ext);
  },
});

// ✅ only allow image files
const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only image files are allowed'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // max 2MB
});

// -----------------------------------------------------------
// POST /api/v1/upload/avatar  (single image)
// -----------------------------------------------------------
uploadRouter.post('/avatar', userAuth, upload.single('file'), (req, res) => {
  try {
    const imageUrl = `/uploads/${req.file.filename}`;
    return res.status(201).json({
      ok: true,
      message: 'Avatar uploaded successfully',
      url: imageUrl,
    });
  } catch (err) {
    console.error('avatar upload error:', err);
    return res.status(500).json({ ok: false, error: 'Upload failed' });
  }
});

// -----------------------------------------------------------
// POST /api/v1/upload/post  (multiple images)
// -----------------------------------------------------------
uploadRouter.post('/post', userAuth, upload.array('files', 4), (req, res) => {
  try {
    const urls = req.files.map((file) => `/uploads/${file.filename}`);
    return res.status(201).json({
      ok: true,
      message: 'Post images uploaded successfully',
      urls,
    });
  } catch (err) {
    console.error('post upload error:', err);
    return res.status(500).json({ ok: false, error: 'Upload failed' });
  }
});

module.exports = uploadRouter;
