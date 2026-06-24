const { Sequelize } = require('sequelize');

// Debug Environment
console.log('================ DATABASE CONFIG ================');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'ADA' : 'KOSONG');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? 'ADA' : 'KOSONG');
console.log('MYSQLHOST:', process.env.MYSQLHOST);
console.log('MYSQLPORT:', process.env.MYSQLPORT);
console.log('MYSQLDATABASE:', process.env.MYSQLDATABASE);
console.log('MYSQLUSER:', process.env.MYSQLUSER);
console.log('MYSQLPASSWORD:', process.env.MYSQLPASSWORD ? 'ADA' : 'KOSONG');
console.log('=================================================');

const dbConfig = {
  database: process.env.DB_NAME || process.env.MYSQLDATABASE,
  username: process.env.DB_USER || process.env.MYSQLUSER,
  password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD,
  host: process.env.DB_HOST || process.env.MYSQLHOST,
  port: Number(process.env.DB_PORT || process.env.MYSQLPORT || 3306),
  dialect: 'mysql',
  logging: false,
  dialectOptions: {
    ssl: false,
  },
};

console.log('FINAL CONFIG:', {
  host: dbConfig.host,
  port: dbConfig.port,
  database: dbConfig.database,
  username: dbConfig.username,
});

const sequelize = new Sequelize(dbConfig);

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database terhubung');
  } catch (err) {
    console.error('❌ Gagal konek database:', err.message);
    console.error('ERROR CODE:', err.original?.code);
    console.error('ERROR SQLSTATE:', err.original?.sqlState);
  }
})();

module.exports = sequelize;
