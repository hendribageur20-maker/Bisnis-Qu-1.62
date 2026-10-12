import React, { useState } from 'react';
import { X, Wrench, Car, User, Phone, FileText, Check } from 'lucide-react';
import { ServiceQueue, Mechanic } from '../../types';

interface NewQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddQueue: (newQueue: ServiceQueue) => void;
  mechanics: Mechanic[];
  existingQueueCount: number;
}

export const NewQueueModal: React.FC<NewQueueModalProps> = ({
  isOpen,
  onClose,
  onAddQueue,
  mechanics,
  existingQueueCount
}) => {
  if (!isOpen) return null;

  const nextQueueNum = `BQ-0${existingQueueCount + 1}`;

  const [plateNumber, setPlateNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [vehicleModel, setVehicleModel] = useState('Honda Vario 160');
  const [vehicleType, setVehicleType] = useState<ServiceQueue['vehicleType']>('Motor Matic');
  const [serviceCategory, setServiceCategory] = useState<ServiceQueue['serviceCategory']>('Servis Berkala');
  const [complaint, setComplaint] = useState('');
  const [selectedMechanic, setSelectedMechanic] = useState(mechanics[0]?.name || 'Mas Joko');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plateNumber.trim() || !customerName.trim()) return;

    const newQueue: ServiceQueue = {
      id: `queue-${Date.now()}`,
      queueNumber: nextQueueNum,
      plateNumber: plateNumber.toUpperCase(),
      customerName,
      customerPhone: customerPhone || '08123456789',
      vehicleModel,
      vehicleType,
      serviceCategory,
      mechanicName: selectedMechanic,
      status: 'menunggu',
      complaint: complaint || 'Pemeriksaan rutin berkala',
      timeIn: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
      estimatedCompletion: '45 Menit',
      progressPercent: 0,
      totalCost: 95000,
      items: [
        { id: `it-1`, name: 'Jasa Servis & Pengecekan Rutin', price: 45000, qty: 1, type: 'jasa' },
        { id: `it-2`, name: 'Oli Mesin Berkualitas', price: 50000, qty: 1, type: 'part' }
      ]
    };

    onAddQueue(newQueue);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#008952] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Wrench className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Input Antrian Servis Baru</h3>
              <p className="text-[11px] text-emerald-100">Nomor Antrian: <span className="font-bold underline">{nextQueueNum}</span></p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3 overflow-y-auto text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Nomor Plat Kendaraan *</label>
            <input
              type="text"
              required
              value={plateNumber}
              onChange={(e) => setPlateNumber(e.target.value)}
              placeholder="Contoh: D 4521 ABC"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold uppercase text-slate-900 tracking-wider text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Nama Pemilik *</label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Nama Pemilik"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-900"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Nomor WhatsApp</label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="08123456789"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Tipe Kendaraan</label>
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-900"
              >
                <option value="Motor Matic">Motor Matic</option>
                <option value="Motor Bebek">Motor Bebek</option>
                <option value="Motor Sport">Motor Sport</option>
                <option value="Mobil">Mobil</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Model & Seri</label>
              <input
                type="text"
                value={vehicleModel}
                onChange={(e) => setVehicleModel(e.target.value)}
                placeholder="Contoh: Vario 160 / NMAX"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Kategori Servis</label>
              <select
                value={serviceCategory}
                onChange={(e) => setServiceCategory(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-900"
              >
                <option value="Servis Berkala">Servis Berkala</option>
                <option value="Servis Ringan">Servis Ringan</option>
                <option value="Ganti Oli & Filter">Ganti Oli & Filter</option>
                <option value="Turun Mesin">Turun Mesin</option>
                <option value="Kelistrikan">Kelistrikan</option>
              </select>
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Mekanik yang Ditugaskan</label>
              <select
                value={selectedMechanic}
                onChange={(e) => setSelectedMechanic(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-900"
              >
                {mechanics.map((m) => (
                  <option key={m.id} value={m.name}>
                    {m.name} ({m.activeTasks} aktif)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Keluhan / Catatan Servis</label>
            <textarea
              rows={2}
              value={complaint}
              onChange={(e) => setComplaint(e.target.value)}
              placeholder="Contoh: Tarikan awal gredek, minta cek v-belt dan ganti oli gardan."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#008952] hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-md shadow-emerald-700/20 active:scale-95 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Cetak & Simpan Antrian</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
