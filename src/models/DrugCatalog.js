const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Katalog obat yang bisa dikelola admin dan dipilih saat meresepkan obat ke pasien.
// Mencakup nama generik, nama dagang (opsional), bentuk sediaan, kekuatan, indikasi umum, dll.
const DrugCatalog = sequelize.define(
  'DrugCatalog',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },         // nama generik, contoh: "Amoxicillin"
    brandName: { type: DataTypes.STRING },                      // nama dagang, contoh: "Amoxan"
    category: { type: DataTypes.STRING },                       // contoh: "Antibiotik", "Analgesik", "OAT"
    form: { type: DataTypes.STRING },                           // contoh: "Tablet", "Kapsul", "Sirup", "Injeksi"
    strength: { type: DataTypes.STRING },                       // contoh: "500mg", "250mg/5ml"
    defaultDosageInstruction: { type: DataTypes.STRING },       // contoh: "3x1 tablet sesudah makan"
    defaultFrequencyPerDay: { type: DataTypes.INTEGER },        // default frekuensi saat dipilih
    sideEffects: { type: DataTypes.TEXT },                      // efek samping yang perlu diinformasikan pasien
    contraindications: { type: DataTypes.TEXT },                // kontraindikasi singkat
    notes: { type: DataTypes.TEXT },                            // catatan tambahan
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    createdBy: { type: DataTypes.UUID, allowNull: false },
  },
  { tableName: 'drug_catalogs', timestamps: true }
);

module.exports = DrugCatalog;
