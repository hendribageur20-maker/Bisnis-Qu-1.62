// License, Device ID, and App Migration Manager for Bengkel Qu

import { ProDurationOption, ProTierOption, DeviceSlotInfo, DeviceSlotRole, DevicePairingToken, SubscriptionPlanId, SubscriptionState } from '../types';

export const APP_VERSION = '2.4.0';
export const DEVELOPER_EMAIL = 'bageurhendri@gmail.com';
const LICENSE_SECRET_SALT = 'BAGEUR-HENDRI-BENGKEL-PRO-2026-KEY';

export interface ProTierMeta {
  id: ProTierOption;
  name: string;
  tagline: string;
  codePrefix: string;
  dailyRate: number; // 1000, 2000, 3000
  rateLabel: string;
  features: string[];
}

export const PRO_TIERS: Record<string, ProTierMeta> = {
  basic: {
    id: 'basic',
    name: 'Basic (Freemium)',
    tagline: 'Gratis / Kasir Dasar',
    codePrefix: 'BASIC',
    dailyRate: 0,
    rateLabel: 'Gratis (Rp 0)',
    features: [
      'Kasir Dasar (Penjualan, Struk Fisik & WhatsApp)',
      'Registrasi & Antrian Servis Kendaraan',
      'Katalog Sparepart & Stok Minimum',
      '100% Gratis Selamanya (Solo Mode)'
    ]
  },
  core: {
    id: 'core',
    name: 'Core / Pro',
    tagline: 'Multi-User, CRM & Otorisasi Lengkap',
    codePrefix: 'CORE',
    dailyRate: 1000,
    rateLabel: 'Rp 1.000 / hari',
    features: [
      'Semua fitur Basic (Freemium)',
      'Multi-User (Supervisor, Kasir, Mekanik)',
      'Matriks Otorisasi Hak Akses Role SPV & Kasir',
      'Modul Marketing (Broadcast WhatsApp & Voucher Diskon)',
      'Modul CRM Pelanggan & Riwayat Servis Lengkap',
      'Modul Piutang & Kas Kecil Operasional',
      'Akses Cloud Server & Multi-Perangkat (3 HP)'
    ]
  },
  addon_branch: {
    id: 'addon_branch',
    name: 'Add-On (+1 Cabang)',
    tagline: 'Modul Opsional Penambahan Cabang',
    codePrefix: 'BRANCH',
    dailyRate: 1000,
    rateLabel: 'Rp 1.000 / hari',
    features: [
      'Modul Opsional Penambahan +1 Cabang Baru',
      'Pengelolaan Multi-Cabang Bengkel Terintegrasi',
      'Laporan Komparasi Omset & Laba Antar Cabang',
      'Dapat Diaktifkan Bersama Paket Core / Pro'
    ]
  },
  AddOnBranch: {
    id: 'AddOnBranch',
    name: 'Add-On (+1 Cabang)',
    tagline: 'Modul Opsional Penambahan Cabang',
    codePrefix: 'BRANCH',
    dailyRate: 1000,
    rateLabel: 'Rp 1.000 / hari',
    features: [
      'Modul Opsional Penambahan +1 Cabang Baru',
      'Pengelolaan Multi-Cabang Bengkel Terintegrasi',
      'Laporan Komparasi Omset & Laba Antar Cabang',
      'Dapat Diaktifkan Bersama Paket Core / Pro'
    ]
  },
  corporate: {
    id: 'corporate',
    name: 'Add-On (+1 Cabang)',
    tagline: 'Modul Opsional Penambahan Cabang',
    codePrefix: 'BRANCH',
    dailyRate: 1000,
    rateLabel: 'Rp 1.000 / hari',
    features: [
      'Modul Opsional Penambahan +1 Cabang Baru',
      'Pengelolaan Multi-Cabang Bengkel Terintegrasi',
      'Laporan Komparasi Omset & Laba Antar Cabang',
      'Dapat Diaktifkan Bersama Paket Core / Pro'
    ]
  }
};

export const DURATION_DAYS_MAP: Record<ProDurationOption, number> = {
  1: 30,
  3: 90,
  6: 180,
  12: 365
};

