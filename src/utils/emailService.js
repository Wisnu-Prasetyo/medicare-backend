const nodemailer = require('nodemailer');

// Konfigurasi SMTP diambil dari .env. Bisa pakai Gmail App Password, SendGrid, Mailgun, dll.
// Jika SMTP belum dikonfigurasi (mode development), email tidak benar-benar terkirim,
// tapi link reset akan dicetak ke console supaya tetap bisa ditest.
function getTransporter() {
  if (!process.env.SMTP_HOST) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

async function sendResetPasswordEmail(toEmail, resetUrl) {
  const transporter = getTransporter();
  const subject = 'Reset Password - Medicare Monitor';
  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
      <h2 style="color:#2563EB;">Reset Password</h2>
      <p>Kami menerima permintaan reset password untuk akun Anda di Medicare Monitor.</p>
      <p>Klik tombol di bawah ini untuk membuat password baru (berlaku 1 jam):</p>
      <p><a href="${resetUrl}" style="background:#2563EB;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;">Reset Password</a></p>
      <p>Jika Anda tidak meminta ini, abaikan email ini.</p>
    </div>`;

  if (!transporter) {
    console.log(`[DEV] SMTP belum dikonfigurasi. Link reset password untuk ${toEmail}: ${resetUrl}`);
    return;
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'no-reply@medicare.app',
    to: toEmail,
    subject,
    html,
  });
}

module.exports = { sendResetPasswordEmail };
