const { DrugCatalog } = require('../models');
const { Op } = require('sequelize');

/**
 * GET /drug-catalog
 */
exports.getAll = async (req, res) => {
  try {
    const { search, category } = req.query;

    const where = {
      isActive: true
    };

    if (category) {
      where.category = category;
    }

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { brandName: { [Op.like]: `%${search}%` } },
        { category: { [Op.like]: `%${search}%` } }
      ];
    }

    const drugs = await DrugCatalog.findAll({
      where,
      order: [['name', 'ASC']]
    });

    return res.json({ drugs });
  } catch (err) {
    console.error('getAll error:', err);

    return res.status(500).json({
      message: 'Gagal mengambil data obat',
      error: err.message
    });
  }
};

/**
 * GET /drug-catalog/:id
 */
exports.getOne = async (req, res) => {
  try {
    const drug = await DrugCatalog.findByPk(req.params.id);

    if (!drug) {
      return res.status(404).json({
        message: 'Obat tidak ditemukan'
      });
    }

    return res.json({ drug });
  } catch (err) {
    console.error('getOne error:', err);

    return res.status(500).json({
      message: 'Gagal mengambil detail obat',
      error: err.message
    });
  }
};

/**
 * POST /drug-catalog
 */
exports.create = async (req, res) => {
  try {
    const {
      name,
      brandName,
      category,
      form,
      strength,
      defaultDosageInstruction,
      defaultFrequencyPerDay,
      sideEffects,
      contraindications,
      notes
    } = req.body;

    if (!name) {
      return res.status(400).json({
        message: 'Nama obat wajib diisi'
      });
    }

    const drug = await DrugCatalog.create({
      name,
      brandName,
      category,
      form,
      strength,
      defaultDosageInstruction,
      defaultFrequencyPerDay,
      sideEffects,
      contraindications,
      notes,
      isActive: true,
      createdBy: req.user?.id || null
    });

    return res.status(201).json({
      message: 'Obat berhasil ditambahkan',
      drug
    });
  } catch (err) {
    console.error('create error:', err);

    return res.status(500).json({
      message: 'Gagal menambah obat',
      error: err.message
    });
  }
};

/**
 * PUT /drug-catalog/:id
 */
exports.update = async (req, res) => {
  try {
    const drug = await DrugCatalog.findByPk(req.params.id);

    if (!drug) {
      return res.status(404).json({
        message: 'Obat tidak ditemukan'
      });
    }

    await drug.update(req.body);

    return res.json({
      message: 'Obat berhasil diperbarui',
      drug
    });
  } catch (err) {
    console.error('update error:', err);

    return res.status(500).json({
      message: 'Gagal memperbarui obat',
      error: err.message
    });
  }
};

/**
 * DELETE /drug-catalog/:id
 * Soft delete (nonaktifkan)
 */
exports.deactivate = async (req, res) => {
  try {
    const drug = await DrugCatalog.findByPk(req.params.id);

    if (!drug) {
      return res.status(404).json({
        message: 'Obat tidak ditemukan'
      });
    }

    await drug.update({
      isActive: false
    });

    return res.json({
      message: 'Obat berhasil dinonaktifkan'
    });
  } catch (err) {
    console.error('deactivate error:', err);

    return res.status(500).json({
      message: 'Gagal menonaktifkan obat',
      error: err.message
    });
  }
};