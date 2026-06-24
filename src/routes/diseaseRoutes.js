const router = require('express').Router();
const diseaseController = require('../controllers/diseaseController');
const { authenticate, authorize } = require('../middleware/auth');
const { diseaseValidator } = require('../middleware/validators');

router.get('/', authenticate, diseaseController.getAll);
router.post('/', authenticate, authorize('admin'), diseaseValidator, diseaseController.create);
router.put('/:id', authenticate, authorize('admin'), diseaseController.update);
router.delete('/:id', authenticate, authorize('admin'), diseaseController.remove);

module.exports = router;
