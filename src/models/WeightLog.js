const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Riwayat berat badan pasien. Penting untuk pasien anak dengan terapi yang dosisnya
// dihitung per kgBB (mis. OAT TBC) — sesuai Juknis TBC: "Dosis obat harus disesuaikan
// dengan kenaikan berat badan" dan dicatat setiap kontrol bulanan/2 mingguan.
const WeightLog = sequelize.define(
  'WeightLog',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    patientId: { type: DataTypes.UUID, allowNull: false },
    weightKg: { type: DataTypes.FLOAT, allowNull: false },
    heightCm: { type: DataTypes.FLOAT },
    recordedAt: { type: DataTypes.DATEONLY, allowNull: false },
    recordedBy: { type: DataTypes.UUID, allowNull: false }, // FK -> users.id (dokter yang mencatat)
    note: { type: DataTypes.STRING },
  },
  {
    tableName: 'weight_logs',
    timestamps: true,
  }
);

module.exports = WeightLog;