/**
 * Menghitung total harga investasi berdasarkan paket tier dan durasi bulan
 * Contoh:
 * - Basic = Gratis (Rp 0)
 * - Core 1 bln = 30 * 1000 = Rp 30.000
 * - Core 3 bln = 90 * 1000 = Rp 90.000
 * - Core 6 bln = 180 * 1000 = Rp 180.000
 * - Core 12 bln = 365 * 1000 = Rp 365.000
 */
export function calculateTierPrice(tier: ProTierOption, months: ProDurationOption): {
  days: number;
  dailyRate: number;
  totalPrice: number;
  formattedPrice: string;
} {
  const days = DURATION_DAYS_MAP[months] || 30;
  const meta = PRO_TIERS[tier] || PRO_TIERS.core;
  const dailyRate = meta?.dailyRate ?? 1000;
  const totalPrice = days * dailyRate;

  return {
    days,
    dailyRate,
    totalPrice,
    formattedPrice: dailyRate === 0 ? 'Gratis (Rp 0)' : `Rp ${totalPrice.toLocaleString('id-ID')}`
  };
}

export interface AddonBranchProrateCalculation {
  isProrated: boolean;
  days: number;
  dailyRate: number;
  totalPrice: number;
  formattedPrice: string;
  coreExpiryDate?: number;
  coreExpiryFormatted?: string;
  explanation: string;
}

/**
 * Menghitung kalkulasi tagihan dinamis PRO-RATA untuk perpanjangan Add-On Cabang.
 * Otomatis menghitung sisa hari mengikuti tanggal kedaluwarsa paket Core/Pro yang sedang aktif
 * agar tanggal kedaluwarsa cabang dan paket Pro selalu sinkron 100%.
 */
export function calculateAddonBranchProrate(
  coreExpiryDate?: number,
  now: number = Date.now(),
  fallbackMonths: ProDurationOption = 1
): AddonBranchProrateCalculation {
  const dailyRate = 1000;
  
  if (coreExpiryDate && coreExpiryDate > now) {
    const diffMs = coreExpiryDate - now;
    const remainingDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    const totalPrice = remainingDays * dailyRate;
    const formattedDate = new Date(coreExpiryDate).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    return {
      isProrated: true,
      days: remainingDays,
      dailyRate,
      totalPrice,
      formattedPrice: `Rp ${totalPrice.toLocaleString('id-ID')}`,
      coreExpiryDate,
      coreExpiryFormatted: formattedDate,
      explanation: `Dihitung pro-rata dinamis (${remainingDays} hari × Rp 1.000) mengikuti sisa masa aktif Core/Pro agar tanggal kedaluwarsa selalu sinkron (${formattedDate}).`
    };
  }

  // Jika paket Core/Pro belum aktif atau sudah expired
  const standardDays = DURATION_DAYS_MAP[fallbackMonths] || 30;
  const totalPrice = standardDays * dailyRate;
  const targetDate = now + standardDays * 24 * 60 * 60 * 1000;
  const formattedDate = new Date(targetDate).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return {
    isProrated: false,
    days: standardDays,
    dailyRate,
    totalPrice,
    formattedPrice: `Rp ${totalPrice.toLocaleString('id-ID')}`,
    coreExpiryDate: targetDate,
    coreExpiryFormatted: formattedDate,
    explanation: `Paket Core/Pro belum aktif. Add-On dihitung berdasarkan durasi standar ${fallbackMonths} Bulan (${standardDays} hari).`
  };
}

/**
 * Algoritma hash deterministik FNV-1a untuk verifikasi serial number & hardware fingerprint
 */
function hashString(str: string): string {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  const unsigned = hash >>> 0;
  return unsigned.toString(16).padStart(8, '0').toUpperCase();
}

/**
 * Menghasilkan sidik jari fisik perangkat (Hardware Fingerprint) yang konsisten.
 * Terikat ke spesifikasi fisik layar, core CPU, platform OS, dan timezone perangkat.
 * Hal ini memastikan Device ID tetap sama meskipun aplikasi di-uninstall lalu di-install ulang di HP yang sama!
 */
