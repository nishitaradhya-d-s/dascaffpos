import React, { useState } from 'react';
import { BillRecord, CafeSettings } from '../../types';
import { printReceipt, formatBillDate } from '../../utils/printer';
import { downloadInvoicePdf, downloadKotPdf } from '../../utils/pdfGenerator';
import { openWhatsAppShare } from '../../utils/messaging';
import { 
  X, 
  Printer, 
  Download, 
  Send, 
  Receipt, 
  ChefHat, 
  Trash2,
  Calendar,
  CreditCard,
  User,
  Eye
} from 'lucide-react';

interface BillDetailModalProps {
  bill: BillRecord;
  settings: CafeSettings;
  onClose: () => void;
  onDeleteBill: (billId: string) => void;
}

export const BillDetailModal: React.FC<BillDetailModalProps> = ({
  bill,
  settings,
  onClose,
  onDeleteBill,
}) => {
  const [viewMode, setViewMode] = useState<'receipt' | 'summary'>('receipt');
  const isGst = bill.billType === 'GST_Customer';
  const { fullFormatted } = formatBillDate(bill.date);
  const checkNo = bill.checkNumber || bill.billNumber.replace(/[^0-9]/g, '') || '001';
  const tableDisplay = bill.orderType === 'Dine-In' && bill.tableNumber 
    ? (bill.tableNumber.replace(/[^0-9]/g, '') || bill.tableNumber) 
    : 'N/A';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D241E]/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl max-w-lg w-full overflow-hidden shadow-2xl border border-[#E0D7D0] animate-in fade-in zoom-in duration-150 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 bg-[#4B3621] text-white flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold font-mono text-amber-200">
                {bill.billNumber}
              </span>
              <span className="text-xs font-mono font-bold text-white/80 bg-black/25 px-2 py-0.5 rounded-md border border-white/10">
                {bill.kotNumber}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  isGst ? 'bg-emerald-600 text-white' : 'bg-[#2D241E] text-amber-200 border border-amber-200/30'
                }`}
              >
                {isGst ? 'GST Tax Invoice' : 'Non-GST Retail'}
              </span>
            </div>
            <p className="text-xs text-amber-200/80 mt-0.5">
              {new Date(bill.date).toLocaleString('en-IN')} • {bill.orderType}{' '}
              {bill.tableNumber ? `(${bill.tableNumber})` : ''}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-black/30 p-0.5 rounded-lg border border-white/10 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setViewMode('receipt')}
                className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                  viewMode === 'receipt' ? 'bg-white text-[#2D241E]' : 'text-white/80 hover:text-white'
                }`}
              >
                Thermal Receipt
              </button>
              <button
                type="button"
                onClick={() => setViewMode('summary')}
                className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                  viewMode === 'summary' ? 'bg-white text-[#2D241E]' : 'text-white/80 hover:text-white'
                }`}
              >
                Data View
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 text-white/70 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs bg-[#F4F1EE]">
          {viewMode === 'receipt' ? (
            /* EXACT THERMAL PAPER RECEIPT PREVIEW (Matching Photo 1:1) */
            <div className="max-w-xs mx-auto bg-white text-black p-5 rounded-md shadow-md border border-[#D5CBC2] font-mono text-[11.5px] leading-relaxed">
              {/* Header */}
              <div className="text-center font-bold text-[14px] uppercase tracking-wide">
                {settings.cafeName}
              </div>
              <div className="text-center font-bold text-[12px] uppercase">
                TAX INVOICE
              </div>
              <div className="text-center text-[10.5px]">
                ORIGINAL
              </div>
              <div className="text-center text-[11px] mt-1 leading-tight text-gray-800">
                {settings.address}<br />
                {settings.cityStateZip}<br />
                Caff Phone No : {settings.phone}
              </div>

              <div className="text-center font-bold text-[12.5px] mt-2">
                Invoice No : {bill.billNumber}
              </div>
              <div className="text-center font-bold text-[11.5px] uppercase">
                {bill.orderType}
              </div>
              <div className="text-center text-[10.5px] text-gray-700">
                {fullFormatted}
              </div>

              <div className="border-t border-dashed border-black my-2" />

              {/* Check & Customer */}
              <div className="flex justify-between">
                <span>CHECK NO : {checkNo}</span>
                <span>Table No: {tableDisplay}</span>
              </div>
              <div className="flex justify-between">
                <span>Customer Name:</span>
                <span>{bill.customerName || 'Walk-in'}</span>
              </div>
              {bill.customerPhone && (
                <div className="flex justify-between">
                  <span>Customer Mobile No :</span>
                  <span>{bill.customerPhone}</span>
                </div>
              )}

              <div className="border-t border-dashed border-black my-2" />

              {/* Table Header */}
              <div className="flex justify-between font-bold text-[11px]">
                <span>QTY &nbsp; PRODUCT</span>
                <span>AMOUNT</span>
              </div>

              {/* Items */}
              <div className="my-1.5 space-y-1">
                {bill.items.map((item, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between items-start">
                      <span>{item.quantity} EA &nbsp; {item.name}</span>
                      <span className="font-bold">{item.totalPrice.toFixed(2)}</span>
                    </div>
                    {item.selectedVariant && (
                      <div className="pl-6 text-[10.5px] text-gray-700">
                        • {item.selectedVariant.name}
                      </div>
                    )}
                    {item.addons && item.addons.length > 0 && (
                      <div className="pl-6 text-[10.5px] text-gray-700">
                        {item.addons.map((a) => `• ${a.name}`).join(' ')}
                      </div>
                    )}
                    {item.comboSelections && item.comboSelections.length > 0 && (
                      <div className="pl-6 text-[10.5px] text-gray-700">
                        {item.comboSelections.map((cs) => `• ${cs.selectedOptionName}`).join(' ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-black my-2" />

              {/* Subtotals */}
              <div className="space-y-0.5">
                <div className="flex justify-between">
                  <span>Sub Total</span>
                  <span className="font-bold">{bill.taxDetails.subTotal.toFixed(2)}</span>
                </div>
                {isGst && (
                  <>
                    <div className="flex justify-between">
                      <span>CGST {bill.taxDetails.cgstRate}%</span>
                      <span>{bill.taxDetails.cgstAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>SGST {bill.taxDetails.sgstRate}%</span>
                      <span>{bill.taxDetails.sgstAmount.toFixed(2)}</span>
                    </div>
                  </>
                )}
                {bill.taxDetails.discountAmount > 0 && (
                  <div className="flex justify-between">
                    <span>Discount ({bill.taxDetails.discountPercent.toFixed(1)}%)</span>
                    <span>-{bill.taxDetails.discountAmount.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-dashed border-black my-2" />

              {/* Total Payable */}
              <div className="flex justify-between font-bold text-[13.5px]">
                <span>Total Payable</span>
                <span>{bill.taxDetails.grandTotal.toFixed(2)}</span>
              </div>

              <div className="border-t border-dashed border-black my-2" />

              {/* Payment Details */}
              <div className="space-y-0.5">
                <div className="font-bold">Payment Details:</div>
                <div className="flex justify-between">
                  <span>Mode:</span>
                  <span className="font-bold">{bill.paymentMode}</span>
                </div>
                {bill.amountPaid && bill.amountPaid > 0 && (
                  <div className="flex justify-between">
                    <span>Cash Received:</span>
                    <span>₹{bill.amountPaid.toFixed(2)}</span>
                  </div>
                )}
                {bill.changeReturned && bill.changeReturned > 0 && (
                  <div className="flex justify-between font-bold">
                    <span>Return Change:</span>
                    <span>₹{bill.changeReturned.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-dashed border-black my-2" />

              {/* Tax Registration Details */}
              <div className="space-y-0.5 text-[10.5px]">
                {settings.sac && <div>SAC : {settings.sac}</div>}
                {settings.gstin && <div>GST NO : {settings.gstin}</div>}
                {settings.cin && <div>CIN : {settings.cin}</div>}
                {settings.fssaiNumber && <div>FSSAI : {settings.fssaiNumber}</div>}
              </div>

              <div className="border-t border-dashed border-black my-2" />

              {/* Footer */}
              <div className="text-center font-bold text-[11px] pt-1">
                {settings.termsAndConditions || '*** HAVE A DELICIOUS DAY ***'}
              </div>
            </div>
          ) : (
            /* DATA SUMMARY VIEW */
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 p-3 bg-white rounded-lg border border-[#E0D7D0]">
                <div>
                  <div className="text-[10px] uppercase font-bold text-[#8B7E74]">Customer</div>
                  <div className="font-bold text-[#2D241E] mt-0.5">
                    {bill.customerName || 'Walk-in Customer'}
                  </div>
                  {bill.customerPhone && (
                    <div className="text-[#8B7E74] font-mono">{bill.customerPhone}</div>
                  )}
                </div>

                <div>
                  <div className="text-[10px] uppercase font-bold text-[#8B7E74]">Payment &amp; Status</div>
                  <div className="font-bold text-[#2D241E] mt-0.5">
                    Mode: {bill.paymentMode}
                  </div>
                  <div className="text-emerald-700 font-semibold">Status: {bill.status}</div>
                </div>
              </div>

              {/* Items List */}
              <div>
                <div className="font-bold text-[#2D241E] uppercase tracking-wider text-[11px] mb-2">
                  Ordered Items
                </div>
                <div className="bg-white border border-[#E0D7D0] rounded-lg overflow-hidden divide-y divide-[#E0D7D0]">
                  {bill.items.map((item, idx) => (
                    <div key={idx} className="p-2.5 flex items-center justify-between gap-2">
                      <div>
                        <div className="font-bold text-[#2D241E]">{item.name}</div>
                        <div className="text-[10px] text-[#8B7E74]">
                          {item.quantity}x @ ₹{(item.totalPrice / item.quantity).toFixed(2)}
                          {item.selectedVariant && ` (${item.selectedVariant.name})`}
                        </div>
                      </div>
                      <div className="font-mono font-bold text-[#2D241E]">
                        ₹{item.totalPrice.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="bg-white p-3 rounded-lg border border-[#E0D7D0] space-y-1.5">
                <div className="flex justify-between text-[#8B7E74]">
                  <span>Items Subtotal:</span>
                  <span className="font-mono font-medium text-[#2D241E]">₹{bill.taxDetails.subTotal.toFixed(2)}</span>
                </div>

                {isGst && (
                  <>
                    <div className="flex justify-between text-[#8B7E74]">
                      <span>CGST ({bill.taxDetails.cgstRate}%):</span>
                      <span className="font-mono font-medium text-[#2D241E]">₹{bill.taxDetails.cgstAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[#8B7E74]">
                      <span>SGST ({bill.taxDetails.sgstRate}%):</span>
                      <span className="font-mono font-medium text-[#2D241E]">₹{bill.taxDetails.sgstAmount.toFixed(2)}</span>
                    </div>
                  </>
                )}

                {bill.taxDetails.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Discount ({bill.taxDetails.discountPercent.toFixed(1)}%):</span>
                    <span className="font-mono">-₹{bill.taxDetails.discountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-[#E0D7D0] flex justify-between items-center text-sm font-bold text-[#2D241E]">
                  <span>Grand Total:</span>
                  <span className="text-base font-mono font-bold text-[#4B3621]">
                    ₹{bill.taxDetails.grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#F9F7F5] border-t border-[#E0D7D0] flex items-center justify-between gap-2 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => {
              if (confirm('Are you sure you want to delete this bill record?')) {
                onDeleteBill(bill.id);
                onClose();
              }
            }}
            className="p-2 rounded-lg bg-white border border-[#E0D7D0] hover:bg-rose-50 text-[#8B7E74] hover:text-rose-700 transition-colors cursor-pointer"
            title="Delete this bill"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => openWhatsAppShare(bill.customerPhone || '', bill, settings)}
              className="py-1.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={() => downloadKotPdf(bill, settings)}
              className="py-1.5 px-3 bg-white hover:bg-[#F4F1EE] text-[#2D241E] border border-[#E0D7D0] font-bold rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
              title="Download KOT PDF"
            >
              <ChefHat className="w-3.5 h-3.5 text-[#4B3621]" />
              <span>KOT PDF</span>
            </button>

            <button
              type="button"
              onClick={() => downloadInvoicePdf(bill, settings)}
              className="py-1.5 px-3 bg-[#4B3621] hover:bg-[#3D2C1B] text-white font-bold rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-amber-200" />
              <span>Bill PDF</span>
            </button>

            <button
              type="button"
              onClick={() => printReceipt(bill, settings, 'bill')}
              className="py-1.5 px-3.5 bg-[#4B3621] hover:bg-[#3D2C1B] text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow-xs transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-amber-200" />
              <span>Print</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
