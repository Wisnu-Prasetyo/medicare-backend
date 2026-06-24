/**
 * Modul dosis Obat Anti Tuberkulosis (OAT) untuk anak & remaja,
 * mengacu pada "Petunjuk Teknis Tata Laksana Tuberkulosis Anak dan Remaja
 * Indonesia 2023" (Kementerian Kesehatan RI).
 *
 * Sumber tabel:
 *  - Tabel 6.1 : Jenis dan dosis obat anti TBC sensitif obat (mg/kgBB/hari)
 *  - Tabel 6.2 : Paduan OAT pada anak dan remaja (kategori diagnosis -> regimen)
 *  - Tabel 6.3 : Rejimen TBC paru & ekstra paru jangka pendek (4 bulan)
 *  - Tabel 6.5 : Dosis OAT KDT (kombinasi dosis tetap) anak, BB 5-30 kg
 *  - Tabel 6.6 : Dosis OAT KDT dewasa untuk anak/remaja BB >30 kg
 *
 * PENTING: Kalkulator ini adalah ALAT BANTU untuk mempercepat input dokter.
 * Keputusan klinis akhir (pemilihan regimen, penyesuaian dosis, kontraindikasi)
 * tetap sepenuhnya ada di tangan dokter yang merawat.
 */

// ---- Tabel 6.1: dosis harian per kgBB & dosis maksimal harian (mg) ----
const DRUGS = {
  H: { name: 'Isoniazid (INH)', mgPerKgRecommended: 10, mgPerKgMin: 7, mgPerKgMax: 15, maxDailyMg: 300 },
  R: { name: 'Rifampisin', mgPerKgRecommended: 15, mgPerKgMin: 10, mgPerKgMax: 20, maxDailyMg: 600 },
  Z: { name: 'Pirazinamid', mgPerKgRecommended: 35, mgPerKgMin: 30, mgPerKgMax: 40, maxDailyMg: 2000 },
  E: { name: 'Etambutol', mgPerKgRecommended: 20, mgPerKgMin: 15, mgPerKgMax: 25, maxDailyMg: 1000 },
};

// ---- Tabel 6.2: kategori diagnosis -> regimen (fase intensif/lanjutan dalam bulan) ----
// Kode regimen memakai notasi standar TBC: angka = lama bulan, huruf = obat.
const REGIMENS = {
  '2RHZ/4RH': {
    label: 'TBC paru tidak terkonfirmasi bakteriologis (tanpa Etambutol)',
    intensif: { months: 2, drugs: ['R', 'H', 'Z'] },
    lanjutan: { months: 4, drugs: ['R', 'H'] },
  },
  '2RHZE/4RH': {
    label: 'TBC paru terkonfirmasi bakteriologis / remaja ≥15 th / TBC paru berat / TBC dgn HIV',
    intensif: { months: 2, drugs: ['R', 'H', 'Z', 'E'] },
    lanjutan: { months: 4, drugs: ['R', 'H'] },
  },
  '2RHZE/10RH': {
    label: 'Meningitis TBC, TBC tulang, TBC milier',
    intensif: { months: 2, drugs: ['R', 'H', 'Z', 'E'] },
    lanjutan: { months: 10, drugs: ['R', 'H'] },
  },
  '2RHZ/2RH': {
    label: 'Regimen jangka pendek (4 bulan) — anak 3 bln-<12 th, TBC tidak berat (sesuai kriteria ketat)',
    intensif: { months: 2, drugs: ['R', 'H', 'Z'] },
    lanjutan: { months: 2, drugs: ['R', 'H'] },
  },
};

// ---- Tabel 6.5: KDT anak (RHZ 75/50/150 + E 100mg), berat badan 5-30 kg ----
const FDC_PEDIATRIC_TABLE = [
  { minKg: 5, maxKg: 7, rhzTablets: 1, eTablets: 1, rhTablets: 1 },
  { minKg: 8, maxKg: 11, rhzTablets: 2, eTablets: 2, rhTablets: 2 },
  { minKg: 12, maxKg: 16, rhzTablets: 3, eTablets: 3, rhTablets: 3 },
  { minKg: 17, maxKg: 22, rhzTablets: 4, eTablets: 4, rhTablets: 4 },
  { minKg: 23, maxKg: 30, rhzTablets: 5, eTablets: 5, rhTablets: 5 },
];

