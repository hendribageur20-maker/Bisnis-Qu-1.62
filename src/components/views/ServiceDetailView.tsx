import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Search, 
  X, 
  CheckCircle2, 
  Clock, 
  Wrench, 
  Plus, 
  Trash2, 
  Printer, 
  Send, 
  RotateCcw, 
  Calendar, 
  Phone, 
  Car, 
  FileText, 
  DollarSign, 
  ChevronRight, 
  Info, 
  AlertCircle,
  Package,
  Layers,
  Sparkles
} from 'lucide-react';
import { ServiceQueue, ServiceItem, ServiceStatus, Sparepart, Mechanic } from '../../types';
import { INITIAL_SPAREPARTS, INITIAL_MECHANICS } from '../../data/mockData';

interface ServiceDetailViewProps {
  initialTab?: string;
  queues: ServiceQueue[];
  onBack: () => void;
  onAddQueue?: (newQueue: ServiceQueue) => void;
  onUpdateQueueStatus: (id: string, status: ServiceStatus, progress?: number) => void;
  onUpdateQueueItems?: (queueId: string, items: ServiceItem[], totalCost: number) => void;
  onSelectQueueForInvoice?: (queue: ServiceQueue) => void;
  onResetDailyQueues?: () => void;
  spareparts?: Sparepart[];
  mechanics?: Mechanic[];
}

