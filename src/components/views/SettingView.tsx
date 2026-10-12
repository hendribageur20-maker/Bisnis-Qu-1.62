import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Palette, 
  Database, 
  UploadCloud, 
  RotateCcw, 
  Check, 
  Download, 
  AlertTriangle, 
  Sparkles,
  ShieldAlert,
  Info,
  Key,
  Copy,
  Mail,
  Crown,
  Laptop,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Zap,
  Trash2,
  RefreshCw,
  Layers,
  FileCheck,
  X,
  Users,
  Building2
} from 'lucide-react';
import { 
  ServiceQueue, 
  Sparepart, 
  Transaction, 
  CustomerVehicle, 
  WorkshopProfile, 
  RolePermissionConfig, 
  BranchItem,
  UserSession,
  DamagedGood,
  ProcurementRecord,
  MarketingCampaign,
  PromoVoucher,
  ExpenseItem,
  SubscriptionState,
  ProDurationOption,
  ProTierOption
} from '../../types';
import { 
  getOrCreateDeviceId, 
  buildMailtoRequest, 
  DEVELOPER_EMAIL, 
  APP_VERSION, 
  checkAndMigrateAppData,
  PRO_TIERS,
  calculateTierPrice
} from '../../utils/licenseManager';

interface SettingViewProps {
  initialTab?: string;
  onBack: () => void;
  queues: ServiceQueue[];
  spareparts: Sparepart[];
  transactions: Transaction[];
  customers: CustomerVehicle[];
  damagedGoods?: DamagedGood[];
  procurements?: ProcurementRecord[];
  campaigns?: MarketingCampaign[];
  vouchers?: PromoVoucher[];
  expenses?: ExpenseItem[];
  profile: WorkshopProfile;
  permissions: RolePermissionConfig[];
  branches: BranchItem[];
  onRestoreData: (backupData: any) => void;
  onResetData: (mode: 'daily' | 'factory' | 'clean_slate') => void;
  userSession?: UserSession | null;
  onLogout?: () => void;
  subscription?: SubscriptionState;
  onActivateSerialKey?: (serialKey: string) => { success: boolean; message: string };
  onReloadDemoData?: () => void;
  onNavigateToDevices?: () => void;
}

