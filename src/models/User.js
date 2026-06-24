const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// role: admin | pasien
const User = sequelize.define(
  'User',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
    password: { type: DataTypes.STRING, allowNull: false },
    role: {
      type: DataTypes.ENUM('admin', 'pasien'),
      allowNull: false,
      defaultValue: 'pasien',
    },
    phone: { type: DataTypes.STRING },
    avatarUrl: { type: DataTypes.STRING },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    expoPushToken: { type: DataTypes.STRING },
    resetPasswordToken: { type: DataTypes.STRING },
    resetPasswordExpires: { type: DataTypes.DATE },
    mustChangePassword: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  { tableName: 'users', timestamps: true }
);

module.exports = User;
