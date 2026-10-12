/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  MENU_MODULES, 
  INITIAL_QUEUES, 
  INITIAL_SPAREPARTS, 
  INITIAL_TRANSACTIONS, 
  INITIAL_MECHANICS, 
  INITIAL_CUSTOMERS, 
  INITIAL_NOTIFICATIONS,
  INITIAL_PROFILE,
  INITIAL_PERMISSIONS,
  INITIAL_BRANCHES,
  INITIAL_DAMAGED_GOODS,
  INITIAL_PROCUREMENTS,
  INITIAL_CAMPAIGNS,
  INITIAL_VOUCHERS
} from './data/mockData';
import { 
  MenuModuleConfig, 
  SubMenuItemConfig, 
  ServiceQueue, 
  ServiceItem,
  Sparepart, 
  Transaction, 
  ServiceStatus, 
  CustomerVehicle, 
  NotificationItem,
  WorkshopProfile,
  RolePermissionConfig,
  BranchItem,
  UserSession,
  DamagedGood,
  ProcurementRecord,
  MarketingCampaign,
  PromoVoucher,
  ExpenseItem,
  SubscriptionPlanId,
  SubscriptionState,
  ProDurationOption
} from './types';
import { 
  getOrCreateDeviceId, 
  validateSerialNumber, 
  checkAndMigrateAppData,
  PRO_TIERS
} from './utils/licenseManager';
import { AndroidFrame } from './components/common/AndroidFrame';
import { BottomNavBar } from './components/common/BottomNavBar';
import { HomeDashboard } from './components/home/HomeDashboard';
import { SubMenuPage } from './components/submenu/SubMenuPage';
import { ServiceDetailView } from './components/views/ServiceDetailView';
import { CashierPOSView } from './components/views/CashierPOSView';
import { InventoryView } from './components/views/InventoryView';
import { CustomerView } from './components/views/CustomerView';
import { MarketingView } from './components/views/MarketingView';
import { ReportView } from './components/views/ReportView';
import { BasicProfileView } from './components/views/BasicProfileView';
import { CorePermissionsView } from './components/views/CorePermissionsView';
import { CorporateBranchesView } from './components/views/CorporateBranchesView';
import { DeviceSyncView } from './components/views/DeviceSyncView';
import { SettingView } from './components/views/SettingView';
import { LoginScreen } from './components/auth/LoginScreen';
import { NewQueueModal } from './components/modals/NewQueueModal';
import { ReceiptModal } from './components/modals/ReceiptModal';
import { NotificationDrawer } from './components/modals/NotificationDrawer';
import { SubscriptionModal } from './components/modals/SubscriptionModal';

