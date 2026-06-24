const cron = require('node-cron');
const dayjs = require('dayjs');
const { Op } = require('sequelize');
const { MedicationLog, User } = require('../models');
const { sendPushNotifications } = require('./notificationService');
const { sendUpcomingVisitNotifications, markOverdueVisits } = require('../controllers/followUpController');

// Tiap menit: kirim pengingat minum obat tepat waktu
function startReminderCron() {
  cron.schedule('* * * * *', async () => {
    try {
      const now = dayjs();
      const today = now.format('YYYY-MM-DD');
      const currentTime = now.format('HH:mm:00');

      const dueLogs = await MedicationLog.findAll({
        where: { scheduledDate: today, scheduledTime: currentTime, status: 'menunggu' },
        include: [{ association: 'medication', attributes: ['name', 'dosage', 'instructions'] }],
      });
      if (dueLogs.length === 0) return;

      const patientIds = [...new Set(dueLogs.map((l) => l.patientId))];
      const patients = await User.findAll({ where: { id: patientIds } });
      const tokenByPatient = Object.fromEntries(patients.map((p) => [p.id, p.expoPushToken]));

      const messages = dueLogs
        .filter((log) => tokenByPatient[log.patientId])
        .map((log) => ({
          to: tokenByPatient[log.patientId],
          title: '⏰ Waktunya minum obat',
          body: `${log.medication.name}${log.medication.dosage ? ' — ' + log.medication.dosage : ''}`,
          data: { logId: log.id, type: 'medication_reminder' },
        }));
      if (messages.length > 0) await sendPushNotifications(messages);
    } catch (err) {
      console.error('Reminder cron error:', err.message);
    }
  });

  // Tiap 5 menit: tandai obat terlewat & kontrol terlewat
  cron.schedule('*/5 * * * *', async () => {
    try {
      const cutoff = dayjs().subtract(30, 'minute');
      const today = cutoff.format('YYYY-MM-DD');
      const cutoffTime = cutoff.format('HH:mm:00');

      await MedicationLog.update(
        { status: 'terlewat' },
        {
          where: {
            status: 'menunggu',
            [Op.or]: [
              { scheduledDate: { [Op.lt]: today } },
              { scheduledDate: today, scheduledTime: { [Op.lt]: cutoffTime } },
            ],
          },
        }
      );
      await markOverdueVisits();
    } catch (err) {
      console.error('Mark-missed cron error:', err.message);
    }
  });

  // Tiap hari jam 08:00: kirim notifikasi H-1 jadwal kontrol
  cron.schedule('0 8 * * *', async () => {
    try {
      await sendUpcomingVisitNotifications();
    } catch (err) {
      console.error('Visit notification cron error:', err.message);
    }
  });
}

module.exports = { startReminderCron };
