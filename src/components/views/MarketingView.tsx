import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Send, 
  Tag, 
  Star, 
  Check, 
  Copy, 
  Sparkles, 
  Users, 
  Percent, 
  MessageCircle, 
  Calendar, 
  Clock, 
  Plus, 
  CheckCircle2,
  Share2,
  Trash2,
  FileText
} from 'lucide-react';
import { MarketingCampaign, PromoVoucher, CustomerVehicle } from '../../types';

interface MarketingViewProps {
  initialTab?: string;
  customers: CustomerVehicle[];
  campaigns: MarketingCampaign[];
  vouchers: PromoVoucher[];
  onBack: () => void;
  onSendCampaign: (newCampaign: MarketingCampaign) => void;
  onAddVoucher: (newVoucher: PromoVoucher) => void;
  onToggleVoucherActive: (id: string) => void;
}

export const MarketingView: React.FC<MarketingViewProps> = ({
  initialTab = 'broadcast-wa',
  customers,
  campaigns,
  vouchers,
  onBack,
  onSendCampaign,
  onAddVoucher,
  onToggleVoucherActive
}) => {
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (initialTab === 'voucher-diskon' || initialTab === 'voucher') return 'promo-diskon';
    if (initialTab === 'ulasan-google' || initialTab === 'reviews') return 'riwayat-pesan';
    return initialTab || 'broadcast-wa';
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Sub-Menu A Form State (Broadcast WhatsApp)
  const [draftTitle, setDraftTitle] = useState('Promo Servis Berkala & Ganti Oli Rutin');
  const [draftTarget, setDraftTarget] = useState('Semua Pelanggan Terdaftar');
  const [draftMessage, setDraftMessage] = useState(
    `🛵 PROMO KHUSUS BENGKEL QU! 🛵\n\nHalo Sahabat Bengkel Qu!\nSudah waktunya ganti oli atau servis rutin motormu? Dapatkan DISKON 15% untuk Paket Ganti Oli + Servis CVT minggu ini!\n\n✅ Oli Dijamin 100% Asli\n✅ Free Cek Rem & Tekanan Ban\n✅ Mekanik Profesional\n\nTunjukkan pesan ini ke kasir Bengkel Qu saat pengerjaan. Kami siap melayani!`
  );

  // Sub-Menu B Form State (Promo & Diskon)
  const [newVoucherCode, setNewVoucherCode] = useState('');
  const [newVoucherTitle, setNewVoucherTitle] = useState('');
  const [newVoucherType, setNewVoucherType] = useState<'Persen' | 'Nominal'>('Persen');
  const [newVoucherValue, setNewVoucherValue] = useState<number>(10);
  const [newVoucherMinTx, setNewVoucherMinTx] = useState<number>(75000);
  const [newVoucherValidUntil, setNewVoucherValidUntil] = useState('30 Nov 2026');
  const [newVoucherCategory, setNewVoucherCategory] = useState<PromoVoucher['category']>('Jasa Servis');
  const [newVoucherQuota, setNewVoucherQuota] = useState<number>(50);
  const [isAddVoucherFormOpen, setIsAddVoucherFormOpen] = useState(false);

  useEffect(() => {
    if (initialTab) {
      if (initialTab === 'voucher-diskon' || initialTab === 'voucher') setActiveTab('promo-diskon');
      else if (initialTab === 'ulasan-google' || initialTab === 'reviews') setActiveTab('riwayat-pesan');
      else setActiveTab(initialTab);
    }
  }, [initialTab]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const todayStr = new Date().toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const getHeaderMeta = () => {
    switch (activeTab) {
      case 'broadcast-wa':
        return {
          title: 'Broadcast WhatsApp',
          subtitle: 'Form Draf & Kirim Pesan Promo / Reminder Servis'
        };
      case 'promo-diskon':
        return {
          title: 'Promo & Diskon',
          subtitle: 'Kelola Voucher Diskon & Potongan Servis Bengkel'
        };
      case 'riwayat-pesan':
        return {
          title: 'Riwayat Pesan / Campaign',
          subtitle: 'Log Kampanye Pesan & Pengiriman Promosi'
        };
      default:
        return {
          title: 'Marketing',
          subtitle: 'Promosi & Komunikasi Pelanggan'
        };
    }
  };

  const headerMeta = getHeaderMeta();

  // Quick preset templates for Broadcast WA
  const PRESET_TEMPLATES = [
    {
      label: 'Promo Oli & CVT 15%',
      title: 'Diskon Paket Servis CVT + Oli Mesin 15%',
      text: `🛵 PROMO BENGKEL QU 🛵\nHalo Sahabat Bengkel Qu!\nNikmati potongan 15% untuk paket ganti oli MPX/SPX/Yamalube + servis CVT.\nTarikan motor enteng kembali, siap gas tanpa kendala!`
    },
    {
      label: 'Reminder Ganti Oli Rutin',
      title: 'Reminder Servis Berkala & Ganti Oli Rutin',
      text: `🔧 JADWAL SERVIS BERKALA MOTOR ANDA 🔧\nHalo Kak! Motor Anda sudah waktunya servis berkala dan cek kesehatan aki di Bengkel Qu.\nYuk mampir hari ini, kami buka sampai jam 17:00 WIB.`
    },
    {
      label: 'Cek Aki & Kelistrikan Gratis',
      title: 'Gratis Pemeriksaan Aki & Tekanan Angin Digital',
      text: `⚡ PROMO MUSIM HUJAN: CEK AKI GRATIS! ⚡\nBengkel Qu menyediakan pengecekan tegangan aki & scanner injeksi gratis untuk motor Anda agar tidak mogok di jalan!`
    }
  ];

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftTitle.trim() || !draftMessage.trim()) {
      showToast('Harap isi judul kampanye dan pesan promosi!');
      return;
    }

    const now = new Date();
    const dateFormatted = `${now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}, ${now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`;

    const recipientEstimate = 
      draftTarget === 'Semua Pelanggan Terdaftar' 
        ? customers.length 
        : Math.max(12, Math.floor(customers.length * 0.7));

    const newCmp: MarketingCampaign = {
      id: `cmp-${Date.now()}`,
      title: draftTitle.trim(),
      channel: 'WhatsApp',
      targetAudience: `${draftTarget} (${recipientEstimate} Kontak)`,
      messageContent: draftMessage.trim(),
      sentDate: dateFormatted,
      recipientCount: recipientEstimate,
      status: 'Terkirim',
      deliveredPercent: 100
    };

    onSendCampaign(newCmp);
    showToast(`Pesan broadcast berhasil dikirimkan ke ${recipientEstimate} kontak WhatsApp pelanggan!`);
    setActiveTab('riwayat-pesan');
  };

  const handleCreateVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVoucherCode.trim() || !newVoucherTitle.trim()) {
      showToast('Harap isi kode voucher dan judul promo!');
      return;
    }

    const newVch: PromoVoucher = {
      id: `vch-${Date.now()}`,
      code: newVoucherCode.trim().toUpperCase(),
      title: newVoucherTitle.trim(),
      discountType: newVoucherType,
      discountValue: Number(newVoucherValue) || 10,
      minTransaction: Number(newVoucherMinTx) || 0,
      validUntil: newVoucherValidUntil.trim() || '31 Des 2026',
      category: newVoucherCategory,
      quota: Number(newVoucherQuota) || 50,
      usedCount: 0,
      isActive: true,
      notes: `Voucher diskon ${newVoucherCategory}`
    };

    onAddVoucher(newVch);
    setIsAddVoucherFormOpen(false);
    showToast(`Voucher ${newVch.code} berhasil dibuat dan diaktifkan di kasir!`);

    // Reset Form
    setNewVoucherCode('');
    setNewVoucherTitle('');
    setNewVoucherValue(10);
    setNewVoucherMinTx(75000);
  };

  const handleCopyText = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
    showToast('Teks berhasil disalin ke clipboard!');
  };

  return (
    <div className="flex-1 bg-slate-50 flex flex-col min-h-screen">
      {/* =========================================================================
          1. COMPACT SUB-MENU HEADER
          - Shrunk compact header
          - Dynamically matches active sub-menu
          - Hiding unnecessary quick filter buttons
      ========================================================================= */}
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
              <h1 className="text-base font-extrabold tracking-tight truncate leading-tight">
                {headerMeta.title}
              </h1>
              <p className="text-[11px] text-emerald-100 font-medium truncate opacity-90 leading-none mt-0.5">
                {headerMeta.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <div className="px-2 py-1 rounded-lg bg-emerald-800/40 text-[10px] font-bold text-white flex items-center gap-1">
              <Calendar className="w-3 h-3 text-emerald-200" />
              <span>{todayStr}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="bg-emerald-900 text-white text-xs font-semibold px-4 py-2.5 shadow-lg flex items-center justify-between gap-2 sticky top-[48px] z-20">
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-[10px] text-emerald-300 font-bold hover:underline shrink-0"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="p-4 space-y-4 max-w-4xl mx-auto w-full pb-20">

        {/* =====================================================================
            SUB-MENU A: BROADCAST WHATSAPP
            - Large form card with minimalist underlined inputs for drafting and sending service reminders or promo messages
        ===================================================================== */}
        {activeTab === 'broadcast-wa' && (
          <div className="space-y-4">
            {/* LARGE FORM CARD */}
            <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-xs border border-slate-200/80 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                    Formulir Draf Siaran Broadcast WhatsApp
                  </h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Kirim pesan promosi, kupon diskon, atau pengingat servis berkala langsung ke pelanggan.
                  </p>
                </div>
                <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <Send className="w-4 h-4" />
                </div>
              </div>

              {/* Template Presets */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Pilih Contoh Template Cepat:
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_TEMPLATES.map((tmpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setDraftTitle(tmpl.title);
                        setDraftMessage(tmpl.text);
                        showToast(`Template "${tmpl.label}" dimuat ke formulir.`);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      {tmpl.label}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSendBroadcast} className="space-y-4">
                {/* Judul Kampanye */}
                <div className="group">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Nama Kampanye / Subjek Pesan *
                  </label>
                  <input
                    type="text"
                    required
                    value={draftTitle}
                    onChange={(e) => setDraftTitle(e.target.value)}
                    placeholder="Contoh: Promo Ganti Oli + Servis CVT Diskon 15%"
                    className="w-full bg-transparent border-0 border-b border-slate-300 focus:border-[#008952] focus:ring-0 rounded-none py-1.5 px-0 text-slate-900 font-bold text-xs focus:outline-none"
                  />
                </div>

                {/* Target Penerima */}
                <div className="group">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Target Sasaran Pelanggan *
                  </label>
                  <select
                    value={draftTarget}
                    onChange={(e) => setDraftTarget(e.target.value)}
                    className="w-full bg-transparent border-0 border-b border-slate-300 focus:border-[#008952] focus:ring-0 rounded-none py-1.5 px-0 text-slate-800 font-medium text-xs focus:outline-none"
                  >
                    <option value="Semua Pelanggan Terdaftar">Semua Pelanggan Terdaftar ({customers.length} Kontak)</option>
                    <option value="Pelanggan Servis Lebih Dari 2 Bulan">Pelanggan Servis Lebih Dari 2 Bulan (Reminder Rutin)</option>
                    <option value="Pemilik Motor Matic (Vario, BeAT, NMAX, Aerox)">Pemilik Motor Matic (Khusus Promo CVT)</option>
                    <option value="Member Poin Loyalitas Tinggi">Member Loyalitas (Poin Reward)</option>
                  </select>
                </div>

                {/* Pesan WhatsApp */}
                <div className="group">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Isi Pesan WhatsApp *
                  </label>
                  <textarea
                    rows={6}
                    required
                    value={draftMessage}
                    onChange={(e) => setDraftMessage(e.target.value)}
                    placeholder="Ketik draf pesan siaran promosi Anda di sini..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs text-slate-800 focus:outline-none focus:border-[#008952] font-mono leading-relaxed"
                  />
                  <span className="text-[10px] text-slate-400 block mt-1">
                    Panjang teks: {draftMessage.length} karakter. Gunakan simbol *tebal* atau _miring_ untuk format teks WhatsApp.
                  </span>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full bg-[#008952] hover:bg-emerald-700 active:scale-98 text-white font-extrabold py-3.5 rounded-2xl shadow-xs text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Kirim Siaran Broadcast WhatsApp ke Pelanggan</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* =====================================================================
            SUB-MENU B: PROMO & DISKON
            - Medium-to-large card layout to manage active discounts and service vouchers using minimalist underlined fields
        ===================================================================== */}
        {activeTab === 'promo-diskon' && (
          <div className="space-y-4">
            {/* Header Action & Stats */}
            <div className="flex items-center justify-between px-1">
              <div>
                <h2 className="text-sm font-extrabold text-slate-900 tracking-tight">
                  Manajemen Voucher & Promo Aktif ({vouchers.filter((v) => v.isActive).length} Voucher Aktif)
                </h2>
                <p className="text-[11px] text-slate-500">
                  Voucher otomatis terbaca saat proses pembayaran di menu Kasir.
                </p>
              </div>

              <button
                onClick={() => setIsAddVoucherFormOpen(!isAddVoucherFormOpen)}
                className="px-3 py-1.5 rounded-xl bg-[#008952] text-white text-xs font-bold flex items-center gap-1 shadow-2xs hover:bg-emerald-700 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAddVoucherFormOpen ? 'Tutup Form' : '+ Tambah Promo'}</span>
              </button>
            </div>

            {/* FORM CARD (COLLAPSIBLE / EXPANDED) */}
            {isAddVoucherFormOpen && (
              <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-emerald-200/80 space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Input Voucher Promo & Diskon Baru
                  </h3>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                    Minimalist Underlined Form
                  </span>
                </div>

                <form onSubmit={handleCreateVoucher} className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="group">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Kode Kupon / Voucher (KAPITAL) *
                      </label>
                      <input
                        type="text"
                        required
                        value={newVoucherCode}
                        onChange={(e) => setNewVoucherCode(e.target.value)}
                        placeholder="Contoh: BENGKELQU15"
                        className="w-full bg-transparent border-0 border-b border-slate-300 focus:border-[#008952] focus:ring-0 rounded-none py-1.5 px-0 text-slate-900 font-black text-xs uppercase"
                      />
                    </div>

                    <div className="group">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Judul Promosi *
                      </label>
                      <input
                        type="text"
                        required
                        value={newVoucherTitle}
                        onChange={(e) => setNewVoucherTitle(e.target.value)}
                        placeholder="Contoh: Diskon Servis Rutin 15%"
                        className="w-full bg-transparent border-0 border-b border-slate-300 focus:border-[#008952] focus:ring-0 rounded-none py-1.5 px-0 text-slate-800 font-bold text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div className="group">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Tipe Potongan
                      </label>
                      <select
                        value={newVoucherType}
                        onChange={(e) => setNewVoucherType(e.target.value as any)}
                        className="w-full bg-transparent border-0 border-b border-slate-300 focus:border-[#008952] focus:ring-0 rounded-none py-1.5 px-0 text-slate-800 font-medium text-xs"
                      >
                        <option value="Persen">Persentase (%)</option>
                        <option value="Nominal">Nominal Tetap (Rp)</option>
                      </select>
                    </div>

                    <div className="group">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Nilai Potongan {newVoucherType === 'Persen' ? '(%)' : '(Rp)'} *
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={newVoucherValue}
                        onChange={(e) => setNewVoucherValue(Number(e.target.value))}
                        className="w-full bg-transparent border-0 border-b border-slate-300 focus:border-[#008952] focus:ring-0 rounded-none py-1.5 px-0 text-[#008952] font-black text-xs"
                      />
                    </div>

                    <div className="group">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Min. Transaksi (Rp)
                      </label>
                      <input
                        type="number"
                        value={newVoucherMinTx}
                        onChange={(e) => setNewVoucherMinTx(Number(e.target.value))}
                        className="w-full bg-transparent border-0 border-b border-slate-300 focus:border-[#008952] focus:ring-0 rounded-none py-1.5 px-0 text-slate-800 font-bold text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div className="group">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Kategori Berlaku
                      </label>
                      <select
                        value={newVoucherCategory}
                        onChange={(e) => setNewVoucherCategory(e.target.value as any)}
                        className="w-full bg-transparent border-0 border-b border-slate-300 focus:border-[#008952] focus:ring-0 rounded-none py-1.5 px-0 text-slate-800 font-medium text-xs"
                      >
                        <option value="Semua">Semua Pembelian</option>
                        <option value="Jasa Servis">Jasa Servis Saja</option>
                        <option value="Sparepart">Suku Cadang Saja</option>
                        <option value="Oli">Oli & Pelumas</option>
                      </select>
                    </div>

                    <div className="group">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Berlaku Sampai
                      </label>
                      <input
                        type="text"
                        value={newVoucherValidUntil}
                        onChange={(e) => setNewVoucherValidUntil(e.target.value)}
                        placeholder="30 Nov 2026"
                        className="w-full bg-transparent border-0 border-b border-slate-300 focus:border-[#008952] focus:ring-0 rounded-none py-1.5 px-0 text-slate-800 font-medium text-xs"
                      />
                    </div>

                    <div className="group">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Batas Kuota Pemakaian
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={newVoucherQuota}
                        onChange={(e) => setNewVoucherQuota(Number(e.target.value))}
                        className="w-full bg-transparent border-0 border-b border-slate-300 focus:border-[#008952] focus:ring-0 rounded-none py-1.5 px-0 text-slate-800 font-medium text-xs"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddVoucherFormOpen(false)}
                      className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 rounded-xl bg-[#008952] hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs"
                    >
                      Simpan & Aktifkan Voucher
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* MEDIUM-TO-LARGE CARDS DISPLAYING ACTIVE VOUCHERS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {vouchers.map((v) => (
                <div
                  key={v.id}
                  className={`bg-white rounded-3xl p-5 shadow-xs border transition-all space-y-3 ${
                    v.isActive ? 'border-slate-200/90 hover:border-emerald-300' : 'border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200 tracking-wider">
                          {v.code}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                          {v.category}
                        </span>
                      </div>
                      <h3 className="font-extrabold text-slate-900 text-sm mt-1.5">
                        {v.title}
                      </h3>
                    </div>

                    <div className="text-right">
                      <span className="text-lg font-black text-[#008952]">
                        {v.discountType === 'Persen' ? `${v.discountValue}%` : `Rp ${v.discountValue.toLocaleString('id-ID')}`}
                      </span>
                      <span className="block text-[10px] text-slate-400">
                        Min. Rp {v.minTransaction.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                    <span>Berlaku s/d: <strong className="text-slate-800">{v.validUntil}</strong></span>
                    <span>Terpakai: <strong className="text-slate-800">{v.usedCount} / {v.quota}</strong></span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      v.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {v.isActive ? '● Status Aktif' : '○ Nonaktif'}
                    </span>

                    <button
                      onClick={() => {
                        onToggleVoucherActive(v.id);
                        showToast(`Status voucher ${v.code} telah diubah.`);
                      }}
                      className="text-xs text-slate-600 hover:text-slate-900 font-bold underline cursor-pointer"
                    >
                      {v.isActive ? 'Nonaktifkan' : 'Aktifkan Kembali'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =====================================================================
            SUB-MENU C: RIWAYAT PESAN / CAMPAIGN
            - Minimalist underlined list view tracking previously sent marketing campaigns
        ===================================================================== */}
        {activeTab === 'riwayat-pesan' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div>
                <h2 className="text-sm font-extrabold text-slate-900 tracking-tight">
                  Riwayat Kampanye & Siaran Pesan ({campaigns.length} Riwayat)
                </h2>
                <p className="text-[11px] text-slate-500">
                  Log kronologis seluruh pengiriman pesan siaran promosi bengkel.
                </p>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                Minimalist Underlined Log
              </span>
            </div>

            {/* Minimalist Underlined List View */}
            <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs divide-y divide-slate-100">
              {campaigns.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  Belum ada kampanye pesan yang dikirim
                </div>
              ) : (
                campaigns.map((cmp, idx) => (
                  <div key={cmp.id} className="p-4 hover:bg-slate-50/70 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900">
                            {cmp.channel}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {cmp.sentDate}
                          </span>
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                            {cmp.deliveredPercent}% Terkirim
                          </span>
                        </div>

                        <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm">
                          {cmp.title}
                        </h4>

                        <p className="text-xs text-slate-600 line-clamp-2 italic font-mono bg-slate-50 p-2 rounded-xl border border-slate-100">
                          "{cmp.messageContent}"
                        </p>

                        <div className="text-[11px] text-slate-500 pt-0.5">
                          Sasaran: <strong className="text-slate-700">{cmp.targetAudience}</strong>
                        </div>
                      </div>

                      <div className="text-left sm:text-right shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-black">
                          {cmp.recipientCount} Kontak
                        </span>
                        <div className="mt-1">
                          <button
                            onClick={() => handleCopyText(cmp.messageContent, idx)}
                            className="text-[11px] text-emerald-700 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Copy className="w-3 h-3" />
                            <span>{copiedIndex === idx ? 'Tersalin!' : 'Salin Pesan'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