// ---- Tabel 6.6: KDT dewasa (HRZE 75/150/400/275 & HR 75/150) untuk BB >30 kg ----
const FDC_ADULT_TABLE = [
  { minKg: 31, maxKg: 34, tablets: 3 },
  { minKg: 35, maxKg: 64, tablets: 4 },
  { minKg: 65, maxKg: Infinity, tablets: 5 },
];

function round(num) {
  return Math.round(num * 10) / 10;
}

/**
 * Hitung dosis harian tiap obat (mg) untuk satu pasien berdasarkan berat badan,
 * memakai dosis rekomendasi per Tabel 6.1, dibatasi dosis maksimal harian.
 */
function calculateDrugDose(drugCode, weightKg) {
  const drug = DRUGS[drugCode];
  if (!drug || !weightKg) return null;

  const recommendedMg = Math.min(weightKg * drug.mgPerKgRecommended, drug.maxDailyMg);
  const minMg = Math.min(weightKg * drug.mgPerKgMin, drug.maxDailyMg);
  const maxMg = Math.min(weightKg * drug.mgPerKgMax, drug.maxDailyMg);

  return {
    drugCode,
    drugName: drug.name,
    weightKg,
    recommendedMg: round(recommendedMg),
    rangeMg: { min: round(minMg), max: round(maxMg) },
    maxDailyMg: drug.maxDailyMg,
    isCappedAtMax: weightKg * drug.mgPerKgRecommended > drug.maxDailyMg,
  };
}

/** Saran jumlah tablet KDT (FDC) berdasarkan berat badan, sesuai Tabel 6.5 & 6.6. */
function suggestFdcTablets(weightKg) {
  if (weightKg <= 30) {
    const row = FDC_PEDIATRIC_TABLE.find((r) => weightKg >= r.minKg && weightKg <= r.maxKg);
    if (!row) return null;
    return {
      type: 'KDT Anak (pediatrik)',
      weightKg,
      intensif: `${row.rhzTablets} tablet RHZ (75/50/150) + ${row.eTablets} tablet E 100mg`,
      lanjutan: `${row.rhTablets} tablet RH (75/50)`,
    };
  }
  const row = FDC_ADULT_TABLE.find((r) => weightKg >= r.minKg && weightKg <= r.maxKg);
  if (!row) return null;
  return {
    type: 'KDT Dewasa (untuk anak/remaja BB >30kg)',
    weightKg,
    intensif: `${row.tablets} tablet HRZE (75/150/400/275)`,
    lanjutan: `${row.tablets} tablet HR (75/150)`,
  };
}

/**
 * Hitung rencana terapi lengkap untuk satu regimen TBC: dosis tiap obat per fase,
 * saran tablet KDT, dan total durasi (untuk auto-generate jadwal minum obat).
 */
function calculateRegimenPlan(regimenCode, weightKg) {
  const regimen = REGIMENS[regimenCode];
  if (!regimen) throw new Error(`Regimen ${regimenCode} tidak dikenali`);

  const buildPhase = (phaseData) => ({
    months: phaseData.months,
    durationDays: phaseData.months * 30,
    drugs: phaseData.drugs.map((code) => calculateDrugDose(code, weightKg)),
  });

  return {
    regimenCode,
    label: regimen.label,
    weightKg,
    intensif: buildPhase(regimen.intensif),
    lanjutan: buildPhase(regimen.lanjutan),
    fdcSuggestion: suggestFdcTablets(weightKg),
  };
}

function listRegimens() {
  return Object.entries(REGIMENS).map(([code, r]) => ({
    code,
    label: r.label,
    intensifMonths: r.intensif.months,
    lanjutanMonths: r.lanjutan.months,
    intensifDrugs: r.intensif.drugs,
    lanjutanDrugs: r.lanjutan.drugs,
  }));
}

module.exports = {
  DRUGS,
  REGIMENS,
  calculateDrugDose,
  suggestFdcTablets,
  calculateRegimenPlan,
  listRegimens,
};
