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
      <div className="w-full max-w-sm bg-white text-black rounded-lg p-5 sm:p-6 shadow-xl border border-[#E0D7D0] font-mono animate-in fade-in zoom-in duration-200">
        {/* Cafe Header */}
        <div className="text-center space-y-0.5">
          <h1 className="text-lg font-bold uppercase tracking-wider">
            {settings.cafeName}
          </h1>
          <div className="text-xs font-bold uppercase tracking-wide">
            TAX INVOICE
          </div>
          <div className="text-[11px] uppercase">
            ORIGINAL
          </div>

          <div className="text-[11.5px] pt-1 leading-snug">
            {settings.address}<br />
            {settings.cityStateZip}<br />
            <span>Caff Phone No : {settings.phone}</span>
          </div>

          <div className="pt-1.5 space-y-0.5">
            <div className="text-xs font-bold">
              Invoice No : {bill.billNumber}
            </div>
            <div className="text-xs font-bold uppercase">
              {bill.orderType}
            </div>
            <div className="text-[11px]">
              {fullFormatted}
            </div>
          </div>
        </div>

        {/* Dashed Separator */}
        <div className="border-t border-dashed border-black my-3" />

        {/* Customer & Check Metadata */}
        <div className="space-y-0.5 text-xs">
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
        </div>

        <div className="border-t border-dashed border-black my-3" />

        {/* Items Table Header */}
        <div className="flex justify-between text-xs font-bold uppercase mb-1.5">
          <span>QTY &nbsp; PRODUCT</span>
          <span>AMOUNT</span>
        </div>

        {/* Items List */}
        <div className="space-y-1 text-xs">
          {bill.items.map((item, idx) => (
            <div key={idx} className="space-y-0.5">
              <div className="flex justify-between items-baseline">
                <span>
                  <span>{item.quantity} EA</span> &nbsp;
                  <span>{item.name}</span>
                </span>
                <span className="font-bold">
                  {item.totalPrice.toFixed(2)}
                </span>
              </div>

              {item.selectedVariant && (
                <div className="text-[11px] pl-6">
                  • {item.selectedVariant.name}
                </div>
              )}

              {item.addons && item.addons.length > 0 && (
                <div className="text-[11px] pl-6">
                  {item.addons.map((a) => `• ${a.name}`).join(' ')}
                </div>
              )}

              {item.comboSelections && item.comboSelections.length > 0 && (
                <div className="text-[11px] pl-6">
                  {item.comboSelections.map((cs) => `• ${cs.selectedName}`).join(' ')}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="border-t border-dashed border-black my-3" />

        {/* Subtotal & Taxes */}
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span>Sub Total</span>
            <span className="font-bold">
              {bill.taxDetails.subTotal.toFixed(2)}
            </span>
          </div>

          {isGst && (
            <>
              <div className="flex justify-between">
                <span>CGST {bill.taxDetails.cgstRate}%</span>
                <span>
                  {bill.taxDetails.cgstAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>SGST {bill.taxDetails.sgstRate}%</span>
                <span>
                  {bill.taxDetails.sgstAmount.toFixed(2)}
                </span>
              </div>
            </>
          )}

          {bill.taxDetails.discountAmount > 0 && (
            <div className="flex justify-between">
              <span>Discount ({bill.taxDetails.discountPercent.toFixed(1)}%)</span>
              <span>
                -{bill.taxDetails.discountAmount.toFixed(2)}
              </span>
            </div>
          )}
        </div>

        <div className="border-t border-dashed border-black my-3" />

        {/* Total Payable */}
        <div className="flex justify-between items-baseline text-sm font-bold">
          <span>Total Payable</span>
          <span className="text-base font-bold">
            {bill.taxDetails.grandTotal.toFixed(2)}
          </span>
        </div>

        <div className="border-t border-dashed border-black my-3" />

        {/* Payment Details */}
        <div className="text-xs space-y-0.5">
          <div className="font-bold">Payment Details:</div>
          <div className="flex justify-between">
            <span>Mode:</span>
            <span className="font-bold">{bill.paymentMode}</span>
          </div>
        </div>

        <div className="border-t border-dashed border-black my-3" />

        {/* Tax Info */}
        <div className="text-[11px] space-y-0.5">
          {settings.sac && <div>SAC : {settings.sac}</div>}
          {settings.gstin && <div>GST NO : {settings.gstin}</div>}
          {settings.cin && <div>CIN : {settings.cin}</div>}
          {settings.fssaiNumber && <div>FSSAI : {settings.fssaiNumber}</div>}
        </div>

        <div className="border-t border-dashed border-black my-3" />

        <div className="text-center text-xs font-bold tracking-wider">
          {settings.termsAndConditions || '*** HAVE A DELICIOUS DAY ***'}
        </div>
      </div>

      <div className="mt-4 text-xs text-[#8B7E74] text-center">
        Powered by {settings.cafeName} POS System
      </div>
    </div>
  );
};
