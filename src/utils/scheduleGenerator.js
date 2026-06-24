/**
 * Auto-generate jam minum obat berdasarkan frekuensi per hari.
 * Aturan default (umum dipakai di dunia medis untuk interval merata):
 *  - 1x sehari  -> 18:00 (malam)
 *  - 2x sehari  -> 08:00, 18:00     (interval ~10 jam, pagi & malam)
 *  - 3x sehari  -> 08:00, 12:00, 18:00  (pagi, siang, malam - sesuai pola makan)
 *  - 4x sehari  -> 06:00, 12:00, 18:00, 24:00 (interval 6 jam)
 *  - >4x sehari -> dibagi rata mulai jam 06:00 dengan interval 24/frequency jam
 *
 * Dokter/admin tetap bisa override jam manual setelah digenerate (lihat
 * medicationController.updateSchedule).
 */

const PRESET = {
  1: [{ time: '18:00', label: 'Malam' }],
  2: [
    { time: '08:00', label: 'Pagi' },
    { time: '18:00', label: 'Malam' },
  ],
  3: [
    { time: '08:00', label: 'Pagi' },
    { time: '12:00', label: 'Siang' },
    { time: '18:00', label: 'Malam' },
  ],
  4: [
    { time: '06:00', label: 'Pagi' },
    { time: '12:00', label: 'Siang' },
    { time: '18:00', label: 'Sore' },
    { time: '00:00', label: 'Malam' },
  ],
};

function pad(num) {
  return String(num).padStart(2, '0');
}

function generateScheduleTimes(frequencyPerDay) {
  if (PRESET[frequencyPerDay]) return PRESET[frequencyPerDay];

  // fallback: bagi rata 24 jam mulai jam 06:00
  const interval = 24 / frequencyPerDay;
  const result = [];
  let startHour = 6;
  for (let i = 0; i < frequencyPerDay; i++) {
    const hourFloat = (startHour + i * interval) % 24;
    const hour = Math.floor(hourFloat);
    const minute = Math.round((hourFloat - hour) * 60);
    result.push({
      time: `${pad(hour)}:${pad(minute)}`,
      label: `Dosis ke-${i + 1}`,
    });
  }
  return result;
}

module.exports = { generateScheduleTimes };
