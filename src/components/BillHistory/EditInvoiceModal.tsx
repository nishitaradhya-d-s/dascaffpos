import React, { useState } from 'react';
import { BillRecord, CafeSettings, TaxDetails, CartItem } from '../../types';
import { X, Save, Trash2, Plus, Minus, Calendar, User, Phone, MapPin, CreditCard } from 'lucide-react';

interface EditInvoiceModalProps {
  bill: BillRecord;
  settings: CafeSettings;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedBill: BillRecord) => void;
}

export function computeTaxDetails(
  items: CartItem[],
  defaultGstRate: number,
  discountPercent: number = 0,
  previousDiscountAmount: number = 0
): TaxDetails {
  const subTotal = items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
  const effectiveGst = typeof defaultGstRate === 'number' ? Math.max(0, defaultGstRate) : 5;
  const halfRate = effectiveGst / 2;

  const taxableValue = subTotal;
  const totalTax = (taxableValue * effectiveGst) / 100;
  const cgstAmount = totalTax / 2;
  const sgstAmount = totalTax / 2;
  const grossTotalWithTax = taxableValue + totalTax;

  let calcDiscount = 0;
  if (discountPercent > 0) {
    calcDiscount = (grossTotalWithTax * discountPercent) / 100;
  } else if (previousDiscountAmount > 0) {
    calcDiscount = Math.min(previousDiscountAmount, grossTotalWithTax);
  }

  const netPayable = Math.max(0, grossTotalWithTax - calcDiscount);
  const rounded = Math.round(netPayable);
  const roundOff = +(rounded - netPayable).toFixed(2);

  return {
    subTotal,
    discountAmount: +calcDiscount.toFixed(2),
    discountPercent: grossTotalWithTax > 0 ? (calcDiscount / grossTotalWithTax) * 100 : 0,
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
}

export const EditInvoiceModal: React.FC<EditInvoiceModalProps> = ({
  bill,
  settings,
  isOpen,
  onClose,
  onSave,
}) => {
  const [customerName, setCustomerName] = useState(bill.customerName || '');
  const [customerPhone, setCustomerPhone] = useState(bill.customerPhone || '');
  const [tableNumber, setTableNumber] = useState(bill.tableNumber || '');
  const [paymentMode, setPaymentMode] = useState(bill.paymentMode || 'Cash');
  const [notes, setNotes] = useState(bill.notes || '');
  const [items, setItems] = useState<CartItem[]>(() => JSON.parse(JSON.stringify(bill.items)));
  const [billDate, setBillDate] = useState(() => {
    try {
      return new Date(bill.date).toISOString().slice(0, 16);
    } catch {
      return new Date().toISOString().slice(0, 16);
    }
  });

  if (!isOpen) return null;

  const currentTaxDetails = computeTaxDetails(
    items,
    settings.defaultGstRate ?? 5,
    bill.taxDetails.discountPercent,
    bill.taxDetails.discountAmount
  );

  const handleUpdateItemQty = (index: number, newQty: number) => {
    if (newQty <= 0) {
      setItems((prev) => prev.filter((_, i) => i !== index));
      return;
    }
    setItems((prev) =>
      prev.map((item, i) => {
        if (i === index) {
          const unitPrice = item.unitPrice || 0;
          return {
            ...item,
            quantity: newQty,
            totalPrice: unitPrice * newQty,
          };
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      alert('Invoice must contain at least one item.');
      return;
    }

    const updatedBill: BillRecord = {
      ...bill,
      customerName: customerName.trim() || 'Walk-in',
      customerPhone: customerPhone.trim() || undefined,
      tableNumber: tableNumber.trim() || undefined,
      paymentMode,
      notes: notes.trim() || undefined,
      items,
      taxDetails: currentTaxDetails,
      date: new Date(billDate).toISOString(),
    };

    onSave(updatedBill);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-[#E0D7D0] overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#4B3621] text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center font-bold text-sm">
              #{bill.billNumber}
            </span>
            <div>
              <h3 className="font-bold text-sm leading-tight">Edit Invoice #{bill.billNumber}</h3>
              <p className="text-[10.5px] text-amber-200/80">KOT #{bill.kotNumber || '000'} • Modify details &amp; items</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-amber-200/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs text-[#2D241E]">
          {/* Metadata Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#F9F7F5] p-3.5 rounded-xl border border-[#E0D7D0]">
            <div>
              <label className="block text-[10.5px] font-bold text-[#8B7E74] uppercase tracking-wider mb-1 flex items-center gap-1">
                <User className="w-3 h-3 text-[#4B3621]" />
                <span>Customer Name</span>
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Walk-in"
                className="w-full bg-white border border-[#E0D7D0] rounded-lg px-2.5 py-1.5 text-xs text-[#2D241E] focus:outline-hidden focus:border-[#4B3621]"
              />
            </div>

            <div>
              <label className="block text-[10.5px] font-bold text-[#8B7E74] uppercase tracking-wider mb-1 flex items-center gap-1">
                <Phone className="w-3 h-3 text-[#4B3621]" />
                <span>Customer Phone</span>
              </label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="10-digit mobile"
                className="w-full bg-white border border-[#E0D7D0] rounded-lg px-2.5 py-1.5 text-xs text-[#2D241E] focus:outline-hidden focus:border-[#4B3621]"
              />
            </div>

            <div>
              <label className="block text-[10.5px] font-bold text-[#8B7E74] uppercase tracking-wider mb-1 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#4B3621]" />
                <span>Table Number / Section</span>
              </label>
              <input
                type="text"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                placeholder="T-1, Cash Sale, Takeaway"
                className="w-full bg-white border border-[#E0D7D0] rounded-lg px-2.5 py-1.5 text-xs text-[#2D241E] focus:outline-hidden focus:border-[#4B3621]"
              />
            </div>

            <div>
              <label className="block text-[10.5px] font-bold text-[#8B7E74] uppercase tracking-wider mb-1 flex items-center gap-1">
                <CreditCard className="w-3 h-3 text-[#4B3621]" />
                <span>Payment Mode</span>
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as any)}
                className="w-full bg-white border border-[#E0D7D0] rounded-lg px-2.5 py-1.5 text-xs text-[#2D241E] focus:outline-hidden focus:border-[#4B3621]"
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI / Online</option>
                <option value="Card">Card</option>
                <option value="Split">Split</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[10.5px] font-bold text-[#8B7E74] uppercase tracking-wider mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-[#4B3621]" />
                <span>Invoice Date &amp; Time</span>
              </label>
              <input
                type="datetime-local"
                value={billDate}
                onChange={(e) => setBillDate(e.target.value)}
                className="w-full bg-white border border-[#E0D7D0] rounded-lg px-2.5 py-1.5 text-xs text-[#2D241E] focus:outline-hidden focus:border-[#4B3621]"
              />
            </div>
          </div>

          {/* Items Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs text-[#4B3621] uppercase tracking-wider">Ordered Items ({items.length})</h4>
              <span className="text-[11px] text-[#8B7E74]">Item count &amp; unit rates</span>
            </div>

            <div className="border border-[#E0D7D0] rounded-xl overflow-hidden divide-y divide-[#E0D7D0]">
              {items.map((item, index) => (
                <div key={item.cartItemId || index} className="p-2.5 bg-white flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-xs text-[#2D241E] truncate">{item.name}</div>
                    <div className="text-[10px] text-[#8B7E74] font-mono">
                      ₹{item.unitPrice.toFixed(2)} each
                    </div>
                  </div>

                  {/* Quantity Modifier */}
                  <div className="flex items-center gap-1.5 bg-[#F9F7F5] p-1 rounded-lg border border-[#E0D7D0]">
                    <button
                      type="button"
                      onClick={() => handleUpdateItemQty(index, item.quantity - 1)}
                      className="w-6 h-6 rounded bg-white hover:bg-[#E0D7D0] text-[#2D241E] flex items-center justify-center font-bold transition-colors cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center font-bold font-mono text-xs text-[#2D241E]">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleUpdateItemQty(index, item.quantity + 1)}
                      className="w-6 h-6 rounded bg-white hover:bg-[#E0D7D0] text-[#2D241E] flex items-center justify-center font-bold transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="w-20 text-right font-mono font-bold text-xs text-[#2D241E]">
                    ₹{(item.totalPrice || item.unitPrice * item.quantity).toFixed(2)}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    className="p-1 text-[#8B7E74] hover:text-rose-600 transition-colors cursor-pointer"
                    title="Remove Item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Tax & Total Summary */}
          <div className="bg-[#F9F7F5] border border-[#E0D7D0] rounded-xl p-3.5 space-y-1.5 text-xs">
            <div className="flex justify-between text-[#8B7E74]">
              <span>Taxable Subtotal:</span>
              <span className="font-mono text-[#2D241E]">₹{currentTaxDetails.subTotal.toFixed(2)}</span>
            </div>
            {currentTaxDetails.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-700 font-medium">
                <span>Discount:</span>
                <span className="font-mono">-₹{currentTaxDetails.discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-[#8B7E74]">
              <span>GST ({currentTaxDetails.gstRate}% - CGST + SGST):</span>
              <span className="font-mono text-[#2D241E]">₹{currentTaxDetails.totalTax.toFixed(2)}</span>
            </div>
            <div className="pt-2 border-t border-[#E0D7D0] flex justify-between text-sm font-bold text-[#4B3621]">
              <span>Grand Total:</span>
              <span className="font-mono">₹{currentTaxDetails.grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="bg-white border-t border-[#E0D7D0] px-5 py-3 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-[#8B7E74] hover:bg-[#F4F1EE] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-[#4B3621] hover:bg-[#3D2C1B] text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
};
