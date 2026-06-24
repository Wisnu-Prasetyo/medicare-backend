const sequelize = require('../config/database');
const User = require('./User');
const PatientProfile = require('./PatientProfile');
const Medication = require('./Medication');
const MedicationSchedule = require('./MedicationSchedule');
const MedicationLog = require('./MedicationLog');
const Education = require('./Education');
const { Consultation, Message } = require('./Consultation');
const Disease = require('./Disease');
const DrugCatalog = require('./DrugCatalog');
const WeightLog = require('./WeightLog');
const FollowUpVisit = require('./FollowUpVisit');

// ----- User <-> PatientProfile -----
User.hasOne(PatientProfile, { foreignKey: 'userId', as: 'profile' });
PatientProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// admin penanggung jawab pasien
User.hasMany(PatientProfile, { foreignKey: 'adminId', as: 'managedPatients' });
PatientProfile.belongsTo(User, { foreignKey: 'adminId', as: 'admin' });

// ----- PatientProfile <-> Disease -----
PatientProfile.belongsTo(Disease, { foreignKey: 'diseaseId', as: 'disease' });
Disease.hasMany(PatientProfile, { foreignKey: 'diseaseId', as: 'patients' });

// ----- Medication -----
User.hasMany(Medication, { foreignKey: 'patientId', as: 'medications' });
Medication.belongsTo(User, { foreignKey: 'patientId', as: 'patient' });

User.hasMany(Medication, { foreignKey: 'adminId', as: 'prescribedMedications' });
Medication.belongsTo(User, { foreignKey: 'adminId', as: 'admin' });

Medication.belongsTo(Disease, { foreignKey: 'diseaseId', as: 'disease' });
Disease.hasMany(Medication, { foreignKey: 'diseaseId', as: 'medications' });

// ----- DrugCatalog -----
User.hasMany(DrugCatalog, { foreignKey: 'createdBy', as: 'createdDrugs' });
DrugCatalog.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

Medication.belongsTo(DrugCatalog, { foreignKey: 'drugCatalogId', as: 'drug' });
DrugCatalog.hasMany(Medication, { foreignKey: 'drugCatalogId', as: 'prescriptions' });

// ----- MedicationSchedule & MedicationLog -----
Medication.hasMany(MedicationSchedule, { foreignKey: 'medicationId', as: 'schedules', onDelete: 'CASCADE' });
MedicationSchedule.belongsTo(Medication, { foreignKey: 'medicationId', as: 'medication' });

Medication.hasMany(MedicationLog, { foreignKey: 'medicationId', as: 'logs', onDelete: 'CASCADE' });
MedicationLog.belongsTo(Medication, { foreignKey: 'medicationId', as: 'medication' });

MedicationSchedule.hasMany(MedicationLog, { foreignKey: 'scheduleId', as: 'logs', onDelete: 'CASCADE' });
MedicationLog.belongsTo(MedicationSchedule, { foreignKey: 'scheduleId', as: 'schedule' });

User.hasMany(MedicationLog, { foreignKey: 'patientId', as: 'medicationLogs' });
MedicationLog.belongsTo(User, { foreignKey: 'patientId', as: 'patient' });

// ----- Education -----
User.hasMany(Education, { foreignKey: 'authorId', as: 'educationContents' });
Education.belongsTo(User, { foreignKey: 'authorId', as: 'author' });

// ----- Consultation & Message -----
User.hasMany(Consultation, { foreignKey: 'patientId', as: 'consultationsAsPatient' });
User.hasMany(Consultation, { foreignKey: 'adminId', as: 'consultationsAsAdmin' });
Consultation.belongsTo(User, { foreignKey: 'patientId', as: 'patient' });
Consultation.belongsTo(User, { foreignKey: 'adminId', as: 'admin' });

Consultation.hasMany(Message, { foreignKey: 'consultationId', as: 'messages', onDelete: 'CASCADE' });
Message.belongsTo(Consultation, { foreignKey: 'consultationId', as: 'consultation' });
Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });

// ----- Disease -----
User.hasMany(Disease, { foreignKey: 'createdBy', as: 'createdDiseases' });
Disease.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

// ----- WeightLog -----
User.hasMany(WeightLog, { foreignKey: 'patientId', as: 'weightLogs' });
WeightLog.belongsTo(User, { foreignKey: 'patientId', as: 'patient' });
WeightLog.belongsTo(User, { foreignKey: 'recordedBy', as: 'recorder' });

// ----- FollowUpVisit -----
User.hasMany(FollowUpVisit, { foreignKey: 'patientId', as: 'followUpVisitsAsPatient' });
User.hasMany(FollowUpVisit, { foreignKey: 'adminId', as: 'followUpVisitsAsAdmin' });
FollowUpVisit.belongsTo(User, { foreignKey: 'patientId', as: 'patient' });
FollowUpVisit.belongsTo(User, { foreignKey: 'adminId', as: 'admin' });
Medication.hasMany(FollowUpVisit, { foreignKey: 'medicationId', as: 'followUpVisits' });
FollowUpVisit.belongsTo(Medication, { foreignKey: 'medicationId', as: 'medication' });

module.exports = {
  sequelize,
  User,
  PatientProfile,
  Medication,
  MedicationSchedule,
  MedicationLog,
  Education,
  Consultation,
  Message,
  Disease,
  DrugCatalog,
  WeightLog,
  FollowUpVisit,
};
