const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Satu baris = satu kejadian "harus minum obat" pada tanggal & jam tertentu.
// Di-generate oleh cron job harian dari MedicationSchedule yang aktif.
// status diupdate pasien dari app mobile saat menekan tombol "Sudah diminum".
const MedicationLog = sequelize.define(
  'MedicationLog',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    medicationId: { type: DataTypes.UUID, allowNull: false },
    scheduleId: { type: DataTypes.UUID, allowNull: false },
    patientId: { type: DataTypes.UUID, allowNull: false },
    scheduledDate: { type: DataTypes.DATEONLY, allowNull: false },
    scheduledTime: { type: DataTypes.TIME, allowNull: false },
    status: {
      type: DataTypes.ENUM('menunggu', 'diminum', 'terlewat'),
      defaultValue: 'menunggu',
    },
    takenAt: { type: DataTypes.DATE }, // waktu pasien menekan tombol konfirmasi
    proofPhotoUrl: { type: DataTypes.STRING }, // opsional: foto bukti minum obat
    notes: { type: DataTypes.STRING },
  },
  {
    tableName: 'medication_logs',
    timestamps: true,
    indexes: [{ unique: true, fields: ['scheduleId', 'scheduledDate'] }],
  }
);

module.exports = MedicationLog;
