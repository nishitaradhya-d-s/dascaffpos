import React, { useState, useMemo } from 'react';
import { 
  CartItem, 
  MenuItem, 
  OrderType, 
  PaymentMode, 
  SplitPayment, 
  BillRecord, 
  CafeSettings, 
  TaxDetails,
  CouponCode
} from '../../types';
import { getStoredCoupons } from '../../utils/storage';
import { 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  Printer, 
  Check, 
  Percent, 
  User, 
  Phone, 
  Layers, 
  ChefHat, 
  BookOpen, 
  QrCode, 
  Banknote, 
  CreditCard, 
  PlusCircle,
  Tag,
  Settings as SettingsIcon,
  Sparkles,
  X,
  AlertCircle
} from 'lucide-react';

interface CartPanelProps {
  cartItems: CartItem[];
  menuItems: MenuItem[];
  onUpdateQuantity: (cartItemId: string, newQty: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  onClearCart: () => void;
  onAddToCart: (item: CartItem) => void;
  settings: CafeSettings;
  onSettleBill: (bill: BillRecord, printMode?: 'bill' | 'kot' | 'both') => void;
  onOpenMenuCatalog: () => void;
}

const TABLES = ['T-1', 'T-2', 'T-3', 'T-4', 'T-5', 'T-6', 'T-7', 'T-8', 'T-9', 'T-10', 'T-11', 'T-12', 'Cash Sale', 'Takeaway', 'Delivery'];

export const CartPanel: React.FC<CartPanelProps> = ({
  cartItems,
  menuItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onAddToCart,
  settings,
  onSettleBill,
  onOpenMenuCatalog,
}) => {
  // Order Metadata
  const [orderType, setOrderType] = useState<OrderType>('Dine-In');
  const [tableNumber, setTableNumber] = useState('T-1');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderNotes, setOrderNotes] = useState('');

  // Quick Select & Open Rate
  const [selectedQuickId, setSelectedQuickId] = useState('');
  const [showOpenRateModal, setShowOpenRateModal] = useState(false);
  const [openRateName, setOpenRateName] = useState('');
  const [openRatePrice, setOpenRatePrice] = useState('');

  // Discount & Tax States
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [flatDiscount, setFlatDiscount] = useState<string>('');
  const [isFlatDiscount, setIsFlatDiscount] = useState(false);
  
