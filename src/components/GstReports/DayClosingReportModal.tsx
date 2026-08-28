import React, { useState } from 'react';
import { BillRecord, CafeSettings } from '../../types';
import { 
  X, 
  Send, 
  Copy, 
  Check, 
  Store, 
  Moon, 
  Phone, 
  TrendingUp, 
  Receipt, 
  CreditCard, 
  Utensils, 
  Clock 
} from 'lucide-react';

interface DayClosingReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  todayBills: BillRecord[];
  settings: CafeSettings;
}

export const DayClosingReportModal: React.FC<DayClosingReportModalProps> = ({
  isOpen,
  onClose,
  todayBills,
  settings,
}) => {
  const [copied, setCopied] = useState(false);
  const [recipientPhone, setRecipientPhone] = useState(
    settings.contactPhone ? settings.contactPhone.replace(/\D/g, '') : ''
  );

  React.useEffect(() => {
    if (isOpen && settings.contactPhone) {
      setRecipientPhone(settings.contactPhone.replace(/\D/g, ''));
    }
  }, [isOpen, settings.contactPhone]);

  if (!isOpen) return null;

  const todayStr = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const currentTimeStr = new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  // Calculate metrics
  const totalBills = todayBills.length;
  const grossRevenue = todayBills.reduce((sum, b) => sum + (b.taxDetails.grandTotal || 0), 0);
  const taxableTotal = todayBills.reduce((sum, b) => sum + (b.taxDetails.taxableValue || 0), 0);
  const totalCgst = todayBills.reduce((sum, b) => sum + (b.taxDetails.cgstAmount || 0), 0);
  const totalSgst = todayBills.reduce((sum, b) => sum + (b.taxDetails.sgstAmount || 0), 0);
  const totalGst = totalCgst + totalSgst;
  const totalDiscount = todayBills.reduce((sum, b) => sum + (b.taxDetails.discountAmount || 0), 0);

  // Payment Breakdown
  const paymentBreakdown = {
    Cash: todayBills.filter((b) => b.paymentMode === 'Cash').reduce((sum, b) => sum + b.taxDetails.grandTotal, 0),
    UPI: todayBills.filter((b) => b.paymentMode === 'UPI').reduce((sum, b) => sum + b.taxDetails.grandTotal, 0),
    Card: todayBills.filter((b) => b.paymentMode === 'Card').reduce((sum, b) => sum + b.taxDetails.grandTotal, 0),
    Split: todayBills.filter((b) => b.paymentMode === 'Split').reduce((sum, b) => sum + b.taxDetails.grandTotal, 0),
  };

  // Order Type Breakdown
  const orderTypeBreakdown = {
    DineIn: todayBills.filter((b) => b.orderType === 'Dine-In').length,
    Takeaway: todayBills.filter((b) => b.orderType === 'Takeaway').length,
    Delivery: todayBills.filter((b) => b.orderType === 'Delivery').length,
  };

  // Item Sales Frequency
  const itemMap: Record<string, { name: string; qty: number; total: number }> = {};
  todayBills.forEach((bill) => {
    bill.items.forEach((item) => {
      if (!itemMap[item.name]) {
        itemMap[item.name] = { name: item.name, qty: 0, total: 0 };
      }
      itemMap[item.name].qty += item.quantity;
      itemMap[item.name].total += item.totalPrice;
    });
  });
  const topItems = Object.values(itemMap)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  // Peak Hour
  const hourlyCount: Record<number, { count: number; sales: number }> = {};
  todayBills.forEach((b) => {
    const hr = new Date(b.date).getHours();
    if (!hourlyCount[hr]) hourlyCount[hr] = { count: 0, sales: 0 };
    hourlyCount[hr].count += 1;
    hourlyCount[hr].sales += b.taxDetails.grandTotal;
  });

  let peakHour = -1;
  let maxSales = 0;
  Object.entries(hourlyCount).forEach(([hr, val]) => {
    if (val.sales > maxSales) {
      maxSales = val.sales;
      peakHour = parseInt(hr, 10);
    }
  });

  const formatHourLabel = (hr: number) => {
    const start = hr % 12 === 0 ? 12 : hr % 12;
    const startAmPm = hr >= 12 ? 'PM' : 'AM';
    const nextHr = (hr + 1) % 24;
    const end = nextHr % 12 === 0 ? 12 : nextHr % 12;
    const endAmPm = nextHr >= 12 ? 'PM' : 'AM';
    return `${start} ${startAmPm} - ${end} ${endAmPm}`;
  };

  const peakHourText = peakHour >= 0 ? formatHourLabel(peakHour) : 'N/A';

  // Construct WhatsApp Plaintext Message
  const generateWhatsAppText = () => {
    let msg = `🌙 *${settings.cafeName.toUpperCase()} - END OF DAY CLOSING REPORT*\n`;
    msg += `📅 *Date:* ${todayStr} | *Time:* ${currentTimeStr}\n`;
    if (settings.gstin) msg += `🏛️ *GSTIN:* ${settings.gstin}\n`;
    msg += `─────────────────────────\n`;
    msg += `💰 *TOTAL GROSS REVENUE: ₹${grossRevenue.toFixed(2)}*\n`;
    msg += `🧾 *Total Invoices Generated:* ${totalBills}\n`;
    msg += `📈 *Taxable Base Value:* ₹${taxableTotal.toFixed(2)}\n`;
    msg += `🏛️ *CGST (2.5%):* ₹${totalCgst.toFixed(2)}\n`;
    msg += `🏛️ *SGST (2.5%):* ₹${totalSgst.toFixed(2)}\n`;
    msg += `📊 *Total GST Collected:* ₹${totalGst.toFixed(2)}\n`;
    if (totalDiscount > 0) {
      msg += `🏷️ *Total Discounts Given:* ₹${totalDiscount.toFixed(2)}\n`;
    }
    msg += `─────────────────────────\n`;
    msg += `💳 *PAYMENT METHOD SUMMARY:*\n`;
    msg += `• Cash: ₹${paymentBreakdown.Cash.toFixed(2)}\n`;
    msg += `• UPI / Online: ₹${paymentBreakdown.UPI.toFixed(2)}\n`;
    msg += `• Card: ₹${paymentBreakdown.Card.toFixed(2)}\n`;
    if (paymentBreakdown.Split > 0) {
      msg += `• Split: ₹${paymentBreakdown.Split.toFixed(2)}\n`;
    }
    msg += `─────────────────────────\n`;
    msg += `🍽️ *ORDER TYPES:*\n`;
    msg += `• Dine-In: ${orderTypeBreakdown.DineIn} orders\n`;
    msg += `• Takeaway: ${orderTypeBreakdown.Takeaway} orders\n`;
    msg += `• Delivery: ${orderTypeBreakdown.Delivery} orders\n`;
    if (peakHour >= 0) {
      msg += `⏰ *Peak Sales Window:* ${peakHourText} (₹${maxSales.toFixed(2)})\n`;
    }
    if (topItems.length > 0) {
      msg += `─────────────────────────\n`;
      msg += `🔥 *TOP 5 BEST SELLERS:*\n`;
      topItems.forEach((it, idx) => {
        msg += `${idx + 1}. ${it.name} - ${it.qty} sold (₹${it.total.toFixed(2)})\n`;
      });
    }
    msg += `─────────────────────────\n`;
    msg += `✅ *Register Closed by Store Manager*`;
    return msg;
  };

  const handleSendToWhatsApp = () => {
    const rawNumber = recipientPhone.replace(/\D/g, '');
    const cleanNumber = rawNumber.startsWith('91') && rawNumber.length === 12
      ? rawNumber
      : rawNumber.length === 10
      ? `91${rawNumber}`
      : rawNumber;

    const message = generateWhatsAppText();
    const encoded = encodeURIComponent(message);

    if (cleanNumber.length >= 10) {
      window.open(`https://wa.me/${cleanNumber}?text=${encoded}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${encoded}`, '_blank');
    }
  };

  const handleCopyReport = () => {
    navigator.clipboard.writeText(generateWhatsAppText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D241E]/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-[#E0D7D0] flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 bg-[#4B3621] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-300/30 flex items-center justify-center text-amber-200">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-200">
                End-of-Day Store Closing
              </div>
              <h3 className="font-bold text-sm sm:text-base flex items-center gap-1.5">
                <span>Daily Sales Summary to WhatsApp</span>
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Summary View */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* Main Key Revenue Banner */}
          <div className="bg-gradient-to-br from-[#4B3621] to-[#2D241E] text-white p-4 rounded-xl shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-200 uppercase tracking-wide">
                Today's Gross Sales ({todayStr})
              </span>
              <span className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-400/30 font-bold">
                {totalBills} Invoices
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black font-mono text-white">
                ₹{grossRevenue.toFixed(2)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-[11px] font-mono text-amber-100/90">
              <div>Base Taxable: ₹{taxableTotal.toFixed(2)}</div>
              <div>GST Collected: ₹{totalGst.toFixed(2)}</div>
            </div>
          </div>

          {/* Payment & Order Mode Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-[#F9F7F5] rounded-xl border border-[#E0D7D0] space-y-1.5">
              <div className="text-[10px] font-bold text-[#8B7E74] uppercase flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-[#4B3621]" />
                <span>Payment Split</span>
              </div>
              <div className="space-y-1 font-mono text-[11px] text-[#2D241E]">
                <div className="flex justify-between">
                  <span>Cash:</span>
                  <span className="font-bold">₹{paymentBreakdown.Cash.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>UPI:</span>
                  <span className="font-bold text-emerald-700">₹{paymentBreakdown.UPI.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Card:</span>
                  <span className="font-bold">₹{paymentBreakdown.Card.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-[#F9F7F5] rounded-xl border border-[#E0D7D0] space-y-1.5">
              <div className="text-[10px] font-bold text-[#8B7E74] uppercase flex items-center gap-1">
                <Utensils className="w-3.5 h-3.5 text-[#4B3621]" />
                <span>Order Types</span>
              </div>
              <div className="space-y-1 font-mono text-[11px] text-[#2D241E]">
                <div className="flex justify-between">
                  <span>Dine-In:</span>
                  <span className="font-bold">{orderTypeBreakdown.DineIn}</span>
                </div>
                <div className="flex justify-between">
                  <span>Takeaway:</span>
                  <span className="font-bold">{orderTypeBreakdown.Takeaway}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery:</span>
                  <span className="font-bold">{orderTypeBreakdown.Delivery}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Peak Rush Info & Top Sellers */}
          {peakHour >= 0 && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-amber-900 font-bold">
                <Clock className="w-4 h-4 text-amber-700" />
                <span>Busiest Peak Hour:</span>
              </div>
              <div className="font-mono font-bold text-[#4B3621] text-[11px]">
                {peakHourText} (₹{maxSales.toFixed(2)})
              </div>
            </div>
          )}

          {/* Recipient WhatsApp Phone Input */}
          <div className="p-3 bg-[#F4F1EE] rounded-xl border border-[#E0D7D0] space-y-2">
            <label className="block text-[10px] font-bold text-[#4B3621] uppercase">
              Send Closing Report To WhatsApp Number (Owner / Manager):
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-[#8B7E74] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                placeholder="Enter 10-digit Owner Mobile Number"
                className="w-full bg-white border border-[#E0D7D0] rounded-lg py-2 pl-9 pr-3 font-mono font-bold text-xs text-[#2D241E] focus:outline-hidden focus:border-[#4B3621]"
              />
            </div>
            <p className="text-[10px] text-[#8B7E74]">
              Defaults to your cafe contact phone. You can also send to any partner or accountant.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 bg-[#F4F1EE] border-t border-[#E0D7D0] flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCopyReport}
            className="px-3 py-2 bg-white border border-[#E0D7D0] hover:bg-gray-50 text-[#4B3621] font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied Report!' : 'Copy Summary'}</span>
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 bg-white border border-[#E0D7D0] text-[#8B7E74] hover:text-[#2D241E] font-bold rounded-xl text-xs cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleSendToWhatsApp}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send to WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
