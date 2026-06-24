const { body, validationResult } = require('express-validator');

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ message: 'Data tidak valid', errors: errors.array() });
  }
  next();
}

const loginValidator = [
  body('email').isEmail().withMessage('Email tidak valid'),
  body('password').notEmpty().withMessage('Password wajib diisi'),
  handleValidation,
];

const registerValidator = [
  body('name').trim().notEmpty().withMessage('Nama wajib diisi'),
  body('email').isEmail().withMessage('Email tidak valid'),
  body('password').isLength({ min: 6 }).withMessage('Password minimal 6 karakter'),
  body('role').isIn(['admin', 'pasien']).withMessage('Role tidak valid'),
  handleValidation,
];

const forgotPasswordValidator = [
  body('email').isEmail().withMessage('Email tidak valid'),
  handleValidation,
];

const resetPasswordValidator = [
  body('email').isEmail().withMessage('Email tidak valid'),
  body('token').notEmpty().withMessage('Token wajib diisi'),
  body('newPassword').isLength({ min: 6 }).withMessage('Password minimal 6 karakter'),
  handleValidation,
];

const changePasswordValidator = [
  body('currentPassword').notEmpty().withMessage('Password saat ini wajib diisi'),
  body('newPassword').isLength({ min: 6 }).withMessage('Password baru minimal 6 karakter'),
  handleValidation,
];

const addPatientValidator = [
  body('name').trim().notEmpty().withMessage('Nama pasien wajib diisi'),
  body('email').isEmail().withMessage('Email tidak valid'),
  body('gender').optional().isIn(['L', 'P']).withMessage('Jenis kelamin tidak valid'),
  handleValidation,
];

const addMedicationValidator = [
  body('patientId').isUUID().withMessage('Pasien tidak valid'),
  body('name').trim().notEmpty().withMessage('Nama obat wajib diisi'),
  body('frequencyPerDay').isInt({ min: 1, max: 12 }).withMessage('Frekuensi per hari harus 1-12'),
  body('startDate').isISO8601().withMessage('Tanggal mulai tidak valid'),
  body('durationDays').isInt({ min: 1, max: 365 }).withMessage('Durasi pengobatan harus 1-365 hari'),
  handleValidation,
];

const createUserValidator = [
  body('name').trim().notEmpty().withMessage('Nama wajib diisi'),
  body('email').isEmail().withMessage('Email tidak valid'),
  body('password').isLength({ min: 6 }).withMessage('Password minimal 6 karakter'),
  body('role').isIn(['admin', 'pasien']).withMessage('Role tidak valid'),
  handleValidation,
];

const educationValidator = [
  body('title').trim().notEmpty().withMessage('Judul wajib diisi'),
  body('content').trim().notEmpty().withMessage('Isi konten wajib diisi'),
  handleValidation,
];

const sendMessageValidator = [
  body('text').optional().trim(),
  body('attachmentUrl').optional().isURL().withMessage('URL lampiran tidak valid'),
  handleValidation,
];

const diseaseValidator = [
  body('name').trim().notEmpty().withMessage('Nama penyakit wajib diisi'),
  handleValidation,
];

const applyTbcRegimenValidator = [
  body('patientId').isUUID().withMessage('Pasien tidak valid'),
  body('regimenCode').notEmpty().withMessage('Regimen wajib dipilih'),
  body('weightKg').isFloat({ min: 1, max: 200 }).withMessage('Berat badan tidak valid'),
  body('startDate').isISO8601().withMessage('Tanggal mulai tidak valid'),
  handleValidation,
];

const weightLogValidator = [
  body('weightKg').isFloat({ min: 1, max: 300 }).withMessage('Berat badan tidak valid'),
  body('recordedAt').isISO8601().withMessage('Tanggal tidak valid'),
  handleValidation,
];

module.exports = {
  handleValidation,
  loginValidator,
  registerValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  changePasswordValidator,
  addPatientValidator,
  addMedicationValidator,
  createUserValidator,
  educationValidator,
  sendMessageValidator,
  diseaseValidator,
  applyTbcRegimenValidator,
  weightLogValidator,
};
