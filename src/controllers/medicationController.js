const dayjs = require('dayjs');
const { Op } = require('sequelize');
const { Medication, MedicationSchedule, MedicationLog, DrugCatalog } = require('../models');
const { generateScheduleTimes } = require('../utils/scheduleGenerator');

// Admin menambahkan obat untuk pasien (bisa dari katalog atau manual)
exports.addMedication = async (req, res) => {
  try {
    const { patientId, drugCatalogId, name, dosage, frequencyPerDay,
      instructions, startDate, durationDays, customTimes, diseaseId } = req.body;

    if (!patientId || !startDate || !durationDays) {
      return res.status(400).json({ message: 'Data tidak lengkap' });
    }

    // Jika dari katalog, ambil default-nya
    let medName = name;
    let medFreq = frequencyPerDay;
    let medInstructions = instructions;
    let medDosage = dosage;

    if (drugCatalogId) {
      const drug = await DrugCatalog.findByPk(drugCatalogId);
      if (drug) {
        medName = medName || drug.name;
        medFreq = medFreq || drug.defaultFrequencyPerDay || 1;
        medInstructions = medInstructions || drug.defaultDosageInstruction;
        medDosage = medDosage || drug.strength;
      }
    }

    if (!medName || !medFreq) {
      return res.status(400).json({ message: 'Nama obat dan frekuensi wajib diisi' });
    }

    const endDate = dayjs(startDate).add(durationDays - 1, 'day').format('YYYY-MM-DD');
    const medication = await Medication.create({
      patientId, adminId: req.user.id, drugCatalogId: drugCatalogId || null,
      diseaseId: diseaseId || null, name: medName, dosage: medDosage,
      frequencyPerDay: Number(medFreq), instructions: medInstructions,
      startDate, durationDays, endDate,
    });

    const times = customTimes?.length > 0 ? customTimes : generateScheduleTimes(Number(medFreq));
    const schedules = await MedicationSchedule.bulkCreate(
      times.map((t) => ({ medicationId: medication.id, time: t.time, label: t.label }))
    );

    const logsToCreate = [];
    for (let d = 0; d < durationDays; d++) {
      const date = dayjs(startDate).add(d, 'day').format('YYYY-MM-DD');
      schedules.forEach((s) => {
        logsToCreate.push({
          medicationId: medication.id, scheduleId: s.id,
          patientId, scheduledDate: date, scheduledTime: s.time, status: 'menunggu',
        });
      });
    }
    await MedicationLog.bulkCreate(logsToCreate);

    res.status(201).json({ medication, schedules, totalRemindersGenerated: logsToCreate.length });
  } catch (err) {
    res.status(500).json({ message: 'Gagal menambah obat', error: err.message });
  }
};

exports.getMedicationsByPatient = async (req, res) => {
  const medications = await Medication.findAll({
    where: { patientId: req.params.patientId },
    include: [{ association: 'schedules' }, { association: 'drug' }],
    order: [['createdAt', 'DESC']],
  });
  res.json({ medications });
};

exports.updateScheduleTime = async (req, res) => {
  try {
    const schedule = await MedicationSchedule.findByPk(req.params.scheduleId);
    if (!schedule) return res.status(404).json({ message: 'Jadwal tidak ditemukan' });
    const { time, label } = req.body;
    schedule.time = time ?? schedule.time;
    schedule.label = label ?? schedule.label;
    await schedule.save();
    await MedicationLog.update(
      { scheduledTime: schedule.time },
      { where: { scheduleId: schedule.id, status: 'menunggu', scheduledDate: { [Op.gte]: dayjs().format('YYYY-MM-DD') } } }
    );
    res.json({ schedule });
  } catch (err) {
    res.status(500).json({ message: 'Gagal memperbarui jadwal', error: err.message });
  }
};

exports.updateMedication = async (req, res) => {
  try {
    const medication = await Medication.findByPk(req.params.medicationId);
    if (!medication) return res.status(404).json({ message: 'Obat tidak ditemukan' });
    const { name, dosage, instructions, frequencyPerDay, customTimes } = req.body;
    medication.name = name ?? medication.name;
    medication.dosage = dosage ?? medication.dosage;
    medication.instructions = instructions ?? medication.instructions;
    const frequencyChanged = frequencyPerDay && Number(frequencyPerDay) !== medication.frequencyPerDay;
    if (frequencyChanged) medication.frequencyPerDay = Number(frequencyPerDay);
    await medication.save();

    if (frequencyChanged) {
      const oldSchedules = await MedicationSchedule.findAll({ where: { medicationId: medication.id } });
      await MedicationLog.destroy({ where: { scheduleId: oldSchedules.map((s) => s.id), status: 'menunggu', scheduledDate: { [Op.gte]: dayjs().format('YYYY-MM-DD') } } });
      await MedicationSchedule.destroy({ where: { medicationId: medication.id } });
      const times = customTimes?.length > 0 ? customTimes : generateScheduleTimes(medication.frequencyPerDay);
      const newSchedules = await MedicationSchedule.bulkCreate(times.map((t) => ({ medicationId: medication.id, time: t.time, label: t.label })));
      const remainingDays = dayjs(medication.endDate).diff(dayjs(), 'day') + 1;
      const logsToCreate = [];
      for (let d = 0; d < Math.max(remainingDays, 0); d++) {
        const date = dayjs().add(d, 'day').format('YYYY-MM-DD');
        newSchedules.forEach((s) => logsToCreate.push({ medicationId: medication.id, scheduleId: s.id, patientId: medication.patientId, scheduledDate: date, scheduledTime: s.time, status: 'menunggu' }));
      }
      if (logsToCreate.length > 0) await MedicationLog.bulkCreate(logsToCreate);
    }
    const updated = await Medication.findByPk(medication.id, { include: [{ association: 'schedules' }] });
    res.json({ medication: updated });
  } catch (err) {
    res.status(500).json({ message: 'Gagal memperbarui obat', error: err.message });
  }
};

exports.deactivateMedication = async (req, res) => {
  try {
    const medication = await Medication.findByPk(req.params.medicationId);
    if (!medication) return res.status(404).json({ message: 'Obat tidak ditemukan' });
    medication.isActive = false;
    await medication.save();
    res.json({ message: 'Pengobatan dihentikan', medication });
  } catch (err) {
    res.status(500).json({ message: 'Gagal menghentikan pengobatan', error: err.message });
  }
};

exports.deleteMedication = async (req, res) => {
  try {
    const medication = await Medication.findByPk(req.params.medicationId);
    if (!medication) return res.status(404).json({ message: 'Obat tidak ditemukan' });
    await medication.destroy();
    res.json({ message: 'Obat dihapus' });
  } catch (err) {
    res.status(500).json({ message: 'Gagal menghapus obat', error: err.message });
  }
};
