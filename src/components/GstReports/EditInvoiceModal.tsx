import React, { useState } from 'react';
import { BillRecord, CafeSettings, TaxDetails, CartItem } from '../../types';
import { X, Save, Edit3, Trash2, Plus, Minus, Calendar, User, Phone, MapPin, CreditCard } from 'lucide-react';

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
    discountPercent: discountPercent,
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
  const getFormattedDate = (dateVal: string) => {
    try {
      const d = new Date(dateVal);
      const tzOffset = d.getTimezoneOffset() * 60000;
      return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
    } catch {
      return new Date().toISOString().slice(0, 16);
    }
  };

  const [customerName, setCustomerName] = useState(bill.customerName || 'Walk-in');
  const [customerPhone, setCustomerPhone] = useState(bill.customerPhone || '');
  const [orderType, setOrderType] = useState(bill.orderType);
  const [tableNumber, setTableNumber] = useState(bill.tableNumber || '');
  const [paymentMode, setPaymentMode] = useState(bill.paymentMode);
  const [notes, setNotes] = useState(bill.notes || '');
  const [invoiceDate, setInvoiceDate] = useState(getFormattedDate(bill.date));
  const [items, setItems] = useState<CartItem[]>(bill.items ? bill.items.map((it) => ({ ...it })) : []);

  React.useEffect(() => {
    if (isOpen && bill) {
      setCustomerName(bill.customerName || 'Walk-in');
      setCustomerPhone(bill.customerPhone || '');
      setOrderType(bill.orderType);
      setTableNumber(bill.tableNumber || '');
      setPaymentMode(bill.paymentMode);
      setNotes(bill.notes || '');
      setInvoiceDate(getFormattedDate(bill.date));
      setItems(bill.items ? bill.items.map((it) => ({ ...it })) : []);
    }
  }, [isOpen, bill]);

  if (!isOpen) return null;

  const handleUpdateItemQty = (cartItemId: string, newQty: number) => {
    if (newQty <= 0) {
      setItems(items.filter((i) => i.cartItemId !== cartItemId));
    } else {
      setItems(
        items.map((item) => {
          if (item.cartItemId === cartItemId) {
            const unit = item.unitPrice || item.totalPrice / item.quantity;
            return {
              ...item,
              quantity: newQty,
              totalPrice: unit * newQty,
            };
          }
          return item;
        })
      );
    }
  };

  const handleRemoveItem = (cartItemId: string) => {
    setItems(items.filter((i) => i.cartItemId !== cartItemId));
  };

  // Recalculate taxes based on updated items
  const taxDetails = computeTaxDetails(
    items,
    settings.defaultGstRate,
    bill.taxDetails.discountPercent || 0,
    bill.taxDetails.discountAmount || 0
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      alert('Invoice must contain at least 1 item.');
      return;
    }

    const updatedBill: BillRecord = {
      ...bill,
      customerName: customerName.trim() || 'Walk-in',
      customerPhone: customerPhone.trim() || undefined,
      orderType,
      tableNumber: orderType === 'Dine-In' ? tableNumber.trim() : undefined,
      paymentMode,
      notes: notes.trim() || undefined,
      date: new Date(invoiceDate).toISOString(),
      items,
      taxDetails,
    };

    onSave(updatedBill);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D241E]/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl max-w-xl w-full overflow-hidden shadow-2xl border border-[#E0D7D0] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-[#4B3621] text-white flex items-center justify-between shrink-0">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-200">
              Modify Invoice Details
            </div>
            <h3 className="font-bold text-sm flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-amber-200" />
              <span>Edit Tax Invoice: {bill.billNumber}</span>
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-white/70 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* Customer & Billing Meta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#F9F7F5] p-3 rounded-lg border border-[#E0D7D0]">
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
                  placeholder="Customer Name"
                  className="w-full bg-white border border-[#E0D7D0] rounded-lg py-1.5 pl-8 pr-2.5 font-bold text-[#2D241E] focus:outline-hidden focus:border-[#4B3621]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#8B7E74] uppercase mb-1">
                Customer Phone
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-[#8B7E74] absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Optional 10-digit number"
                  className="w-full bg-white border border-[#E0D7D0] rounded-lg py-1.5 pl-8 pr-2.5 font-mono text-[#2D241E] focus:outline-hidden focus:border-[#4B3621]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#8B7E74] uppercase mb-1">
                Order Type &amp; Table
              </label>
              <div className="flex gap-2">
                <select
                  value={orderType}
                  onChange={(e) => setOrderType(e.target.value as any)}
                  className="flex-1 bg-white border border-[#E0D7D0] rounded-lg py-1.5 px-2 font-bold text-[#2D241E] focus:outline-hidden focus:border-[#4B3621]"
                >
                  <option value="Dine-In">Dine-In</option>
                  <option value="Takeaway">Takeaway</option>
                  <option value="Delivery">Delivery</option>
                </select>

                {orderType === 'Dine-In' && (
                  <input
                    type="text"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    placeholder="Table #"
                    className="w-20 bg-white border border-[#E0D7D0] rounded-lg py-1.5 px-2 font-bold text-[#2D241E] focus:outline-hidden focus:border-[#4B3621]"
                  />
                )}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#8B7E74] uppercase mb-1">
                Payment Method
              </label>
              <div className="relative">
                <CreditCard className="w-3.5 h-3.5 text-[#8B7E74] absolute left-2.5 top-1/2 -translate-y-1/2" />
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value as any)}
                  className="w-full bg-white border border-[#E0D7D0] rounded-lg py-1.5 pl-8 pr-2.5 font-bold text-[#2D241E] focus:outline-hidden focus:border-[#4B3621]"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Card">Card</option>
                  <option value="Split">Split</option>
                </select>
              </div>
            </div>

            <div className="col-span-1 sm:col-span-2">
              <label className="block text-[10px] font-bold text-[#8B7E74] uppercase mb-1">
                Settlement Date &amp; Time
              </label>
              <div className="relative">
                <Calendar className="w-3.5 h-3.5 text-[#8B7E74] absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="datetime-local"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full bg-white border border-[#E0D7D0] rounded-lg py-1.5 pl-8 pr-2.5 font-mono text-[#2D241E] focus:outline-hidden focus:border-[#4B3621]"
                />
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-[#E0D7D0] rounded-lg overflow-hidden">
            <div className="p-2 bg-[#F4F1EE] border-b border-[#E0D7D0] font-bold text-[#4B3621] flex justify-between items-center">
              <span>Invoice Items ({items.length})</span>
              <span className="text-[11px] text-[#8B7E74]">Quantity &amp; Pricing</span>
            </div>

            <div className="divide-y divide-[#E0D7D0]/60 max-h-48 overflow-y-auto">
              {items.map((item) => {
                const unitPrice = item.unitPrice || item.totalPrice / item.quantity;
                return (
                  <div key={item.cartItemId} className="p-2.5 flex items-center justify-between gap-2 hover:bg-[#F9F7F5]">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-[#2D241E] truncate">{item.name}</div>
                      <div className="text-[10px] text-[#8B7E74] font-mono">
                        ₹{unitPrice.toFixed(2)} / unit
                        {item.selectedVariant && ` • ${item.selectedVariant.name}`}
                      </div>
                    </div>

                    {/* Qty Controls */}
                    <div className="flex items-center gap-1.5 bg-[#F4F1EE] rounded-md p-0.5 border border-[#E0D7D0]">
                      <button
                        type="button"
                        onClick={() => handleUpdateItemQty(item.cartItemId, item.quantity - 1)}
                        className="w-5 h-5 rounded flex items-center justify-center bg-white hover:bg-rose-50 text-[#4B3621] hover:text-rose-600 font-bold cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center font-mono font-bold text-[#2D241E]">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateItemQty(item.cartItemId, item.quantity + 1)}
                        className="w-5 h-5 rounded flex items-center justify-center bg-white hover:bg-emerald-50 text-[#4B3621] hover:text-emerald-700 font-bold cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="w-20 text-right font-mono font-bold text-[#4B3621]">
                      ₹{item.totalPrice.toFixed(2)}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.cartItemId)}
                      className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded cursor-pointer"
                      title="Remove Item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live Recalculated GST Summary */}
          <div className="bg-[#4B3621] text-white p-3 rounded-lg space-y-1 font-mono text-xs">
            <div className="flex justify-between text-amber-100/80 text-[11px]">
              <span>Taxable Value (Base):</span>
              <span>₹{taxDetails.taxableValue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-amber-100/80 text-[11px]">
              <span>CGST ({taxDetails.cgstRate}%):</span>
              <span>₹{taxDetails.cgstAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-amber-100/80 text-[11px]">
              <span>SGST ({taxDetails.sgstRate}%):</span>
              <span>₹{taxDetails.sgstAmount.toFixed(2)}</span>
            </div>
            {taxDetails.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-300 text-[11px]">
                <span>Discount:</span>
                <span>-₹{taxDetails.discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="pt-1 border-t border-amber-200/30 flex justify-between font-bold text-sm text-white">
              <span>Recalculated Grand Total:</span>
              <span className="text-amber-200">₹{taxDetails.grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-3 bg-[#F4F1EE] border-t border-[#E0D7D0] flex justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-[#E0D7D0] hover:bg-gray-50 text-[#8B7E74] hover:text-[#2D241E] font-bold rounded-lg text-xs cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-4 py-2 bg-[#4B3621] hover:bg-[#3D2C1B] text-white font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Save className="w-3.5 h-3.5 text-amber-200" />
            <span>Save &amp; Update Invoice</span>
          </button>
        </div>
      </div>
    </div>
  );
};