export function computeHardwareFingerprint(): string {
  try {
    const screenInfo = typeof window !== 'undefined' && window.screen 
      ? `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}` 
      : '360x640x24';
    const cpuCores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4;
    const lang = typeof navigator !== 'undefined' ? navigator.language || 'id' : 'id';
    const tz = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Jakarta' : 'Asia/Jakarta';
    const platform = typeof navigator !== 'undefined' 
      ? (navigator as any).userAgentData?.platform || navigator.platform || 'Linux armv8l' 
      : 'Android';
    
    const raw = `${screenInfo}|${cpuCores}|${lang}|${tz}|${platform}|BQ-HARDWARE-ROOT-KEY`;
    const fullHash = hashString(raw);
    const p1 = fullHash.substring(0, 4);
    const p2 = fullHash.substring(4, 8);

    return `BQ-DEV-${p1}-${p2}`;
  } catch (e) {
    return 'BQ-DEV-87C2-91B4';
  }
}

/**
 * Mendapatkan atau membuat Device ID unik persisten untuk perangkat ini.
 * Memadukan penyimpanan lokal dengan sidik jari hardware deterministik.
 * Format: BQ-DEV-XXXX-XXXX
 */
export function getOrCreateDeviceId(): string {
  const existingId = localStorage.getItem('bq_device_id');
  if (existingId && existingId.trim().length > 0) {
    return existingId.trim();
  }

  // Gunakan Hardware Fingerprint deterministik agar Device ID tidak berubah saat re-install
  const persistentDeviceId = computeHardwareFingerprint();
  localStorage.setItem('bq_device_id', persistentDeviceId);
  return persistentDeviceId;
}

/**
 * Formula Pembuatan Serial Number oleh Developer (Hendri)
 * Format: BQPRO-[TIER]-[DURATION]M-[PART1]-[PART2]
 * Contoh:
 * - Basic 1 Bulan: BQPRO-BASIC-1M-9F2B-A103
 * - Core 3 Bulan: BQPRO-CORE-3M-4C21-7B89
 * - Enterprise 12 Bulan: BQPRO-ENT-12M-E65A-3B19
 */
export function generateSerialNumber(
  deviceId: string,
  tier: ProTierOption = 'core',
  months: ProDurationOption = 1
): string {
  const cleanDevice = deviceId.trim().toUpperCase();
  const prefix = PRO_TIERS[tier]?.codePrefix || 'CORE';
  const payload = `${cleanDevice}|${prefix}|${months}M|${LICENSE_SECRET_SALT}`;
  const fullHash = hashString(payload);
  const part1 = fullHash.substring(0, 4);
  const part2 = fullHash.substring(4, 8);

  return `BQPRO-${prefix}-${months}M-${part1}-${part2}`;
}

/**
 * Validasi Serial Number yang diinputkan pengguna berdasarkan Device ID
 */
export function validateSerialNumber(
  deviceId: string,
  inputSerial: string
): { 
  isValid: boolean; 
  tier?: ProTierOption; 
  months?: ProDurationOption; 
  dailyRate?: number;
  error?: string 
} {
  if (!inputSerial || !inputSerial.trim()) {
    return { isValid: false, error: 'Serial number tidak boleh kosong.' };
  }

  const normalized = inputSerial.trim().toUpperCase();

  // Master Developer Override Key (untuk testing / darurat oleh Hendri)
  if (normalized === 'BAGEUR-DEV-MASTER-2026') {
    return { 
      isValid: true, 
      tier: 'core', 
      months: 12, 
      dailyRate: 1000 
    };
  }

  const tiers: ProTierOption[] = ['basic', 'core', 'addon_branch', 'corporate'];
  const durationOptions: ProDurationOption[] = [1, 3, 6, 12];

  for (const t of tiers) {
    for (const m of durationOptions) {
      // 1. Cek format baru dengan prefix tier
      const expectedKey = generateSerialNumber(deviceId, t, m);
      if (normalized === expectedKey) {
        return { 
          isValid: true, 
          tier: t, 
          months: m, 
          dailyRate: PRO_TIERS[t].dailyRate 
        };
      }

      // 2. Cek format warisan BQPRO-[DURASI]M-... (default ke core pro)
      const legacyPayload = `${deviceId.trim().toUpperCase()}|${m}M|${LICENSE_SECRET_SALT}`;
      const legacyHash = hashString(legacyPayload);
      const legacyKey = `BQPRO-${m}M-${legacyHash.substring(0, 4)}-${legacyHash.substring(4, 8)}`;
      if (normalized === legacyKey) {
        return { 
          isValid: true, 
          tier: 'core', 
          months: m, 
          dailyRate: 2000 
        };
      }
    }
  }

  return {
    isValid: false,
    error: 'Serial number tidak cocok dengan Device ID ini atau format tidak valid.'
  };
}

