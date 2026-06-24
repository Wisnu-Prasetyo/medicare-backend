const { WeightLog, PatientProfile } = require('../models');

// Dokter mencatat berat badan terbaru pasien (saat kontrol).
// Otomatis update juga PatientProfile.weightKg supaya kalkulator dosis TBC selalu pakai BB terkini.
exports.addWeightLog = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { weightKg, heightCm, recordedAt, note } = req.body;
    if (!weightKg || !recordedAt) {
      return res.status(400).json({ message: 'Berat badan dan tanggal wajib diisi' });
    }

    const log = await WeightLog.create({
      patientId,
      weightKg,
      heightCm,
      recordedAt,
      note,
      recordedBy: req.user.id,
    });

    await PatientProfile.update({ weightKg, heightCm: heightCm || undefined }, { where: { userId: patientId } });

    res.status(201).json({ log });
  } catch (err) {
    res.status(500).json({ message: 'Gagal mencatat berat badan', error: err.message });
  }
};

exports.getWeightHistory = async (req, res) => {
  const logs = await WeightLog.findAll({
    where: { patientId: req.params.patientId },
    order: [['recordedAt', 'ASC']],
  });
  res.json({ logs });
};
