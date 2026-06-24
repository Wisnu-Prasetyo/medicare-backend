const { Education } = require('../models');

exports.getAll = async (req, res) => {
  const { category } = req.query;
  const where = { isPublished: true };
  if (category) where.category = category;
  const items = await Education.findAll({ where, order: [['createdAt', 'DESC']] });
  res.json({ items });
};

exports.getOne = async (req, res) => {
  const item = await Education.findByPk(req.params.id);
  if (!item) return res.status(404).json({ message: 'Konten tidak ditemukan' });
  res.json({ item });
};

// Admin membuat konten edukasi
exports.create = async (req, res) => {
  try {
    const { title, category, content, coverImageUrl, isPublished } = req.body;
    const item = await Education.create({
      title,
      category,
      content,
      coverImageUrl,
      isPublished: isPublished ?? true,
      authorId: req.user.id,
    });
    res.status(201).json({ item });
  } catch (err) {
    res.status(500).json({ message: 'Gagal membuat konten edukasi', error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const item = await Education.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: 'Konten tidak ditemukan' });
    Object.assign(item, req.body);
    await item.save();
    res.json({ item });
  } catch (err) {
    res.status(500).json({ message: 'Gagal memperbarui konten', error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const item = await Education.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: 'Konten tidak ditemukan' });
    await item.destroy();
    res.json({ message: 'Konten dihapus' });
  } catch (err) {
    res.status(500).json({ message: 'Gagal menghapus konten', error: err.message });
  }
};