  // Dedicated Coupon Code State
  const [appliedCoupon, setAppliedCoupon] = useState<CouponCode | null>(null);
  const [couponInputText, setCouponInputText] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);

  const handleApplyCouponCode = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setCouponError(null);

    const cleanCode = couponInputText.trim().toUpperCase();
    if (!cleanCode) {
      setCouponError('Please enter a coupon code');
      return;
    }

    const stored = getStoredCoupons();
    const found = stored.find((c) => c.code.toUpperCase() === cleanCode);

    if (!found) {
      setCouponError(`Invalid coupon code "${cleanCode}". Not found in menu catalog.`);
      return;
    }

    if (!found.isActive) {
      setCouponError(`Coupon "${cleanCode}" is currently disabled in Menu & Rates.`);
      return;
    }

    if (found.minBillAmount && found.minBillAmount > 0 && subTotal < found.minBillAmount) {
      setCouponError(`Coupon requires minimum bill amount of ₹${found.minBillAmount} (Current: ₹${subTotal.toFixed(2)})`);
      return;
    }

    // Auto-apply discount based on configured rules in Menu & Rates
    setAppliedCoupon(found);
    if (found.type === 'percent') {
      setIsFlatDiscount(false);
      setDiscountPercent(found.value);
      setFlatDiscount('');
    } else {
      setIsFlatDiscount(true);
      setFlatDiscount(found.value.toString());
      setDiscountPercent(0);
    }

    setCouponInputText('');
    setCouponError(null);
  };

  const handleRemoveAppliedCoupon = () => {
    setAppliedCoupon(null);
    setIsFlatDiscount(false);
    setDiscountPercent(0);
    setFlatDiscount('');
    setCouponError(null);
  };

  // Payment Mode and Typed Amount
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('Cash');
  const [amountTendered, setAmountTendered] = useState<string>('');

  // Total Quantity in Cart
  const totalQuantity = useMemo(() => {
    return cartItems.reduce((acc, curr) => acc + curr.quantity, 0);
  }, [cartItems]);

  // Subtotal Calculation
  const subTotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
  }, [cartItems]);

  // GST & Total Calculations driven strictly and accurately by Settings
  const taxDetails: TaxDetails = useMemo(() => {
    const effectiveGst = typeof settings.defaultGstRate === 'number' ? Math.max(0, settings.defaultGstRate) : 5;
    const halfRate = effectiveGst / 2;

    const taxableValue = subTotal;
    const totalTax = (taxableValue * effectiveGst) / 100;
    const cgstAmount = totalTax / 2;
    const sgstAmount = totalTax / 2;
    const grossTotalWithTax = taxableValue + totalTax;

    let calcDiscount = 0;
    if (isFlatDiscount && flatDiscount) {
      const val = parseFloat(flatDiscount) || 0;
      calcDiscount = Math.min(val, grossTotalWithTax);
    } else if (discountPercent > 0) {
      calcDiscount = (grossTotalWithTax * discountPercent) / 100;
    }

    const netPayable = Math.max(0, grossTotalWithTax - calcDiscount);
    const rounded = Math.round(netPayable);
    const roundOff = +(rounded - netPayable).toFixed(2);

    return {
      subTotal,
      discountAmount: +calcDiscount.toFixed(2),
      discountPercent: isFlatDiscount
        ? grossTotalWithTax > 0
          ? (calcDiscount / grossTotalWithTax) * 100
          : 0
        : discountPercent,
      taxableValue,
      gstRate: effectiveGst,
      cgstRate: halfRate,
      sgstRate: halfRate,
      cgstAmount: +cgstAmount.toFixed(2),
      sgstAmount: +sgstAmount.toFixed(2),
      totalTax: +totalTax.toFixed(2),
      roundOff,
      grandTotal: rounded,
    };
  }, [subTotal, discountPercent, isFlatDiscount, flatDiscount, settings.defaultGstRate]);

  // Dynamic Payment Breakdown (Handles e.g. typing 300 for 390 -> 300 Cash, 90 UPI)
  const paymentBreakdown = useMemo(() => {
    const total = taxDetails.grandTotal;
    const typed = parseFloat(amountTendered);

    if (paymentMode === 'Cash') {
      if (!isNaN(typed) && typed > 0) {
        if (typed < total) {
          const cashPart = typed;
          const upiPart = total - typed;
          return {
            mode: 'Split' as PaymentMode,
            cash: cashPart,
            upi: upiPart,
            card: 0,
            change: 0,
            displayText: `${cashPart.toFixed(0)} Cash + ${upiPart.toFixed(0)} UPI`,
            statusBadge: `💵 ${cashPart.toFixed(2)} Cash & 📱 Remaining ${upiPart.toFixed(2)} UPI`,
          };
        } else if (typed > total) {
          const change = typed - total;
          return {
            mode: 'Cash' as PaymentMode,
            cash: total,
            upi: 0,
            card: 0,
            change: change,
            displayText: `Cash ₹${total.toFixed(2)}`,
            statusBadge: `💵 Cash Received: ₹${typed.toFixed(2)} | 🔄 Return Change: ₹${change.toFixed(2)}`,
          };
        } else {
          return {
            mode: 'Cash' as PaymentMode,
            cash: total,
            upi: 0,
            card: 0,
            change: 0,
            displayText: `Cash ₹${total.toFixed(2)}`,
            statusBadge: `💵 Cash: ₹${total.toFixed(2)} (Exact Paid)`,
          };
        }
      }
      return {
        mode: 'Cash' as PaymentMode,
        cash: total,
        upi: 0,
        card: 0,
        change: 0,
        displayText: `Cash ₹${total.toFixed(2)}`,
        statusBadge: `💵 Cash: ₹${total.toFixed(2)}`,
      };
    } else if (paymentMode === 'UPI') {
      return {
        mode: 'UPI' as PaymentMode,
        cash: 0,
        upi: total,
        card: 0,
        change: 0,
        displayText: `UPI / Online ₹${total.toFixed(2)}`,
        statusBadge: `📱 Offline UPI / Online: ₹${total.toFixed(2)}`,
      };
    } else {
      return {
        mode: 'Card' as PaymentMode,
        cash: 0,
        upi: 0,
        card: total,
        change: 0,
        displayText: `Card ₹${total.toFixed(2)}`,
        statusBadge: `💳 Card: ₹${total.toFixed(2)}`,
      };
    }
  }, [paymentMode, amountTendered, taxDetails.grandTotal]);

  // Handle Quick Add dropdown selection
  const handleQuickAddDropdown = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const itemId = e.target.value;
    if (!itemId) return;
    const found = menuItems.find((m) => m.id === itemId);
    if (found) {
      const cartItemId = `${found.id}-${Date.now()}`;
      onAddToCart({
        cartItemId,
        menuItemId: found.id,
        name: found.name,
        category: found.category,
        type: found.type,
        unitPrice: found.price,
        quantity: 1,
        addons: [],
        totalPrice: found.price,
      });
    }
    setSelectedQuickId('');
  };

  // Add Custom Open Rate Item
  const handleAddOpenRateItem = (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(openRatePrice);
    if (!openRateName.trim() || isNaN(price) || price <= 0) return;

    const cartItemId = `custom-${Date.now()}`;
    onAddToCart({
      cartItemId,
      menuItemId: `custom-${Date.now()}`,
      name: openRateName.trim(),
      category: 'Sides',
      type: 'veg',
      unitPrice: price,
      quantity: 1,
      addons: [],
      totalPrice: price,
    });

    setOpenRateName('');
    setOpenRatePrice('');
    setShowOpenRateModal(false);
  };

  // Build Settled Record
  const buildBillRecord = (): BillRecord => {
    const splitData: SplitPayment | undefined =
      paymentBreakdown.mode === 'Split'
        ? {
            cash: paymentBreakdown.cash,
            upi: paymentBreakdown.upi,
            card: paymentBreakdown.card,
          }
        : paymentBreakdown.mode === 'Cash'
        ? { cash: paymentBreakdown.cash, upi: 0, card: 0 }
        : paymentBreakdown.mode === 'UPI'
        ? { cash: 0, upi: paymentBreakdown.upi, card: 0 }
        : undefined;

    const typedAmount = parseFloat(amountTendered);
    const effectiveAmountPaid = !isNaN(typedAmount) && typedAmount > 0 
      ? typedAmount 
      : paymentBreakdown.mode === 'Cash' ? taxDetails.grandTotal : undefined;

    return {
      id: `bill-${Date.now()}`,
      billNumber: 'TEMP',
      kotNumber: 'TEMP',
      date: new Date().toISOString(),
      orderType,
      tableNumber: orderType === 'Dine-In' ? tableNumber : undefined,
      customerName: customerName.trim() || 'Walk-in',
      customerPhone: customerPhone.trim() || undefined,
      items: cartItems,
      taxDetails,
      billType: 'GST_Customer',
      paymentMode: paymentBreakdown.mode,
      splitDetails: splitData,
      amountPaid: effectiveAmountPaid,
      changeReturned: paymentBreakdown.change > 0 ? paymentBreakdown.change : undefined,
      status: 'Preparing',
      notes: orderNotes.trim() || undefined,
      couponCode: appliedCoupon?.code || undefined,
      createdBy: 'Staff',
    };
  };

  const handleSettle = (printMode?: 'bill' | 'kot' | 'both') => {
    if (cartItems.length === 0) return;
    const bill = buildBillRecord();
    onSettleBill(bill, printMode);
  };

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden select-none border-l border-[#E0D7D0]">
      {/* 1. Header Bar: Active Bill Title & Menu Button */}
      <div className="p-3 bg-[#F9F7F5] border-b border-[#E0D7D0] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#4B3621] text-white flex items-center justify-center font-bold text-xs shadow-xs font-cinzel">
            POS
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#2D241E] leading-tight">Current Order</h2>
            <p className="text-[11px] text-[#8B7E74] font-medium">
              {cartItems.length} items ({totalQuantity} qty)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {cartItems.length > 0 && (
            <button
              type="button"
              onClick={onClearCart}
              className="px-2.5 py-1 text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              Clear
            </button>
          )}
          <button
            type="button"
            onClick={onOpenMenuCatalog}
            className="flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-[#F4F1EE] border border-[#E0D7D0] rounded-lg text-xs font-bold text-[#4B3621] transition-colors shadow-2xs cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Menu Catalog</span>
          </button>
        </div>
      </div>

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Order Type Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-[#F4F1EE] p-1 rounded-lg border border-[#E0D7D0]">
          {(['Dine-In', 'Takeaway', 'Delivery'] as OrderType[]).map((t) => {
            const isActive = orderType === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setOrderType(t)}
                className={`py-1.5 px-3 rounded-md text-xs font-bold transition-all cursor-pointer text-center ${
                  isActive
                    ? 'bg-[#4B3621] text-white shadow-xs'
                    : 'text-[#8B7E74] hover:text-[#2D241E] hover:bg-white/60'
                }`}
              >
                {t}
              </button>
            );
          })}
        </div>

        {/* Table, Customer Name & Mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          <div>
            <label className="block text-[10px] font-bold text-[#8B7E74] uppercase mb-1">
              Table # {orderType !== 'Dine-In' && <span className="text-amber-600 font-normal lowercase">(not applicable)</span>}
            </label>
            <select
              value={orderType === 'Dine-In' ? tableNumber : ''}
              disabled={orderType !== 'Dine-In'}
              onChange={(e) => setTableNumber(e.target.value)}
              className={`w-full bg-white border border-[#E0D7D0] rounded-lg px-2.5 py-1.5 text-xs font-bold text-[#2D241E] focus:outline-hidden focus:border-[#4B3621] ${
                orderType !== 'Dine-In' ? 'opacity-50 bg-[#F4F1EE] cursor-not-allowed text-[#8B7E74]' : ''
              }`}
            >
              {orderType !== 'Dine-In' ? (
                <option value="">N/A ({orderType})</option>
              ) : (
                TABLES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#8B7E74] uppercase mb-1">
              Customer Name
            </label>
            <div className="relative">
              <User className="w-3.5 h-3.5 text-[#8B7E74] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Walk-in"
                className="w-full bg-white border border-[#E0D7D0] rounded-lg py-1.5 pl-8 pr-2 text-xs text-[#2D241E] placeholder:text-[#8B7E74] focus:outline-hidden focus:border-[#4B3621]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#8B7E74] uppercase mb-1">
              Mobile (WhatsApp)
            </label>
            <div className="relative">
              <Phone className="w-3.5 h-3.5 text-[#8B7E74] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="10-digit #"
                className="w-full bg-white border border-[#E0D7D0] rounded-lg py-1.5 pl-8 pr-2 text-xs text-[#2D241E] placeholder:text-[#8B7E74] focus:outline-hidden focus:border-[#4B3621] font-mono"
              />
            </div>
          </div>
        </div>

        {/* Direct Quick-Add Item Dropdown & Open Rate */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#4B3621] flex items-center gap-1">
              <PlusCircle className="w-3.5 h-3.5" />
              <span>DIRECT QUICK-ADD ITEM</span>
            </span>
            <button
              type="button"
              onClick={() => setShowOpenRateModal(true)}
              className="text-[11px] font-bold text-[#4B3621] hover:underline cursor-pointer"
            >
              + Custom Open Rate Item
            </button>
          </div>

          <select
            value={selectedQuickId}
            onChange={handleQuickAddDropdown}
            className="w-full bg-white border border-[#E0D7D0] rounded-lg px-3 py-1.5 text-xs text-[#2D241E] focus:outline-hidden focus:border-[#4B3621] font-medium"
          >
            <option value="">-- Choose item from menu --</option>
            {menuItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} ({item.category}) - ₹{item.price.toFixed(0)}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={onOpenMenuCatalog}
            className="w-full bg-[#4B3621] hover:bg-[#3D2C1B] text-white py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-between transition-colors shadow-2xs cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              <span>Open Full Menu Catalog (Food &amp; Drinks Grid)</span>
            </div>
            <span>&rarr;</span>
          </button>
        </div>

        {/* Custom Open Rate Item Popup Modal */}
        {showOpenRateModal && (
          <div className="p-3 bg-[#F9F7F5] border border-[#E0D7D0] rounded-xl space-y-2">
            <div className="text-xs font-bold text-[#4B3621]">Add Open Rate / Custom Item</div>
            <form onSubmit={handleAddOpenRateItem} className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={openRateName}
                  onChange={(e) => setOpenRateName(e.target.value)}
                  placeholder="Item Name (e.g. Special Coffee)"
                  required
                  className="bg-white border border-[#E0D7D0] rounded-lg px-2.5 py-1 text-xs text-[#2D241E] focus:border-[#4B3621]"
                />
                <input
                  type="number"
                  value={openRatePrice}
                  onChange={(e) => setOpenRatePrice(e.target.value)}
                  placeholder="Price (₹)"
                  required
                  min="1"
                  step="any"
                  className="bg-white border border-[#E0D7D0] rounded-lg px-2.5 py-1 text-xs text-[#2D241E] focus:border-[#4B3621]"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowOpenRateModal(false)}
                  className="px-2.5 py-1 text-xs text-[#8B7E74] font-bold hover:text-[#2D241E]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 bg-[#4B3621] text-white rounded-lg text-xs font-bold"
                >
                  Add Item
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ITEMS IN ACTIVE BILL */}
        <div className="pt-2">
          <div className="flex items-center justify-between text-xs font-bold text-[#8B7E74] uppercase tracking-wider mb-2">
            <span>ITEMS IN CURRENT ORDER:</span>
            <span>{cartItems.length} ITEMS</span>
          </div>

          {cartItems.length === 0 ? (
            <div className="bg-[#F9F7F5] border border-dashed border-[#E0D7D0] rounded-xl p-6 text-center space-y-2">
              <div className="w-10 h-10 mx-auto rounded-full bg-white flex items-center justify-center text-[#8B7E74] border border-[#E0D7D0]">
                <ShoppingBag className="w-5 h-5 stroke-[1.5]" />
              </div>
              <div className="text-xs font-bold text-[#2D241E]">Your Order is Currently Empty</div>
              <p className="text-[11px] text-[#8B7E74] max-w-xs mx-auto">
                Use the Quick-Add picker above or open the menu catalog to add items.
              </p>
              <button
                type="button"
                onClick={onOpenMenuCatalog}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#4B3621] hover:bg-[#3D2C1B] text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Open Menu Catalog</span>
              </button>
            </div>
          ) : (
            <div className="bg-white border border-[#E0D7D0] rounded-xl divide-y divide-[#E0D7D0]/60 overflow-hidden">
              {cartItems.map((item) => (
                <div key={item.cartItemId} className="p-2.5 flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      {item.type === 'veg' && (
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0"></span>
                      )}
                      {item.type === 'non-veg' && (
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-600 shrink-0"></span>
                      )}
                      {item.type === 'beverage' && (
                        <span className="w-2.5 h-2.5 rounded-full bg-sky-600 shrink-0"></span>
                      )}
                      <span className="text-xs font-bold text-[#2D241E] truncate">{item.name}</span>
                    </div>

                    {item.addons && item.addons.length > 0 && (
                      <div className="text-[10px] text-[#8B7E74] font-medium pl-4">
                        {item.addons.map((a) => a.name).join(', ')}
                      </div>
                    )}

                    <div className="text-[11px] text-[#8B7E74] font-medium pl-4">
                      ₹{item.unitPrice.toFixed(0)} &times; {item.quantity} = <strong className="text-[#4B3621] font-mono">₹{item.totalPrice.toFixed(2)}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <div className="flex items-center bg-[#F4F1EE] rounded-md p-0.5 border border-[#E0D7D0]">
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.cartItemId, item.quantity - 1)}
                        className="w-5 h-5 flex items-center justify-center text-[#2D241E] hover:bg-[#E0D7D0] rounded cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-1.5 text-xs font-bold font-mono text-[#2D241E] min-w-4 text-center">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.cartItemId, item.quantity + 1)}
                        className="w-5 h-5 flex items-center justify-center text-[#2D241E] hover:bg-[#E0D7D0] rounded cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.cartItemId)}
                      className="p-1 text-[#8B7E74] hover:text-rose-600 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* MANUAL % / FLAT DISCOUNT (Toggled Separately in Settings) */}
        {settings.isDiscountEnabled !== false && (
          <div className="bg-[#F9F7F5] border border-[#E0D7D0] rounded-xl p-2.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#4B3621] flex items-center gap-1">
                <Percent className="w-3.5 h-3.5 text-[#4B3621]" />
                <span>MANUAL DISCOUNT:</span>
              </span>
              <span className="text-[11px] font-bold text-emerald-700 font-mono">
                {taxDetails.discountAmount > 0 && !appliedCoupon
                  ? `-₹${taxDetails.discountAmount.toFixed(2)}`
                  : 'No Discount'}
              </span>
            </div>

            {/* Quick Percentage Chips */}
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
              {[0, 5, 10, 15, 20, 25, 50].map((p) => {
                const isSelected = !isFlatDiscount && discountPercent === p && !appliedCoupon;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      setAppliedCoupon(null);
                      setIsFlatDiscount(false);
                      setDiscountPercent(p);
                      setFlatDiscount('');
                    }}
                    className={`px-2 py-1 rounded-md text-xs font-bold transition-all shrink-0 cursor-pointer ${
                      isSelected
                        ? 'bg-[#4B3621] text-white shadow-2xs'
                        : 'bg-white border border-[#E0D7D0] text-[#2D241E] hover:bg-[#FDFCFB]'
                    }`}
                  >
                    {p === 0 ? '0%' : `${p}%`}
                  </button>
                );
              })}
            </div>

            {/* Custom Inputs */}
            <div className="grid grid-cols-2 gap-2 pt-0.5">
              <div className="relative">
                <input
                  type="number"
                  value={isFlatDiscount || appliedCoupon ? '' : discountPercent || ''}
                  onChange={(e) => {
                    setAppliedCoupon(null);
                    setIsFlatDiscount(false);
                    setDiscountPercent(parseFloat(e.target.value) || 0);
                  }}
                  placeholder="Custom %"
                  min="0"
                  max="100"
                  className="w-full bg-white border border-[#E0D7D0] rounded-lg px-2 py-1 text-xs text-[#2D241E] focus:border-[#4B3621]"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[#8B7E74]">%</span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  value={appliedCoupon ? '' : flatDiscount}
                  onChange={(e) => {
                    setAppliedCoupon(null);
                    setIsFlatDiscount(true);
                    setFlatDiscount(e.target.value);
                  }}
                  placeholder="Flat ₹ Off"
                  min="0"
                  className="w-full bg-white border border-[#E0D7D0] rounded-lg px-2 py-1 text-xs text-[#2D241E] focus:border-[#4B3621]"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[#8B7E74]">₹</span>
              </div>
            </div>
          </div>
        )}

        {/* COUPON CODE TEXT ENTRY (Toggled Separately in Settings, Configured in Menu & Rates) */}
        {settings.isCouponEnabled !== false && (
          <div className="bg-[#F9F7F5] border border-[#E0D7D0] rounded-xl p-2.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#4B3621] flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-[#4B3621]" />
                <span>COUPON CODE:</span>
              </span>
              {appliedCoupon && (
                <span className="text-[11px] font-bold text-emerald-700 font-mono">
                  -₹{taxDetails.discountAmount.toFixed(2)}
                </span>
              )}
            </div>

            {/* Input field to type coupon code */}
            <form onSubmit={handleApplyCouponCode} className="flex gap-1.5 items-center">
              <div className="relative flex-1">
                <Tag className="w-3.5 h-3.5 text-[#8B7E74] absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={couponInputText}
                  onChange={(e) => {
                    setCouponInputText(e.target.value.toUpperCase());
                    if (couponError) setCouponError(null);
                  }}
                  placeholder="Enter Coupon Code"
                  className="w-full bg-white border border-[#E0D7D0] rounded-lg py-1.5 pl-8 pr-2 text-xs font-mono font-bold text-[#4B3621] uppercase tracking-wider focus:outline-hidden focus:border-[#4B3621]"
                />
              </div>
              <button
                type="submit"
                disabled={!couponInputText.trim()}
                className="px-3.5 py-1.5 bg-[#4B3621] hover:bg-[#3D2C1B] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shrink-0"
              >
                Apply
              </button>
            </form>

            {/* Inline validation error message */}
            {couponError && (
              <div className="text-[11px] text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-2 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                <span>{couponError}</span>
              </div>
            )}

            {/* Applied Coupon Info Box with Remove Button */}
            {appliedCoupon && (
              <div className="p-2 bg-emerald-50 border border-emerald-300 rounded-lg flex items-center justify-between text-xs text-emerald-950">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                  <div>
                    <div className="font-bold flex items-center gap-1.5">
                      <span className="font-mono bg-emerald-100 text-emerald-900 px-1.5 py-0.5 rounded border border-emerald-300 text-[11px]">
                        {appliedCoupon.code}
                      </span>
                      <span className="text-emerald-800">
                        ({appliedCoupon.type === 'percent' ? `${appliedCoupon.value}% OFF` : `Flat ₹${appliedCoupon.value} OFF`})
                      </span>
                    </div>
                    <p className="text-[10.5px] text-emerald-700">
                      Saved: -₹{taxDetails.discountAmount.toFixed(2)}
                      {appliedCoupon.description ? ` • ${appliedCoupon.description}` : ''}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveAppliedCoupon}
                  className="px-2 py-1 bg-white hover:bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-bold rounded-md transition-colors cursor-pointer flex items-center gap-1"
                  title="Remove coupon code"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* GST TAX (Configured in Settings) */}
        <div className="bg-[#F4F1EE] border border-[#E0D7D0] rounded-xl p-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-bold text-[#4B3621]">
            <Percent className="w-3.5 h-3.5 text-[#4B3621]" />
            <span>GST Rate: {taxDetails.gstRate}%</span>
          </div>
          <div className="text-[11px] font-bold text-[#4B3621] font-mono">
            CGST {taxDetails.cgstRate.toFixed(2)}% + SGST {taxDetails.sgstRate.toFixed(2)}%
          </div>
        </div>

        {/* Calculation Totals */}
        <div className="bg-white border border-[#E0D7D0] rounded-xl p-3 space-y-1.5 text-xs">
          <div className="flex justify-between text-[#8B7E74]">
            <span>Subtotal</span>
            <span className="font-semibold font-mono text-[#2D241E]">₹{subTotal.toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-[#8B7E74] text-[11px]">
            <span>CGST ({taxDetails.cgstRate.toFixed(2)}%)</span>
            <span className="font-mono text-[#2D241E]">₹{taxDetails.cgstAmount.toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-[#8B7E74] text-[11px]">
            <span>SGST ({taxDetails.sgstRate.toFixed(2)}%)</span>
            <span className="font-mono text-[#2D241E]">₹{taxDetails.sgstAmount.toFixed(2)}</span>
          </div>

          {taxDetails.discountAmount > 0 && (
            <div className="flex justify-between text-emerald-700 font-semibold">
              <span>Discount ({taxDetails.discountPercent.toFixed(1)}%)</span>
              <span className="font-mono">-₹{taxDetails.discountAmount.toFixed(2)}</span>
            </div>
          )}

          {taxDetails.roundOff !== 0 && (
            <div className="flex justify-between text-[#8B7E74] text-[10px]">
              <span>Round Off:</span>
              <span className="font-mono">
                {taxDetails.roundOff > 0 ? `+${taxDetails.roundOff.toFixed(2)}` : taxDetails.roundOff.toFixed(2)}
              </span>
            </div>
          )}

          <div className="pt-2 border-t border-dashed border-[#E0D7D0] flex justify-between items-baseline mt-2">
            <span className="text-sm font-bold text-[#4B3621] uppercase">
              TOTAL
            </span>
            <span className="text-xl font-black text-[#4B3621] font-mono">
              ₹{taxDetails.grandTotal.toFixed(2)}
            </span>
          </div>
        </div>

        {/* PAYMENT MODE & DYNAMIC AMOUNT ENTRY */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#2D241E]">SELECT PAYMENT MODE:</span>
            <span className="text-[11px] font-bold text-[#4B3621] font-mono">
              {paymentBreakdown.displayText}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                setPaymentMode('Cash');
              }}
              className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                paymentMode === 'Cash'
                  ? 'bg-[#4B3621] text-white shadow-xs'
                  : 'bg-white border border-[#E0D7D0] text-[#2D241E] hover:bg-[#FDFCFB]'
              }`}
            >
              <Banknote className="w-3.5 h-3.5" />
              <span>CASH</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPaymentMode('UPI');
                setAmountTendered('');
              }}
              className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                paymentMode === 'UPI'
                  ? 'bg-[#1DB954] text-white shadow-xs'
                  : 'bg-white border border-[#E0D7D0] text-[#2D241E] hover:bg-[#FDFCFB]'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>UPI / QR</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPaymentMode('Card');
                setAmountTendered('');
              }}
              className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                paymentMode === 'Card'
                  ? 'bg-[#4B3621] text-white shadow-xs'
                  : 'bg-white border border-[#E0D7D0] text-[#2D241E] hover:bg-[#FDFCFB]'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>CARD</span>
            </button>
          </div>

          {/* Dynamic Amount Received Input */}
          <div className="bg-[#F9F7F5] border border-[#E0D7D0] rounded-xl p-2.5 space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-[#2D241E]">
              <span className="flex items-center gap-1">
                <Banknote className="w-3.5 h-3.5 text-[#4B3621]" />
                <span>Type Cash Amount Received (₹):</span>
              </span>
              <span className="text-[11px] text-[#8B7E74] font-mono">
                Total: ₹{taxDetails.grandTotal.toFixed(2)}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <div className="relative flex-1">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8B7E74]">₹</span>
                <input
                  type="number"
                  step="any"
                  value={amountTendered}
                  onChange={(e) => {
                    setAmountTendered(e.target.value);
                    if (paymentMode !== 'Cash') setPaymentMode('Cash');
                  }}
                  placeholder="Type cash (e.g. 300)"
                  className="w-full bg-white border border-[#E0D7D0] rounded-lg py-1.5 pl-6 pr-2 text-xs text-[#2D241E] font-bold font-mono focus:outline-hidden focus:border-[#4B3621]"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  setPaymentMode('Cash');
                  setAmountTendered(taxDetails.grandTotal.toString());
                }}
                className="px-2 py-1 bg-[#E0D7D0] hover:bg-[#D5CBC2] text-[#2D241E] rounded-md text-xs font-bold cursor-pointer shrink-0"
              >
                Exact (₹{taxDetails.grandTotal})
              </button>
              <button
                type="button"
                onClick={() => {
                  setPaymentMode('Cash');
                  setAmountTendered('100');
                }}
                className="px-2 py-1 bg-white border border-[#E0D7D0] hover:bg-[#F4F1EE] text-[#2D241E] rounded-md text-xs font-bold cursor-pointer"
              >
                ₹100
              </button>
              <button
                type="button"
                onClick={() => {
                  setPaymentMode('Cash');
                  setAmountTendered('200');
                }}
                className="px-2 py-1 bg-white border border-[#E0D7D0] hover:bg-[#F4F1EE] text-[#2D241E] rounded-md text-xs font-bold cursor-pointer"
              >
                ₹200
              </button>
              <button
                type="button"
                onClick={() => {
                  setPaymentMode('Cash');
                  setAmountTendered('500');
                }}
                className="px-2 py-1 bg-white border border-[#E0D7D0] hover:bg-[#F4F1EE] text-[#2D241E] rounded-md text-xs font-bold cursor-pointer"
              >
                ₹500
              </button>
            </div>

            {/* Dynamic Status Breakdown Indicator */}
            <div className="p-2 rounded-lg bg-white border border-[#E0D7D0] flex items-center justify-between text-xs font-bold text-[#4B3621]">
              <span>{paymentBreakdown.statusBadge}</span>
              {amountTendered && parseFloat(amountTendered) < taxDetails.grandTotal && parseFloat(amountTendered) > 0 && (
                <span className="text-[10px] bg-[#4B3621] text-white px-2 py-0.5 rounded-md font-bold">
                  Auto-Split
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Action Panel */}
      <div className="p-3 bg-white border-t border-[#E0D7D0] space-y-2 shrink-0">
        {/* Row 1: Direct Send KOT & Bill primary button */}
        <button
          type="button"
          disabled={cartItems.length === 0}
          onClick={() => handleSettle('both')}
          className="w-full py-3 px-4 bg-[#4B3621] hover:bg-[#3D2C1B] active:bg-[#2D241E] text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>SEND KOT &amp; BILL (₹{taxDetails.grandTotal.toFixed(2)})</span>
        </button>

        {/* 2 Sub-Buttons Row: Print Bill Only, Print KOT Only */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={cartItems.length === 0}
            onClick={() => handleSettle('bill')}
            className="py-2 px-2 bg-white border border-[#4B3621] text-[#4B3621] hover:bg-[#F9F7F5] rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs disabled:opacity-50 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Bill Only</span>
          </button>

          <button
            type="button"
            disabled={cartItems.length === 0}
            onClick={() => handleSettle('kot')}
            className="py-2 px-2 bg-white border border-[#4B3621] text-[#4B3621] hover:bg-[#F9F7F5] rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs disabled:opacity-50 cursor-pointer"
          >
            <ChefHat className="w-3.5 h-3.5" />
            <span>KOT Only</span>
          </button>
        </div>
      </div>

    </div>
  );
};
