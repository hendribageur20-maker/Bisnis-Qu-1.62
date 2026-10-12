import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Building2, 
  Save, 
  CheckCircle2, 
  MapPin, 
  UserCheck, 
  Phone, 
  Mail, 
  Sparkles, 
  Check, 
  Smartphone,
  Lock,
  Zap,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { BranchItem, SubscriptionState } from '../../types';

interface CorporateBranchesViewProps {
  onBack: () => void;
  branches: BranchItem[];
  onSaveBranches: (updated: BranchItem[]) => void;
  onNavigateToDevices?: () => void;
  subscription?: SubscriptionState;
  onActivateBranchTrial?: () => void;
}

export const CorporateBranchesView: React.FC<CorporateBranchesViewProps> = ({
  onBack,
  branches,
  onSaveBranches,
  onNavigateToDevices,
  subscription,
  onActivateBranchTrial
}) => {
  const [branchList, setBranchList] = useState<BranchItem[]>(branches);
  const [savedIndex, setSavedIndex] = useState<number | null>(null);
  const [globalSaved, setGlobalSaved] = useState(false);

  const [lockNotice, setLockNotice] = useState<string | null>(null);

  const isBranchFeatureActive = Boolean(
    subscription?.isBranchTrialActive ||
    subscription?.isBranchSubscribed ||
    subscription?.isTrialActive ||
    (subscription?.isSubscribed && (subscription?.planId === 'addon_branch' || subscription?.planId === 'corporate'))
  );

  const handleFieldChange = (index: number, field: keyof BranchItem, value: any) => {
    const updated = [...branchList];
    updated[index] = { ...updated[index], [field]: value };
    setBranchList(updated);
  };

  const handleSetActiveBranch = (index: number) => {
    // Cabang 1 (Utama) selalu bisa diakses di Basic Freemium
    // Cabang 2 & 3 memerlukan trial aktif atau add-on aktif
    if (index > 0 && !isBranchFeatureActive) {
      setLockNotice(
        `Slot Cabang ${index + 1} terkunci dari transaksi baru. Seluruh data cabang #${branchList[index].id} tetap tersimpan 100% aman di perangkat. Aktifkan Trial 10 Hari Add-On Cabang untuk membuka akses!`
      );
      setTimeout(() => setLockNotice(null), 5000);
      return;
    }

    const updated = branchList.map((b: BranchItem, i: number) => ({
      ...b,
      isActive: i === index
    }));
    setBranchList(updated);
    onSaveBranches(updated);
  };

  const handleSaveCard = (index: number, e: React.FormEvent) => {
    e.preventDefault();
    onSaveBranches(branchList);
    setSavedIndex(index);
    setTimeout(() => setSavedIndex(null), 2000);
  };

  const handleSaveAll = () => {
    onSaveBranches(branchList);
    setGlobalSaved(true);
    setTimeout(() => setGlobalSaved(false), 2000);
  };

  return (
    <div className="flex-1 bg-slate-50 flex flex-col">
      {/* Top Header */}
      <div className="bg-[#008952] text-white px-5 pt-4 pb-6 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              aria-label="Kembali"
              className="w-10 h-10 rounded-full bg-white/15 active:bg-white/30 flex items-center justify-center transition-colors shadow-sm"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Corporate: Cabang</h1>
              <p className="text-xs text-emerald-100 font-medium">3 Form Card Manajemen Outlet</p>
            </div>
          </div>
          <button
            onClick={handleSaveAll}
            className="bg-white text-[#008952] font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1 shadow-sm active:scale-95 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4 stroke-[2.3]" />
            <span>Simpan Semua</span>
          </button>
        </div>
        <p className="text-[11px] text-emerald-100 mt-2">
          Kelola data alamat, kontak, dan penanggung jawab SPV untuk masing-masing cabang bengkel.
        </p>

        {onNavigateToDevices && (
          <button
            type="button"
            onClick={onNavigateToDevices}
            className="w-full mt-3 bg-white/20 hover:bg-white/30 text-white rounded-xl py-2 px-3 text-xs font-bold flex items-center justify-between transition-all cursor-pointer shadow-xs active:scale-98"
          >
            <span className="flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5" />
              <span>Kelola Slot HP Multi-Cabang (Maksimal 9 HP)</span>
            </span>
            <span className="bg-white/25 px-2 py-0.5 rounded-lg text-[10px]">Tautkan HP →</span>
          </button>
        )}
      </div>

      {/* Trial Active Banner */}
      {subscription?.isBranchTrialActive && (
        <div className="mx-4 mt-3 p-3 bg-purple-50 border border-purple-200 text-purple-950 rounded-2xl text-xs flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
            <div>
              <span className="font-extrabold text-[11px] block">Trial Add-On Cabang Aktif (Auto-ON)</span>
              <span className="text-[10px] text-purple-700">Sisa {subscription.branchTrialDaysRemaining || 10} Hari • Seluruh cabang terbuka penuh</span>
            </div>
          </div>
          <span className="text-[9px] font-black bg-purple-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
            Auto-ON
          </span>
        </div>
      )}

      {/* Fallback Data Aman Indicator */}
      {!isBranchFeatureActive && (
        <div className="mx-4 mt-3 p-3.5 bg-amber-50 border border-amber-200 text-amber-950 rounded-2xl text-xs space-y-2 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-amber-900 text-[11px]">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Jaminan Data Aman 100% (Mode Basic Freemium)</span>
            </div>
            <span className="text-[9px] font-bold bg-white text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300">
              Data Tersimpan
            </span>
          </div>
          <p className="text-[10px] text-amber-900/80 leading-relaxed">
            Masa aktif paket Core/Trial telah berakhir, sistem otomatis kembali ke Basic Freemium. Seluruh data cabang & transaksi Anda tetap tersimpan utuh di database lokal. Slot cabang 2 & 3 terkunci dari transaksi baru sampai diperpanjang.
          </p>
          {onActivateBranchTrial && (
            <button
              type="button"
              onClick={onActivateBranchTrial}
              className="w-full bg-[#008952] hover:bg-emerald-700 active:scale-98 text-white font-black py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 fill-white" />
              <span>Aktifkan Trial 10 Hari Add-On Cabang (Auto-ON)</span>
            </button>
          )}
        </div>
      )}

      {/* Lock Toast Notice */}
      {lockNotice && (
        <div className="mx-4 mt-3 p-3 bg-slate-900 text-white rounded-2xl text-xs flex items-center justify-between border border-amber-400/50 shadow-xl animate-in fade-in">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-[11px] leading-tight font-medium">{lockNotice}</span>
          </div>
          {onActivateBranchTrial && (
            <button
              type="button"
              onClick={onActivateBranchTrial}
              className="ml-2 bg-amber-400 hover:bg-amber-300 text-slate-950 text-[10px] font-black px-2.5 py-1 rounded-lg shrink-0 cursor-pointer"
            >
              Aktifkan Trial
            </button>
          )}
        </div>
      )}

      {globalSaved && (
        <div className="m-4 mb-0 p-3.5 bg-emerald-100 border border-emerald-300 text-[#008952] rounded-2xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#008952]" />
          <span>Seluruh data 3 cabang berhasil disimpan ke sistem!</span>
        </div>
      )}

      {/* 3 Form Cards Container */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {branchList.map((branch: BranchItem, idx: number) => {
          const isLocked = idx > 0 && !isBranchFeatureActive;
          return (
          <form
            key={branch.id}
            onSubmit={(e) => handleSaveCard(idx, e)}
            className={`bg-white rounded-3xl p-4 shadow-xs border transition-all space-y-3.5 ${
              branch.isActive
                ? 'border-[#008952] ring-2 ring-emerald-500/20'
                : isLocked
                ? 'border-slate-200 bg-slate-50/60'
                : 'border-slate-100 hover:border-emerald-200'
            }`}
          >
            {/* Header Form Card */}
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs ${
                  isLocked ? 'bg-slate-200 text-slate-600' : 'bg-emerald-50 text-[#008952]'
                }`}>
                  0{idx + 1}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-slate-900 text-sm">
                      Form Card Cabang {idx + 1}
                    </h3>
                    {isLocked && (
                      <span className="px-1.5 py-0.2 bg-slate-200 text-slate-600 rounded text-[9px] font-bold">
                        Terkunci
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400">ID Outlet: #{branch.id}</span>
                </div>
              </div>

              {branch.isActive ? (
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-[#008952] border border-emerald-200 text-[10px] font-bold flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  <span>Cabang Aktif</span>
                </span>
              ) : isLocked ? (
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold border border-slate-200 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-slate-400" />
                    <span>Slot Terkunci</span>
                  </span>
                  {onActivateBranchTrial && (
                    <button
                      type="button"
                      onClick={onActivateBranchTrial}
                      className="px-2 py-0.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-black transition-all cursor-pointer shadow-xs active:scale-95"
                    >
                      Buka Trial
                    </button>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSetActiveBranch(idx)}
                  className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-[#008952] text-[10px] font-bold transition-colors cursor-pointer"
                >
                  Pilih Cabang Ini
                </button>
              )}
            </div>

            {savedIndex === idx && (
              <div className="p-2 bg-emerald-50 text-[#008952] rounded-xl text-[11px] font-bold flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                <span>Data Cabang {idx + 1} berhasil disimpan!</span>
              </div>
            )}

            {/* 1. Nama Cabang */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1 mb-1">
                <Building2 className="w-3 h-3 text-[#008952]" />
                Nama Cabang *
              </label>
              <input
                type="text"
                required
                value={branch.branchName}
                onChange={(e) => handleFieldChange(idx, 'branchName', e.target.value)}
                placeholder="Nama Cabang"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            {/* 2. Alamat */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1 mb-1">
                <MapPin className="w-3 h-3 text-[#008952]" />
                Alamat Cabang *
              </label>
              <textarea
                rows={2}
                required
                value={branch.address}
                onChange={(e) => handleFieldChange(idx, 'address', e.target.value)}
                placeholder="Alamat Cabang"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            {/* 3. SPV */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1 mb-1">
                <UserCheck className="w-3 h-3 text-[#008952]" />
                Supervisor (SPV) *
              </label>
              <input
                type="text"
                required
                value={branch.spvName}
                onChange={(e) => handleFieldChange(idx, 'spvName', e.target.value)}
                placeholder="Nama SPV Penanggung Jawab"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            {/* 4. No HP & 5. Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1 mb-1">
                  <Phone className="w-3 h-3 text-[#008952]" />
                  No HP Cabang *
                </label>
                <input
                  type="tel"
                  required
                  value={branch.phone}
                  onChange={(e) => handleFieldChange(idx, 'phone', e.target.value)}
                  placeholder="08xx-xxxx-xxxx"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1 mb-1">
                  <Mail className="w-3 h-3 text-[#008952]" />
                  Email Cabang *
                </label>
                <input
                  type="email"
                  required
                  value={branch.email}
                  onChange={(e) => handleFieldChange(idx, 'email', e.target.value)}
                  placeholder="cabang@bengkelqu.id"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            {/* Tombol Simpan Form Card */}
            <div className="pt-1 flex items-center justify-end">
              <button
                type="submit"
                className="bg-[#008952] hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Cabang {idx + 1}</span>
              </button>
            </div>
          </form>
          );
        })}
      </div>
    </div>
  );
};
