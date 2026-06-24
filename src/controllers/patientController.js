const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { User, PatientProfile, Medication, MedicationLog, Disease } = require('../models');

// Admin menambahkan pasien baru
exports.addPatient = async (req, res) => {
  try {
    const { name, email, password, phone, birthDate, gender, address, bloodType,
      allergies, diagnosis, diseaseId, weightKg, heightCm,
      emergencyContactName, emergencyContactPhone } = req.body;

    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(409).json({ message: 'Email sudah terdaftar' });

    const usingDefault = !password;
    const hashed = await bcrypt.hash(password || 'pasien123', 10);
    const user = await User.create({ name, email, password: hashed, role: 'pasien', phone, mustChangePassword: usingDefault });

    const profile = await PatientProfile.create({
      userId: user.id,
      adminId: req.user.id,
      birthDate, gender, address, bloodType, allergies, diagnosis,
      diseaseId, weightKg, heightCm, emergencyContactName, emergencyContactPhone,
    });

    const { password: _, ...safeUser } = user.toJSON();
    res.status(201).json({ patient: safeUser, profile });
  } catch (err) {
    res.status(500).json({ message: 'Gagal menambah pasien', error: err.message });
  }
};

// Admin melihat daftar semua pasien
exports.getMyPatients = async (req, res) => {
  const { search } = req.query;
  const userWhere = search
    ? { [Op.or]: [{ name: { [Op.iLike]: `%${search}%` } }, { email: { [Op.iLike]: `%${search}%` } }] }
    : undefined;

  const profiles = await PatientProfile.findAll({
    where: { adminId: req.user.id },
    include: [
      { model: User, as: 'user', attributes: { exclude: ['password'] }, where: userWhere },
      { association: 'disease' },
    ],
    order: [['createdAt', 'DESC']],
  });
  res.json({ patients: profiles });
};

exports.getPatientDetail = async (req, res) => {
  const profile = await PatientProfile.findOne({
    where: { userId: req.params.patientId },
    include: [
      { model: User, as: 'user', attributes: { exclude: ['password'] } },
      { association: 'disease' },
    ],
  });
  if (!profile) return res.status(404).json({ message: 'Pasien tidak ditemukan' });

  const medications = await Medication.findAll({
    where: { patientId: req.params.patientId },
    include: [{ association: 'schedules' }, { association: 'drug' }],
    order: [['createdAt', 'DESC']],
  });
  res.json({ profile, medications });
};

exports.updatePatientProfile = async (req, res) => {
  try {
    const profile = await PatientProfile.findOne({ where: { userId: req.params.patientId } });
    if (!profile) return res.status(404).json({ message: 'Pasien tidak ditemukan' });
    Object.assign(profile, req.body);
    await profile.save();
    res.json({ profile });
  } catch (err) {
    res.status(500).json({ message: 'Gagal memperbarui data pasien', error: err.message });
  }
};

// Monitoring kepatuhan minum obat
exports.getPatientAdherence = async (req, res) => {
  const { patientId } = req.params;
  const { from, to } = req.query;
  const where = { patientId };
  if (from && to) where.scheduledDate = { [Op.between]: [from, to] };

  const logs = await MedicationLog.findAll({
    where,
    include: [{ association: 'medication', attributes: ['name', 'dosage'] }],
    order: [['scheduledDate', 'DESC'], ['scheduledTime', 'ASC']],
  });

  const total = logs.length;
  const diminum = logs.filter((l) => l.status === 'diminum').length;
  const terlewat = logs.filter((l) => l.status === 'terlewat').length;
  const menunggu = logs.filter((l) => l.status === 'menunggu').length;
  const adherenceRate = total > 0 ? Math.round((diminum / total) * 100) : 0;

  res.json({ logs, summary: { total, diminum, terlewat, menunggu, adherenceRate } });
};
