require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const { sequelize } = require('./models');
const { startReminderCron } = require('./utils/reminderCron');

const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const pasienRoutes = require('./routes/pasienRoutes');
const educationRoutes = require('./routes/educationRoutes');
const consultationRoutes = require('./routes/consultationRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const diseaseRoutes = require('./routes/diseaseRoutes');
const drugCatalogRoutes = require('./routes/drugCatalogRoutes');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: process.env.CORS_ORIGIN || '*' } });

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '5mb' }));
app.use(morgan('dev'));
app.set('io', io);

io.on('connection', (socket) => {
  socket.on('join_consultation', (consultationId) => socket.join(`consultation_${consultationId}`));
  socket.on('leave_consultation', (consultationId) => socket.leave(`consultation_${consultationId}`));
});

app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/pasien', pasienRoutes);
app.use('/api/education', educationRoutes);
app.use('/api/consultations', consultationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/diseases', diseaseRoutes);
app.use('/api/drugs', drugCatalogRoutes);

app.use((req, res) => res.status(404).json({ message: 'Endpoint tidak ditemukan' }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Terjadi kesalahan server', error: err.message });
});

const PORT = process.env.PORT || 3000;

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database terhubung');
    startReminderCron();
    server.listen(PORT, () => console.log(`🚀 Server berjalan di port ${PORT}`));
  } catch (err) {
    console.error('❌ Gagal konek database:', err.message);
    process.exit(1);
  }
})();