export default function App() {
  // Persistence state
  const [queues, setQueues] = useState<ServiceQueue[]>(() => {
    const saved = localStorage.getItem('bq_queues');
    return saved ? JSON.parse(saved) : INITIAL_QUEUES;
  });

  const [spareparts, setSpareparts] = useState<Sparepart[]>(() => {
    const saved = localStorage.getItem('bq_spareparts');
    return saved ? JSON.parse(saved) : INITIAL_SPAREPARTS;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('bq_transactions');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  const [customers, setCustomers] = useState<CustomerVehicle[]>(() => {
    const saved = localStorage.getItem('bq_customers');
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem('bq_notifs');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  const [damagedGoods, setDamagedGoods] = useState<DamagedGood[]>(() => {
    const saved = localStorage.getItem('bq_damaged_goods');
    return saved ? JSON.parse(saved) : INITIAL_DAMAGED_GOODS;
  });

  const [procurements, setProcurements] = useState<ProcurementRecord[]>(() => {
    const saved = localStorage.getItem('bq_procurements');
    return saved ? JSON.parse(saved) : INITIAL_PROCUREMENTS;
  });

  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>(() => {
    const saved = localStorage.getItem('bq_campaigns');
    return saved ? JSON.parse(saved) : INITIAL_CAMPAIGNS;
  });

  const [vouchers, setVouchers] = useState<PromoVoucher[]>(() => {
    const saved = localStorage.getItem('bq_vouchers');
    return saved ? JSON.parse(saved) : INITIAL_VOUCHERS;
  });

  const [expenses, setExpenses] = useState<ExpenseItem[]>(() => {
    const saved = localStorage.getItem('bq_kas_kecil');
    return saved ? JSON.parse(saved) : [
      { id: 'exp-1', title: 'Bensin Pertalite Tes Motor Tarikan', category: 'BBM / Transport', amount: 25000, date: 'Hari Ini', notes: 'Tes motor KLX BQ-05' },
      { id: 'exp-2', title: 'Beli Air Mineral Galon & Gelas Kasir', category: 'Konsumsi', amount: 22000, date: 'Hari Ini', notes: 'Konsumsi bengkel' }
    ];
  });

  const [profile, setProfile] = useState<WorkshopProfile>(() => {
    const saved = localStorage.getItem('bq_profile');
    return saved ? JSON.parse(saved) : INITIAL_PROFILE;
  });

  const [permissions, setPermissions] = useState<RolePermissionConfig[]>(() => {
    const saved = localStorage.getItem('bq_permissions');
    return saved ? JSON.parse(saved) : INITIAL_PERMISSIONS;
  });

  const [branches, setBranches] = useState<BranchItem[]>(() => {
    const saved = localStorage.getItem('bq_branches');
    return saved ? JSON.parse(saved) : INITIAL_BRANCHES;
  });

  const [userSession, setUserSession] = useState<UserSession | null>(() => {
    const saved = localStorage.getItem('bq_user_session');
    return saved ? JSON.parse(saved) : null;
  });

  // 10-Day Trial & Monetization State (Langsung aktif saat install pertama)
  const [subscription, setSubscription] = useState<SubscriptionState>(() => {
    const saved = localStorage.getItem('bq_subscription');
    const now = Date.now();
    const currentDeviceId = getOrCreateDeviceId();

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Cek apakah sudah berlangganan PRO dengan tanggal kedaluwarsa
        if (parsed.isSubscribed && parsed.subscriptionExpiryDate) {
          const isStillValid = parsed.subscriptionExpiryDate > now;
          return {
            ...parsed,
            deviceId: currentDeviceId,
            isSubscribed: isStillValid,
            isTrialActive: false
          };
        }

        // Cek sisa hari masa trial 10 hari
        const trialStart = parsed.trialStartDate || now;
        const daysPassed = Math.floor((now - trialStart) / (1000 * 60 * 60 * 24));
        const daysRemaining = Math.max(0, (parsed.trialDurationDays || 10) - daysPassed);
        const isTrialActive = daysRemaining > 0;

        return {
          ...parsed,
          deviceId: currentDeviceId,
          trialDaysRemaining: daysRemaining,
          isTrialActive
        };
      } catch (e) {
        // Fallback ke inisialisasi awal
      }
    }

    // Install pertama: Trial 10 hari langsung aktif otomatis!
    const initialTrial: SubscriptionState = {
      planId: 'trial',
      planName: '10-Day Full Trial (Semua Fitur Terbuka)',
      dailyRate: 0,
      trialStartDate: now,
      trialDurationDays: 10,
      isTrialActive: true,
      trialDaysRemaining: 10,
      isSubscribed: false,
      deviceId: currentDeviceId
    };
    localStorage.setItem('bq_subscription', JSON.stringify(initialTrial));
    return initialTrial;
  });

  // Auto-adapt data schema saat aplikasi dimuat (update langsung timpa tanpa uninstall)
  useEffect(() => {
    checkAndMigrateAppData();
  }, []);

  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [featureLockToast, setFeatureLockToast] = useState<string | null>(null);

  // Aktivasi Serial Number Pro (Berdasarkan Device ID dan Pilihan Durasi 1, 3, 6, 12 Bulan)
  const handleActivateSerialKey = (serialKey: string): { success: boolean; message: string } => {
    const activeDevId = subscription.deviceId || getOrCreateDeviceId();
    const validation = validateSerialNumber(activeDevId, serialKey);

    if (!validation.isValid || !validation.months) {
      return {
        success: false,
        message: validation.error || 'Serial number tidak valid untuk Device ID perangkat ini.'
      };
    }

    const months = validation.months;
    const durationDays = months === 1 ? 30 : months === 3 ? 90 : months === 6 ? 180 : 365;
    
    // Perpanjang jika masih aktif, atau mulai dari sekarang
    const baseTime = subscription.subscriptionExpiryDate && subscription.subscriptionExpiryDate > Date.now()
      ? subscription.subscriptionExpiryDate
      : Date.now();
    const newExpiry = baseTime + durationDays * 24 * 60 * 60 * 1000;

    const tier = validation.tier || 'core';
    const tierMeta = PRO_TIERS[tier] || PRO_TIERS.core;
    const dailyRate = tierMeta.dailyRate;

    const updatedSub: SubscriptionState = {
      ...subscription,
      planId: tier,
      planName: `${tierMeta.name} (${tierMeta.rateLabel})`,
      dailyRate,
      isSubscribed: true,
      isTrialActive: false,
      subscriptionExpiryDate: newExpiry,
      subscriptionDurationMonths: months,
      activeSerialKey: serialKey,
      activatedAt: Date.now()
    };

    setSubscription(updatedSub);
    localStorage.setItem('bq_subscription', JSON.stringify(updatedSub));

    const formattedDate = new Date(newExpiry).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    return {
      success: true,
      message: `Aktivasi ${tierMeta.name} Berhasil! Masa aktif ${months} Bulan (${durationDays} Hari) berlaku hingga ${formattedDate}.`
    };
  };

  const handleSelectPlan = (planId: SubscriptionPlanId, durationDays: number = 30) => {
    let rate = 0;
    let name = 'Free Lifetime (Service, Kasir, Stok)';
    if (planId === 'basic') {
      rate = 1000;
      name = 'Basic Pro (Rp 1.000/hari - Solo Mode)';
    } else if (planId === 'core') {
      rate = 2000;
      name = 'Core Pro (Rp 2.000/hari - Multi-User)';
    } else if (planId === 'corporate') {
      rate = 3000;
      name = 'Corporate Pro (Rp 3.000/hari - Multi-Cabang)';
    }

    const updated: SubscriptionState = {
      ...subscription,
      planId,
      planName: name,
      dailyRate: rate,
      isSubscribed: planId !== 'free',
      isTrialActive: false,
      subscriptionExpiryDate: Date.now() + durationDays * 24 * 60 * 60 * 1000
    };
    setSubscription(updated);
    localStorage.setItem('bq_subscription', JSON.stringify(updated));
  };

  const showFeatureLockNotice = (featureName: string) => {
    setFeatureLockToast(
      `Masa trial 10 hari telah usai. Fitur "${featureName}" masuk ke paket Pro. Menu Service, Kasir & Stok tetap 100% Gratis Selamanya!`
    );
    setTimeout(() => {
      setFeatureLockToast(null);
    }, 4500);
    setIsSubscriptionModalOpen(true);
  };

  const handleLoginSuccess = (session: UserSession) => {
    setUserSession(session);
    localStorage.setItem('bq_user_session', JSON.stringify(session));
  };

  const handleLogout = () => {
    setUserSession(null);
    localStorage.removeItem('bq_user_session');
    setCurrentScreen('dashboard');
    setSelectedModule(null);
  };

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('bq_queues', JSON.stringify(queues));
  }, [queues]);

  useEffect(() => {
    localStorage.setItem('bq_spareparts', JSON.stringify(spareparts));
  }, [spareparts]);

  useEffect(() => {
    localStorage.setItem('bq_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('bq_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('bq_notifs', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('bq_damaged_goods', JSON.stringify(damagedGoods));
  }, [damagedGoods]);

  useEffect(() => {
    localStorage.setItem('bq_procurements', JSON.stringify(procurements));
  }, [procurements]);

  useEffect(() => {
    localStorage.setItem('bq_campaigns', JSON.stringify(campaigns));
  }, [campaigns]);

  useEffect(() => {
    localStorage.setItem('bq_vouchers', JSON.stringify(vouchers));
  }, [vouchers]);

  useEffect(() => {
    localStorage.setItem('bq_kas_kecil', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('bq_profile', JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem('bq_permissions', JSON.stringify(permissions));
  }, [permissions]);

  useEffect(() => {
    localStorage.setItem('bq_branches', JSON.stringify(branches));
  }, [branches]);

  // Navigation state
  // screen: 'dashboard' | 'submenu' | 'feature'
  const [currentScreen, setCurrentScreen] = useState<'dashboard' | 'submenu' | 'feature'>('dashboard');
  const [selectedModule, setSelectedModule] = useState<MenuModuleConfig | null>(null);
  const [selectedSubMenu, setSelectedSubMenu] = useState<SubMenuItemConfig | null>(null);
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [preselectedQueueForPOS, setPreselectedQueueForPOS] = useState<ServiceQueue | null>(null);

  // Modals state
  const [isNewQueueModalOpen, setIsNewQueueModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [activeReceiptTx, setActiveReceiptTx] = useState<Transaction | null>(null);
  const [isNotifDrawerOpen, setIsNotifDrawerOpen] = useState(false);

  // Navigation handlers
  const handleSelectModule = (mod: MenuModuleConfig) => {
    // Free Tier Lock Rules:
    // Core Free Menus: servis, kasir, inventaris (Always 100% Free & Unlimited)
    // Non-Core Menus: pelanggan, marketing, basic, core, corporate (Require active trial or subscription)
    const isCoreFreeMenu = mod.id === 'servis' || mod.id === 'kasir' || mod.id === 'inventaris';
    const isPermitted = isCoreFreeMenu || subscription.isTrialActive || subscription.isSubscribed;

    if (!isPermitted) {
      showFeatureLockNotice(mod.title);
      return;
    }

    setSelectedModule(mod);
    setCurrentTab(mod.id);
    setCurrentScreen('submenu');
  };

  const handleSelectSubMenu = (subItem: SubMenuItemConfig) => {
    // If Kasir submenus like piutang are accessed when trial expired without subscription
    const isProKasirSubMenu = subItem.id === 'pos-receivable' || subItem.id === 'piutang';
    if (isProKasirSubMenu && !subscription.isTrialActive && !subscription.isSubscribed) {
      showFeatureLockNotice('Piutang Kasir');
      return;
    }

    setSelectedSubMenu(subItem);
    setCurrentScreen('feature');
  };

  const handleBack = () => {
    if (currentScreen === 'feature') {
      setCurrentScreen('submenu');
    } else if (currentScreen === 'submenu') {
      setCurrentScreen('dashboard');
      setSelectedModule(null);
      setSelectedSubMenu(null);
      setCurrentTab('dashboard');
    }
  };

  const handleGoHome = () => {
    setCurrentScreen('dashboard');
    setSelectedModule(null);
    setSelectedSubMenu(null);
    setCurrentTab('dashboard');
  };

  const handleBottomTabChange = (tabId: string) => {
    setCurrentTab(tabId);
    if (tabId === 'dashboard') {
      handleGoHome();
    } else {
      const targetMod = MENU_MODULES.find((m) => m.id === tabId);
      if (targetMod) {
        setSelectedModule(targetMod);
        setCurrentScreen('submenu');
      }
    }
  };

  // Queue actions
  const handleAddQueue = (newQ: ServiceQueue) => {
    setQueues([newQ, ...queues]);
    // Also check if customer exists, otherwise add
    const existingCust = customers.find((c) => c.plateNumber === newQ.plateNumber);
    if (!existingCust) {
      setCustomers([
        {
          id: `c-${Date.now()}`,
          name: newQ.customerName,
          phone: newQ.customerPhone,
          plateNumber: newQ.plateNumber,
          vehicleModel: newQ.vehicleModel,
          year: '2024',
          lastServiceDate: 'Hari Ini',
          totalVisits: 1,
          loyaltyPoints: 20,
          notes: newQ.complaint
        },
        ...customers
      ]);
    }
  };

  const handleUpdateQueueStatus = (id: string, status: ServiceStatus, progress?: number) => {
    setQueues((prev) =>
      prev.map((q) => {
        if (q.id === id) {
          const newProgress = progress !== undefined ? progress : status === 'selesai' ? 100 : q.progressPercent;
          return { ...q, status, progressPercent: newProgress };
        }
        return q;
      })
    );
  };

  const handleUpdateQueueItems = (queueId: string, items: ServiceItem[], totalCost: number) => {
    setQueues((prev) =>
      prev.map((q) => (q.id === queueId ? { ...q, items, totalCost } : q))
    );
  };

  const handleResetDailyQueues = () => {
    setQueues([]);
  };

  const handlePayQueueAtPOS = (queue: ServiceQueue) => {
    setPreselectedQueueForPOS(queue);
    // Switch directly to POS feature
    const kasirMod = MENU_MODULES.find((m) => m.id === 'kasir');
    if (kasirMod) {
      setSelectedModule(kasirMod);
      setSelectedSubMenu(kasirMod.subMenus[0]);
      setCurrentScreen('feature');
    }
  };

  // Transaction action
  const handleCompleteTransaction = (newTx: Transaction) => {
    setTransactions([newTx, ...transactions]);
    // If it corresponds to a queue, mark it as 'diambil'
    if (preselectedQueueForPOS) {
      handleUpdateQueueStatus(preselectedQueueForPOS.id, 'diambil', 100);
      setPreselectedQueueForPOS(null);
    }
  };

  const handleOpenReceipt = (tx: Transaction) => {
    setActiveReceiptTx(tx);
    setIsReceiptModalOpen(true);
  };

  // Inventory actions
  const handleUpdateStock = (id: string, newStock: number) => {
    setSpareparts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, stock: newStock } : p))
    );
  };

  const handleAddNewPart = (newPartData: Omit<Sparepart, 'id'>) => {
    const newPart: Sparepart = {
      ...newPartData,
      id: `p-${Date.now()}`
    };
    setSpareparts([newPart, ...spareparts]);
  };

  // Inbound arrival: syncs existing or adds new, logs procurement
  const handleSaveInboundStock = (
    itemData: {
      code: string;
      name: string;
      category: Sparepart['category'];
      brand: string;
      stockToAdd: number;
      minStock: number;
      buyPrice: number;
      sellPrice: number;
      unit: string;
      rackLocation: string;
      supplier?: string;
      poNumber?: string;
      notes?: string;
    }
  ) => {
    const existingIndex = spareparts.findIndex(
      (p) => p.code.trim().toLowerCase() === itemData.code.trim().toLowerCase()
    );

    let resolvedPartName = itemData.name;
    let resolvedCategory = itemData.category;
    let isRestock = false;

    if (existingIndex >= 0) {
      isRestock = true;
      const current = spareparts[existingIndex];
      resolvedPartName = current.name;
      resolvedCategory = current.category;
      const updatedList = [...spareparts];
      updatedList[existingIndex] = {
        ...current,
        name: itemData.name || current.name,
        category: itemData.category || current.category,
        brand: itemData.brand || current.brand,
        stock: current.stock + itemData.stockToAdd,
        minStock: itemData.minStock || current.minStock,
        buyPrice: itemData.buyPrice || current.buyPrice,
        sellPrice: itemData.sellPrice || current.sellPrice,
        unit: itemData.unit || current.unit,
        rackLocation: itemData.rackLocation || current.rackLocation,
        supplier: itemData.supplier || current.supplier
      };
      setSpareparts(updatedList);
    } else {
      const newPart: Sparepart = {
        id: `p-${Date.now()}`,
        code: itemData.code,
        name: itemData.name,
        category: itemData.category,
        brand: itemData.brand,
        stock: itemData.stockToAdd,
        minStock: itemData.minStock,
        buyPrice: itemData.buyPrice,
        sellPrice: itemData.sellPrice,
        unit: itemData.unit,
        rackLocation: itemData.rackLocation,
        supplier: itemData.supplier
      };
      setSpareparts([newPart, ...spareparts]);
    }

    // Automatically record procurement log
    const now = new Date();
    const dateFormatted = `${now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}, ${now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`;
    const newPO: ProcurementRecord = {
      id: `po-${Date.now()}`,
      poNumber: itemData.poNumber || `INB-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${Date.now().toString().slice(-4)}`,
      code: itemData.code,
      name: resolvedPartName,
      category: resolvedCategory,
      supplier: itemData.supplier || 'Distributor Resmi Bengkel',
      qty: itemData.stockToAdd,
      unit: itemData.unit || 'Pcs',
      buyPrice: itemData.buyPrice,
      totalCost: itemData.buyPrice * itemData.stockToAdd,
      date: dateFormatted,
      timestamp: Date.now(),
      receiver: userSession?.name || 'Admin Logistik Bengkel',
      type: isRestock ? 'Restock' : 'Baru',
      notes: itemData.notes || (isRestock ? 'Penambahan stok inbound' : 'Suku cadang baru katalog')
    };
    setProcurements([newPO, ...procurements]);
  };

  // Damaged goods reporting: automatically reduces stock from master catalog
  const handleReportDamagedGood = (
    report: {
      sparepartId?: string;
      code: string;
      name: string;
      qty: number;
      unit: string;
      damageReason: string;
      reportedBy: string;
      notes?: string;
    }
  ) => {
    const now = new Date();
    const dateFormatted = `${now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}, ${now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`;
    const newDamage: DamagedGood = {
      id: `dmg-${Date.now()}`,
      sparepartId: report.sparepartId,
      code: report.code,
      name: report.name,
      qty: report.qty,
      unit: report.unit,
      damageReason: report.damageReason,
      reportedBy: report.reportedBy || userSession?.name || 'Mekanik / Tim Bengkel',
      date: dateFormatted,
      timestamp: Date.now(),
      status: 'Diajukan',
      notes: report.notes
    };
    setDamagedGoods([newDamage, ...damagedGoods]);

    // Automatically reduce master catalog stock
    if (report.code) {
      setSpareparts((prev) =>
        prev.map((p) => {
          if (p.code.toLowerCase() === report.code.toLowerCase() || p.id === report.sparepartId) {
            return { ...p, stock: Math.max(0, p.stock - report.qty) };
          }
          return p;
        })
      );
    }
  };

  // Quick search from dashboard
  const handleQuickSearchPlat = (query: string) => {
    // Open service module with search prefilled
    const servMod = MENU_MODULES.find((m) => m.id === 'servis');
    if (servMod) {
      setSelectedModule(servMod);
      setSelectedSubMenu(servMod.subMenus[0]);
      setCurrentScreen('feature');
    }
  };

  const handleMarkAllNotifsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadNotifsCount = notifications.filter((n) => !n.read).length;

  const handleRestoreData = (backupData: any) => {
    if (backupData.queues) setQueues(backupData.queues);
    if (backupData.spareparts) setSpareparts(backupData.spareparts);
    if (backupData.transactions) setTransactions(backupData.transactions);
    if (backupData.customers) setCustomers(backupData.customers);
    if (backupData.damagedGoods) setDamagedGoods(backupData.damagedGoods);
    if (backupData.procurements) setProcurements(backupData.procurements);
    if (backupData.campaigns) setCampaigns(backupData.campaigns);
    if (backupData.vouchers) setVouchers(backupData.vouchers);
    if (backupData.expenses) setExpenses(backupData.expenses);
    if (backupData.profile) setProfile(backupData.profile);
    if (backupData.permissions) setPermissions(backupData.permissions);
    if (backupData.branches) setBranches(backupData.branches);
    if (backupData.subscription) {
      setSubscription(backupData.subscription);
      localStorage.setItem('bq_subscription', JSON.stringify(backupData.subscription));
    }
  };

  const handleResetData = (mode: 'daily' | 'factory' | 'clean_slate') => {
    if (mode === 'daily') {
      // Clear completed queues and today's transactions
      setQueues((prev) => prev.filter((q) => q.status === 'menunggu' || q.status === 'proses'));
      setTransactions([]);
    } else if (mode === 'clean_slate') {
      // REQUIREMENT: Pastikan reset berfungsi hapus data tidak tersisa (0 records left)
      setQueues([]);
      setSpareparts([]);
      setTransactions([]);
      setCustomers([]);
      setDamagedGoods([]);
      setProcurements([]);
      setCampaigns([]);
      setVouchers([]);
      setExpenses([]);
      setNotifications([]);

      localStorage.setItem('bq_queues', '[]');
      localStorage.setItem('bq_spareparts', '[]');
      localStorage.setItem('bq_transactions', '[]');
      localStorage.setItem('bq_customers', '[]');
      localStorage.setItem('bq_damaged_goods', '[]');
      localStorage.setItem('bq_procurements', '[]');
      localStorage.setItem('bq_campaigns', '[]');
      localStorage.setItem('bq_vouchers', '[]');
      localStorage.setItem('bq_kas_kecil', '[]');
      localStorage.setItem('bq_notifs', '[]');
    } else if (mode === 'factory') {
      // Muat ulang data sampel / demo pabrik lengkap
      setQueues(INITIAL_QUEUES);
      setSpareparts(INITIAL_SPAREPARTS);
      setTransactions(INITIAL_TRANSACTIONS);
      setCustomers(INITIAL_CUSTOMERS);
      setDamagedGoods(INITIAL_DAMAGED_GOODS);
      setProcurements(INITIAL_PROCUREMENTS);
      setCampaigns(INITIAL_CAMPAIGNS);
      setVouchers(INITIAL_VOUCHERS);
      setProfile(INITIAL_PROFILE);
      setPermissions(INITIAL_PERMISSIONS);
      setBranches(INITIAL_BRANCHES);
      setNotifications(INITIAL_NOTIFICATIONS);

      localStorage.setItem('bq_queues', JSON.stringify(INITIAL_QUEUES));
      localStorage.setItem('bq_spareparts', JSON.stringify(INITIAL_SPAREPARTS));
      localStorage.setItem('bq_transactions', JSON.stringify(INITIAL_TRANSACTIONS));
      localStorage.setItem('bq_customers', JSON.stringify(INITIAL_CUSTOMERS));
      localStorage.setItem('bq_damaged_goods', JSON.stringify(INITIAL_DAMAGED_GOODS));
      localStorage.setItem('bq_procurements', JSON.stringify(INITIAL_PROCUREMENTS));
      localStorage.setItem('bq_campaigns', JSON.stringify(INITIAL_CAMPAIGNS));
      localStorage.setItem('bq_vouchers', JSON.stringify(INITIAL_VOUCHERS));
      localStorage.setItem('bq_profile', JSON.stringify(INITIAL_PROFILE));
      localStorage.setItem('bq_permissions', JSON.stringify(INITIAL_PERMISSIONS));
      localStorage.setItem('bq_branches', JSON.stringify(INITIAL_BRANCHES));
      localStorage.setItem('bq_notifs', JSON.stringify(INITIAL_NOTIFICATIONS));
    }
  };

  // Decide which screen to render
  const renderCurrentView = () => {
    if (currentScreen === 'dashboard') {
      return (
        <HomeDashboard
          modules={MENU_MODULES}
          onSelectModule={handleSelectModule}
          queues={queues}
          onOpenNewQueue={() => setIsNewQueueModalOpen(true)}
          onOpenNotifications={() => setIsNotifDrawerOpen(true)}
          unreadNotifsCount={unreadNotifsCount}
          onSelectQueueItem={(q) => {
            const servMod = MENU_MODULES.find((m) => m.id === 'servis');
            if (servMod) {
              setSelectedModule(servMod);
              setSelectedSubMenu(servMod.subMenus[0]);
              setCurrentScreen('feature');
            }
          }}
          onQuickSearchPlat={handleQuickSearchPlat}
          profile={profile}
          userSession={userSession}
          onLogout={handleLogout}
          subscription={subscription}
          onOpenSubscription={() => setIsSubscriptionModalOpen(true)}
        />
      );
    }

    if (currentScreen === 'submenu' && selectedModule) {
      return (
        <SubMenuPage
          module={selectedModule}
          onBack={handleBack}
          onSelectSubMenu={handleSelectSubMenu}
          activeSubMenuId={selectedSubMenu?.id}
        />
      );
    }

    if (currentScreen === 'feature' && selectedModule) {
      switch (selectedModule.id) {
        case 'servis':
          return (
            <ServiceDetailView
              initialTab={selectedSubMenu?.id || 'registrasi'}
              queues={queues}
              onBack={handleBack}
              onAddQueue={handleAddQueue}
              onUpdateQueueStatus={handleUpdateQueueStatus}
              onUpdateQueueItems={handleUpdateQueueItems}
              onSelectQueueForInvoice={handlePayQueueAtPOS}
              onResetDailyQueues={handleResetDailyQueues}
              spareparts={spareparts}
              mechanics={INITIAL_MECHANICS}
            />
          );
        case 'kasir':
          return (
            <CashierPOSView
              initialTab={selectedSubMenu?.id || 'kasir'}
              onBack={handleBack}
              spareparts={spareparts}
              transactions={transactions}
              queues={queues}
              onCompleteTransaction={handleCompleteTransaction}
              onOpenReceipt={handleOpenReceipt}
              preselectedQueue={preselectedQueueForPOS}
              onUpdateQueueStatus={handleUpdateQueueStatus}
              onAddQueue={handleAddQueue}
            />
          );
        case 'inventaris':
          return (
            <InventoryView
              initialTab={selectedSubMenu?.id || 'sparepart-datang'}
              spareparts={spareparts}
              damagedGoods={damagedGoods}
              procurements={procurements}
              onBack={handleBack}
              onUpdateStock={handleUpdateStock}
              onAddNewPart={handleAddNewPart}
              onSaveInboundStock={handleSaveInboundStock}
              onReportDamagedGood={handleReportDamagedGood}
            />
          );
        case 'pelanggan':
          return (
            <CustomerView
              initialTab={selectedSubMenu?.id || 'daftar-pelanggan'}
              customers={customers}
              queues={queues}
              transactions={transactions}
              onBack={handleBack}
              onAddNewCustomer={(c) => setCustomers([c, ...customers])}
            />
          );
        case 'marketing':
          return (
            <MarketingView
              initialTab={selectedSubMenu?.id || 'broadcast-wa'}
              customers={customers}
              campaigns={campaigns}
              vouchers={vouchers}
              onBack={handleBack}
              onSendCampaign={(newCmp) => setCampaigns([newCmp, ...campaigns])}
              onAddVoucher={(newVch) => setVouchers([newVch, ...vouchers])}
              onToggleVoucherActive={(vchId) =>
                setVouchers((prev) =>
                  prev.map((v) => (v.id === vchId ? { ...v, isActive: !v.isActive } : v))
                )
              }
            />
          );
        case 'laporan':
          return (
            <ReportView
              initialTab={selectedSubMenu?.id || 'laporan-pendapatan'}
              transactions={transactions}
              mechanics={INITIAL_MECHANICS}
              queues={queues}
              expenses={expenses}
              onBack={handleBack}
            />
          );
        case 'basic':
          return (
            <BasicProfileView
              onBack={handleBack}
              profile={profile}
              onSaveProfile={(updated) => setProfile(updated)}
            />
          );
        case 'core':
          if (selectedSubMenu?.id === 'core-profile') {
            return (
              <BasicProfileView
                onBack={handleBack}
                profile={profile}
                onSaveProfile={(updated) => setProfile(updated)}
              />
            );
          }
          if (selectedSubMenu?.id === 'core-devices') {
            return (
              <DeviceSyncView
                onBack={handleBack}
                subscription={subscription}
                workshopProfile={profile}
                onOpenSubscription={() => setIsSubscriptionModalOpen(true)}
              />
            );
          }
          return (
            <CorePermissionsView
              onBack={handleBack}
              permissions={permissions}
              onUpdatePermissions={(updated) => setPermissions(updated)}
              onNavigateToDevices={() => {
                setSelectedSubMenu({
                  id: 'core-devices',
                  title: 'Tautkan HP (3 Slot)',
                  subtitle: 'Pairing HP Kasir & Mekanik via QR',
                  iconName: 'Smartphone',
                  badge: '3 HP',
                  targetView: 'core-devices'
                });
              }}
            />
          );
        case 'corporate':
          if (selectedSubMenu?.id === 'corp-profile') {
            return (
              <BasicProfileView
                onBack={handleBack}
                profile={profile}
                onSaveProfile={(updated) => setProfile(updated)}
              />
            );
          }
          if (selectedSubMenu?.id === 'corp-permissions') {
            return (
              <CorePermissionsView
                onBack={handleBack}
                permissions={permissions}
                onUpdatePermissions={(updated) => setPermissions(updated)}
                onNavigateToDevices={() => {
                  setSelectedSubMenu({
                    id: 'corp-devices',
                    title: 'Tautkan HP (9 Slot)',
                    subtitle: 'Multi-Cabang (3 Outlet x 3 HP)',
                    iconName: 'Smartphone',
                    badge: '9 HP',
                    targetView: 'corp-devices'
                  });
                }}
              />
            );
          }
          if (selectedSubMenu?.id === 'corp-devices') {
            return (
              <DeviceSyncView
                onBack={handleBack}
                subscription={subscription}
                workshopProfile={profile}
                onOpenSubscription={() => setIsSubscriptionModalOpen(true)}
              />
            );
          }
          return (
            <CorporateBranchesView
              onBack={handleBack}
              branches={branches}
              onSaveBranches={(updated) => setBranches(updated)}
              onNavigateToDevices={() => {
                setSelectedSubMenu({
                  id: 'corp-devices',
                  title: 'Tautkan HP (9 Slot)',
                  subtitle: 'Multi-Cabang (3 Outlet x 3 HP)',
                  iconName: 'Smartphone',
                  badge: '9 HP',
                  targetView: 'corp-devices'
                });
              }}
            />
          );
        case 'setting':
          if (selectedSubMenu?.id === 'setting-perangkat') {
            return (
              <DeviceSyncView
                onBack={handleBack}
                subscription={subscription}
                workshopProfile={profile}
                onOpenSubscription={() => setIsSubscriptionModalOpen(true)}
              />
            );
          }
          return (
            <SettingView
              initialTab={selectedSubMenu?.id || 'setting-tema'}
              onBack={handleBack}
              queues={queues}
              spareparts={spareparts}
              transactions={transactions}
              customers={customers}
              damagedGoods={damagedGoods}
              procurements={procurements}
              campaigns={campaigns}
              vouchers={vouchers}
              expenses={expenses}
              profile={profile}
              permissions={permissions}
              branches={branches}
              onRestoreData={handleRestoreData}
              onResetData={handleResetData}
              userSession={userSession}
              onLogout={handleLogout}
              subscription={subscription}
              onActivateSerialKey={handleActivateSerialKey}
              onReloadDemoData={() => handleResetData('factory')}
              onNavigateToDevices={() => {
                setSelectedSubMenu({
                  id: 'setting-perangkat',
                  title: 'Tautkan HP & Sinkron',
                  subtitle: 'Hubungkan HP Karyawan (QR Code)',
                  iconName: 'Smartphone',
                  badge: 'Multi-HP',
                  targetView: 'setting-perangkat'
                });
              }}
            />
          );
        default:
          return (
            <SubMenuPage
              module={selectedModule}
              onBack={handleBack}
              onSelectSubMenu={handleSelectSubMenu}
            />
          );
      }
    }

    return null;
  };

  // Tampilkan Halaman Login Auto Google Account terlebih dahulu sebelum masuk ke Halaman Utama
  if (!userSession) {
    return (
      <AndroidFrame canGoBack={false}>
        <LoginScreen
          onLoginSuccess={handleLoginSuccess}
          defaultEmail="smbsyariah@gmail.com"
        />
      </AndroidFrame>
    );
  }

  return (
    <AndroidFrame
      onHomePress={handleGoHome}
      onBackPress={handleBack}
      canGoBack={currentScreen !== 'dashboard'}
      bottomBar={
        <BottomNavBar
          currentTab={currentTab}
          onTabChange={handleBottomTabChange}
          activeQueueCount={queues.filter((q) => q.status !== 'diambil').length}
        />
      }
    >
      {/* Active Screen View - Hanya bagian ini yang dapat di-scroll */}
      <div className="flex-1 flex flex-col min-h-full">
        {renderCurrentView()}
      </div>

      {/* Global Modals */}
      <NewQueueModal
        isOpen={isNewQueueModalOpen}
        onClose={() => setIsNewQueueModalOpen(false)}
        onAddQueue={handleAddQueue}
        mechanics={INITIAL_MECHANICS}
        existingQueueCount={queues.length}
      />

      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => {
          setIsReceiptModalOpen(false);
          setActiveReceiptTx(null);
        }}
        transaction={activeReceiptTx}
      />

      <NotificationDrawer
        isOpen={isNotifDrawerOpen}
        onClose={() => setIsNotifDrawerOpen(false)}
        notifications={notifications}
        onMarkAllAsRead={handleMarkAllNotifsRead}
      />

      {/* Subscription Modal & Monetization Manager */}
      <SubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
        subscription={subscription}
        onSelectPlan={handleSelectPlan}
        onActivateSerialKey={handleActivateSerialKey}
        workshopName={profile.workshopName}
        contactPhone={profile.phone}
      />

      {/* Feature Lock Notice Toast */}
      {featureLockToast && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white text-xs px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 max-w-[90%] border border-amber-500/50 animate-in fade-in slide-in-from-top-3">
          <span className="text-base">🔒</span>
          <p className="text-[11px] leading-tight font-medium text-slate-100">{featureLockToast}</p>
        </div>
      )}
    </AndroidFrame>
  );
}