/**
 * Helper untuk menyusun link mailto ke developer bageurhendri@gmail.com
 */
export function buildMailtoRequest(
  deviceId: string,
  tier: ProTierOption,
  months: ProDurationOption,
  workshopName: string = 'Bengkel Saya',
  contactPhone: string = '',
  prorateInfo?: {
    isProrated: boolean;
    days: number;
    formattedPrice: string;
    coreExpiryFormatted?: string;
  }
): string {
  const tierMeta = PRO_TIERS[tier] || PRO_TIERS.core;
  const isBranchAddon = tier === 'addon_branch' || tier === 'corporate' || tier === 'AddOnBranch';
  const priceInfo = calculateTierPrice(tier, months);
  
  let durationLabel = `${months} Bulan (${priceInfo.days} Hari)`;
  let priceFormatted = priceInfo.formattedPrice;
  let formulaInfo = `${priceInfo.days} hari × ${tierMeta.rateLabel}`;
  let extraNotes = '';

  if (isBranchAddon && prorateInfo?.isProrated) {
    durationLabel = `Pro-Rata ${prorateInfo.days} Hari (Sinkronisasi Masa Aktif Core/Pro)`;
    priceFormatted = prorateInfo.formattedPrice;
    formulaInfo = `${prorateInfo.days} hari × Rp 1.000 / hari`;
    extraNotes = `\n• Target Sinkronisasi : Kedaluwarsa sinkron pada ${prorateInfo.coreExpiryFormatted || '-'}`;
  }

  const subject = encodeURIComponent(
    isBranchAddon && prorateInfo?.isProrated
      ? `Permintaan Serial Number [Add-On Cabang Pro-Rata ${prorateInfo.days} Hari] - ${deviceId}`
      : `Permintaan Serial Number [${tierMeta.name}] [${months} Bulan] - ${deviceId}`
  );

  const body = encodeURIComponent(
`Kepada Yth. Developer Bengkel Qu (Hendri)
Email: ${DEVELOPER_EMAIL}

Halo Mas Hendri,
Saya ingin mengajukan aktivasi / perpanjangan lisensi Bengkel Qu PRO untuk perangkat bengkel saya:

• Device ID       : ${deviceId}
• Pilihan Paket   : ${tierMeta.name} (${tierMeta.rateLabel})
• Pilihan Durasi  : ${durationLabel}
• Total Investasi : ${priceFormatted} (${formulaInfo})${extraNotes}
• Nama Bengkel    : ${workshopName}
• Kontak / WA     : ${contactPhone || '-'}
• Tanggal Request : ${new Date().toLocaleDateString('id-ID')}

Mohon dibuatkan Serial Number aktivasi PRO berdasarkan kalkulasi tagihan di atas.
Terima kasih!`
  );

  return `mailto:${DEVELOPER_EMAIL}?subject=${subject}&body=${body}`;
}

/**
 * Adaptasi & migrasi otomatis data tanpa perlu uninstall aplikasi.
 * Dipanggil saat aplikasi dimuat atau diperbarui untuk memastikan struktur data selalu kompatibel.
 */
export function checkAndMigrateAppData(): {
  previousVersion: string | null;
  currentVersion: string;
  isUpdated: boolean;
} {
  const previousVersion = localStorage.getItem('bq_app_version');
  const isUpdated = previousVersion !== APP_VERSION;

  const coreKeys = [
    { key: 'bq_queues', fallback: '[]' },
    { key: 'bq_spareparts', fallback: '[]' },
    { key: 'bq_transactions', fallback: '[]' },
    { key: 'bq_customers', fallback: '[]' },
    { key: 'bq_damaged_goods', fallback: '[]' },
    { key: 'bq_procurements', fallback: '[]' },
    { key: 'bq_campaigns', fallback: '[]' },
    { key: 'bq_vouchers', fallback: '[]' },
    { key: 'bq_kas_kecil', fallback: '[]' },
    { key: 'bq_notifs', fallback: '[]' }
  ];

  for (const { key, fallback } of coreKeys) {
    const val = localStorage.getItem(key);
    if (val) {
      try {
        JSON.parse(val);
      } catch (e) {
        localStorage.setItem(key, fallback);
      }
    }
  }

  localStorage.setItem('bq_app_version', APP_VERSION);
  localStorage.setItem('bq_last_launch', new Date().toISOString());

  return {
    previousVersion,
    currentVersion: APP_VERSION,
    isUpdated
  };
}

