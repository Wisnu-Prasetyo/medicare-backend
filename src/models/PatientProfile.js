const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PatientProfile = sequelize.define(
  'PatientProfile',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false },
    adminId: { type: DataTypes.UUID, allowNull: true }, // admin penanggung jawab pasien
    birthDate: { type: DataTypes.DATEONLY },
    gender: { type: DataTypes.ENUM('L', 'P') },
    address: { type: DataTypes.TEXT },
    bloodType: { type: DataTypes.STRING },
    allergies: { type: DataTypes.TEXT },
    diagnosis: { type: DataTypes.TEXT },
    diseaseId: { type: DataTypes.UUID, allowNull: true },
    weightKg: { type: DataTypes.FLOAT },
    heightCm: { type: DataTypes.FLOAT },
    emergencyContactName: { type: DataTypes.STRING },
    emergencyContactPhone: { type: DataTypes.STRING },
  },
  { tableName: 'patient_profiles', timestamps: true }
);

module.exports = PatientProfile;