export const ServiceDetailView: React.FC<ServiceDetailViewProps> = ({
  initialTab = 'antrian',
  queues,
  onBack,
  onAddQueue,
  onUpdateQueueStatus,
  onUpdateQueueItems,
  onSelectQueueForInvoice,
  onResetDailyQueues,
  spareparts = INITIAL_SPAREPARTS,
  mechanics = INITIAL_MECHANICS
}) => {
  // Normalize initialTab to our 5 active sub-menus
  const getNormalizedTab = (tab: string) => {
    if (tab === 'service-register' || tab === 'registrasi') return 'registrasi';
    if (tab === 'service-queue' || tab === 'antrian') return 'antrian';
    if (tab === 'service-progress' || tab === 'proses-service') return 'proses-service';
    if (tab === 'service-completed' || tab === 'selesai-service') return 'selesai-service';
    if (tab === 'service-total' || tab === 'total-service') return 'total-service';
    return 'antrian';
  };

  const [activeTab, setActiveTab] = useState<string>(() => getNormalizedTab(initialTab));
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals for Proses Service actions
  const [selectedQueueForAction, setSelectedQueueForAction] = useState<ServiceQueue | null>(null);
  const [isAddPartModalOpen, setIsAddPartModalOpen] = useState(false);
  const [isAddLaborModalOpen, setIsAddLaborModalOpen] = useState(false);
  const [selectedPartId, setSelectedPartId] = useState<string>(spareparts[0]?.id || '');
  const [partQty, setPartQty] = useState<number>(1);
  const [laborName, setLaborName] = useState<string>('');
  const [laborPrice, setLaborPrice] = useState<number>(35000);

  // Modal for Invoice (Selesai Service)
  const [invoiceQueue, setInvoiceQueue] = useState<ServiceQueue | null>(null);
  const [showDailyResetConfirm, setShowDailyResetConfirm] = useState(false);

  // Form State for "Registrasi" (Minimalist underline styling in Full Screen mode)
  const [regPlate, setRegPlate] = useState('');
  const [regCustomerName, setRegCustomerName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regVehicleModel, setRegVehicleModel] = useState('');
  const [regVehicleType, setRegVehicleType] = useState<ServiceQueue['vehicleType']>('Motor Matic');
  const [regCategory, setRegCategory] = useState<ServiceQueue['serviceCategory']>('Servis Berkala');
  const [regComplaint, setRegComplaint] = useState('');
  const [regMechanic, setRegMechanic] = useState(mechanics[0]?.name || 'Mas Joko');
  const [regEstimatedTime, setRegEstimatedTime] = useState('45 Menit');

  // Trigger feedback toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Get today date string YYYY-MM-DD
  const todayDateStr = new Date().toISOString().split('T')[0];

  // Dynamic Header Title & Subtitle based on active sub-menu
  const getHeaderMeta = () => {
    switch (activeTab) {
      case 'registrasi':
        return {
          title: 'Registrasi',
          subtitle: 'Input Pendaftaran Unit Baru'
        };
      case 'antrian':
        return {
          title: 'Antrian',
          subtitle: 'Daftar Menunggu Servis'
        };
      case 'proses-service':
        return {
          title: 'Proses Service',
          subtitle: 'Pengerjaan Teknisi Aktif'
        };
      case 'selesai-service':
        return {
          title: 'Selesai Service',
          subtitle: 'Unit Selesai & Cetak Nota / WA'
        };
      case 'total-service':
        return {
          title: 'Total Service',
          subtitle: 'Rekap Log Semua Servis Hari Ini'
        };
      default:
        return {
          title: 'Manajemen Servis',
          subtitle: 'Sistem Operasional Servis'
        };
    }
  };

  const headerMeta = getHeaderMeta();

  // Filter queues by active sub-menu and search term
  const waitingQueues = queues.filter((q) => q.status === 'menunggu');
  const inProgressQueues = queues.filter((q) => q.status === 'proses');
  const completedQueues = queues.filter((q) => q.status === 'selesai');

  // Total Service filtered by today's date (Daily Reset Rule)
  const todayTotalQueues = queues.filter((q) => {
    // If q has date property, match today. If no date, consider it today's queue
    if (q.date) {
      return q.date === todayDateStr;
    }
    return true;
  });

  const filterBySearch = (list: ServiceQueue[]) => {
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (item) =>
        item.plateNumber.toLowerCase().includes(q) ||
        item.customerName.toLowerCase().includes(q) ||
        item.vehicleModel.toLowerCase().includes(q) ||
        item.queueNumber.toLowerCase().includes(q) ||
        item.mechanicName.toLowerCase().includes(q)
    );
  };

  // Auto-calculated next queue number
  const nextQueueNumber = `BQ-${String(queues.length + 1).padStart(2, '0')}`;

  // ==========================================
  // ACTION WORKFLOWS
  // ==========================================

  // 1. REGISTRASI: Save/Send -> Auto routes into Antrian
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regPlate.trim() || !regCustomerName.trim()) {
      showToast('Mohon lengkapi nomor plat dan nama pelanggan!');
      return;
    }

    const newQueueItem: ServiceQueue = {
      id: `queue-${Date.now()}`,
      queueNumber: nextQueueNumber,
      plateNumber: regPlate.trim().toUpperCase(),
      customerName: regCustomerName.trim(),
      customerPhone: regPhone.trim() || '081234567890',
      vehicleModel: regVehicleModel.trim() || 'Motor Honda / Yamaha',
      vehicleType: regVehicleType,
      serviceCategory: regCategory,
      mechanicName: regMechanic,
      status: 'menunggu',
      complaint: regComplaint.trim() || 'Pemeriksaan rutin dan servis berkala.',
      timeIn: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
      date: todayDateStr,
      estimatedCompletion: regEstimatedTime,
      items: [
        { id: `it-${Date.now()}-1`, name: 'Jasa Pengecekan & Servis Ringan', price: 40000, qty: 1, type: 'jasa' }
      ],
      progressPercent: 0,
      totalCost: 40000
    };

    if (onAddQueue) {
      onAddQueue(newQueueItem);
    }

    // Reset Form Fields
    setRegPlate('');
    setRegCustomerName('');
    setRegPhone('');
    setRegVehicleModel('');
    setRegComplaint('');

    showToast(`Unit ${newQueueItem.plateNumber} berhasil didaftarkan ke Antrian!`);

    // Automated flow: Automatically route into Antrian sub-menu
    setActiveTab('antrian');
  };

  // 2. ANTRIAN: Process / Kerjakan -> Auto moves to Proses Service
  const handleStartProcess = (queue: ServiceQueue) => {
    onUpdateQueueStatus(queue.id, 'proses', 35);
    showToast(`Unit ${queue.plateNumber} mulai dikerjakan! Pindah ke Proses Service.`);
    // Automated flow: Automatically move to Proses Service sub-menu
    setActiveTab('proses-service');
  };

  // 3. PROSES SERVICE: Add Part
  const handleAddPartSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQueueForAction) return;

    const partObj = spareparts.find((p) => p.id === selectedPartId);
    if (!partObj) return;

    const newItem: ServiceItem = {
      id: `item-part-${Date.now()}`,
      name: partObj.name,
      price: partObj.sellPrice,
      qty: Math.max(1, partQty),
      type: 'part'
    };

    const updatedItems = [...selectedQueueForAction.items, newItem];
    const newTotal = updatedItems.reduce((acc, it) => acc + it.price * it.qty, 0);

    if (onUpdateQueueItems) {
      onUpdateQueueItems(selectedQueueForAction.id, updatedItems, newTotal);
    }

    // Update local state if needed
    selectedQueueForAction.items = updatedItems;
    selectedQueueForAction.totalCost = newTotal;

    setIsAddPartModalOpen(false);
    showToast(`Suku cadang "${partObj.name}" berhasil ditambahkan.`);
  };

  // 3. PROSES SERVICE: Add Labor/Service
  const handleAddLaborSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQueueForAction || !laborName.trim()) return;

    const newItem: ServiceItem = {
      id: `item-jasa-${Date.now()}`,
      name: laborName.trim(),
      price: Number(laborPrice) || 30000,
      qty: 1,
      type: 'jasa'
    };

    const updatedItems = [...selectedQueueForAction.items, newItem];
    const newTotal = updatedItems.reduce((acc, it) => acc + it.price * it.qty, 0);

    if (onUpdateQueueItems) {
      onUpdateQueueItems(selectedQueueForAction.id, updatedItems, newTotal);
    }

    selectedQueueForAction.items = updatedItems;
    selectedQueueForAction.totalCost = newTotal;

    setLaborName('');
    setIsAddLaborModalOpen(false);
    showToast(`Jasa servis "${newItem.name}" berhasil ditambahkan.`);
  };

  // 3. PROSES SERVICE: Selesai -> Auto moves to Selesai Service
  const handleCompleteProcess = (queue: ServiceQueue) => {
    onUpdateQueueStatus(queue.id, 'selesai', 100);
    showToast(`Pengerjaan ${queue.plateNumber} selesai! Pindah ke Selesai Service.`);
    // Automated flow: Automatically move to Selesai Service sub-menu
    setActiveTab('selesai-service');
  };

  // 4. SELESAI SERVICE: WhatsApp Output Action
  const handleSendWhatsAppInvoice = (queue: ServiceQueue) => {
    const phone = queue.customerPhone.replace(/[^0-9]/g, '');
    const cleanPhone = phone.startsWith('0') ? '62' + phone.slice(1) : phone;

    const itemsSummary = queue.items
      .map((it, idx) => `${idx + 1}. ${it.name} (${it.qty}x) = Rp ${(it.price * it.qty).toLocaleString('id-ID')}`)
      .join('\n');

    const message = `*BENGKEL QU - NOTA SERVIS SELESAI*
============================
No. Antrian : ${queue.queueNumber}
Plat Nomor  : ${queue.plateNumber}
Kendaraan   : ${queue.vehicleModel}
Pelanggan   : ${queue.customerName}
Mekanik     : ${queue.mechanicName}
Status      : SELESAI & SIAP DIAMBIL

*RINCIAN BIAYA & PART:*
${itemsSummary}
----------------------------
*TOTAL TAGIHAN : Rp ${queue.totalCost.toLocaleString('id-ID')}*
============================
Unit Anda telah selesai dikerjakan dan sudah dicek QC. Silakan datang ke kasir Bengkel Qu untuk serah terima kendaraan. Terima kasih!`;

    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
    showToast(`Membuka WhatsApp untuk mengirim nota ke ${queue.customerName}...`);
  };

  // 4. SELESAI SERVICE: Print Output Action
  const handlePrintInvoice = (queue: ServiceQueue) => {
    setInvoiceQueue(queue);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  // 5. TOTAL SERVICE: Manual Daily Reset
  const handleManualDailyReset = () => {
    if (onResetDailyQueues) {
      onResetDailyQueues();
    }
    setShowDailyResetConfirm(false);
    showToast('Log harian berhasil dibersihkan untuk hari baru!');
  };

  return (
    <div className="flex-1 bg-slate-50 flex flex-col min-h-screen">
      {/* =========================================================================
          1. HEADER & MAIN NAVIGATION
          - Dynamic Header Title matching active sub-menu
          - Search logo directly in header bar
          - Clutter removal: No quick filter buttons (Semua, Menunggu, Proses, Selesai, Diambil)
      ========================================================================= */}
      {/* 1. COMPACT HEADER BAR */}
      <div className="bg-[#008952] text-white px-4 py-2.5 shadow-sm sticky top-0 z-30">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={onBack}
              aria-label="Kembali"
              className="w-8 h-8 rounded-full bg-white/15 active:bg-white/30 flex items-center justify-center transition-colors shadow-xs shrink-0 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-white" />
            </button>
            <div className="min-w-0">
              {/* Dynamic Header Title */}
              <h1 className="text-base font-extrabold tracking-tight truncate leading-tight">
                {headerMeta.title}
              </h1>
              <p className="text-[11px] text-emerald-100 font-medium truncate opacity-90 leading-none mt-0.5">
                {headerMeta.subtitle}
              </p>
            </div>
          </div>

          {/* Search Logo placed directly in header bar */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                isSearchOpen ? 'bg-white text-[#008952]' : 'bg-white/15 text-white active:bg-white/30'
              }`}
              title="Cari kendaraan atau plat nomor"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Quick action button to Registrasi if on another tab */}
            {activeTab !== 'registrasi' && (
              <button
                onClick={() => setActiveTab('registrasi')}
                className="bg-white text-[#008952] font-bold text-[11px] px-2.5 py-1.5 rounded-xl flex items-center gap-1 shadow-xs active:scale-95 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="hidden sm:inline">Daftar</span>
              </button>
            )}
          </div>
        </div>

        {/* Expandable Search Input directly in the header */}
        {isSearchOpen && (
          <div className="mt-2.5 relative animate-in fade-in slide-in-from-top-1 duration-150">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ketik nomor plat, nama, atau tipe motor..."
              className="w-full bg-white text-slate-900 text-xs rounded-xl pl-8.5 pr-8 py-2 shadow-inner focus:outline-none focus:ring-2 focus:ring-emerald-400 font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Floating Toast Feedback for automated workflow routes */}
      {toastMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white text-xs px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top-3 duration-200 max-w-sm text-center">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* =========================================================================
          2. SUB-MENU VIEWS & WORKFLOWS
      ========================================================================= */}
      <div className="flex-1 flex flex-col">
        {/* =====================================================================
            A. REGISTRASI
            - Form Layout: Full Screen mode
            - Input Styling: Minimalist design language (thin bottom lines only / underline style)
            - Action Button: Save / Send (Simpan / Kirim)
            - Automated Flow: Upon saving/sending, data automatically routes into Antrian!
        ===================================================================== */}
        {activeTab === 'registrasi' && (
          <div className="flex-1 bg-white p-5 md:p-8 flex flex-col justify-between">
            <div className="max-w-2xl mx-auto w-full">
              {/* Header Info Banner */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                <div>
                  <span className="text-[11px] font-bold tracking-wider text-emerald-700 uppercase bg-emerald-50 px-2.5 py-1 rounded-md">
                    Registrasi Kendaraan Masuk
                  </span>
                  <h2 className="text-lg font-black text-slate-800 mt-1">Formulir Pendaftaran Servis</h2>
                  <p className="text-xs text-slate-400">Isi data identitas unit. Setelah disimpan, sistem langsung mengarahkan ke Antrian.</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-400 block font-medium">Nomor Tiket</span>
                  <span className="text-base font-black text-[#008952]">{nextQueueNumber}</span>
                </div>
              </div>

              {/* Minimalist Full Screen Underline Form */}
              <form onSubmit={handleRegisterSubmit} className="space-y-6">
                {/* 1. Plat Nomor Kendaraan */}
                <div className="group">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Nomor Plat Kendaraan *
                  </label>
                  <input
                    type="text"
                    required
                    value={regPlate}
                    onChange={(e) => setRegPlate(e.target.value.toUpperCase())}
                    placeholder="Contoh: D 4521 ABC"
                    className="w-full bg-transparent border-0 border-b-2 border-slate-300 focus:border-[#008952] focus:ring-0 rounded-none py-2 px-0 text-slate-900 font-extrabold text-base tracking-wider transition-colors placeholder:text-slate-300 placeholder:font-normal focus:outline-none"
                  />
                </div>

                {/* 2. Nama Pemilik & No WhatsApp */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="group">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Nama Pemilik / Pelanggan *
                    </label>
                    <input
                      type="text"
                      required
                      value={regCustomerName}
                      onChange={(e) => setRegCustomerName(e.target.value)}
                      placeholder="Nama lengkap pelanggan"
                      className="w-full bg-transparent border-0 border-b border-slate-300 focus:border-[#008952] focus:ring-0 rounded-none py-2 px-0 text-slate-800 font-semibold text-sm transition-colors placeholder:text-slate-300 placeholder:font-normal focus:outline-none"
                    />
                  </div>

                  <div className="group">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      No. WhatsApp / Telepon
                    </label>
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="0812xxxxxxxx"
                      className="w-full bg-transparent border-0 border-b border-slate-300 focus:border-[#008952] focus:ring-0 rounded-none py-2 px-0 text-slate-800 font-semibold text-sm transition-colors placeholder:text-slate-300 placeholder:font-normal focus:outline-none"
                    />
                  </div>
                </div>

                {/* 3. Model Kendaraan & Tipe */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="group">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Model Kendaraan
                    </label>
                    <input
                      type="text"
                      value={regVehicleModel}
                      onChange={(e) => setRegVehicleModel(e.target.value)}
                      placeholder="Contoh: Honda Vario 160 (2023)"
                      className="w-full bg-transparent border-0 border-b border-slate-300 focus:border-[#008952] focus:ring-0 rounded-none py-2 px-0 text-slate-800 font-semibold text-sm transition-colors placeholder:text-slate-300 placeholder:font-normal focus:outline-none"
                    />
                  </div>

                  <div className="group">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Tipe Kendaraan
                    </label>
                    <select
                      value={regVehicleType}
                      onChange={(e) => setRegVehicleType(e.target.value as ServiceQueue['vehicleType'])}
                      className="w-full bg-transparent border-0 border-b border-slate-300 focus:border-[#008952] focus:ring-0 rounded-none py-2 px-0 text-slate-800 font-semibold text-sm transition-colors focus:outline-none cursor-pointer"
                    >
                      <option value="Motor Matic">Motor Matic</option>
                      <option value="Motor Bebek">Motor Bebek</option>
                      <option value="Motor Sport">Motor Sport</option>
                      <option value="Mobil">Mobil</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>
                </div>

                {/* 4. Kategori Servis & Mekanik */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="group">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Kategori Pengerjaan
                    </label>
                    <select
                      value={regCategory}
                      onChange={(e) => setRegCategory(e.target.value as ServiceQueue['serviceCategory'])}
                      className="w-full bg-transparent border-0 border-b border-slate-300 focus:border-[#008952] focus:ring-0 rounded-none py-2 px-0 text-slate-800 font-semibold text-sm transition-colors focus:outline-none cursor-pointer"
                    >
                      <option value="Servis Berkala">Servis Berkala</option>
                      <option value="Servis Ringan">Servis Ringan</option>
                      <option value="Ganti Oli & Filter">Ganti Oli & Filter</option>
                      <option value="Turun Mesin">Turun Mesin</option>
                      <option value="Kelistrikan">Kelistrikan</option>
                      <option value="Custom">Custom / Perbaikan Lain</option>
                    </select>
                  </div>

                  <div className="group">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Penugasan Mekanik
                    </label>
                    <select
                      value={regMechanic}
                      onChange={(e) => setRegMechanic(e.target.value)}
                      className="w-full bg-transparent border-0 border-b border-slate-300 focus:border-[#008952] focus:ring-0 rounded-none py-2 px-0 text-slate-800 font-semibold text-sm transition-colors focus:outline-none cursor-pointer"
                    >
                      {mechanics.map((m) => (
                        <option key={m.id} value={m.name}>
                          {m.name} ({m.role})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 5. Keluhan & Instruksi Khusus */}
                <div className="group">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Keluhan Kendaraan & Instruksi Khusus
                  </label>
                  <textarea
                    rows={2}
                    value={regComplaint}
                    onChange={(e) => setRegComplaint(e.target.value)}
                    placeholder="Contoh: Tarikan berat di tanjakan, rem belakang berdecit, ganti oli mesin..."
                    className="w-full bg-transparent border-0 border-b border-slate-300 focus:border-[#008952] focus:ring-0 rounded-none py-2 px-0 text-slate-800 font-medium text-sm transition-colors placeholder:text-slate-300 focus:outline-none resize-none"
                  />
                </div>

                {/* 6. Estimasi Waktu */}
                <div className="group">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Estimasi Waktu Pengerjaan
                  </label>
                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    {['30 Menit', '45 Menit', '1 Jam', '1.5 Jam', '2 Jam', '3 Jam'].map((time) => (
                      <button
                        type="button"
                        key={time}
                        onClick={() => setRegEstimatedTime(time)}
                        className={`text-xs px-3 py-1.5 rounded-full transition-all font-semibold ${
                          regEstimatedTime === time
                            ? 'bg-[#008952] text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Action Button: Simpan / Kirim (Save / Send) */}
                <div className="pt-6">
                  <button
                    type="submit"
                    className="w-full bg-[#008952] hover:bg-[#007545] active:scale-[0.99] text-white font-black py-4 px-6 rounded-2xl shadow-lg shadow-emerald-700/25 flex items-center justify-center gap-2.5 transition-all text-sm tracking-wide"
                  >
                    <Send className="w-4 h-4 stroke-[2.5]" />
                    <span>Simpan / Kirim (Masuk ke Antrian)</span>
                  </button>
                  <p className="text-[11px] text-center text-slate-400 mt-2">
                    Data akan otomatis terhubung ke papan antrian bengkel.
                  </p>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* =====================================================================
            B. ANTRIAN (Daftar Menunggu Servis)
            - View: Displays list of queue logs (status: 'menunggu')
            - Action Button: Proses / Kerjakan
            - Automated Flow: Clicking process moves item to Proses Service sub-menu!
        ===================================================================== */}
        {activeTab === 'antrian' && (
          <div className="flex-1 p-4 md:p-6 space-y-3.5 max-w-4xl mx-auto w-full overflow-y-auto">
            {filterBySearch(waitingQueues).length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center border border-slate-100 shadow-xs mt-6">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#008952] flex items-center justify-center mx-auto mb-3 shadow-inner">
                  <Clock className="w-7 h-7" />
                </div>
                <h3 className="font-extrabold text-slate-800 text-base">Tidak Ada Kendaraan di Antrian</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Semua kendaraan sedang dikerjakan atau belum ada pendaftaran baru.
                </p>
                <button
                  onClick={() => setActiveTab('registrasi')}
                  className="mt-5 bg-[#008952] hover:bg-[#007545] text-white text-xs font-bold px-5 py-2.5 rounded-xl inline-flex items-center gap-2 shadow-sm active:scale-95 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Daftarkan Unit Baru</span>
                </button>
              </div>
            ) : (
              filterBySearch(waitingQueues).map((queue) => (
                <div
                  key={queue.id}
                  className="bg-white rounded-2xl p-4 md:p-5 shadow-xs border border-slate-100 hover:border-emerald-200 transition-all space-y-3.5"
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-[#008952] text-white flex flex-col items-center justify-center shadow-xs shrink-0">
                        <span className="text-[9px] uppercase tracking-wider text-emerald-200 font-bold">No</span>
                        <span className="text-base font-black leading-none mt-0.5">{queue.queueNumber}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-black text-slate-900 text-base">{queue.plateNumber}</h3>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold">
                            {queue.vehicleType}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-700 mt-0.5">{queue.vehicleModel}</p>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span>{queue.customerName}</span>
                          <span>•</span>
                          <span className="text-emerald-700 font-medium">{queue.customerPhone}</span>
                        </p>
                      </div>
                    </div>

                    <span className="shrink-0 text-[11px] font-extrabold px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>Menunggu</span>
                    </span>
                  </div>

                  {/* Keluhan & Keterangan */}
                  <div className="bg-slate-50/80 rounded-xl p-3 text-xs text-slate-700 space-y-1.5 border border-slate-100">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-semibold text-slate-500">Kategori: {queue.serviceCategory}</span>
                      <span>Jam Masuk: {queue.timeIn}</span>
                    </div>
                    <p className="text-slate-800 font-medium leading-relaxed">
                      <span className="font-bold text-slate-900">Keluhan:</span> {queue.complaint}
                    </p>
                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60 text-slate-500">
                      <span>Mekanik: <strong className="text-slate-800">{queue.mechanicName}</strong></span>
                      <span>Estimasi: <strong className="text-emerald-700">{queue.estimatedCompletion}</strong></span>
                    </div>
                  </div>

                  {/* Action Button: Proses / Kerjakan (Automated Flow to Proses Service) */}
                  <div className="pt-1 flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleStartProcess(queue)}
                      className="w-full sm:w-auto bg-[#008952] hover:bg-[#007545] active:scale-95 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2 transition-all"
                    >
                      <Wrench className="w-4 h-4 stroke-[2.3]" />
                      <span>Proses / Kerjakan</span>
                      <ChevronRight className="w-4 h-4 opacity-70" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* =====================================================================
            C. PROSES SERVICE (Pengerjaan & Tambah Part/Jasa)
            - View: Active service logs currently in progress (status: 'proses')
            - Features & Actions:
              - Add Part (Suku Cadang) button
              - Add Service/Labor button
              - Selesai (Complete) button
            - Automated Flow: Clicking Selesai automatically moves to Selesai Service!
        ===================================================================== */}
        {activeTab === 'proses-service' && (
          <div className="flex-1 p-4 md:p-6 space-y-4 max-w-4xl mx-auto w-full overflow-y-auto">
            {filterBySearch(inProgressQueues).length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center border border-slate-100 shadow-xs mt-6">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
                  <Wrench className="w-7 h-7" />
                </div>
                <h3 className="font-extrabold text-slate-800 text-base">Tidak Ada Servis yang Sedang Dikerjakan</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Pilih kendaraan di sub-menu <strong>Antrian</strong> dan klik tombol <em>Proses / Kerjakan</em>.
                </p>
                <button
                  onClick={() => setActiveTab('antrian')}
                  className="mt-5 bg-[#008952] hover:bg-[#007545] text-white text-xs font-bold px-5 py-2.5 rounded-xl inline-flex items-center gap-2 shadow-sm active:scale-95 transition-all"
                >
                  <Clock className="w-4 h-4" />
                  <span>Lihat Daftar Antrian ({waitingQueues.length})</span>
                </button>
              </div>
            ) : (
              filterBySearch(inProgressQueues).map((queue) => (
                <div
                  key={queue.id}
                  className="bg-white rounded-2xl p-4 md:p-5 shadow-xs border-2 border-emerald-500/20 hover:border-emerald-500/40 transition-all space-y-3.5"
                >
                  {/* Card Header & Progress Bar */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex flex-col items-center justify-center shadow-xs shrink-0">
                        <span className="text-[9px] uppercase tracking-wider text-blue-200 font-bold">No</span>
                        <span className="text-base font-black leading-none mt-0.5">{queue.queueNumber}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-black text-slate-900 text-base">{queue.plateNumber}</h3>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-extrabold">
                            Dikerjakan
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-700 mt-0.5">{queue.vehicleModel}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Mekanik: <strong className="text-slate-800">{queue.mechanicName}</strong> • {queue.customerName}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-bold text-slate-400 block">Total Berjalan</span>
                      <span className="text-sm font-black text-[#008952]">
                        Rp {queue.totalCost.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  {/* Progress Indicator */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                      <span className="flex items-center gap-1.5 text-blue-700">
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping inline-block" />
                        Sedang Dikerjakan Mekanik
                      </span>
                      <span>{queue.progressPercent}% Selesai</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(15, queue.progressPercent)}%` }}
                      />
                    </div>
                  </div>

                  {/* Attached Items (Jasa & Spareparts) */}
                  <div className="bg-slate-50 rounded-xl p-3 space-y-2 border border-slate-100">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 pb-1 border-b border-slate-200">
                      <span>Rincian Jasa & Sparepart Terpasang</span>
                      <span className="text-slate-400">{queue.items.length} Item</span>
                    </div>

                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {queue.items.map((it, idx) => (
                        <div key={it.id || idx} className="flex items-center justify-between text-xs py-0.5">
                          <div className="flex items-center gap-1.5 min-w-0 pr-2">
                            <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase shrink-0 ${
                              it.type === 'part' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {it.type}
                            </span>
                            <span className="truncate text-slate-800 font-medium">{it.name}</span>
                            <span className="text-slate-400 font-semibold text-[11px]">x{it.qty}</span>
                          </div>
                          <span className="font-bold text-slate-900 shrink-0 text-xs">
                            Rp {(it.price * it.qty).toLocaleString('id-ID')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* FEATURES & ACTION BUTTONS:
                      - Add Part (Suku Cadang)
                      - Add Service/Labor
                      - Selesai (Complete)
                  */}
                  <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                    <div className="flex items-center gap-2">
                      {/* Button: + Tambah Part */}
                      <button
                        onClick={() => {
                          setSelectedQueueForAction(queue);
                          setIsAddPartModalOpen(true);
                        }}
                        className="bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs px-3 py-2 rounded-xl border border-amber-200 flex items-center gap-1.5 active:scale-95 transition-all"
                      >
                        <Package className="w-3.5 h-3.5 text-amber-700" />
                        <span>+ Tambah Part</span>
                      </button>

                      {/* Button: + Tambah Jasa */}
                      <button
                        onClick={() => {
                          setSelectedQueueForAction(queue);
                          setIsAddLaborModalOpen(true);
                        }}
                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs px-3 py-2 rounded-xl border border-emerald-200 flex items-center gap-1.5 active:scale-95 transition-all"
                      >
                        <Wrench className="w-3.5 h-3.5 text-emerald-700" />
                        <span>+ Tambah Jasa</span>
                      </button>
                    </div>

                    {/* Button: Selesai (Automated Flow to Selesai Service) */}
                    <button
                      onClick={() => handleCompleteProcess(queue)}
                      className="bg-[#008952] hover:bg-[#007545] active:scale-95 text-white font-black text-xs px-5 py-2 rounded-xl shadow-md shadow-emerald-700/20 flex items-center gap-2 transition-all ml-auto"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Selesai (Pindah ke Selesai)</span>
                      <ChevronRight className="w-4 h-4 opacity-70" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* =====================================================================
            D. SELESAI SERVICE (Unit Selesai & Output Nota / WA)
            - View: Displays completed service logs (status: 'selesai')
            - Features & Actions: Access to Invoice / Bill view
            - Output Options: Print or Send via WhatsApp
        ===================================================================== */}
        {activeTab === 'selesai-service' && (
          <div className="flex-1 p-4 md:p-6 space-y-4 max-w-4xl mx-auto w-full overflow-y-auto">
            {filterBySearch(completedQueues).length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center border border-slate-100 shadow-xs mt-6">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#008952] flex items-center justify-center mx-auto mb-3 shadow-inner">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="font-extrabold text-slate-800 text-base">Belum Ada Servis yang Selesai</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Kendaraan yang telah selesai dikerjakan mekanik di sub-menu <strong>Proses Service</strong> akan muncul di sini.
                </p>
                <button
                  onClick={() => setActiveTab('proses-service')}
                  className="mt-5 bg-[#008952] hover:bg-[#007545] text-white text-xs font-bold px-5 py-2.5 rounded-xl inline-flex items-center gap-2 shadow-sm active:scale-95 transition-all"
                >
                  <Wrench className="w-4 h-4" />
                  <span>Lihat Proses Service ({inProgressQueues.length})</span>
                </button>
              </div>
            ) : (
              filterBySearch(completedQueues).map((queue) => (
                <div
                  key={queue.id}
                  className="bg-white rounded-2xl p-4 md:p-5 shadow-xs border border-emerald-200/80 hover:shadow-md transition-all space-y-3.5"
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-emerald-700 text-white flex flex-col items-center justify-center shadow-xs shrink-0">
                        <span className="text-[9px] uppercase tracking-wider text-emerald-200 font-bold">No</span>
                        <span className="text-base font-black leading-none mt-0.5">{queue.queueNumber}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-black text-slate-900 text-base">{queue.plateNumber}</h3>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Siap Diambil</span>
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-700 mt-0.5">{queue.vehicleModel}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Pelanggan: <strong className="text-slate-800">{queue.customerName}</strong> ({queue.customerPhone})
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-bold text-slate-400 block">Total Tagihan</span>
                      <span className="text-base font-black text-[#008952]">
                        Rp {queue.totalCost.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  {/* Summary of services & parts */}
                  <div className="bg-emerald-50/50 rounded-xl p-3 text-xs text-slate-700 space-y-1.5 border border-emerald-100/60">
                    <div className="flex items-center justify-between text-[11px] text-emerald-900 font-bold">
                      <span>Mekanik: {queue.mechanicName}</span>
                      <span>{queue.items.length} Rincian Item Terpasang</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {queue.items.map((it, idx) => (
                        <span
                          key={idx}
                          className="bg-white border border-emerald-200/80 px-2 py-0.5 rounded-md text-[11px] font-medium text-slate-700"
                        >
                          {it.name} (Rp {it.price.toLocaleString('id-ID')})
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Features & Actions:
                      1. Lihat Nota / Invoice
                      2. Cetak Nota (Print)
                      3. Kirim via WhatsApp
                  */}
                  <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                    {/* View Invoice / Bill */}
                    <button
                      onClick={() => setInvoiceQueue(queue)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 active:scale-95 transition-all"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-600" />
                      <span>Lihat Nota / Invoice</span>
                    </button>

                    <div className="flex items-center gap-2 ml-auto">
                      {/* Output: Cetak Nota */}
                      <button
                        onClick={() => handlePrintInvoice(queue)}
                        className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs flex items-center gap-1.5 active:scale-95 transition-all"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Cetak</span>
                      </button>

                      {/* Output: Kirim via WhatsApp */}
                      <button
                        onClick={() => handleSendWhatsAppInvoice(queue)}
                        className="bg-[#25D366] hover:bg-[#20ba59] active:scale-95 text-white font-black text-xs px-4 py-2 rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Kirim WhatsApp</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* =====================================================================
            E. TOTAL SERVICE (Comprehensive Log of All Services Combined)
            - View: Displays comprehensive log of all services combined
            - Special Rule (Daily Reset): All data/logs within this menu must automatically
              clear/reset at the start of the next day.
        ===================================================================== */}
        {activeTab === 'total-service' && (
          <div className="flex-1 p-4 md:p-6 space-y-4 max-w-4xl mx-auto w-full overflow-y-auto">
            {/* KPI Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Total Unit Hari Ini</span>
                <span className="text-2xl font-black text-slate-900 mt-0.5 block">{todayTotalQueues.length}</span>
                <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 block">Semua Status</span>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs">
                <span className="text-[10px] font-bold text-amber-500 block uppercase">Menunggu</span>
                <span className="text-2xl font-black text-amber-600 mt-0.5 block">{waitingQueues.length}</span>
                <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">Di Antrian</span>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs">
                <span className="text-[10px] font-bold text-blue-500 block uppercase">Dikerjakan</span>
                <span className="text-2xl font-black text-blue-600 mt-0.5 block">{inProgressQueues.length}</span>
                <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">Di Pit Servis</span>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs">
                <span className="text-[10px] font-bold text-emerald-600 block uppercase">Selesai</span>
                <span className="text-2xl font-black text-[#008952] mt-0.5 block">{completedQueues.length}</span>
                <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">Siap / Diambil</span>
              </div>
            </div>

            {/* Daily Reset Notification Banner & Manual Reset Trigger */}
            <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-slate-900 text-xs">Aturan Reset Harian (Daily Reset)</h4>
                    <span className="text-[10px] bg-emerald-200/70 text-emerald-900 font-black px-2 py-0.2 rounded-full">
                      Otomatis 00:00
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                    Log pada menu ini otomatis dibersihkan setiap pergantian hari baru untuk rekap shift operasional.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowDailyResetConfirm(true)}
                className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-[11px] px-3 py-2 rounded-xl shrink-0 flex items-center gap-1.5 shadow-2xs active:scale-95 transition-all"
                title="Bersihkan log harian sekarang"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Reset Harian</span>
              </button>
            </div>

            {/* Comprehensive Combined Log Table / List */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm">Rekapitulasi Semua Servis ({todayTotalQueues.length})</h3>
                  <p className="text-[11px] text-slate-400">Daftar lengkap pengerjaan unit hari ini</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-medium">Estimasi Omset Servis</span>
                  <p className="text-sm font-black text-[#008952]">
                    Rp {todayTotalQueues.reduce((acc, q) => acc + q.totalCost, 0).toLocaleString('id-ID')}
                  </p>
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {filterBySearch(todayTotalQueues).map((queue) => (
                  <div key={queue.id} className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex flex-col items-center justify-center font-black text-xs shrink-0">
                        {queue.queueNumber}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900 text-sm">{queue.plateNumber}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full capitalize ${
                            queue.status === 'selesai'
                              ? 'bg-emerald-100 text-emerald-800'
                              : queue.status === 'proses'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {queue.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 truncate mt-0.5">
                          {queue.vehicleModel} • {queue.customerName}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Mekanik: {queue.mechanicName} • Jam Masuk: {queue.timeIn}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-black text-slate-900 block">
                        Rp {queue.totalCost.toLocaleString('id-ID')}
                      </span>
                      <button
                        onClick={() => setInvoiceQueue(queue)}
                        className="text-[11px] font-bold text-emerald-700 hover:underline mt-1 inline-block"
                      >
                        Detail Nota
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          MODALS & DRAWERS
      ========================================================================= */}

      {/* Modal: Tambah Part (Suku Cadang) */}
      {isAddPartModalOpen && selectedQueueForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md p-5 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Tambah Suku Cadang (Part)</h3>
                <p className="text-xs text-slate-400">Unit: {selectedQueueForAction.plateNumber}</p>
              </div>
              <button
                onClick={() => setIsAddPartModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddPartSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Pilih Suku Cadang dari Katalog</label>
                <select
                  value={selectedPartId}
                  onChange={(e) => setSelectedPartId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800"
                >
                  {spareparts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Stok: {p.stock} {p.unit}) - Rp {p.sellPrice.toLocaleString('id-ID')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Jumlah (Qty)</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={partQty}
                  onChange={(e) => setPartQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddPartModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-[#008952] hover:bg-[#007545] text-white font-bold px-5 py-2.5 rounded-xl shadow-sm"
                >
                  Tambahkan ke Servis
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Tambah Jasa Servis (Labor) */}
      {isAddLaborModalOpen && selectedQueueForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md p-5 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Tambah Jasa Servis (Labor)</h3>
                <p className="text-xs text-slate-400">Unit: {selectedQueueForAction.plateNumber}</p>
              </div>
              <button
                onClick={() => setIsAddLaborModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddLaborSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Pekerjaan Jasa</label>
                <input
                  type="text"
                  required
                  value={laborName}
                  onChange={(e) => setLaborName(e.target.value)}
                  placeholder="Contoh: Jasa Bersihkan Injektor & Throttle Body"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Tarif Biaya Jasa (Rp)</label>
                <input
                  type="number"
                  min="0"
                  step="5000"
                  value={laborPrice}
                  onChange={(e) => setLaborPrice(Number(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddLaborModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-[#008952] hover:bg-[#007545] text-white font-bold px-5 py-2.5 rounded-xl shadow-sm"
                >
                  Tambahkan Jasa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Lihat Nota / Invoice (Bill Detail View) */}
      {invoiceQueue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
            {/* Invoice Header */}
            <div className="bg-[#008952] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-black text-base leading-tight">Nota Servis & Invoice</h3>
                  <p className="text-[11px] text-emerald-100">No. Antrian: {invoiceQueue.queueNumber} • {invoiceQueue.plateNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setInvoiceQueue(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Printable Bill Content */}
            <div id="printable-invoice" className="p-5 overflow-y-auto space-y-4 text-xs text-slate-700">
              <div className="text-center pb-3 border-b border-dashed border-slate-200">
                <h2 className="font-black text-base text-slate-900 tracking-tight">BENGKEL QU MOTOR</h2>
                <p className="text-[11px] text-slate-500">Jl. Otto Iskandardinata No. 128, Sukajadi, Kota Bandung</p>
                <p className="text-[10px] text-slate-400">Telp/WA: 0812-3456-7890 • Sistem Kasir POS & Servis</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 block">Pelanggan:</span>
                  <strong className="text-slate-900">{invoiceQueue.customerName}</strong>
                  <span className="text-slate-500 block">{invoiceQueue.customerPhone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Kendaraan:</span>
                  <strong className="text-slate-900">{invoiceQueue.plateNumber}</strong>
                  <span className="text-slate-500 block">{invoiceQueue.vehicleModel}</span>
                </div>
                <div className="mt-1">
                  <span className="text-slate-400 block">Mekanik:</span>
                  <strong className="text-slate-800">{invoiceQueue.mechanicName}</strong>
                </div>
                <div className="mt-1">
                  <span className="text-slate-400 block">Jam Selesai:</span>
                  <strong className="text-slate-800">{invoiceQueue.timeIn}</strong>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <h4 className="font-bold text-slate-900 text-xs mb-2">Rincian Jasa & Suku Cadang:</h4>
                <div className="space-y-1.5 border-t border-b border-slate-200 py-2">
                  {invoiceQueue.items.map((it, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-slate-800">{it.name}</span>
                        <span className="text-slate-400 text-[11px] ml-1.5">({it.qty}x)</span>
                      </div>
                      <span className="font-bold text-slate-900">
                        Rp {(it.price * it.qty).toLocaleString('id-ID')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Calculation */}
              <div className="flex items-center justify-between pt-1 text-sm font-extrabold text-slate-900">
                <span>TOTAL PEMBAYARAN</span>
                <span className="text-base text-[#008952]">Rp {invoiceQueue.totalCost.toLocaleString('id-ID')}</span>
              </div>
            </div>

            {/* Modal Actions: Print & WhatsApp */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                onClick={() => setInvoiceQueue(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800"
              >
                Tutup
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePrintInvoice(invoiceQueue)}
                  className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-1.5 active:scale-95 transition-all"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Nota</span>
                </button>

                <button
                  onClick={() => handleSendWhatsAppInvoice(invoiceQueue)}
                  className="bg-[#25D366] hover:bg-[#20ba59] active:scale-95 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
                >
                  <Send className="w-4 h-4" />
                  <span>Kirim WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Reset Harian (Daily Reset) */}
      {showDailyResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm p-5 shadow-2xl border border-slate-100 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-base">Reset Log Harian?</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Tindakan ini akan mengosongkan antrian hari ini dan memulai nomor antrian baru dari BQ-01 untuk shift berikutnya.
            </p>
            <div className="pt-2 flex items-center justify-center gap-2">
              <button
                onClick={() => setShowDailyResetConfirm(false)}
                className="px-4 py-2 rounded-xl text-slate-600 font-bold text-xs hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                onClick={handleManualDailyReset}
                className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-5 py-2 rounded-xl shadow-sm"
              >
                Ya, Bersihkan Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