/**
 * Mendapatkan atau membuat Workshop ID unik untuk akun bengkel
 */
export function getOrCreateWorkshopId(): string {
  const existing = localStorage.getItem('bq_workshop_id');
  if (existing && existing.trim().length > 0) return existing.trim();

  const deviceId = getOrCreateDeviceId();
  const clean = deviceId.replace(/[^A-Z0-9]/g, '');
  const id = `WS-BENGKEL-${clean.slice(-4) || '8821'}`;
  localStorage.setItem('bq_workshop_id', id);
  return id;
}

/**
 * Mendapatkan batas maksimal slot HP berdasarkan paket aktif
 * Basic / Free / Trial: 1 HP (Solo Mode Lokal)
 * Core Pro: 3 HP
 * Enterprise Pro: 9 HP (Multi-Cabang)
 */
export function getMaxSlotsForPlan(planId: SubscriptionPlanId): number {
  if (planId === 'corporate' || planId === 'addon_branch' || planId === 'AddOnBranch') return 9;
  if (planId === 'core') return 3;
  return 1;
}

/**
 * Memuat daftar slot HP yang terdaftar untuk bengkel ini.
 */
export function loadDeviceSlots(
  planId: SubscriptionPlanId,
  currentDeviceId: string,
  workshopName: string = 'Bengkel Qu'
): DeviceSlotInfo[] {
  const maxSlots = getMaxSlotsForPlan(planId);
  const raw = localStorage.getItem('bq_device_slots');
  let slots: DeviceSlotInfo[] = [];

  if (raw) {
    try {
      slots = JSON.parse(raw);
    } catch (e) {
      slots = [];
    }
  }

  // Jika slot kosong, inisialisasi default
  if (!slots || slots.length === 0) {
    slots = [
      {
        slotNumber: 1,
        deviceId: currentDeviceId,
        deviceName: `HP Master (${workshopName})`,
        role: 'Owner',
        branchId: 'CABANG-PUSAT',
        branchName: 'Cabang Utama',
        status: 'active',
        isCurrentDevice: true,
        lastSyncTime: 'Baru saja'
      }
    ];

    // Jika Core, buat slot 2 & 3 sebagai pending/empty
    if (maxSlots >= 3) {
      slots.push({
        slotNumber: 2,
        deviceId: '',
        deviceName: 'HP Kasir POS',
        role: 'Kasir',
        branchId: 'CABANG-PUSAT',
        branchName: 'Cabang Utama',
        status: 'empty',
        isCurrentDevice: false,
        lastSyncTime: 'Belum Terhubung'
      });
      slots.push({
        slotNumber: 3,
        deviceId: '',
        deviceName: 'HP Mekanik Front Desk',
        role: 'Mekanik',
        branchId: 'CABANG-PUSAT',
        branchName: 'Cabang Utama',
        status: 'empty',
        isCurrentDevice: false,
        lastSyncTime: 'Belum Terhubung'
      });
    }

    // Jika Enterprise (9 slots, 3 cabang)
    if (maxSlots >= 9) {
      const branches = [
        { id: 'CABANG-PUSAT', name: 'Cabang Utama' },
        { id: 'CABANG-TIMUR', name: 'Cabang Timur' },
        { id: 'CABANG-BARAT', name: 'Cabang Barat' }
      ];

      slots = [];
      let counter = 1;
      for (const br of branches) {
        slots.push({
          slotNumber: counter++,
          deviceId: counter === 2 ? currentDeviceId : '',
          deviceName: `HP SPV (${br.name})`,
          role: counter === 2 ? 'Owner' : 'Supervisor',
          branchId: br.id,
          branchName: br.name,
          status: counter === 2 ? 'active' : 'empty',
          isCurrentDevice: counter === 2,
          lastSyncTime: counter === 2 ? 'Baru saja' : 'Belum Terhubung'
        });
        slots.push({
          slotNumber: counter++,
          deviceId: '',
          deviceName: `HP Kasir (${br.name})`,
          role: 'Kasir',
          branchId: br.id,
          branchName: br.name,
          status: 'empty',
          isCurrentDevice: false,
          lastSyncTime: 'Belum Terhubung'
        });
        slots.push({
          slotNumber: counter++,
          deviceId: '',
          deviceName: `HP Mekanik (${br.name})`,
          role: 'Mekanik',
          branchId: br.id,
          branchName: br.name,
          status: 'empty',
          isCurrentDevice: false,
          lastSyncTime: 'Belum Terhubung'
        });
      }
    }

    localStorage.setItem('bq_device_slots', JSON.stringify(slots));
  }

  // Tandai perangkat saat ini
  return slots.slice(0, maxSlots).map((s) => ({
    ...s,
    isCurrentDevice: s.deviceId === currentDeviceId
  }));
}

