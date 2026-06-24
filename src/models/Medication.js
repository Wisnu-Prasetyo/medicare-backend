const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Medication = sequelize.define(
  'Medication',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    patientId: { type: DataTypes.UUID, allowNull: false },
    adminId: { type: DataTypes.UUID, allowNull: false },    // admin yang meresepkan
    diseaseId: { type: DataTypes.UUID, allowNull: true },
    drugCatalogId: { type: DataTypes.UUID, allowNull: true }, // FK -> drug_catalogs (obat dari katalog)
    name: { type: DataTypes.STRING, allowNull: false },
    dosage: { type: DataTypes.STRING },
    drugCode: { type: DataTypes.STRING },  // untuk OAT TBC: H,R,Z,E
    phase: { type: DataTypes.STRING },     // intensif | lanjutan (TBC)
    regimenCode: { type: DataTypes.STRING },
    frequencyPerDay: { type: DataTypes.INTEGER, allowNull: false },
    instructions: { type: DataTypes.TEXT },
    startDate: { type: DataTypes.DATEONLY, allowNull: false },
    durationDays: { type: DataTypes.INTEGER, allowNull: false },
    endDate: { type: DataTypes.DATEONLY },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  { tableName: 'medications', timestamps: true }
);

module.exports = Medication;
