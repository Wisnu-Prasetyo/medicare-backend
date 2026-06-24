const bcrypt = require('bcryptjs');
const dayjs = require('dayjs');
const { Op } = require('sequelize');
const { User, PatientProfile, Medication, MedicationSchedule, MedicationLog, Education, Consultation } = require('../models');

// ---- Kelola Users ----
exports.getAllUsers = async (req, res) => {
  const { role, search, page = 1, limit = 20 } = req.query;
  // Hanya bisa lihat pasien (tidak ada role dokter)
  const where = { role: role || 'pasien' };
  if (search) {
    where[Op.or] = [{ name: { [Op.iLike]: `%${search}%` } }, { email: { [Op.iLike]: `%${search}%` } }];
  }
  const offset = (Number(page) - 1) * Number(limit);
  const { rows, count } = await User.findAndCountAll({
    where, attributes: { exclude: ['password'] }, limit: Number(limit), offset, order: [['createdAt', 'DESC']],
  });
  res.json({ users: rows, pagination: { total: count, page: Number(page), limit: Number(limit), totalPages: Math.ceil(count / limit) } });
};

exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;
    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(409).json({ message: 'Email sudah terdaftar' });
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, role: role || 'pasien', phone });
    if (role === 'pasien') await PatientProfile.create({ userId: user.id, adminId: req.user.id });
    const { password: _, ...safe } = user.toJSON();
    res.status(201).json({ user: safe });
  } catch (err) {
    res.status(500).json({ message: 'Gagal membuat user', error: err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });
    const { name, phone, isActive } = req.body;
    Object.assign(user, { name: name ?? user.name, phone: phone ?? user.phone, isActive: isActive ?? user.isActive });
    await user.save();
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Gagal memperbarui user', error: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });
    await user.destroy();
    res.json({ message: 'User dihapus' });
  } catch (err) {
    res.status(500).json({ message: 'Gagal menghapus user', error: err.message });
  }
};

// ---- Admin lihat semua jadwal ----
exports.getAllSchedules = async (req, res) => {
  const medications = await Medication.findAll({
    include: [
      { model: MedicationSchedule, as: 'schedules' },
      { association: 'patient', attributes: ['id', 'name', 'email'] },
    ],
    order: [['createdAt', 'DESC']],
  });
  res.json({ medications });
};

// ---- Dashboard statistik ----
exports.getDashboardStats = async (req, res) => {
  try {
    const today = dayjs().format('YYYY-MM-DD');
    const [totalPasien, activeMedications, todayLogs, allTimeLogs, totalEducation, openConsultations] =
      await Promise.all([
        User.count({ where: { role: 'pasien' } }),
        Medication.count({ where: { isActive: true } }),
        MedicationLog.findAll({ where: { scheduledDate: today } }),
        MedicationLog.findAll(),
        Education.count(),
        Consultation.count({ where: { status: 'terbuka' } }),
      ]);

    const todayDiminum = todayLogs.filter((l) => l.status === 'diminum').length;
    const todayTerlewat = todayLogs.filter((l) => l.status === 'terlewat').length;
    const todayMenunggu = todayLogs.filter((l) => l.status === 'menunggu').length;
    const allDiminum = allTimeLogs.filter((l) => l.status === 'diminum').length;
    const allTotal = allTimeLogs.filter((l) => l.status !== 'menunggu').length;
    const overallAdherenceRate = allTotal > 0 ? Math.round((allDiminum / allTotal) * 100) : 0;

    res.json({
      users: { totalPasien },
      medications: { activeMedications },
      today: { total: todayLogs.length, diminum: todayDiminum, terlewat: todayTerlewat, menunggu: todayMenunggu },
      overallAdherenceRate, totalEducation, openConsultations,
    });
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil statistik', error: err.message });
  }
};