/**
 * Menyimpan daftar slot HP ke penyimpanan lokal
 */
export function saveDeviceSlots(slots: DeviceSlotInfo[]): void {
  localStorage.setItem('bq_device_slots', JSON.stringify(slots));
}

/**
 * Membuat Token Pairing untuk HP Karyawan (Format JSON & 6-Digit Code)
 */
export function createPairingPayload(
  workshopId: string,
  workshopName: string,
  planId: 'core' | 'corporate' | 'addon_branch' | 'AddOnBranch',
  slotNumber: number,
  role: DeviceSlotRole,
  branchId?: string,
  branchName?: string
): { jsonString: string; quickCode: string } {
  const seed = `${workshopId}-${slotNumber}-${Date.now()}`;
  const quickCode = hashString(seed).slice(0, 6);

  const payload: DevicePairingToken = {
    workshopId,
    workshopName,
    tier: planId,
    slotNumber,
    role,
    branchId: branchId || 'CABANG-PUSAT',
    branchName: branchName || 'Cabang Utama',
    createdAt: Date.now(),
    pairingCode: quickCode
  };

  return {
    jsonString: JSON.stringify(payload),
    quickCode
  };
}

/**
 * Evaluasi status langganan dan masa trial secara berkala.
 * Logika Fallback Aman (100% Data Aman):
 * - Jika Core/Pro atau Trial habis masa aktifnya, otomatis mengembalikan mode aplikasi ke Basic (Freemium).
 * - Tidak ada data database lokal (antrian, stok, transaksi, cabang) yang dihapus atau dirusak.
 */
