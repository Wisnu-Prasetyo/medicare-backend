require('dotenv').config();
const { sequelize } = require('../models');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Koneksi database berhasil.');
    await sequelize.sync({ alter: true }); // buat/perbarui semua tabel sesuai model
    console.log('Migrasi selesai, semua tabel sudah dibuat.');
    process.exit(0);
  } catch (err) {
    console.error('Migrasi gagal:', err);
    process.exit(1);
  }
})();
