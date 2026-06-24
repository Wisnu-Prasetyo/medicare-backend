const dayjs = require('dayjs');
const { Medication, MedicationSchedule, MedicationLog, FollowUpVisit, PatientProfile } = require('../models');
const { listRegimens, calculateRegimenPlan } = require('../utils/tbcDosing');

// Daftar pilihan regimen TBC standar (Tabel 6.2 & 6.3 Juknis TBC 2023), untuk ditampilkan
// sebagai pilihan di form dokter.
exports.getRegimenOptions = async (req, res) => {
  res.json({ regimens: listRegimens() });
};

// Preview kalkulasi dosis SEBELUM disimpan — dokter bisa lihat dulu hasil hitungan
// sebelum benar-benar menerapkan regimen ke pasien.
exports.previewDose = async (req, res) => {
  try {
    const { regimenCode, weightKg } = req.query;
    if (!regimenCode || !weightKg) {
      return res.status(400).json({ message: 'regimenCode dan weightKg wajib diisi' });
    }
    const plan = calculateRegimenPlan(regimenCode, Number(weightKg));
    res.json({ plan });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Terapkan regimen TBC ke pasien: otomatis membuat Medication untuk tiap obat di
// fase intensif (lanjutan dibuat menyusul setelah fase intensif selesai, supaya dosis
// bisa disesuaikan ulang dengan BB terbaru pasien — sesuai anjuran Juknis), beserta
// jadwal minum obat & jadwal kontrol pemantauan otomatis.
exports.applyRegimen = async (req, res) => {
  try {
    const { patientId, diseaseId, regimenCode, weightKg, startDate } = req.body;
    if (!patientId || !regimenCode || !weightKg || !startDate) {
      return res.status(400).json({ message: 'Data tidak lengkap' });
    }

    const plan = calculateRegimenPlan(regimenCode, Number(weightKg));
    const phaseData = plan.intensif; // mulai dari fase intensif

    // Simpan/update berat badan terkini pasien
    await PatientProfile.update({ weightKg: Number(weightKg) }, { where: { userId: patientId } });

    const createdMedications = [];
    for (const drugDose of phaseData.drugs) {
      const medication = await Medication.create({
        patientId,
        adminId: req.user.id,
        diseaseId: diseaseId || null,
        name: drugDose.drugName,
        dosage: `${drugDose.recommendedMg} mg/hari (${drugDose.weightKg} kg)`,
        drugCode: drugDose.drugCode,
        phase: 'intensif',
        regimenCode,
        frequencyPerDay: 1, // OAT diberikan 1x sehari, sebaiknya pagi sebelum makan
        instructions: 'Diminum 1 jam sebelum makan atau 2 jam sesudah makan, di waktu yang sama tiap hari',
        startDate,
        durationDays: phaseData.durationDays,
        endDate: dayjs(startDate).add(phaseData.durationDays - 1, 'day').format('YYYY-MM-DD'),
      });

      // OAT diminum 1x sehari -> jam tetap pagi (07:00) sesuai anjuran "waktu yang sama tiap hari"
      const schedule = await MedicationSchedule.create({
        medicationId: medication.id,
        time: '07:00',
        label: 'Pagi (sebelum makan)',
      });

      const logsToCreate = [];
      for (let d = 0; d < phaseData.durationDays; d++) {
        logsToCreate.push({
          medicationId: medication.id,
          scheduleId: schedule.id,
          patientId,
          scheduledDate: dayjs(startDate).add(d, 'day').format('YYYY-MM-DD'),
          scheduledTime: '07:00',
          status: 'menunggu',
        });
      }
      await MedicationLog.bulkCreate(logsToCreate);

      createdMedications.push({ medication, schedule, doseInfo: drugDose });
    }

    // ---- Jadwal kontrol otomatis sesuai Juknis: tiap 2 minggu pada fase intensif ----
    const followUpsToCreate = [];
    for (let d = 14; d < phaseData.durationDays; d += 14) {
      followUpsToCreate.push({
        patientId,
        adminId: req.user.id,
        scheduledDate: dayjs(startDate).add(d, 'day').format('YYYY-MM-DD'),
        phase: 'intensif',
        status: 'terjadwal',
      });
    }
    // Kontrol akhir fase intensif (sekaligus evaluasi lanjut ke fase lanjutan)
    // + pengingat periksa dahak/BTA di bulan ke-2 (untuk kasus terkonfirmasi bakteriologis)
    followUpsToCreate.push({
      patientId,
      adminId: req.user.id,
      scheduledDate: dayjs(startDate).add(phaseData.durationDays, 'day').format('YYYY-MM-DD'),
      phase: 'intensif',
      status: 'terjadwal',
      sputumTestReminder: true,
      doctorNotes: 'Evaluasi akhir fase intensif: cek perbaikan klinis, BB, efek samping, dan pertimbangkan periksa dahak/BTA ulang sebelum lanjut ke fase lanjutan.',
    });

    const followUps = await FollowUpVisit.bulkCreate(followUpsToCreate);

    res.status(201).json({
      message: `Regimen ${regimenCode} fase intensif berhasil diterapkan (${phaseData.months} bulan).`,
      medications: createdMedications,
      followUpVisits: followUps,
      lanjutanPreview: plan.lanjutan, // info fase lanjutan untuk referensi dokter nanti
      fdcSuggestion: plan.fdcSuggestion,
    });
  } catch (err) {
    res.status(500).json({ message: 'Gagal menerapkan regimen', error: err.message });
  }
};

// Lanjutkan ke fase lanjutan (dipanggil dokter setelah fase intensif selesai & dievaluasi).
// Berat badan diminta ulang karena dosis harus disesuaikan dengan kenaikan BB.
exports.applyContinuationPhase = async (req, res) => {
  try {
    const { patientId, diseaseId, regimenCode, weightKg, startDate } = req.body;
    if (!patientId || !regimenCode || !weightKg || !startDate) {
      return res.status(400).json({ message: 'Data tidak lengkap' });
    }

    const plan = calculateRegimenPlan(regimenCode, Number(weightKg));
    const phaseData = plan.lanjutan;

    await PatientProfile.update({ weightKg: Number(weightKg) }, { where: { userId: patientId } });

    const createdMedications = [];
    for (const drugDose of phaseData.drugs) {
      const medication = await Medication.create({
        patientId,
        adminId: req.user.id,
        diseaseId: diseaseId || null,
        name: drugDose.drugName,
        dosage: `${drugDose.recommendedMg} mg/hari (${drugDose.weightKg} kg)`,
        drugCode: drugDose.drugCode,
        phase: 'lanjutan',
        regimenCode,
        frequencyPerDay: 1,
        instructions: 'Diminum 1 jam sebelum makan atau 2 jam sesudah makan, di waktu yang sama tiap hari',
        startDate,
        durationDays: phaseData.durationDays,
        endDate: dayjs(startDate).add(phaseData.durationDays - 1, 'day').format('YYYY-MM-DD'),
      });

      const schedule = await MedicationSchedule.create({
        medicationId: medication.id,
        time: '07:00',
        label: 'Pagi (sebelum makan)',
      });

      const logsToCreate = [];
      for (let d = 0; d < phaseData.durationDays; d++) {
        logsToCreate.push({
          medicationId: medication.id,
          scheduleId: schedule.id,
          patientId,
          scheduledDate: dayjs(startDate).add(d, 'day').format('YYYY-MM-DD'),
          scheduledTime: '07:00',
          status: 'menunggu',
        });
      }
      await MedicationLog.bulkCreate(logsToCreate);
      createdMedications.push({ medication, schedule, doseInfo: drugDose });
    }

    // ---- Jadwal kontrol fase lanjutan: tiap bulan ----
    const followUpsToCreate = [];
    for (let d = 30; d <= phaseData.durationDays; d += 30) {
      followUpsToCreate.push({
        patientId,
        adminId: req.user.id,
        scheduledDate: dayjs(startDate).add(d, 'day').format('YYYY-MM-DD'),
        phase: 'lanjutan',
        status: 'terjadwal',
        sputumTestReminder: d >= phaseData.durationDays, // periksa dahak di akhir pengobatan
        doctorNotes: d >= phaseData.durationDays ? 'Evaluasi akhir pengobatan: periksa dahak/BTA ulang dan tentukan hasil akhir terapi.' : undefined,
      });
    }
    const followUps = await FollowUpVisit.bulkCreate(followUpsToCreate);

    res.status(201).json({
      message: `Regimen ${regimenCode} fase lanjutan berhasil diterapkan (${phaseData.months} bulan).`,
      medications: createdMedications,
      followUpVisits: followUps,
    });
  } catch (err) {
    res.status(500).json({ message: 'Gagal menerapkan fase lanjutan', error: err.message });
  }
};
