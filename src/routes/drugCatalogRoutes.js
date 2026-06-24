const router = require('express').Router();
const drugCatalogController = require('../controllers/drugCatalogController');
const { authenticate, authorize } = require('../middleware/auth');

// Semua user yang login bisa lihat katalog obat (pasien untuk edukasi)
router.get('/', authenticate, drugCatalogController.getAll);
router.get('/:id', authenticate, drugCatalogController.getOne);

// Hanya admin yang bisa mengelola katalog
router.post('/', authenticate, authorize('admin'), drugCatalogController.create);
router.put('/:id', authenticate, authorize('admin'), drugCatalogController.update);
router.delete('/:id', authenticate, authorize('admin'), drugCatalogController.deactivate);

module.exports = router;
