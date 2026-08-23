import React from 'react';
import { BillRecord, CafeSettings } from '../../types';
import { downloadInvoicePdf } from '../../utils/pdfGenerator';
import { printReceipt, formatBillDate } from '../../utils/printer';
import { 
  Download, 
  Printer, 
  CheckCircle2, 
  Building2, 
  ArrowLeft,
  Receipt,
  Phone,
  MapPin,
  ShieldCheck
} from 'lucide-react';

interface PublicBillViewProps {
  bill: BillRecord;
  settings: CafeSettings;
  onBackToApp?: () => void;
}

export const PublicBillView: React.FC<PublicBillViewProps> = ({
  bill,
  settings,
  onBackToApp,
}) => {
  const { fullFormatted } = formatBillDate(bill.date);
  const isGst = bill.billType === 'GST_Customer';
  const checkNo = bill.checkNumber || bill.billNumber.replace(/[^0-9]/g, '') || '004';
  const tableDisplay = bill.tableNumber ? bill.tableNumber.replace(/[^0-9]/g, '') || bill.tableNumber : '1';

  return (
    <div className="min-h-screen w-screen bg-[#F4F1EE] text-[#2D241E] flex flex-col items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Top Bar for Customer */}
      <div className="w-full max-w-md flex items-center justify-between mb-4">
        {onBackToApp && (
          <button
            type="button"
            onClick={onBackToApp}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#F4F1EE] text-[#2D241E] border border-[#E0D7D0] rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Open POS Terminal</span>
          </button>
        )}

        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            onClick={() => downloadInvoicePdf(bill, settings)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#4B3621] hover:bg-[#3D2C1B] text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Invoice PDF</span>
          </button>
          <button
            type="button"
            onClick={() => printReceipt(bill, settings, 'bill')}
            className="p-1.5 bg-white hover:bg-[#F4F1EE] text-[#2D241E] border border-[#E0D7D0] rounded-lg transition-colors cursor-pointer shadow-2xs"
            title="Print Receipt"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Official Bill Card Matching Paper Invoice */}
      <div className="w-full max-w-md bg-white text-[#2D241E] rounded-xl p-6 sm:p-7 shadow-xl border border-[#E0D7D0] animate-in fade-in zoom-in duration-200">
        {/* Cafe Header */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-xl bg-[#4B3621] text-amber-200 flex items-center justify-center font-bold text-lg mx-auto shadow-xs font-cinzel">
            DC
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#2D241E] tracking-wider uppercase font-cinzel">
            {settings.cafeName}
          </h1>
          <div className="text-xs font-bold uppercase text-[#2D241E] tracking-widest">
            TAX INVOICE
          </div>
          <div className="text-[11px] font-semibold text-[#8B7E74] uppercase tracking-wider">
            ORIGINAL
          </div>

          <div className="text-xs text-[#8B7E74] pt-1 leading-relaxed">
            {settings.address}<br />
            {settings.cityStateZip}<br />
            <span className="font-semibold text-[#2D241E]">Caff Phone No :</span> <span className="font-mono">{settings.phone}</span>
          </div>

          <div className="pt-2">
            <div className="text-sm font-bold text-[#2D241E] font-mono">
              Invoice No : {bill.billNumber}
            </div>
            <div className="text-xs font-bold text-[#4B3621] uppercase tracking-wider">
              {bill.orderType}
            </div>
            <div className="text-[11px] text-[#8B7E74] font-medium">
              {fullFormatted}
            </div>
          </div>
        </div>

        {/* Dashed Separator */}
        <div className="border-t border-dashed border-[#E0D7D0] my-4" />

        {/* Customer & Check Metadata */}
        <div className="space-y-1 text-xs text-[#2D241E] font-medium">
          <div className="flex justify-between">
            <span>CHECK NO : <strong className="font-mono text-[#2D241E]">{checkNo}</strong></span>
            <span>Table No: <strong className="font-mono text-[#2D241E]">{tableDisplay}</strong></span>
          </div>
          <div className="flex justify-between">
            <span>Customer Name:</span>
            <strong className="text-[#2D241E]">{bill.customerName || 'Walk-in'}</strong>
          </div>
          <div className="flex justify-between">
            <span>Customer Mobile No :</span>
            <span className="font-mono text-[#2D241E]">{bill.customerPhone || '******46252'}</span>
          </div>
        </div>

        <div className="border-t border-dashed border-[#E0D7D0] my-4" />

        {/* Items Table Header */}
        <div className="flex justify-between text-xs font-bold text-[#2D241E] uppercase mb-2">
          <span>QTY &nbsp; PRODUCT</span>
          <span>AMOUNT</span>
        </div>

        {/* Items List */}
        <div className="space-y-2 text-xs">
          {bill.items.map((item, idx) => (
            <div key={idx} className="space-y-0.5">
              <div className="flex justify-between items-baseline">
                <span className="font-medium text-[#2D241E]">
                  <span className="font-mono">{item.quantity} EA</span> &nbsp;
                  <span className="font-bold">{item.name}</span>
                </span>
                <span className="font-mono font-bold text-[#2D241E]">
                  {item.totalPrice.toFixed(2)}
                </span>
              </div>

              {item.selectedVariant && (
                <div className="text-[11px] text-[#8B7E74] pl-8 font-medium">
                  - {item.selectedVariant.name}
                </div>
              )}

              {item.addons && item.addons.length > 0 && (
                <div className="text-[11px] text-[#8B7E74] pl-8 font-medium">
                  {item.addons.map((a) => `+ ${a.name}`).join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="border-t border-dashed border-[#E0D7D0] my-4" />

        {/* Subtotal & Taxes */}
        <div className="space-y-1.5 text-xs text-[#2D241E]">
          <div className="flex justify-between">
            <span>Sub Total</span>
            <span className="font-mono font-bold text-[#2D241E]">
              {bill.taxDetails.subTotal.toFixed(2)}
            </span>
          </div>

          {isGst && (
            <>
              <div className="flex justify-between">
                <span>CGST {bill.taxDetails.cgstRate}%</span>
                <span className="font-mono text-[#2D241E]">
                  {bill.taxDetails.cgstAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>SGST {bill.taxDetails.sgstRate}%</span>
                <span className="font-mono text-[#2D241E]">
                  {bill.taxDetails.sgstAmount.toFixed(2)}
                </span>
              </div>
            </>
          )}

          {bill.taxDetails.discountAmount > 0 && (
            <div className="flex justify-between text-emerald-700 font-semibold">
              <span>Discount ({bill.taxDetails.discountPercent.toFixed(1)}%)</span>
              <span className="font-mono">
                -{bill.taxDetails.discountAmount.toFixed(2)}
              </span>
            </div>
          )}
        </div>

        <div className="border-t border-dashed border-[#E0D7D0] my-4" />

        {/* Total Payable */}
        <div className="flex justify-between items-baseline text-base font-bold text-[#2D241E]">
          <span>Total Payable</span>
          <span className="text-xl font-mono font-bold text-[#4B3621]">
            ₹{bill.taxDetails.grandTotal.toFixed(2)}
          </span>
        </div>

        <div className="border-t border-dashed border-[#E0D7D0] my-4" />

        {/* Payment Details */}
        <div className="text-xs space-y-1">
          <div className="font-bold text-[#2D241E]">Payment Details:</div>
          <div className="flex justify-between text-[#8B7E74]">
            <span>{bill.paymentMode}</span>
            <span className="font-mono font-bold text-[#2D241E]">
              {bill.taxDetails.grandTotal.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="border-t border-dashed border-[#E0D7D0] my-4" />

        {/* Tax Info */}
        <div className="text-[11px] text-[#8B7E74] space-y-0.5 font-mono">
          {settings.sac && <div>SAC : {settings.sac}</div>}
          {settings.gstin && <div>GST NO : {settings.gstin}</div>}
          {settings.cin && <div>CIN : {settings.cin}</div>}
          {settings.fssaiNumber && <div>FSSAI : {settings.fssaiNumber}</div>}
        </div>

        <div className="border-t border-dashed border-[#E0D7D0] my-4" />

        <div className="text-center text-xs font-bold text-[#2D241E] tracking-wider">
          {settings.termsAndConditions || '*** HAVE A DELICIOUS DAY ***'}
        </div>
      </div>

      <div className="mt-4 text-xs text-[#8B7E74] text-center">
        Powered by {settings.cafeName} POS System
      </div>
    </div>
  );
};
