const router = require('express').Router();
const { upload } = require('../config/upload');
const { authenticate } = require('../middleware/auth');

// Endpoint umum upload gambar. Dipakai untuk: foto profil, cover edukasi,
// lampiran chat konsultasi, dan foto bukti minum obat.
// Response berisi URL publik yang bisa langsung disimpan di field terkait (avatarUrl, coverImageUrl, dst).
router.post('/image', authenticate, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Tidak ada file yang diunggah' });

  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.status(201).json({ url: fileUrl, filename: req.file.filename });
});

// Multer error handler khusus route ini (ukuran file, tipe file)
router.use((err, req, res, next) => {
  if (err) return res.status(400).json({ message: err.message });
  next();
});

module.exports = router;
