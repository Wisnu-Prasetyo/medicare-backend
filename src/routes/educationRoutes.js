const router = require('express').Router();
const educationController = require('../controllers/educationController');
const { authenticate, authorize } = require('../middleware/auth');
const { educationValidator } = require('../middleware/validators');

router.get('/', authenticate, educationController.getAll);
router.get('/:id', authenticate, educationController.getOne);
router.post('/', authenticate, authorize('admin'), educationValidator, educationController.create);
router.put('/:id', authenticate, authorize('admin'), educationController.update);
router.delete('/:id', authenticate, authorize('admin'), educationController.remove);

module.exports = router;
