const { Expo } = require('expo-server-sdk');
const expo = new Expo();

/**
 * Kirim push notification ke satu atau banyak expoPushToken.
 * messages: [{ to, title, body, data }]
 */
async function sendPushNotifications(messages) {
  const validMessages = messages.filter((m) => m.to && Expo.isExpoPushToken(m.to));
  if (validMessages.length === 0) return;

  const chunks = expo.chunkPushNotifications(validMessages);
  for (const chunk of chunks) {
    try {
      await expo.sendPushNotificationsAsync(chunk);
    } catch (err) {
      console.error('Gagal kirim push notification:', err.message);
    }
  }
}

module.exports = { sendPushNotifications };
