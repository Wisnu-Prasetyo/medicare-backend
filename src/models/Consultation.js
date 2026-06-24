const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Consultation = sequelize.define(
  'Consultation',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    patientId: { type: DataTypes.UUID, allowNull: false },
    adminId: { type: DataTypes.UUID, allowNull: false },  // admin yang menangani diskusi
    subject: { type: DataTypes.STRING },
    status: { type: DataTypes.ENUM('terbuka', 'selesai'), defaultValue: 'terbuka' },
    lastMessageAt: { type: DataTypes.DATE },
  },
  { tableName: 'consultations', timestamps: true }
);

const Message = sequelize.define(
  'Message',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    consultationId: { type: DataTypes.UUID, allowNull: false },
    senderId: { type: DataTypes.UUID, allowNull: false },
    text: { type: DataTypes.TEXT },
    attachmentUrl: { type: DataTypes.STRING },
    messageType: {
      type: DataTypes.ENUM('pertanyaan', 'jawaban', 'info'),
      defaultValue: 'info',
    },
    answeredQuestionId: { type: DataTypes.UUID, allowNull: true },
    isRead: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  { tableName: 'messages', timestamps: true }
);

module.exports = { Consultation, Message };
