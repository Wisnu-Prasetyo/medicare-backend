const router = require('express').Router();
const logController = require('../controllers/logController');
const followUpController = require('../controllers/followUpController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate, authorize('pasien'));

router.get('/schedule/today', logController.getTodaySchedule);
router.get('/history', logController.getMyHistory);
router.put('/logs/:logId/confirm', logController.confirmTaken);
router.get('/next-visit', followUpController.getMyNextVisit);

module.exports = router;
