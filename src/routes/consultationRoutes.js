const router = require('express').Router();
const consultationController = require('../controllers/consultationController');
const { authenticate, authorize } = require('../middleware/auth');
const { sendMessageValidator } = require('../middleware/validators');

router.use(authenticate, authorize('pasien', 'admin'));

router.post('/', authorize('pasien'), consultationController.startConsultation);
router.get('/', consultationController.getMyConsultations);
router.get('/:consultationId/messages', consultationController.getMessages);
router.get('/:consultationId/qa-table', consultationController.getQaTable);
router.post('/:consultationId/messages', sendMessageValidator, consultationController.sendMessage);
router.put('/:consultationId/close', consultationController.closeConsultation);

module.exports = router;
