const router = require('express').Router();
const adminController = require('../controllers/adminController');
const patientController = require('../controllers/patientController');
const medicationController = require('../controllers/medicationController');
const tbcController = require('../controllers/tbcController');
const followUpController = require('../controllers/followUpController');
const weightController = require('../controllers/weightController');
const { authenticate, authorize } = require('../middleware/auth');
const { createUserValidator, addPatientValidator, addMedicationValidator, applyTbcRegimenValidator, weightLogValidator } = require('../middleware/validators');

router.use(authenticate, authorize('admin'));

// Dashboard
router.get('/dashboard', adminController.getDashboardStats);

// Kelola akun pasien
router.get('/users', adminController.getAllUsers);
router.post('/users', createUserValidator, adminController.createUser);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

// Jadwal semua pasien
router.get('/schedules', adminController.getAllSchedules);

// ---- Manajemen Pasien ----
router.post('/patients', addPatientValidator, patientController.addPatient);
router.get('/patients', patientController.getMyPatients);
router.get('/patients/:patientId', patientController.getPatientDetail);
router.put('/patients/:patientId', patientController.updatePatientProfile);
router.get('/patients/:patientId/adherence', patientController.getPatientAdherence);

// ---- Input Obat ke Pasien ----
router.post('/medications', addMedicationValidator, medicationController.addMedication);
router.get('/medications/patient/:patientId', medicationController.getMedicationsByPatient);
router.put('/medications/:medicationId', medicationController.updateMedication);
router.delete('/medications/:medicationId', medicationController.deleteMedication);
router.put('/medications/schedule/:scheduleId', medicationController.updateScheduleTime);
router.put('/medications/:medicationId/deactivate', medicationController.deactivateMedication);

// ---- Modul TBC ----
router.get('/tbc/regimens', tbcController.getRegimenOptions);
router.get('/tbc/preview-dose', tbcController.previewDose);
router.post('/tbc/apply-regimen', applyTbcRegimenValidator, tbcController.applyRegimen);
router.post('/tbc/apply-continuation', applyTbcRegimenValidator, tbcController.applyContinuationPhase);

// ---- Berat Badan Pasien ----
router.post('/patients/:patientId/weight', weightLogValidator, weightController.addWeightLog);
router.get('/patients/:patientId/weight', weightController.getWeightHistory);

// ---- Jadwal Kontrol ----
router.post('/follow-up', followUpController.createVisit);
router.get('/follow-up/worklist', followUpController.getMyWorklist);
router.get('/follow-up/patient/:patientId', followUpController.getPatientVisits);
router.put('/follow-up/:visitId/complete', followUpController.completeVisit);
router.put('/follow-up/:visitId/reschedule', followUpController.rescheduleVisit);

module.exports = router;
