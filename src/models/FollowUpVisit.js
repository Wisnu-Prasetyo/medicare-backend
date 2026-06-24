const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const FollowUpVisit = sequelize.define(
  'FollowUpVisit',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    patientId: { type: DataTypes.UUID, allowNull: false },
    medicationId: { type: DataTypes.UUID, allowNull: true },
    adminId: { type: DataTypes.UUID, allowNull: false },  // admin yang menjadwalkan
    scheduledDate: { type: DataTypes.DATEONLY, allowNull: false },
    phase: { type: DataTypes.STRING },   // 'intensif' | 'lanjutan' | null
    status: {
      type: DataTypes.ENUM('terjadwal', 'selesai', 'terlewat', 'dibatalkan'),
      defaultValue: 'terjadwal',
    },
    weightKg: { type: DataTypes.FLOAT },
    symptomsImproving: { type: DataTypes.BOOLEAN },
    adherenceGood: { type: DataTypes.BOOLEAN },
    sideEffects: { type: DataTypes.TEXT },
    sputumTestReminder: { type: DataTypes.BOOLEAN, defaultValue: false },
    adminNotes: { type: DataTypes.TEXT },
    examinedAt: { type: DataTypes.DATE },
    notificationSent: { type: DataTypes.BOOLEAN, defaultValue: false }, // sudah kirim notif H-1?
  },
  { tableName: 'follow_up_visits', timestamps: true }
);

module.exports = FollowUpVisit;
