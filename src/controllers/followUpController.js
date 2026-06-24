const dayjs = require('dayjs');
const { Op } = require('sequelize');
const { FollowUpVisit, User, MedicationLog } = require('../models');
const { sendPushNotifications } = require('../utils/notificationService');

// Admin membuat jadwal kontrol manual
exports.createVisit = async (req, res) => {
  try {
    const { patientId, scheduledDate, medicationId, phase, adminNotes } = req.body;
    if (!patientId || !scheduledDate) return res.status(400).json({ message: 'Pasien dan tanggal wajib diisi' });
    const visit = await FollowUpVisit.create({
      patientId, adminId: req.user.id, scheduledDate,
      medicationId: medicationId || null, phase: phase || null, adminNotes: adminNotes || null,
    });

    // Kirim notifikasi langsung ke pasien saat jadwal baru dibuat
    const patient = await User.findByPk(patientId, { attributes: ['name', 'expoPushToken'] });
    if (patient?.expoPushToken) {
      const dayjs = require('dayjs');
      await sendPushNotifications([{
        to: patient.expoPushToken,
        title: '🩺 Jadwal Kontrol Baru',
        body: `Anda memiliki jadwal kontrol pada ${dayjs(scheduledDate).format('DD MMMM YYYY')}. Jangan lupa hadir!`,
        data: { visitId: visit.id, type: 'followup_scheduled' },
      }]);
    }

    res.status(201).json({ visit });
  } catch (err) {
    res.status(500).json({ message: 'Gagal membuat jadwal kontrol', error: err.message });
  }
};

// Worklist semua jadwal kontrol (admin)
exports.getMyWorklist = async (req, res) => {
  const { status } = req.query;
  const where = { adminId: req.user.id };
  if (status) where.status = status;
  const visits = await FollowUpVisit.findAll({
    where,
    include: [{ model: User, as: 'patient', attributes: ['id', 'name', 'phone', 'expoPushToken'] }],
    order: [['scheduledDate', 'ASC']],
  });
  res.json({ visits });
};

exports.getPatientVisits = async (req, res) => {
  const visits = await FollowUpVisit.findAll({
    where: { patientId: req.params.patientId },
    order: [['scheduledDate', 'ASC']],
  });
  res.json({ visits });
};

// Isi hasil kontrol
exports.completeVisit = async (req, res) => {
  try {
    const visit = await FollowUpVisit.findByPk(req.params.visitId);
    if (!visit) return res.status(404).json({ message: 'Jadwal tidak ditemukan' });

    const { weightKg, symptomsImproving, sideEffects, adminNotes } = req.body;

    const recentLogs = await MedicationLog.findAll({
      where: { patientId: visit.patientId, scheduledDate: { [Op.lte]: dayjs().format('YYYY-MM-DD') } },
      limit: 30,
      order: [['scheduledDate', 'DESC']],
    });
    const relevant = recentLogs.filter((l) => l.status !== 'menunggu');
    const adherenceRate = relevant.length > 0 ? relevant.filter((l) => l.status === 'diminum').length / relevant.length : null;

    Object.assign(visit, {
      weightKg: weightKg ?? visit.weightKg,
      symptomsImproving: symptomsImproving ?? visit.symptomsImproving,
      sideEffects: sideEffects ?? visit.sideEffects,
      adminNotes: adminNotes ?? visit.adminNotes,
      adherenceGood: adherenceRate !== null ? adherenceRate >= 0.8 : visit.adherenceGood,
      status: 'selesai',
      examinedAt: new Date(),
    });
    await visit.save();
    res.json({ visit, calculatedAdherenceRate: adherenceRate });
  } catch (err) {
    res.status(500).json({ message: 'Gagal menyimpan hasil kontrol', error: err.message });
  }
};

exports.rescheduleVisit = async (req, res) => {
  try {
    const visit = await FollowUpVisit.findByPk(req.params.visitId);
    if (!visit) return res.status(404).json({ message: 'Jadwal tidak ditemukan' });
    visit.scheduledDate = req.body.scheduledDate;
    visit.status = 'terjadwal';
    visit.notificationSent = false;
    await visit.save();

    // Kirim notifikasi perubahan jadwal ke pasien
    const patient = await User.findByPk(visit.patientId, { attributes: ['name', 'expoPushToken'] });
    if (patient?.expoPushToken) {
      const dayjs = require('dayjs');
      await sendPushNotifications([{
        to: patient.expoPushToken,
        title: '🔄 Jadwal Kontrol Diperbarui',
        body: `Jadwal kontrol Anda diubah ke ${dayjs(req.body.scheduledDate).format('DD MMMM YYYY')}.`,
        data: { visitId: visit.id, type: 'followup_rescheduled' },
      }]);
    }

    res.json({ visit });
  } catch (err) {
    res.status(500).json({ message: 'Gagal menjadwalkan ulang', error: err.message });
  }
};

// Pasien lihat jadwal kontrol berikutnya
exports.getMyNextVisit = async (req, res) => {
  const visit = await FollowUpVisit.findOne({
    where: { patientId: req.user.id, status: 'terjadwal', scheduledDate: { [Op.gte]: dayjs().format('YYYY-MM-DD') } },
    order: [['scheduledDate', 'ASC']],
  });
  res.json({ visit });
};

// Kirim notifikasi H-1 sebelum jadwal kontrol (dipanggil cron)
exports.sendUpcomingVisitNotifications = async () => {
  const tomorrow = dayjs().add(1, 'day').format('YYYY-MM-DD');
  const visits = await FollowUpVisit.findAll({
    where: { scheduledDate: tomorrow, status: 'terjadwal', notificationSent: false },
    include: [{ model: User, as: 'patient', attributes: ['id', 'name', 'expoPushToken'] }],
  });
  if (!visits.length) return;

  const messages = visits
    .filter((v) => v.patient?.expoPushToken)
    .map((v) => ({
      to: v.patient.expoPushToken,
      title: '🩺 Pengingat Kontrol Besok',
      body: `Hei ${v.patient.name}, Anda ada jadwal kontrol kesehatan besok (${dayjs(v.scheduledDate).format('DD MMMM YYYY')}). Jangan lupa hadir!`,
      data: { visitId: v.id, type: 'followup_reminder' },
    }));

  if (messages.length > 0) await sendPushNotifications(messages);

  // Tandai sudah dikirim
  await FollowUpVisit.update({ notificationSent: true }, { where: { id: visits.map((v) => v.id) } });
};

// Tandai kontrol yang lewat tanggal sebagai terlewat
exports.markOverdueVisits = async () => {
  await FollowUpVisit.update(
    { status: 'terlewat' },
    { where: { status: 'terjadwal', scheduledDate: { [Op.lt]: dayjs().format('YYYY-MM-DD') } } }
  );
};
