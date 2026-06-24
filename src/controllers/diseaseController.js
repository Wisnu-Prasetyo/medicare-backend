const { Disease } = require('../models');

exports.getAll = async (req, res) => {
  const items = await Disease.findAll({ where: { isActive: true }, order: [['name', 'ASC']] });
  res.json({ items });
};

exports.create = async (req, res) => {
  try {
    const { name, category, description, moduleCode } = req.body;
    if (!name) return res.status(400).json({ message: 'Nama penyakit wajib diisi' });
    const item = await Disease.create({ name, category, description, moduleCode, createdBy: req.user.id });
    res.status(201).json({ item });
  } catch (err) {
    res.status(500).json({ message: 'Gagal menambah penyakit', error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const item = await Disease.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: 'Penyakit tidak ditemukan' });
    Object.assign(item, req.body);
    await item.save();
    res.json({ item });
  } catch (err) {
    res.status(500).json({ message: 'Gagal memperbarui penyakit', error: err.message });
  }
};

// Soft-delete (nonaktifkan) supaya data obat/pasien lama yang masih mereferensikan tidak rusak
exports.remove = async (req, res) => {
  try {
    const item = await Disease.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: 'Penyakit tidak ditemukan' });
    item.isActive = false;
    await item.save();
    res.json({ message: 'Penyakit dinonaktifkan' });
  } catch (err) {
    res.status(500).json({ message: 'Gagal menghapus penyakit', error: err.message });
  }
};
