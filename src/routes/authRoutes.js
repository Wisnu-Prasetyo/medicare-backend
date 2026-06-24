const router = require('express').Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const {
  loginValidator,
  registerValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  changePasswordValidator,
} = require('../middleware/validators');

router.post('/register', registerValidator, authController.register);
router.post('/login', loginValidator, authController.login);
router.post('/forgot-password', forgotPasswordValidator, authController.forgotPassword);
router.post('/reset-password', resetPasswordValidator, authController.resetPassword);
router.get('/me', authenticate, authController.me);
router.put('/me', authenticate, authController.updateMe);
router.post('/push-token', authenticate, authController.savePushToken);
router.put('/change-password', authenticate, changePasswordValidator, authController.changePassword);

module.exports = router;
