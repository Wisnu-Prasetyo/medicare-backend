const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User, PatientProfile } = require('../models');
const { sendResetPasswordEmail } = require('../utils/emailService');

function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

function sanitize(user) {
  const { password, ...rest } = user.toJSON();
  return rest;
}

// Pasien butuh data profile (terutama adminId penanggung jawab) di setiap response
// user agar fitur "Mulai Diskusi" di app tahu harus terhubung ke dokter mana.
// Sebelumnya sanitize() tidak pernah menyertakan relasi profile sehingga
// user.profile selalu undefined di mobile -> selalu gagal "tidak dapat terhubung dengan dokter".
async function getUserWithProfile(userId) {
  const user = await User.findByPk(userId, {
    include: [{ association: 'profile' }],
  });
  return sanitize(user);
}

// Hanya admin yang boleh membuat akun dokter/admin baru.
// Pasien dibuat oleh dokter (lihat patientController) supaya datanya lengkap (profile + dokter penanggung jawab).
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Data tidak lengkap' });
    }
    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(409).json({ message: 'Email sudah terdaftar' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, role, phone });

    if (role === 'pasien') {
      await PatientProfile.create({ userId: user.id });
    }

    const token = signToken(user);
    res.status(201).json({ user: await getUserWithProfile(user.id), token });
  } catch (err) {
    res.status(500).json({ message: 'Gagal mendaftar', error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Email atau password salah' });
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: 'Email atau password salah' });

    const token = signToken(user);
    res.json({ user: await getUserWithProfile(user.id), token });
  } catch (err) {
    res.status(500).json({ message: 'Gagal login', error: err.message });
  }
};

exports.me = async (req, res) => {
  res.json({ user: await getUserWithProfile(req.user.id) });
};

// User edit profil sendiri (nama, telepon, foto profil)
exports.updateMe = async (req, res) => {
  try {
    const { name, phone, avatarUrl } = req.body;
    req.user.name = name ?? req.user.name;
    req.user.phone = phone ?? req.user.phone;
    req.user.avatarUrl = avatarUrl ?? req.user.avatarUrl;
    await req.user.save();
    res.json({ user: await getUserWithProfile(req.user.id) });
  } catch (err) {
    res.status(500).json({ message: 'Gagal memperbarui profil', error: err.message });
  }
};

// Mobile app mengirim expoPushToken setelah login supaya bisa menerima notifikasi
exports.savePushToken = async (req, res) => {
  try {
    const { expoPushToken } = req.body;
    req.user.expoPushToken = expoPushToken;
    await req.user.save();
    res.json({ message: 'Push token disimpan' });
  } catch (err) {
    res.status(500).json({ message: 'Gagal menyimpan push token', error: err.message });
  }
};

// ---------- LUPA PASSWORD ----------
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });

    // Selalu balas sukses walau email tidak ditemukan, supaya tidak bocor info akun mana yang terdaftar
    if (!user) {
      return res.json({ message: 'Jika email terdaftar, instruksi reset password telah dikirim.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 jam
    await user.save();

    const resetUrl = `${process.env.RESET_PASSWORD_URL || 'medicareapp://reset-password'}?token=${token}&email=${encodeURIComponent(email)}`;
    await sendResetPasswordEmail(email, resetUrl);

    res.json({ message: 'Jika email terdaftar, instruksi reset password telah dikirim.' });
  } catch (err) {
    res.status(500).json({ message: 'Gagal memproses permintaan', error: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;
    if (!email || !token || !newPassword) {
      return res.status(400).json({ message: 'Data tidak lengkap' });
    }
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      where: { email, resetPasswordToken: hashedToken },
    });

    if (!user || !user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
      return res.status(400).json({ message: 'Token reset tidak valid atau sudah kedaluwarsa' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    user.mustChangePassword = false;
    await user.save();

    res.json({ message: 'Password berhasil direset, silakan login dengan password baru' });
  } catch (err) {
    res.status(500).json({ message: 'Gagal mereset password', error: err.message });
  }
};

// Ganti password saat sudah login (dipakai juga untuk paksa ganti password default)
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const valid = await bcrypt.compare(currentPassword, req.user.password);
    if (!valid) return res.status(401).json({ message: 'Password saat ini salah' });

    req.user.password = await bcrypt.hash(newPassword, 10);
    req.user.mustChangePassword = false;
    await req.user.save();
    res.json({ message: 'Password berhasil diubah' });
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengubah password', error: err.message });
  }
};
