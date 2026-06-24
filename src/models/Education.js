const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Education = sequelize.define(
  'Education',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    title: { type: DataTypes.STRING, allowNull: false },
    category: { type: DataTypes.STRING }, // contoh: "Diabetes", "Hipertensi", "Gizi"
    content: { type: DataTypes.TEXT, allowNull: false }, // bisa markdown/html
    coverImageUrl: { type: DataTypes.STRING },
    authorId: { type: DataTypes.UUID, allowNull: false }, // FK -> users.id (admin/dokter pembuat)
    isPublished: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    tableName: 'educations',
    timestamps: true,
  }
);

module.exports = Education;
