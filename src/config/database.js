const { Sequelize } = require('sequelize');

// Railway MySQL menyediakan DATABASE_URL atau variable individual
const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'mysql',
      logging: false,
      dialectOptions: {
        ssl: false,
      },
    })
  : new Sequelize({
      database: process.env.DB_NAME || process.env.MYSQLDATABASE,
      username: process.env.DB_USER || process.env.MYSQLUSER,
      password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD,
      host: process.env.DB_HOST || process.env.MYSQLHOST,
      port: Number(process.env.DB_PORT || process.env.MYSQLPORT || 3306),
      dialect: 'mysql',
      logging: false,
    });

sequelize.authenticate()
  .then(() => console.log('✅ Database terhubung'))
  .catch(err => console.error('❌ Gagal konek database:', err.message));

module.exports = sequelize;