export function evaluateSubscriptionState(
  savedState: SubscriptionState,
  deviceId: string = getOrCreateDeviceId(),
  now: number = Date.now()
): {
  state: SubscriptionState;
  hasExpired: boolean;
  expiredNotice?: string;
} {
  const currentDevId = deviceId || savedState.deviceId || getOrCreateDeviceId();
  let hasExpired = false;
  let expiredNotice: string | undefined = undefined;

  let isSubscribed = savedState.isSubscribed;
  let planId = savedState.planId;
  let planName = savedState.planName;
  let dailyRate = savedState.dailyRate;
  let isTrialActive = savedState.isTrialActive;
  let trialDaysRemaining = savedState.trialDaysRemaining;

  // 1. Evaluasi Langganan Pro Berbayar
  if (savedState.isSubscribed && savedState.subscriptionExpiryDate) {
    if (savedState.subscriptionExpiryDate > now) {
      isSubscribed = true;
      isTrialActive = false;
    } else {
      // EXPIRED -> Fallback ke Basic Freemium
      isSubscribed = false;
      isTrialActive = false;
      planId = 'basic';
      planName = 'Basic (Freemium) - Kasir Dasar';
      dailyRate = 0;
      hasExpired = true;
      expiredNotice = 'Masa aktif langganan Core/Pro telah berakhir. Mode beralih ke Basic (Freemium). Seluruh data transaksi, stok, dan cabang Anda tetap tersimpan 100% aman!';
    }
  } else if (savedState.isTrialActive) {
    // 2. Evaluasi Masa Trial 10 Hari Core/Pro
    const trialStart = savedState.trialStartDate || now;
    const daysPassed = Math.floor((now - trialStart) / (1000 * 60 * 60 * 24));
    trialDaysRemaining = Math.max(0, (savedState.trialDurationDays || 10) - daysPassed);
    if (trialDaysRemaining > 0) {
      isTrialActive = true;
    } else {
      // TRIAL EXPIRED -> Fallback ke Basic Freemium
      isTrialActive = false;
      trialDaysRemaining = 0;
      planId = 'basic';
      planName = 'Basic (Freemium) - Kasir Dasar';
      dailyRate = 0;
      hasExpired = true;
      expiredNotice = 'Masa uji coba trial 10 hari telah usai. Mode beralih ke Basic (Freemium). Seluruh data transaksi, pelanggan, dan cabang Anda tetap tersimpan 100% aman!';
    }
  }

  // 3. Evaluasi Trial Add-On Cabang
  let isBranchTrialActive = savedState.isBranchTrialActive || false;
  let branchTrialDaysRemaining = savedState.branchTrialDaysRemaining ?? 0;
  if (savedState.isBranchTrialActive && savedState.branchTrialStartDate) {
    const branchDaysPassed = Math.floor((now - savedState.branchTrialStartDate) / (1000 * 60 * 60 * 24));
    branchTrialDaysRemaining = Math.max(0, (savedState.branchTrialDurationDays || 10) - branchDaysPassed);
    if (branchTrialDaysRemaining > 0) {
      isBranchTrialActive = true;
    } else {
      // TRIAL CABANG EXPIRED -> Cabang tambahan terkunci, data tetap aman
      isBranchTrialActive = false;
      branchTrialDaysRemaining = 0;
      if (planId === 'addon_branch' || planId === 'AddOnBranch') {
        if (!isSubscribed) {
          planId = 'basic';
          planName = 'Basic (Freemium) - Kasir Dasar';
          dailyRate = 0;
        }
      }
      hasExpired = true;
      if (!expiredNotice) {
        expiredNotice = 'Masa trial Add-On Cabang 10 hari telah berakhir. Slot cabang tambahan dikunci dari transaksi baru. Seluruh data cabang tetap tersimpan 100% aman!';
      }
    }
  }

  // 4. Evaluasi Langganan Add-On Cabang Berbayar
  let isBranchSubscribed = savedState.isBranchSubscribed || false;
  if (savedState.isBranchSubscribed && savedState.branchExpiryDate) {
    if (savedState.branchExpiryDate <= now) {
      isBranchSubscribed = false;
      if (planId === 'addon_branch' || planId === 'AddOnBranch') {
        if (!isSubscribed) {
          planId = 'basic';
          planName = 'Basic (Freemium) - Kasir Dasar';
          dailyRate = 0;
        }
      }
      hasExpired = true;
      if (!expiredNotice) {
        expiredNotice = 'Masa aktif Add-On Cabang telah berakhir. Slot cabang tambahan dikunci dari transaksi baru. Seluruh data cabang tetap tersimpan 100% aman!';
      }
    }
  }

  const updated: SubscriptionState = {
    ...savedState,
    deviceId: currentDevId,
    planId,
    planName,
    dailyRate,
    isSubscribed,
    isTrialActive,
    trialDaysRemaining,
    isBranchTrialActive,
    branchTrialDaysRemaining,
    isBranchSubscribed
  };

  return {
    state: updated,
    hasExpired,
    expiredNotice
  };
}

/**
 * Aktivasi Trial 10 Hari untuk Add-On Cabang secara LANGSUNG AKTIF (Auto-ON)
 */
export function activateBranchTrial(
  currentState: SubscriptionState,
  now: number = Date.now()
): {
  updatedState: SubscriptionState;
  message: string;
} {
  const updatedState: SubscriptionState = {
    ...currentState,
    planId: 'addon_branch',
    planName: 'Add-On (+1 Cabang) Trial',
    isBranchTrialActive: true,
    branchTrialStartDate: now,
    branchTrialDurationDays: 10,
    branchTrialDaysRemaining: 10
  };

  localStorage.setItem('bq_subscription', JSON.stringify(updatedState));

  return {
    updatedState,
    message: 'Trial Add-On Cabang 10 Hari berhasil diaktifkan (Auto-ON)! Seluruh fitur multi-cabang kini terbuka penuh.'
  };
}

