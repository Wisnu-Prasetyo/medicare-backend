require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize, User, Education, Disease, DrugCatalog } = require('../models');

(async () => {
  try {
    await sequelize.sync();

    const adminExists = await User.findOne({ where: { email: 'admin@medicare.app' } });
    if (!adminExists) {
      const hashed = await bcrypt.hash('admin123', 10);
      await User.create({ name: 'Administrator', email: 'admin@medicare.app', password: hashed, role: 'admin' });
      console.log('Akun admin default: admin@medicare.app / admin123 (segera ganti password!)');
    }
    const admin = await User.findOne({ where: { role: 'admin' } });

    const diseaseCount = await Disease.count();
    if (diseaseCount === 0) {
      await Disease.bulkCreate([
        { name: 'Tuberkulosis (TBC) Anak dan Remaja', category: 'Infeksi Respirasi', description: 'Mengacu Juknis TBC Anak dan Remaja Indonesia 2023 (Kemenkes RI). Mendukung kalkulator dosis OAT otomatis.', moduleCode: 'tbc', createdBy: admin.id },
        { name: 'Hipertensi', category: 'Kardiovaskular', createdBy: admin.id },
        { name: 'Diabetes Melitus', category: 'Metabolik', createdBy: admin.id },
        { name: 'Asma', category: 'Respirasi', createdBy: admin.id },
        { name: 'Infeksi Saluran Pernapasan Akut (ISPA)', category: 'Infeksi', createdBy: admin.id },
        { name: 'Demam Tifoid', category: 'Infeksi', createdBy: admin.id },
      ]);
      console.log('Katalog penyakit awal dibuat.');
    }

    const drugCount = await DrugCatalog.count();
    if (drugCount === 0) {
      await DrugCatalog.bulkCreate([
        // OAT TBC
        { name: 'Isoniazid (INH)', category: 'OAT', form: 'Tablet', strength: '100mg / 300mg', defaultDosageInstruction: '1x sehari, 1 jam sebelum makan', defaultFrequencyPerDay: 1, sideEffects: 'Neuropati perifer, hepatotoksisitas', createdBy: admin.id },
        { name: 'Rifampisin', category: 'OAT', form: 'Kapsul/Tablet', strength: '150mg / 300mg / 450mg / 600mg', defaultDosageInstruction: '1x sehari, 1 jam sebelum makan', defaultFrequencyPerDay: 1, sideEffects: 'Urin/dahak/air mata berwarna oranye kemerahan, hepatotoksisitas', createdBy: admin.id },
        { name: 'Pirazinamid', category: 'OAT', form: 'Tablet', strength: '500mg', defaultDosageInstruction: '1x sehari, sesudah makan', defaultFrequencyPerDay: 1, sideEffects: 'Hiperurisemia, nyeri sendi, hepatotoksisitas', createdBy: admin.id },
        { name: 'Etambutol', category: 'OAT', form: 'Tablet', strength: '250mg / 500mg', defaultDosageInstruction: '1x sehari, sesudah makan', defaultFrequencyPerDay: 1, sideEffects: 'Neuritis optik (gangguan penglihatan)', createdBy: admin.id },
        // Antibiotik umum
        { name: 'Amoxicillin', category: 'Antibiotik', form: 'Kapsul/Sirup', strength: '250mg / 500mg', defaultDosageInstruction: '3x1 sesudah makan', defaultFrequencyPerDay: 3, sideEffects: 'Reaksi alergi, diare, mual', createdBy: admin.id },
        { name: 'Cotrimoxazole', category: 'Antibiotik', form: 'Tablet', strength: '480mg', defaultDosageInstruction: '2x1 sesudah makan', defaultFrequencyPerDay: 2, sideEffects: 'Ruam kulit, mual, gangguan darah', createdBy: admin.id },
        // Antihipertensi
        { name: 'Amlodipine', category: 'Antihipertensi', form: 'Tablet', strength: '5mg / 10mg', defaultDosageInstruction: '1x1 pagi hari', defaultFrequencyPerDay: 1, sideEffects: 'Edema tungkai, sakit kepala, pusing', createdBy: admin.id },
        { name: 'Captopril', category: 'Antihipertensi', form: 'Tablet', strength: '12.5mg / 25mg', defaultDosageInstruction: '2-3x1 sebelum makan', defaultFrequencyPerDay: 2, sideEffects: 'Batuk kering, hiperkalemia', createdBy: admin.id },
        // Diabetes
        { name: 'Metformin', category: 'Antidiabetes', form: 'Tablet', strength: '500mg / 850mg', defaultDosageInstruction: '2-3x1 sesudah makan', defaultFrequencyPerDay: 2, sideEffects: 'Mual, diare, asidosis laktat (jarang)', createdBy: admin.id },
        // Analgesik
        { name: 'Parasetamol (Paracetamol)', category: 'Analgesik/Antipiretik', form: 'Tablet/Sirup', strength: '500mg', defaultDosageInstruction: '3x1 saat nyeri/demam', defaultFrequencyPerDay: 3, sideEffects: 'Hepatotoksisitas (dosis tinggi)', createdBy: admin.id },
        { name: 'Ibuprofen', category: 'Analgesik/NSAID', form: 'Tablet', strength: '200mg / 400mg', defaultDosageInstruction: '3x1 sesudah makan', defaultFrequencyPerDay: 3, sideEffects: 'Gangguan lambung, tukak peptic', contraindications: 'Hindari pada pasien dengan ulkus peptikum aktif atau gangguan ginjal berat', createdBy: admin.id },
        // Antiasma
        { name: 'Salbutamol', category: 'Bronkodilator', form: 'Tablet/Inhaler', strength: '2mg / 4mg', defaultDosageInstruction: '3x1 atau sesuai kebutuhan', defaultFrequencyPerDay: 3, sideEffects: 'Tremor, palpitasi, sakit kepala', createdBy: admin.id },
      ]);
      console.log('Katalog obat awal dibuat (12 obat termasuk OAT TBC).');
    }

    const eduCount = await Education.count();
    if (eduCount === 0) {
      await Education.bulkCreate([
        { title: 'Pentingnya Minum Obat Tepat Waktu', category: 'Umum', content: 'Minum obat sesuai jadwal sangat penting agar kadar obat dalam darah tetap stabil sehingga efektif melawan penyakit dan mengurangi risiko resistensi obat.', authorId: admin.id },
        { title: 'Mengenal Hipertensi dan Cara Mengelolanya', category: 'Hipertensi', content: 'Hipertensi atau tekanan darah tinggi dapat dikontrol dengan pola makan rendah garam, olahraga teratur, dan kepatuhan minum obat sesuai anjuran.', authorId: admin.id },
        { title: 'Apa itu TBC dan Bagaimana Pengobatannya?', category: 'TBC', content: 'Tuberkulosis (TBC) disebabkan bakteri Mycobacterium tuberculosis. Pengobatan memerlukan kombinasi beberapa obat selama minimal 6 bulan. Sangat penting untuk tidak berhenti minum obat sebelum masa pengobatan selesai untuk mencegah resistensi.', authorId: admin.id },
      ]);
      console.log('Konten edukasi awal dibuat.');
    }

    console.log('Seeding selesai.');
    process.exit(0);
  } catch (err) {
    console.error('Seeding gagal:', err);
    process.exit(1);
  }
})();
