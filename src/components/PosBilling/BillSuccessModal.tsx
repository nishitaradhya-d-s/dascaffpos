import React, { useState } from 'react';
import { BillRecord, CafeSettings } from '../../types';
import { printReceipt } from '../../utils/printer';
import { downloadInvoicePdf, downloadKotPdf, downloadBothPdfs } from '../../utils/pdfGenerator';
import { openWhatsAppShare } from '../../utils/messaging';
import { 
  CheckCircle2, 
  Printer, 
  Download, 
  Send, 
  Plus, 
  Receipt, 
  ChefHat, 
  Share2, 
  X,
  Phone,
  Layers
} from 'lucide-react';

interface BillSuccessModalProps {
  bill: BillRecord;
  settings: CafeSettings;
  onClose: () => void;
  onNewOrder: () => void;
}

export const BillSuccessModal: React.FC<BillSuccessModalProps> = ({
  bill,
  settings,
  onClose,
  onNewOrder,
}) => {
  const [phoneNumber, setPhoneNumber] = useState(bill.customerPhone || '');
  const [whatsAppSent, setWhatsAppSent] = useState(false);

  const handleWhatsApp = () => {
    openWhatsAppShare(phoneNumber, bill, settings);
    setWhatsAppSent(true);
  };

  const handlePrintBill = () => {
    printReceipt(bill, settings, 'bill');
  };

  const handlePrintKot = () => {
    printReceipt(bill, settings, 'kot');
  };

  const handlePrintBoth = () => {
    printReceipt(bill, settings, 'both');
  };

  const handleDownloadInvoicePdf = () => {
    downloadInvoicePdf(bill, settings);
  };

  const handleDownloadKotPdf = () => {
    downloadKotPdf(bill, settings);
  };

  const handleDownloadBoth = () => {
    downloadBothPdfs(bill, settings);
  };

  const isGst = bill.billType === 'GST_Customer';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D241E]/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl max-w-md w-full overflow-hidden shadow-2xl border border-[#E0D7D0] animate-in fade-in zoom-in duration-150">
        {/* Header Banner */}
        <div className="p-6 bg-[#4B3621] text-white text-center relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/10 text-white/70 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center mx-auto mb-3 shadow-xs">
            <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
          </div>

          <h2 className="text-lg font-bold text-white tracking-wide">
            Bill Settled Successfully!
          </h2>
          <div className="flex items-center justify-center gap-2 mt-1 flex-wrap">
            <span className="text-xs font-mono font-bold text-amber-200 bg-black/25 px-2.5 py-0.5 rounded-md border border-white/10">
              {bill.billNumber}
            </span>
            <span className="text-xs font-mono font-bold text-white/80 bg-black/25 px-2 py-0.5 rounded-md border border-white/10">
              {bill.kotNumber}
            </span>
            <span className="text-xs text-white/80">
              {bill.orderType} {bill.tableNumber ? `(${bill.tableNumber})` : ''}
            </span>
          </div>

          <div className="text-xs font-bold text-amber-100 mt-1 flex items-center justify-center gap-1.5">
            <span>Customer: {bill.customerName || 'Walk-in'}</span>
            {bill.customerPhone && <span className="text-white/70 font-normal">({bill.customerPhone})</span>}
          </div>

          <div className="mt-4 pt-3 border-t border-white/15 flex justify-around text-center">
            <div>
              <div className="text-[10px] uppercase text-amber-200/70 font-bold">Total Payable</div>
              <div className="text-lg font-bold text-amber-200 font-mono">
                ₹{bill.taxDetails.grandTotal.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-amber-200/70 font-bold">Mode</div>
              <div className="text-xs font-bold text-white mt-1">{bill.paymentMode}</div>
            </div>
            {bill.changeReturned && bill.changeReturned > 0 ? (
              <div>
                <div className="text-[10px] uppercase text-emerald-300 font-bold">Return Change</div>
                <div className="text-sm font-bold text-emerald-300 font-mono mt-0.5">
                  ₹{bill.changeReturned.toFixed(2)}
                </div>
              </div>
            ) : (
              <div>
                <div className="text-[10px] uppercase text-amber-200/70 font-bold">Type</div>
                <div className="text-xs font-bold text-emerald-300 mt-1">
                  {isGst ? 'GST Invoice' : 'Non-GST'}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content: Actions */}
        <div className="p-5 space-y-3.5">
          {/* 1. WhatsApp Dispatch Box */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-emerald-700" />
                <span>Send WhatsApp Message (❤️ Thank You &amp; Enjoy Meals)</span>
              </span>
              {whatsAppSent && (
                <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded-md">
                  ✓ Sent
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Phone className="w-3.5 h-3.5 text-emerald-700 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Enter 10-digit mobile number"
                  className="w-full bg-white border border-emerald-300 rounded-lg py-1.5 pl-8 pr-2 text-xs text-[#2D241E] placeholder:text-emerald-700/50 font-mono focus:outline-hidden focus:border-emerald-600"
                />
              </div>

              <button
                type="button"
                onClick={handleWhatsApp}
                className="py-1.5 px-3.5 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition-colors shrink-0 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </div>
          </div>

          {/* 2. Print Action Buttons: Bill Only, KOT Only, and Both */}
          <div className="p-3 bg-[#F9F7F5] border border-[#E0D7D0] rounded-xl space-y-2">
            <div className="text-[11px] font-bold text-[#2D241E] flex items-center gap-1.5">
              <Printer className="w-3.5 h-3.5 text-[#4B3621]" />
              <span>Thermal 80mm Print Options</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={handlePrintBill}
                className="p-2 bg-white hover:bg-[#F4F1EE] text-[#2D241E] border border-[#E0D7D0] rounded-lg flex flex-col items-center justify-center gap-1 text-[11px] font-bold transition-all cursor-pointer shadow-2xs"
              >
                <Receipt className="w-3.5 h-3.5 text-[#4B3621]" />
                <span>Print Bill</span>
              </button>

              <button
                type="button"
                onClick={handlePrintKot}
                className="p-2 bg-white hover:bg-[#F4F1EE] text-[#2D241E] border border-[#E0D7D0] rounded-lg flex flex-col items-center justify-center gap-1 text-[11px] font-bold transition-all cursor-pointer shadow-2xs"
              >
                <ChefHat className="w-3.5 h-3.5 text-[#4B3621]" />
                <span>Print KOT</span>
              </button>

              <button
                type="button"
                onClick={handlePrintBoth}
                className="p-2 bg-[#4B3621] hover:bg-[#3D2C1B] active:bg-[#2D241E] text-white rounded-lg flex flex-col items-center justify-center gap-1 text-[11px] font-bold transition-all shadow-xs cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5 text-amber-200" />
                <span>Print Both</span>
              </button>
            </div>
          </div>

          {/* 3. Download PDF Action Buttons (Bill PDF, KOT PDF & Both) */}
          <div className="p-3 bg-[#F9F7F5] border border-[#E0D7D0] rounded-xl space-y-2">
            <div className="text-[11px] font-bold text-[#2D241E] flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5 text-[#4B3621]" />
              <span>Save &amp; Download PDF (80mm Paper Optimized)</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={handleDownloadInvoicePdf}
                className="py-2 px-2 bg-white hover:bg-[#F4F1EE] text-[#2D241E] border border-[#E0D7D0] rounded-lg text-[11px] font-bold transition-all text-center cursor-pointer shadow-2xs"
              >
                Bill PDF
              </button>
              <button
                type="button"
                onClick={handleDownloadKotPdf}
                className="py-2 px-2 bg-white hover:bg-[#F4F1EE] text-[#2D241E] border border-[#E0D7D0] rounded-lg text-[11px] font-bold transition-all text-center cursor-pointer shadow-2xs"
              >
                KOT PDF
              </button>
              <button
                type="button"
                onClick={handleDownloadBoth}
                className="py-2 px-2 bg-[#4B3621] hover:bg-[#3D2C1B] text-white rounded-lg text-[11px] font-bold transition-all text-center cursor-pointer shadow-2xs"
              >
                Both PDFs
              </button>
            </div>
          </div>

          {/* 4. Start Fresh New Order */}
          <button
            type="button"
            onClick={onNewOrder}
            className="w-full py-3 bg-[#4B3621] hover:bg-[#3D2C1B] active:bg-[#2D241E] text-white font-bold rounded-lg text-sm transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Start Next Bill</span>
          </button>
        </div>
      </div>
    </div>
  );
};
