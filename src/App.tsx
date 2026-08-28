import React, { useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { 
  MenuItem, 
  CartItem, 
  BillRecord, 
  CafeSettings, 
  OrderStatus,
  ComboItem
} from './types';
import { 
  getStoredMenu, 
  saveMenu, 
  resetMenuToDefault, 
  getStoredSettings, 
  saveSettings, 
  getStoredBills, 
  saveBillRecord, 
  deleteBillRecord, 
  getNextInvoiceNumber, 
  getNextKotNumber, 
  seedSampleBillsIfEmpty,
  checkIsAuthenticated,
  setAuthSession,
  clearAuthSession,
  checkManagerUnlocked,
  setManagerUnlocked,
  deductInventoryForBill
} from './utils/storage';
import { printReceipt } from './utils/printer';
import { decodeBillFromUrlSafeString } from './utils/messaging';

// Components
import { LoginPage } from './components/Auth/LoginPage';
import { ManagerAuthModal } from './components/Auth/ManagerAuthModal';
import { Navbar, ActiveTab } from './components/Navbar';
import { MenuGrid } from './components/PosBilling/MenuGrid';
import { CartPanel } from './components/PosBilling/CartPanel';
import { ItemCustomizerModal } from './components/PosBilling/ItemCustomizerModal';
import { ComboSelectorModal } from './components/PosBilling/ComboSelectorModal';
import { BillSuccessModal } from './components/PosBilling/BillSuccessModal';
import { BillHistory } from './components/BillHistory/BillHistory';
import { BillDetailModal } from './components/BillHistory/BillDetailModal';
import { GstReports } from './components/GstReports/GstReports';
import { MenuManager } from './components/MenuManager/MenuManager';
import { InventoryManager } from './components/Inventory/InventoryManager';
import { KotBoard } from './components/KotBoard/KotBoard';
import { SettingsModal } from './components/SettingsModal/SettingsModal';
import { PublicBillView } from './components/PublicBillView/PublicBillView';
import { ArrowRight } from 'lucide-react';

export default function App() {
  // 1. PUBLIC BILL LINK INSPECTOR (Executed FIRST before authentication)
  const [publicBill, setPublicBill] = useState<BillRecord | null>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const billCode = params.get('b') || params.get('bill') || params.get('viewBill') || params.get('billData');
      if (billCode) {
        const decoded = decodeBillFromUrlSafeString(billCode);
        if (decoded) return decoded;

        const stored = getStoredBills();
        const found = stored.find(
          (b) =>
            b.billNumber.toLowerCase() === billCode.toLowerCase() ||
            b.id.toLowerCase() === billCode.toLowerCase() ||
            b.billNumber.replace(/[^0-9]/g, '') === billCode.replace(/[^0-9]/g, '')
        );
        if (found) return found;

        const seeded = seedSampleBillsIfEmpty(getStoredSettings());
        const foundSeeded = seeded.find(
          (b) =>
            b.billNumber.toLowerCase() === billCode.toLowerCase() ||
            b.id.toLowerCase() === billCode.toLowerCase() ||
            b.billNumber.replace(/[^0-9]/g, '') === billCode.replace(/[^0-9]/g, '')
        );
        if (foundSeeded) return foundSeeded;
      }
      return null;
    } catch {
      return null;
    }
  });

  // Settings & Menu storage
  const [settings, setSettings] = useState<CafeSettings>(() => getStoredSettings());
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => getStoredMenu());
  const [bills, setBills] = useState<BillRecord[]>(() => {
    const s = getStoredSettings();
    return seedSampleBillsIfEmpty(s);
  });

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => checkIsAuthenticated());

  // Navigation (Default to POS Billing)
  const [activeTab, setActiveTab] = useState<ActiveTab>('pos');

  // Mobile / Responsive View Toggle
  const [mobileCartView, setMobileCartView] = useState<'menu' | 'cart'>('menu');

  // POS Cart State
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [customizerItem, setCustomizerItem] = useState<MenuItem | null>(null);
  const [selectedComboForCustomizing, setSelectedComboForCustomizing] = useState<ComboItem | null>(null);

  // Modals
  const [justSettledBill, setJustSettledBill] = useState<BillRecord | null>(null);
  const [selectedBillForDetail, setSelectedBillForDetail] = useState<BillRecord | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Manager Authentication Protection
  const [isManagerAuthOpen, setIsManagerAuthOpen] = useState(false);
  const [managerTargetTitle, setManagerTargetTitle] = useState('Manager Section');
  const [pendingProtectedAction, setPendingProtectedAction] = useState<(() => void) | null>(null);
  const [isManagerUnlockedState, setIsManagerUnlockedState] = useState<boolean>(checkManagerUnlocked());

  const requireManagerAuth = (title: string, action: () => void) => {
    if (checkManagerUnlocked()) {
      setIsManagerUnlockedState(true);
      action();
    } else {
      setManagerTargetTitle(title);
      setPendingProtectedAction(() => action);
      setIsManagerAuthOpen(true);
    }
  };

  const handleExitManagerMode = () => {
    setManagerUnlocked(false);
    setIsManagerUnlockedState(false);
    if (activeTab === 'history' || activeTab === 'gst' || activeTab === 'menu' || activeTab === 'inventory') {
      setActiveTab('pos');
    }
  };

  const handleTabChange = (tab: ActiveTab) => {
    if (tab === 'history') {
      requireManagerAuth('Bill Register', () => {
        setActiveTab('history');
      });
    } else if (tab === 'gst') {
      requireManagerAuth('GST Reports', () => {
        setActiveTab('gst');
      });
    } else if (tab === 'menu') {
      requireManagerAuth('Menu & Rates Catalog', () => {
        setActiveTab('menu');
      });
    } else if (tab === 'inventory') {
      requireManagerAuth('Inventory & Stock Management', () => {
        setActiveTab('inventory');
      });
    } else {
      setActiveTab(tab);
      if (tab === 'pos') {
        setMobileCartView('menu');
      }
    }
  };

  const handleOpenSettings = () => {
    requireManagerAuth('System & GST Settings', () => {
      setIsSettingsOpen(true);
    });
  };

  // Today's Sales Metrics for Top Header
  const { todaySalesTotal, todayBillsCount } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayBills = bills.filter((b) => {
      const d = new Date(b.date);
      return d >= today && b.status !== 'Cancelled';
    });

    const total = todayBills.reduce((sum, b) => sum + b.taxDetails.grandTotal, 0);
    return {
      todaySalesTotal: total,
      todayBillsCount: todayBills.length,
    };
  }, [bills]);

  // Auth Handlers
  const handleLoginSuccess = (rememberMe: boolean) => {
    setAuthSession(true, rememberMe);
    setIsAuthenticated(true);
    setMobileCartView('cart');
  };

  const handleLogout = () => {
    clearAuthSession();
    setIsAuthenticated(false);
  };

  // IF PUBLIC BILL LINK IS DETECTED: Render standalone customer invoice directly
  if (publicBill) {
    return (
      <PublicBillView
        bill={publicBill}
        settings={settings}
        onBackToApp={() => {
          window.history.pushState({}, '', window.location.pathname);
          setPublicBill(null);
        }}
      />
    );
  }

  // If not authenticated, render Login Page
  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} settings={settings} />;
  }

  // Cart Management Handlers
  const handleAddToCart = (item: CartItem) => {
    const existingIndex = cartItems.findIndex(
      (ci) =>
        ci.menuItemId === item.menuItemId &&
        ci.selectedVariant?.name === item.selectedVariant?.name &&
        JSON.stringify(ci.addons) === JSON.stringify(item.addons) &&
        ci.notes === item.notes
    );

    if (existingIndex >= 0) {
      const updated = [...cartItems];
      const prev = updated[existingIndex];
      const newQty = prev.quantity + item.quantity;
      const unit = prev.totalPrice / prev.quantity;
      updated[existingIndex] = {
        ...prev,
        quantity: newQty,
        totalPrice: unit * newQty,
      };
      setCartItems(updated);
    } else {
      setCartItems([...cartItems, item]);
    }
  };

  const handleQuickAdd = (item: MenuItem) => {
    const defaultVariant = item.variants && item.variants.length > 0 ? item.variants[0] : undefined;
    const unitPrice = defaultVariant ? defaultVariant.price : item.price;
    const cartItemId = `${item.id}-${defaultVariant ? defaultVariant.name : 'reg'}-${Date.now()}`;
    const newCartItem: CartItem = {
      cartItemId,
      menuItemId: item.id,
      name: item.name,
      category: item.category,
      type: item.type,
      unitPrice,
      quantity: 1,
      selectedVariant: defaultVariant,
      addons: [],
      totalPrice: unitPrice,
    };
    handleAddToCart(newCartItem);
  };

  const handleUpdateCartQuantityByMenuItemId = (menuItemId: string, delta: number) => {
    const existing = cartItems.find((ci) => ci.menuItemId === menuItemId);
    if (!existing) return;
    handleUpdateQuantity(existing.cartItemId, existing.quantity + delta);
  };

  const handleUpdateQuantity = (cartItemId: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(cartItemId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.cartItemId === cartItemId) {
          const unit = item.totalPrice / item.quantity;
          return {
            ...item,
            quantity: newQty,
            totalPrice: unit * newQty,
          };
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (cartItemId: string) => {
    setCartItems((prev) => prev.filter((i) => i.cartItemId !== cartItemId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  // Bill Settlement Handler (with custom GST and Split payment breakdown)
  const handleSettleBill = (settledBill: BillRecord, printMode?: 'bill' | 'kot' | 'both') => {
    if (cartItems.length === 0) return;

    const prefix = settings.invoicePrefix || 'INV-';
    const invoiceNum = getNextInvoiceNumber(prefix);
    const kotNum = getNextKotNumber();

    const finalizedBill: BillRecord = {
      ...settledBill,
      billNumber: invoiceNum,
      kotNumber: kotNum,
    };

    // Save to persistence and auto-deduct raw material inventory
    saveBillRecord(finalizedBill);
    deductInventoryForBill(finalizedBill);
    setBills((prev) => [finalizedBill, ...prev]);

    // Handle Printing if specified
    if (printMode) {
      printReceipt(finalizedBill, settings, printMode);
    }

    // Celebration confetti
    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch (e) {}

    // Reset Cart & Show Success Dialog
    setCartItems([]);
    setMobileCartView('cart');
    setJustSettledBill(finalizedBill);
  };

  // Start fresh bill (New Bill handler)
  const handleStartNewOrder = () => {
    setActiveTab('pos');
    setCartItems([]);
    setMobileCartView('cart');
    setJustSettledBill(null);
    setSelectedBillForDetail(null);
  };

  // Status updates on KOTs
  const handleUpdateOrderStatus = (billId: string, newStatus: OrderStatus) => {
    const updated = bills.map((b) => {
      if (b.id === billId) {
        const up = { ...b, status: newStatus };
        saveBillRecord(up);
        return up;
      }
      return b;
    });
    setBills(updated);
  };

  // Delete bill handler
  const handleDeleteBill = (billId: string) => {
    deleteBillRecord(billId);
    setBills(getStoredBills());
    if (selectedBillForDetail?.id === billId) {
      setSelectedBillForDetail(null);
    }
  };

  // Edit / Update bill handler
  const handleUpdateBill = (updatedBill: BillRecord) => {
    saveBillRecord(updatedBill);
    setBills(getStoredBills());
    if (selectedBillForDetail?.id === updatedBill.id) {
      setSelectedBillForDetail(updatedBill);
    }
  };

  // Save updated Menu
  const handleSaveMenu = (newMenu: MenuItem[]) => {
    saveMenu(newMenu);
    setMenuItems(newMenu);
  };

  // Reset menu to original
  const handleResetMenu = () => {
    const original = resetMenuToDefault();
    setMenuItems(original);
  };

  // Save Settings
  const handleSaveSettings = (newSettings: CafeSettings) => {
    saveSettings(newSettings);
    setSettings(newSettings);
  };

  const cartTotalAmount = cartItems.reduce((s, i) => s + i.totalPrice, 0);
  const cartTotalQty = cartItems.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="h-screen w-screen flex flex-col bg-[#F4F1EE] text-[#2D241E] font-sans select-none overflow-hidden">
      {/* Top Bar Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        settings={settings}
        openSettings={handleOpenSettings}
        onNewOrder={handleStartNewOrder}
        todaySalesTotal={todaySalesTotal}
        todayBillsCount={todayBillsCount}
        onLogout={handleLogout}
        isManagerUnlocked={isManagerUnlockedState}
        onExitManagerMode={handleExitManagerMode}
      />

      {/* Main View Area */}
      <main className="flex-1 flex overflow-hidden relative">
        {activeTab === 'pos' && (
          <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden relative">
            {/* 1. Left Section: Menu Catalog & Categories Grid */}
            <div
              className={`flex-1 h-full overflow-hidden bg-[#F4F1EE] ${
                mobileCartView === 'menu' ? 'block' : 'hidden lg:block'
              }`}
            >
              <MenuGrid
                menuItems={menuItems}
                onOpenCustomizer={(item) => setCustomizerItem(item)}
                onSelectCombo={(combo) => setSelectedComboForCustomizing(combo)}
                onQuickAdd={handleQuickAdd}
                onUpdateCartQuantityByMenuItemId={handleUpdateCartQuantityByMenuItemId}
                cartItems={cartItems}
              />
            </div>

            {/* 2. Right Section: Active Bill / Cart Panel */}
            <div
              className={`w-full lg:w-[400px] xl:w-[430px] 2xl:w-[460px] h-full overflow-hidden shrink-0 border-l border-[#E0D7D0] shadow-sm z-10 ${
                mobileCartView === 'cart' ? 'block' : 'hidden lg:block'
              }`}
            >
              <CartPanel
                cartItems={cartItems}
                menuItems={menuItems}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
                onClearCart={handleClearCart}
                onAddToCart={handleAddToCart}
                settings={settings}
                onSettleBill={handleSettleBill}
                onOpenMenuCatalog={() => setMobileCartView('menu')}
              />
            </div>

            {/* Floating Navigation Pill when in Menu Catalog View on Mobile */}
            {mobileCartView === 'menu' && (
              <div className="lg:hidden absolute bottom-3 left-3 right-3 z-20">
                <button
                  type="button"
                  onClick={() => setMobileCartView('cart')}
                  className="w-full py-3 px-4 bg-[#4B3621] text-white rounded-xl shadow-lg flex items-center justify-between border border-[#3D2C1B] active:scale-[0.99] transition-transform cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#F4F1EE] text-[#4B3621] flex items-center justify-center font-bold text-xs">
                      {cartTotalQty}
                    </div>
                    <span className="text-xs font-bold text-white">View Current Order ({cartTotalQty} Items)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-amber-200 font-mono font-bold text-sm">
                    <span>₹{cartTotalAmount.toFixed(2)}</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <BillHistory
            bills={bills}
            settings={settings}
            onViewBill={(bill) => setSelectedBillForDetail(bill)}
            onDeleteBill={handleDeleteBill}
            onUpdateBill={handleUpdateBill}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryManager
            menuItems={menuItems}
            settings={settings}
          />
        )}

        {activeTab === 'gst' && (
          <GstReports
            bills={bills}
            settings={settings}
            onDeleteBill={handleDeleteBill}
            onUpdateBill={handleUpdateBill}
          />
        )}

        {activeTab === 'kot' && (
          <KotBoard
            bills={bills}
            settings={settings}
            onUpdateStatus={handleUpdateOrderStatus}
          />
        )}

        {activeTab === 'menu' && (
          <MenuManager
            menuItems={menuItems}
            onSaveMenu={handleSaveMenu}
            onResetMenu={handleResetMenu}
          />
        )}
      </main>

      {/* Modals */}
      {/* 1. Item Customizer (Sizes, Addons, Notes) */}
      <ItemCustomizerModal
        item={customizerItem}
        isOpen={Boolean(customizerItem)}
        onClose={() => setCustomizerItem(null)}
        onAddToCart={handleAddToCart}
      />

      {/* 1b. Combo Deal Selector Modal */}
      <ComboSelectorModal
        combo={selectedComboForCustomizing}
        isOpen={Boolean(selectedComboForCustomizing)}
        onClose={() => setSelectedComboForCustomizing(null)}
        onAddToCart={handleAddToCart}
        menuItems={menuItems}
      />

      {/* 2. Bill Settled Success & WhatsApp Dispatch Modal */}
      {justSettledBill && (
        <BillSuccessModal
          bill={justSettledBill}
          settings={settings}
          onClose={() => setJustSettledBill(null)}
          onNewOrder={handleStartNewOrder}
        />
      )}

      {/* 3. Bill Detail & Preview Modal */}
      {selectedBillForDetail && (
        <BillDetailModal
          bill={selectedBillForDetail}
          settings={settings}
          onClose={() => setSelectedBillForDetail(null)}
          onDeleteBill={handleDeleteBill}
        />
      )}

      {/* 4. Cafe & GST Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
        onSaveSettings={handleSaveSettings}
      />

      {/* 5. Manager Authentication Protection Modal */}
      <ManagerAuthModal
        isOpen={isManagerAuthOpen}
        onClose={() => {
          setIsManagerAuthOpen(false);
          setPendingProtectedAction(null);
        }}
        onSuccess={() => {
          setIsManagerUnlockedState(true);
          setIsManagerAuthOpen(false);
          if (pendingProtectedAction) {
            pendingProtectedAction();
            setPendingProtectedAction(null);
          }
        }}
        settings={settings}
        targetSectionTitle={managerTargetTitle}
      />
    </div>
  );
}
