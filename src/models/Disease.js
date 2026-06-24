const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Katalog penyakit yang bisa dipilih dokter saat mendiagnosis pasien.
// Bisa ditambah bebas oleh admin/dokter. Penyakit tertentu (mis. TBC) memiliki
// `hasStructuredRegimen = true` yang mengaktifkan kalkulator dosis otomatis
// (lihat utils/tbcDosing.js) dan penjadwalan kontrol otomatis di aplikasi.
const Disease = sequelize.define(
  'Disease',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false }, // contoh: "Tuberkulosis (TBC) Anak dan Remaja"
    category: { type: DataTypes.STRING }, // contoh: "Infeksi", "Kronis", "Respirasi"
    description: { type: DataTypes.TEXT },
    // Kode khusus untuk modul yang punya logic terstruktur bawaan aplikasi.
    // Saat ini hanya 'tbc' yang didukung kalkulator dosis otomatis.
    moduleCode: { type: DataTypes.STRING }, // 'tbc' | null
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    createdBy: { type: DataTypes.UUID, allowNull: false }, // FK -> users.id (admin/dokter pembuat)
  },
  {
    tableName: 'diseases',
    timestamps: true,
  }
);

module.exports = Disease;