export const SettingView: React.FC<SettingViewProps> = ({
  initialTab = 'setting-tema',
  onBack,
  queues,
  spareparts,
  transactions,
  customers,
  damagedGoods = [],
  procurements = [],
  campaigns = [],
  vouchers = [],
  expenses = [],
  profile,
  permissions,
  branches,
  onRestoreData,
  onResetData,
  userSession,
  onLogout,
  subscription,
  onActivateSerialKey,
  onReloadDemoData,
  onNavigateToDevices
}) => {
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  // 1. Theme State
  const [selectedTheme, setSelectedTheme] = useState<'emerald' | 'teal' | 'forest' | 'lime'>(() => {
    return (localStorage.getItem('bq_theme') as any) || 'emerald';
  });
  const [themeSaved, setThemeSaved] = useState(false);

  // 2. Backup Options State
  const [backupOptions, setBackupOptions] = useState({
    queues: true,
    spareparts: true,
    transactions: true,
    customers: true,
    damagedGoods: true,
    procurements: true,
    campaigns: true,
    vouchers: true,
    expenses: true,
    profile: true,
    permissions: true,
    branches: true
  });
  const [backupDownloaded, setBackupDownloaded] = useState(false);

  // 3. Restore State
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restorePreview, setRestorePreview] = useState<any | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [restoreSuccess, setRestoreSuccess] = useState(false);

  // 4. Reset State (Clean slate vs demo vs daily)
  const [resetConfirmationText, setResetConfirmationText] = useState('');
  const [resetModalMode, setResetModalMode] = useState<'daily' | 'factory' | 'clean_slate' | null>(null);
  const [resetSuccessNotice, setResetSuccessNotice] = useState<string | null>(null);

  // 5. Activation State (Tier & Durasi)
  const deviceId = subscription?.deviceId || getOrCreateDeviceId();
  const [selectedTier, setSelectedTier] = useState<ProTierOption>('core');
  const [selectedDuration, setSelectedDuration] = useState<ProDurationOption>(1);
  const [inputSerial, setInputSerial] = useState('');
  const [activationResult, setActivationResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedDeviceId, setCopiedDeviceId] = useState(false);
  const [copiedEmailText, setCopiedEmailText] = useState(false);

  // 6. Update App State
  const [migrationStatus, setMigrationStatus] = useState<{ checked: boolean; msg: string } | null>(null);

  // Theme Choices
  const THEMES = [
    {
      id: 'emerald',
      name: 'Hijau Emerald (Standar Bengkel Qu)',
      desc: 'Warna resmi hijau bersih yang sejuk dan profesional',
      color: '#008952',
      badge: 'Aktif'
    },
    {
      id: 'teal',
      name: 'Teal Mint Modern',
      desc: 'Nuansa biru-kehijauan cerah ala aplikasi fintech modern',
      color: '#0d9488',
      badge: 'Pilihan'
    },
    {
      id: 'forest',
      name: 'Hijau Forest Solid',
      desc: 'Warna hijau daun pekat dengan kontras tinggi',
      color: '#15803d',
      badge: 'Pilihan'
    },
    {
      id: 'lime',
      name: 'Lime Racing Otomotif',
      desc: 'Warna hijau sporty terinspirasi arena balap motor',
      color: '#65a30d',
      badge: 'Sporty'
    }
  ];

  const DURATION_OPTIONS: {
    months: ProDurationOption;
    days: number;
    label: string;
    sublabel: string;
    badge?: string;
    priceEstimate: string;
  }[] = [
    {
      months: 1,
      days: 30,
      label: '1 Bulan',
      sublabel: '30 Hari Operasional',
      priceEstimate: 'Rp 30.000'
    },
    {
      months: 3,
      days: 90,
      label: '3 Bulan',
      sublabel: '90 Hari (Kuartal)',
      badge: 'Hemat 5%',
      priceEstimate: 'Rp 85.000'
    },
    {
      months: 6,
      days: 180,
      label: '6 Bulan',
      sublabel: '180 Hari (Semester)',
      badge: 'Populer',
      priceEstimate: 'Rp 160.000'
    },
    {
      months: 12,
      days: 365,
      label: '12 Bulan',
      sublabel: '1 Tahun Penuh',
      badge: 'Paling Hemat',
      priceEstimate: 'Rp 300.000'
    }
  ];

  const handleApplyTheme = (themeId: any) => {
    setSelectedTheme(themeId);
    localStorage.setItem('bq_theme', themeId);
    setThemeSaved(true);
    setTimeout(() => setThemeSaved(false), 2000);
  };

  const handleDownloadBackup = () => {
    const backupPayload: any = {
      app: 'Bengkel Qu POS',
      timestamp: new Date().toISOString(),
      version: APP_VERSION,
      deviceId,
      subscription,
      summary: {
        queuesCount: queues.length,
        sparepartsCount: spareparts.length,
        transactionsCount: transactions.length,
        customersCount: customers.length,
        damagedGoodsCount: damagedGoods.length,
        procurementsCount: procurements.length
      },
      data: {}
    };

    if (backupOptions.queues) backupPayload.data.queues = queues;
    if (backupOptions.spareparts) backupPayload.data.spareparts = spareparts;
    if (backupOptions.transactions) backupPayload.data.transactions = transactions;
    if (backupOptions.customers) backupPayload.data.customers = customers;
    if (backupOptions.damagedGoods) backupPayload.data.damagedGoods = damagedGoods;
    if (backupOptions.procurements) backupPayload.data.procurements = procurements;
    if (backupOptions.campaigns) backupPayload.data.campaigns = campaigns;
    if (backupOptions.vouchers) backupPayload.data.vouchers = vouchers;
    if (backupOptions.expenses) backupPayload.data.expenses = expenses;
    if (backupOptions.profile) backupPayload.data.profile = profile;
    if (backupOptions.permissions) backupPayload.data.permissions = permissions;
    if (backupOptions.branches) backupPayload.data.branches = branches;

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupPayload, null, 2));
    const downloadAnchor = document.createElement('a');
    const now = new Date();
    const dateFormatted = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `bengkelqu_backup_${dateFormatted}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setBackupDownloaded(true);
    setTimeout(() => setBackupDownloaded(false), 2500);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRestoreFile(file);
    setRestoreError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!parsed.data && !parsed.queues) {
          throw new Error('Format berkas tidak sesuai dengan skema data cadangan Bengkel Qu.');
        }
        setRestorePreview(parsed.data || parsed);
      } catch (err: any) {
        setRestoreError(err.message || 'Gagal membaca berkas JSON.');
        setRestorePreview(null);
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteRestore = () => {
    if (!restorePreview) return;
    onRestoreData(restorePreview);
    setRestoreSuccess(true);
    setTimeout(() => {
      setRestoreSuccess(false);
      setRestoreFile(null);
      setRestorePreview(null);
    }, 2500);
  };

  const handleExecuteReset = () => {
    const cleanWord = resetConfirmationText.trim().toUpperCase();
    if (cleanWord !== 'RESET' && cleanWord !== 'HAPUS') return;

    if (resetModalMode) {
      onResetData(resetModalMode);
      if (resetModalMode === 'clean_slate') {
        setResetSuccessNotice('Semua data operasional berhasil dihapus bersih total tanpa tersisa!');
      } else if (resetModalMode === 'factory') {
        setResetSuccessNotice('Data sampel / demo pabrik berhasil dimuat ulang!');
      } else {
        setResetSuccessNotice('Antrian & transaksi shift hari ini berhasil dibersihkan!');
      }

      setResetModalMode(null);
      setResetConfirmationText('');
      setTimeout(() => setResetSuccessNotice(null), 3500);
    }
  };

  const handleCopyDeviceId = () => {
    navigator.clipboard.writeText(deviceId);
    setCopiedDeviceId(true);
    setTimeout(() => setCopiedDeviceId(false), 2000);
  };

  const handleCopyEmailText = () => {
    const tierMeta = PRO_TIERS[selectedTier];
    const priceInfo = calculateTierPrice(selectedTier, selectedDuration);
    const text = `Kepada: ${DEVELOPER_EMAIL}\nPerihal: Permintaan Serial Number [${tierMeta.name}] [${selectedDuration} Bulan] - ${deviceId}\n\n• Device ID: ${deviceId}\n• Paket: ${tierMeta.name} (${tierMeta.rateLabel})\n• Durasi: ${selectedDuration} Bulan (${priceInfo.days} Hari)\n• Total: ${priceInfo.formattedPrice}\n• Nama Bengkel: ${profile.workshopName}\n• Kontak / WA: ${profile.phone}\n\nMohon dikirimkan Serial Number aktivasi PRO. Terima kasih!`;
    navigator.clipboard.writeText(text);
    setCopiedEmailText(true);
    setTimeout(() => setCopiedEmailText(false), 2000);
  };

  const handleDoActivate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputSerial.trim()) {
      setActivationResult({ success: false, message: 'Masukkan kode Serial Number terlebih dahulu.' });
      return;
    }
    if (onActivateSerialKey) {
      const res = onActivateSerialKey(inputSerial.trim());
      setActivationResult(res);
    }
  };

  const handleRunMigrationCheck = () => {
    const info = checkAndMigrateAppData();
    setMigrationStatus({
      checked: true,
      msg: `Pengecekan versi ${info.currentVersion} berhasil. Skema data tersinkronisasi 100% aman dan kompatibel!`
    });
    setTimeout(() => setMigrationStatus(null), 3500);
  };

  return (
    <div className="flex-1 bg-slate-50 flex flex-col">
      {/* Top Header */}
      <div className="bg-[#008952] text-white px-5 pt-4 pb-5 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              aria-label="Kembali"
              className="w-10 h-10 rounded-full bg-white/15 active:bg-white/30 flex items-center justify-center transition-colors shadow-sm cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Setting Bengkel Qu</h1>
              <p className="text-xs text-emerald-100 font-medium">
                Tema, Backup, Restore, Reset & Aktivasi Lisensi
              </p>
            </div>
          </div>
        </div>

        {/* Tab Switcher Horizontal (Scrollable for compact touch) */}
        <div className="flex items-center gap-1.5 mt-4 bg-emerald-800/50 p-1 rounded-xl text-xs overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('setting-tema')}
            className={`flex-1 min-w-[65px] py-1.5 px-2 rounded-lg font-bold transition-all text-center cursor-pointer whitespace-nowrap ${
              activeTab === 'setting-tema' ? 'bg-white text-[#008952] shadow-xs' : 'text-emerald-100'
            }`}
          >
            Tema
          </button>
          <button
            onClick={() => setActiveTab('setting-backup')}
            className={`flex-1 min-w-[70px] py-1.5 px-2 rounded-lg font-bold transition-all text-center cursor-pointer whitespace-nowrap ${
              activeTab === 'setting-backup' ? 'bg-white text-[#008952] shadow-xs' : 'text-emerald-100'
            }`}
          >
            Backup
          </button>
          <button
            onClick={() => setActiveTab('setting-restore')}
            className={`flex-1 min-w-[70px] py-1.5 px-2 rounded-lg font-bold transition-all text-center cursor-pointer whitespace-nowrap ${
              activeTab === 'setting-restore' ? 'bg-white text-[#008952] shadow-xs' : 'text-emerald-100'
            }`}
          >
            Restore
          </button>
          <button
            onClick={() => setActiveTab('setting-reset')}
            className={`flex-1 min-w-[65px] py-1.5 px-2 rounded-lg font-bold transition-all text-center cursor-pointer whitespace-nowrap ${
              activeTab === 'setting-reset' ? 'bg-white text-rose-600 shadow-xs' : 'text-emerald-100'
            }`}
          >
            Reset
          </button>
          <button
            onClick={() => setActiveTab('setting-aktivasi')}
            className={`flex-1 min-w-[90px] py-1.5 px-2 rounded-lg font-bold transition-all text-center cursor-pointer whitespace-nowrap ${
              activeTab === 'setting-aktivasi' ? 'bg-white text-[#008952] shadow-xs' : 'text-emerald-100'
            }`}
          >
            Aktivasi PRO
          </button>
          <button
            onClick={() => setActiveTab('setting-update')}
            className={`flex-1 min-w-[85px] py-1.5 px-2 rounded-lg font-bold transition-all text-center cursor-pointer whitespace-nowrap ${
              activeTab === 'setting-update' ? 'bg-white text-[#008952] shadow-xs' : 'text-emerald-100'
            }`}
          >
            Update App
          </button>
          {onNavigateToDevices && (
            <button
              type="button"
              onClick={onNavigateToDevices}
              className="flex-1 min-w-[85px] py-1.5 px-2 rounded-lg font-bold transition-all text-center cursor-pointer whitespace-nowrap text-emerald-100 hover:text-white bg-white/15 hover:bg-white/25 active:scale-95"
            >
              Tautkan HP
            </button>
          )}
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        
        {/* ================= TAB 1: TEMA ================= */}
        {activeTab === 'setting-tema' && (
          <div className="space-y-3 animate-in fade-in">
            <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-100">
              <div className="flex items-center gap-2 mb-1">
                <Palette className="w-4 h-4 text-[#008952]" />
                <h3 className="font-bold text-slate-900 text-sm">Pilihan Tema Warna</h3>
              </div>
              <p className="text-xs text-slate-500">
                Pilih palet nuansa warna antarmuka untuk seluruh dashboard dan tombol Bengkel Qu.
              </p>
            </div>

            {themeSaved && (
              <div className="p-3 bg-emerald-100 border border-emerald-300 text-[#008952] rounded-2xl text-xs font-bold flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>Tema berhasil diterapkan dan disimpan!</span>
              </div>
            )}

            <div className="space-y-2.5">
              {THEMES.map((t) => (
                <div
                  key={t.id}
                  onClick={() => handleApplyTheme(t.id)}
                  className={`bg-white rounded-2xl p-4 shadow-xs border transition-all cursor-pointer flex items-center justify-between ${
                    selectedTheme === t.id
                      ? 'border-[#008952] ring-2 ring-emerald-500/20 shadow-md'
                      : 'border-slate-100 hover:border-emerald-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-2xl shadow-sm flex items-center justify-center text-white font-black"
                      style={{ backgroundColor: t.color }}
                    >
                      ✓
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">{t.name}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">{t.desc}</p>
                    </div>
                  </div>

                  <div className="shrink-0 pl-2">
                    {selectedTheme === t.id ? (
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-[#008952] border border-emerald-200">
                        Dipakai
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-medium">Pilih</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 2: BACKUP ================= */}
        {activeTab === 'setting-backup' && (
          <div className="space-y-3 animate-in fade-in">
            <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-100">
              <div className="flex items-center gap-2 mb-1">
                <Database className="w-4 h-4 text-[#008952]" />
                <h3 className="font-bold text-slate-900 text-sm">Pencadangan Data (Backup .JSON)</h3>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Unduh berkas cadangan komprehensif berisi seluruh riwayat antrian, katalog sparepart, transaksi kasir, pelanggan, barang rusak, pengadaan, dan pengaturan.
              </p>
            </div>

            {backupDownloaded && (
              <div className="p-3 bg-emerald-100 border border-emerald-300 text-[#008952] rounded-2xl text-xs font-bold flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>Berkas cadangan berhasil diunduh ke perangkat Anda!</span>
              </div>
            )}

            {/* Checklist Modul yang Dicadangkan */}
            <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-100 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-bold text-xs text-slate-800">Pilih Data yang Disertakan:</span>
                <span className="text-[10px] text-slate-400">Centang sesuai kebutuhan</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { key: 'queues', label: `Antrian Servis (${queues.length})` },
                  { key: 'spareparts', label: `Katalog Part (${spareparts.length})` },
                  { key: 'transactions', label: `Transaksi Kasir (${transactions.length})` },
                  { key: 'customers', label: `Data CRM Pelanggan (${customers.length})` },
                  { key: 'damagedGoods', label: `Barang Rusak (${damagedGoods.length})` },
                  { key: 'procurements', label: `Pengadaan Suku Cadang (${procurements.length})` },
                  { key: 'expenses', label: `Kas Kecil Operasional (${expenses.length})` },
                  { key: 'profile', label: 'Profil & Identitas Bengkel' },
                  { key: 'permissions', label: 'Matriks Otorisasi Hak Akses' },
                  { key: 'branches', label: 'Data Cabang Bengkel' }
                ].map((item) => (
                  <label key={item.key} className="flex items-center gap-2 text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(backupOptions as any)[item.key]}
                      onChange={(e) =>
                        setBackupOptions({
                          ...backupOptions,
                          [item.key]: e.target.checked
                        })
                      }
                      className="rounded text-[#008952] focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                    />
                    <span className="text-[11px] font-medium">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleDownloadBackup}
              className="w-full bg-[#008952] hover:bg-emerald-700 active:scale-95 text-white font-bold py-3 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-700/20 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Ekspor & Unduh Berkas Cadangan (.JSON)</span>
            </button>
          </div>
        )}

        {/* ================= TAB 3: RESTORE ================= */}
        {activeTab === 'setting-restore' && (
          <div className="space-y-3 animate-in fade-in">
            <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-100">
              <div className="flex items-center gap-2 mb-1">
                <UploadCloud className="w-4 h-4 text-[#008952]" />
                <h3 className="font-bold text-slate-900 text-sm">Pemulihan Data (Restore .JSON)</h3>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Pulihkan data bengkel dari berkas JSON hasil ekspor cadangan sebelumnya. Data baru akan otomatis menggantikan atau menyinkronkan data aktif.
              </p>
            </div>

            {restoreSuccess && (
              <div className="p-3 bg-emerald-100 border border-emerald-300 text-[#008952] rounded-2xl text-xs font-bold flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>Seluruh data cadangan berhasil dipulihkan dan disinkronkan!</span>
              </div>
            )}

            {restoreError && (
              <div className="p-3 bg-rose-100 border border-rose-300 text-rose-800 rounded-2xl text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>{restoreError}</span>
              </div>
            )}

            {/* Upload Area */}
            <div className="bg-white rounded-2xl p-5 shadow-xs border-2 border-dashed border-slate-200 text-center space-y-3">
              <div className="w-12 h-12 bg-emerald-50 text-[#008952] rounded-full flex items-center justify-center mx-auto">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <span className="font-bold text-xs text-slate-800 block">
                  Pilih Berkas Cadangan Bengkel Qu (.JSON)
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Format berkas: bengkelqu_backup_*.json
                </span>
              </div>

              <input
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-[#008952] hover:file:bg-emerald-100 cursor-pointer"
              />
            </div>

            {/* Preview Restore */}
            {restorePreview && (
              <div className="bg-white rounded-2xl p-4 shadow-xs border border-emerald-300 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-[#008952]">
                  <FileCheck className="w-4 h-4" />
                  <span className="font-bold text-xs">Pratinjau Data yang Ditemukan</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-50 p-2 rounded-xl">
                    <span className="text-[10px] text-slate-400 block">Antrian Servis</span>
                    <span className="font-bold text-slate-800">{restorePreview.queues?.length || 0} Tiket</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl">
                    <span className="text-[10px] text-slate-400 block">Suku Cadang / Stok</span>
                    <span className="font-bold text-slate-800">{restorePreview.spareparts?.length || 0} Item</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl">
                    <span className="text-[10px] text-slate-400 block">Transaksi Kasir</span>
                    <span className="font-bold text-slate-800">{restorePreview.transactions?.length || 0} Nota</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl">
                    <span className="text-[10px] text-slate-400 block">Pelanggan CRM</span>
                    <span className="font-bold text-slate-800">{restorePreview.customers?.length || 0} Unit</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleExecuteRestore}
                  className="w-full bg-[#008952] hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Terapkan Pemulihan Sekarang</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 4: RESET (PASTIKAN HAPUS BERSIH TIDAK TERSISA) ================= */}
        {activeTab === 'setting-reset' && (
          <div className="space-y-3 animate-in fade-in">
            <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-100">
              <div className="flex items-center gap-2 mb-1">
                <RotateCcw className="w-4 h-4 text-rose-600" />
                <h3 className="font-bold text-slate-900 text-sm">Pusat Reset & Penghapusan Data</h3>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Pilih opsi di bawah untuk mengosongkan seluruh data operasional tanpa tersisa, atau memuat ulang data demo/sampel untuk pelatihan tim bengkel.
              </p>
            </div>

            {resetSuccessNotice && (
              <div className="p-3 bg-emerald-100 border border-emerald-300 text-[#008952] rounded-2xl text-xs font-bold flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>{resetSuccessNotice}</span>
              </div>
            )}

            {/* OPSI UTAMA 1: HAPUS BERSIH TOTAL (TIDAK TERSISA SAMA SEKALI) */}
            <div className="bg-rose-50/50 border-2 border-rose-300 rounded-2xl p-4 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-rose-700 font-extrabold text-xs">
                    <Trash2 className="w-4 h-4" />
                    <span>Hapus Bersih Total (Kosongkan Data - Tidak Ada Tersisa)</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    Menghapus seluruh antrian servis, riwayat kasir, suku cadang, pelanggan CRM, log barang rusak, dan kas kecil menjadi <strong>0 data (kosong total)</strong>. Cocok untuk bengkel baru yang siap mulai operasional nyata dari awal.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setResetModalMode('clean_slate')}
                className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs active:scale-95 shadow-md shadow-rose-700/20 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Bersih Total (0 Data Tersisa)</span>
              </button>
            </div>

            {/* OPSI 2: Muat Ulang Data Sampel / Demo Pabrik */}
            <div className="bg-white rounded-2xl p-4 shadow-xs border border-emerald-200 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-[#008952] font-bold text-xs">
                    <RefreshCw className="w-4 h-4" />
                    <span>Muat Ulang Data Sampel / Demo Pabrik</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Mengisi kembali data contoh motor matic, katalog oli & sparepart, serta transaksi kasir untuk latihan/simulasi tim kasir dan mekanik.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setResetModalMode('factory')}
                className="bg-emerald-50 hover:bg-emerald-100 text-[#008952] border border-emerald-300 font-bold px-3 py-2 rounded-xl text-xs active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Muat Ulang Data Demo Pabrik</span>
              </button>
            </div>

            {/* OPSI 3: Bersihkan Shift Hari Ini Saja */}
            <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-100 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">Bersihkan Shift & Transaksi Selesai Hari Ini</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Menghapus antrian yang selesai dan riwayat transaksi hari ini tanpa menghapus katalog barang dan data pelanggan.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setResetModalMode('daily')}
                className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold px-3 py-2 rounded-xl text-xs active:scale-95 transition-all cursor-pointer"
              >
                Bersihkan Shift Hari Ini Saja
              </button>
            </div>

            {/* Info Akun Google */}
            {userSession && (
              <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-100 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs">
                  <span className="font-bold text-slate-800">Akun Google Terhubung</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    {userSession.role}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block">{userSession.name}</span>
                    <span className="text-[11px] text-slate-500 font-mono">{userSession.email}</span>
                  </div>
                  {onLogout && (
                    <button
                      type="button"
                      onClick={onLogout}
                      className="bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 font-bold px-3 py-1.5 rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      Keluar / Logout
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 5: AKTIVASI PRO ================= */}
        {activeTab === 'setting-aktivasi' && (
          <div className="space-y-4 animate-in fade-in">
            {/* Header info */}
            <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-500" />
                  <h3 className="font-bold text-slate-900 text-sm">Status Lisensi Bengkel Qu PRO</h3>
                </div>
                {subscription?.isSubscribed ? (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-black">
                    PRO AKTIF
                  </span>
                ) : subscription?.isTrialActive ? (
                  <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black border border-amber-300">
                    Trial: {subscription.trialDaysRemaining} Hari
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                    Free Lifetime
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                Permintaan Serial Number dikirimkan langsung ke developer (<strong className="font-mono text-slate-800">{DEVELOPER_EMAIL}</strong>) berdasarkan <strong>Device ID</strong> unik perangkat ini. Developer akan memproses dan membuatkan serial number via aplikasi Termux miliknya.
              </p>
            </div>

            {/* Device ID Card */}
            <div className="bg-emerald-50/70 border border-emerald-300 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                  <Laptop className="w-4 h-4 text-[#008952]" />
                  Device ID Perangkat Ini:
                </span>
                <span className="text-[10px] font-semibold text-emerald-700 bg-white px-2 py-0.5 rounded-full border border-emerald-200">
                  Kunci Unik Perangkat
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1 bg-white border border-emerald-300 rounded-xl px-3 py-2.5 font-mono text-sm font-black text-slate-800 tracking-wider">
                  {deviceId}
                </div>
                <button
                  type="button"
                  onClick={handleCopyDeviceId}
                  className="bg-[#008952] hover:bg-emerald-700 active:scale-95 text-white px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer shrink-0"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedDeviceId ? 'Tersalin!' : 'Salin'}</span>
                </button>
              </div>
            </div>

            {/* 1. Pilihan Paket PRO (Basic 1000/hari, Core 2000/hari, Enterprise 3000/hari) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-900 flex items-center justify-between">
                <span>1. Pilih Paket PRO yang Diinginkan:</span>
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Tarif Harian Terjangkau
                </span>
              </label>

              <div className="grid grid-cols-3 gap-2">
                {/* Basic Pro */}
                <button
                  type="button"
                  onClick={() => setSelectedTier('basic')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    selectedTier === 'basic'
                      ? 'border-blue-500 bg-blue-50/70 ring-2 ring-blue-500/30 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-blue-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold text-xs text-slate-900">Basic Pro</span>
                      <Users className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <span className="text-[10px] text-slate-500 block leading-tight">Solo Mode Mandiri</span>
                  </div>
                  <div className="mt-2.5 pt-1.5 border-t border-slate-100">
                    <span className="font-mono text-xs font-black text-blue-700 block">Rp 1.000</span>
                    <span className="text-[9px] text-slate-400">per hari</span>
                  </div>
                </button>

                {/* Core Pro */}
                <button
                  type="button"
                  onClick={() => setSelectedTier('core')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between relative ${
                    selectedTier === 'core'
                      ? 'border-[#008952] bg-emerald-50/70 ring-2 ring-emerald-500/30 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-emerald-200'
                  }`}
                >
                  <span className="absolute -top-2 right-2 bg-amber-400 text-amber-950 font-black text-[8px] px-1.5 py-0.2 rounded-full shadow-2xs">
                    Populer
                  </span>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold text-xs text-slate-900">Core Pro</span>
                      <ShieldAlert className="w-3.5 h-3.5 text-[#008952]" />
                    </div>
                    <span className="text-[10px] text-slate-500 block leading-tight">Multi-User SPV & Kasir</span>
                  </div>
                  <div className="mt-2.5 pt-1.5 border-t border-slate-100">
                    <span className="font-mono text-xs font-black text-[#008952] block">Rp 2.000</span>
                    <span className="text-[9px] text-slate-400">per hari</span>
                  </div>
                </button>

                {/* Enterprise Pro */}
                <button
                  type="button"
                  onClick={() => setSelectedTier('corporate')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    selectedTier === 'corporate'
                      ? 'border-purple-500 bg-purple-50/70 ring-2 ring-purple-500/30 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-purple-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold text-xs text-slate-900">Enterprise</span>
                      <Building2 className="w-3.5 h-3.5 text-purple-600" />
                    </div>
                    <span className="text-[10px] text-slate-500 block leading-tight">Multi-Cabang (3 Outlet)</span>
                  </div>
                  <div className="mt-2.5 pt-1.5 border-t border-slate-100">
                    <span className="font-mono text-xs font-black text-purple-700 block">Rp 3.000</span>
                    <span className="text-[9px] text-slate-400">per hari</span>
                  </div>
                </button>
              </div>
            </div>

            {/* 2. Pilihan Durasi Pro 1, 3, 6, 12 Bulan */}
            <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-100 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-800">2. Pilih Durasi Langganan:</span>
                <span className="text-[10px] text-slate-400">1, 3, 6, 12 Bulan</span>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {DURATION_OPTIONS.map((opt) => {
                  const price = calculateTierPrice(selectedTier, opt.months);
                  const isSelected = selectedDuration === opt.months;

                  return (
                    <button
                      key={opt.months}
                      type="button"
                      onClick={() => setSelectedDuration(opt.months)}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-[#008952] bg-emerald-50/80 ring-2 ring-emerald-500/20 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-emerald-300'
                      }`}
                    >
                      <div>
                        <span className="font-extrabold text-xs text-slate-900 block">{opt.label}</span>
                        <span className="text-[9px] text-slate-400 block mt-0.5">{opt.days} Hari</span>
                      </div>
                      <span className="text-[10px] font-black text-[#008952] font-mono mt-1.5 block">
                        {price.formattedPrice}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Rincian Kalkulasi Harga */}
              {(() => {
                const calc = calculateTierPrice(selectedTier, selectedDuration);
                return (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Rincian Paket & Durasi:</span>
                      <span className="font-bold text-slate-900">
                        {PRO_TIERS[selectedTier].name} ({selectedDuration} Bulan / {calc.days} Hari)
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-500 block text-[10px]">
                        {calc.days} hari × {PRO_TIERS[selectedTier].rateLabel}
                      </span>
                      <span className="font-mono font-black text-sm text-[#008952]">
                        {calc.formattedPrice}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Request Buttons ke Email Developer */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-[#008952]" />
                  Kirim Permintaan ke Developer Hendri
                </span>
                <span className="font-mono text-[11px] text-slate-600 font-bold">{DEVELOPER_EMAIL}</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <a
                  href={buildMailtoRequest(deviceId, selectedTier, selectedDuration, profile.workshopName, profile.phone)}
                  className="flex-1 bg-[#008952] hover:bg-emerald-700 text-white py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all text-center"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Kirim Email Permintaan Serial Number</span>
                  <ExternalLink className="w-3 h-3 opacity-80" />
                </a>

                <button
                  type="button"
                  onClick={handleCopyEmailText}
                  className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>{copiedEmailText ? 'Format Disalin!' : 'Salin Format'}</span>
                </button>
              </div>

              <p className="text-[10px] text-slate-500 leading-tight">
                Developer (<strong>Mas Hendri</strong> di <code className="bg-slate-200/70 px-1 py-0.5 rounded font-mono text-slate-800">{DEVELOPER_EMAIL}</code>) akan membuat Serial Number aktivasi {PRO_TIERS[selectedTier].name} ({selectedDuration} Bulan) menggunakan Termux dan mengirimkannya kembali ke Anda.
              </p>
            </div>

            {/* Input Serial Number */}
            <form onSubmit={handleDoActivate} className="bg-white border-2 border-emerald-600/30 rounded-2xl p-4 space-y-3 shadow-xs">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-[#008952]" />
                <h4 className="font-extrabold text-xs text-slate-900">
                  Masukkan Serial Number dari Developer:
                </h4>
              </div>

              <input
                type="text"
                value={inputSerial}
                onChange={(e) => {
                  setInputSerial(e.target.value.toUpperCase());
                  setActivationResult(null);
                }}
                placeholder="Contoh: BQPRO-CORE-3M-A48F-72E1"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-mono font-bold text-slate-900 tracking-wider uppercase placeholder:normal-case placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />

              {activationResult && (
                <div className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  activationResult.success 
                    ? 'bg-emerald-100 text-[#008952] border border-emerald-300' 
                    : 'bg-rose-100 text-rose-800 border border-rose-300'
                }`}>
                  {activationResult.success ? <Check className="w-4 h-4 shrink-0" /> : <X className="w-4 h-4 shrink-0" />}
                  <span>{activationResult.message}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-[#008952] hover:bg-emerald-700 active:scale-95 text-white py-2.5 rounded-xl text-xs font-black shadow-md shadow-emerald-700/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Zap className="w-4 h-4 fill-white" />
                <span>Aktivasi Bengkel Qu PRO Sekarang</span>
              </button>
            </form>
          </div>
        )}

        {/* ================= TAB 6: UPDATE APP (AUTO-ADAPT TANPA UNINSTALL) ================= */}
        {activeTab === 'setting-update' && (
          <div className="space-y-3 animate-in fade-in">
            <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-100">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-[#008952]" />
                <h3 className="font-bold text-slate-900 text-sm">Pembaruan Aplikasi & Sinkronisasi Skema</h3>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Aplikasi Bengkel Qu dirancang untuk dapat <strong>ditimpa pembaruan langsung</strong> tanpa perlu melakukan uninstall terlebih dahulu. Data lama Anda (antrian, stok, kasir, pelanggan) otomatis menyesuaikan.
              </p>
            </div>

            {migrationStatus && (
              <div className="p-3 bg-emerald-100 border border-emerald-300 text-[#008952] rounded-2xl text-xs font-bold flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>{migrationStatus.msg}</span>
              </div>
            )}

            <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-100 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs">
                <span className="text-slate-500">Versi Terpasang Saat Ini</span>
                <span className="font-mono font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-lg">
                  v{APP_VERSION}-pro
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs">
                <span className="text-slate-500">Status Kompatibilitas Data</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Kompatibel 100%
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Mekanisme Update</span>
                <span className="font-semibold text-slate-800">
                  Langsung Timpa (Zero Data Loss)
                </span>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-950">
                <Check className="w-4 h-4 text-[#008952]" />
                <span>Keamanan Data Saat Update</span>
              </div>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                Saat developer merilis pembaruan antarmuka atau fitur baru, Anda cukup merefresh atau menimpa aplikasi. Algoritma auto-migrasi akan memeriksa dan menambahkan kolom baru secara otomatis tanpa mereset atau menghapus transaksi riil yang sudah ada.
              </p>
            </div>

            <button
              type="button"
              onClick={handleRunMigrationCheck}
              className="w-full bg-[#008952] hover:bg-emerald-700 active:scale-95 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Sinkronkan & Sesuaikan Skema Data Sekarang</span>
            </button>
          </div>
        )}

      </div>

      {/* Confirmation Modal for Reset */}
      {resetModalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-100 p-5 space-y-3.5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto ${
              resetModalMode === 'clean_slate' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-[#008952]'
            }`}>
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="font-extrabold text-slate-900 text-sm">
                {resetModalMode === 'clean_slate'
                  ? 'Konfirmasi Hapus Bersih Total (0 Tersisa)'
                  : resetModalMode === 'factory'
                  ? 'Konfirmasi Muat Ulang Data Sampel Pabrik'
                  : 'Konfirmasi Bersihkan Shift Hari Ini'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {resetModalMode === 'clean_slate'
                  ? 'PERINGATAN: Seluruh antrian, barang, pelanggan, dan transaksi akan dikosongkan total tanpa ada data yang tersisa.'
                  : 'Data akan dimuat ulang ke kondisi standar.'}
              </p>
              <p className="text-xs font-bold text-slate-700 mt-2">
                Ketik kata <span className="font-black text-rose-600">HAPUS</span> atau <span className="font-black text-rose-600">RESET</span> di bawah untuk melanjutkan:
              </p>
            </div>

            <input
              type="text"
              value={resetConfirmationText}
              onChange={(e) => setResetConfirmationText(e.target.value)}
              placeholder="Ketik HAPUS atau RESET"
              className="w-full text-center bg-slate-50 border border-slate-300 rounded-xl py-2 font-mono text-sm uppercase font-bold tracking-widest text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
            />

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setResetModalMode(null);
                  setResetConfirmationText('');
                }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={
                  resetConfirmationText.trim().toUpperCase() !== 'RESET' &&
                  resetConfirmationText.trim().toUpperCase() !== 'HAPUS'
                }
                onClick={handleExecuteReset}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                Ya, Eksekusi Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
