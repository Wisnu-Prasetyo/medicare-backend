const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Satu baris = satu jam minum obat dalam sehari, contoh: 08:00, 12:00, 18:00
// Di-generate otomatis saat Medication dibuat, tapi dokter/admin boleh edit manual per jam.
const MedicationSchedule = sequelize.define(
  'MedicationSchedule',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    medicationId: { type: DataTypes.UUID, allowNull: false }, // FK -> medications.id
    time: { type: DataTypes.TIME, allowNull: false }, // jam minum, contoh '08:00:00'
    label: { type: DataTypes.STRING }, // contoh: "Pagi", "Siang", "Sore", "Malam"
  },
  {
    tableName: 'medication_schedules',
    timestamps: true,
  }
);

module.exports = MedicationSchedule;
