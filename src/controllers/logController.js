const dayjs = require('dayjs');
const { Op } = require('sequelize');
const { MedicationLog } = require('../models');

// Pasien melihat jadwal minum obat hari ini (untuk halaman utama app + dasar notifikasi)
exports.getTodaySchedule = async (req, res) => {
  const today = dayjs().format('YYYY-MM-DD');
  const logs = await MedicationLog.findAll({
    where: { patientId: req.user.id, scheduledDate: today },
    include: [{ association: 'medication', attributes: ['name', 'dosage', 'instructions'] }],
    order: [['scheduledTime', 'ASC']],
  });
  res.json({ date: today, logs });
};

// Pasien melihat riwayat (untuk ditampilkan sbg kalender/grafik kepatuhan)
exports.getMyHistory = async (req, res) => {
  const { from, to } = req.query;
  const where = { patientId: req.user.id };
  if (from && to) where.scheduledDate = { [Op.between]: [from, to] };

  const logs = await MedicationLog.findAll({
    where,
    include: [{ association: 'medication', attributes: ['name', 'dosage'] }],
    order: [['scheduledDate', 'DESC'], ['scheduledTime', 'ASC']],
  });
  res.json({ logs });
};

// Tombol "Sudah diminum" di app pasien
exports.confirmTaken = async (req, res) => {
  try {
    const log = await MedicationLog.findByPk(req.params.logId);
    if (!log) return res.status(404).json({ message: 'Jadwal tidak ditemukan' });
    if (log.patientId !== req.user.id) {
      return res.status(403).json({ message: 'Bukan jadwal Anda' });
    }
    log.status = 'diminum';
    log.takenAt = new Date();
    if (req.body.proofPhotoUrl) log.proofPhotoUrl = req.body.proofPhotoUrl;
    await log.save();
    res.json({ message: 'Berhasil dicatat, terima kasih sudah minum obat tepat waktu!', log });
  } catch (err) {
    res.status(500).json({ message: 'Gagal mencatat', error: err.message });
  }
};
