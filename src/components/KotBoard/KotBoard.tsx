import React, { useState } from 'react';
import { BillRecord, OrderStatus, CafeSettings } from '../../types';
import { printReceipt } from '../../utils/printer';
import { downloadKotPdf } from '../../utils/pdfGenerator';
import { 
  ChefHat, 
  Clock, 
  Printer, 
  Download, 
  CheckCircle2, 
  Layers, 
  AlertCircle, 
  Timer, 
  Utensils, 
  Flame,
  Check,
  User,
  Phone
} from 'lucide-react';

interface KotBoardProps {
  bills: BillRecord[];
  settings: CafeSettings;
  onUpdateStatus: (billId: string, status: OrderStatus) => void;
}

export const KotBoard: React.FC<KotBoardProps> = ({
  bills,
  settings,
  onUpdateStatus,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('active');

  // Filter bills for KOT board
  const kotOrders = bills.filter((b) => {
    if (b.status === 'Cancelled') return false;
    if (filterStatus === 'active') {
      return b.status === 'Preparing' || b.status === 'Ready';
    }
    if (filterStatus === 'all') return true;
    return b.status === filterStatus;
  });

  const preparingCount = bills.filter((b) => b.status === 'Preparing').length;
  const readyCount = bills.filter((b) => b.status === 'Ready').length;
  const servedCount = bills.filter((b) => b.status === 'Served' || b.status === 'Completed').length;

  return (
    <div className="h-full flex-1 flex flex-col bg-[#F4F1EE] overflow-hidden select-none">
      {/* Top Header Bar */}
      <div className="p-4 bg-white border-b border-[#E0D7D0] space-y-3 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#4B3621] text-amber-200 flex items-center justify-center font-bold shadow-xs">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-[#2D241E] leading-tight">
                Kitchen Display System (KOT Board)
              </h1>
              <p className="text-xs text-[#8B7E74] font-medium">
                Live food preparation queue, recipe customizations, timers, and instant 80mm KOT thermal reprint.
              </p>
            </div>
          </div>

          {/* Quick Status Counters */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F4F1EE] text-[#4B3621] border border-[#E0D7D0] text-xs font-bold">
              <Flame className="w-3.5 h-3.5 text-[#4B3621] animate-pulse" />
              <span>{preparingCount} Preparing</span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{readyCount} Ready to Serve</span>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {[
            { id: 'active', label: `Active Queue (${preparingCount + readyCount})` },
            { id: 'Preparing', label: `Preparing (${preparingCount})` },
            { id: 'Ready', label: `Ready (${readyCount})` },
            { id: 'Served', label: `Completed / Served (${servedCount})` },
            { id: 'all', label: `All Orders (${bills.length})` },
          ].map((tab) => {
            const isSelected = filterStatus === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterStatus(tab.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#4B3621] text-white shadow-xs'
                    : 'bg-white border border-[#E0D7D0] text-[#8B7E74] hover:text-[#2D241E]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main KOT Cards Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {kotOrders.length === 0 ? (
          <div className="h-72 flex flex-col items-center justify-center text-center p-6 text-[#8B7E74] bg-white rounded-xl border border-[#E0D7D0]">
            <CheckCircle2 className="w-12 h-12 text-[#4B3621] mb-2" />
            <p className="text-base font-bold text-[#2D241E]">Kitchen Queue is Clean!</p>
            <p className="text-xs text-[#8B7E74] mt-1 max-w-sm">
              All kitchen orders have been prepared and served to guests. New POS bills will automatically appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {kotOrders.map((bill) => {
              const orderTime = new Date(bill.date);
              const minutesAgo = Math.max(0, Math.floor((Date.now() - orderTime.getTime()) / 60000));
              const isPreparing = bill.status === 'Preparing';
              const isReady = bill.status === 'Ready';

              return (
                <div
                  key={bill.id}
                  className={`bg-white rounded-xl border flex flex-col justify-between overflow-hidden transition-all shadow-xs ${
                    isPreparing
                      ? 'border-[#4B3621]/60 ring-1 ring-[#4B3621]/20'
                      : isReady
                      ? 'border-emerald-600/60 ring-1 ring-emerald-600/20'
                      : 'border-[#E0D7D0]'
                  }`}
                >
                  {/* Card Header */}
                  <div
                    className={`p-3 flex items-center justify-between text-white ${
                      isPreparing
                        ? 'bg-[#4B3621]'
                        : isReady
                        ? 'bg-emerald-800'
                        : 'bg-[#2D241E]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold font-mono text-amber-200">
                          KOT #{bill.kotNumber}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/10 uppercase tracking-wider text-white">
                          {bill.orderType} {bill.tableNumber ? `(${bill.tableNumber})` : ''}
                        </span>
                      </div>
                      <div className="text-[12px] font-bold text-white flex items-center gap-1 mt-0.5">
                        <User className="w-3.5 h-3.5 text-amber-200" />
                        <span>{bill.customerName || 'Walk-in'}</span>
                        {bill.customerPhone && (
                          <span className="text-[11px] text-amber-100/70 font-mono font-normal">
                            ({bill.customerPhone})
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-amber-100/60 font-mono">
                        Bill: {bill.billNumber}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-xs font-bold text-amber-200 bg-black/25 px-2.5 py-1 rounded-md">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{minutesAgo}m ago</span>
                    </div>
                  </div>

                  {/* Customer / Prep Instruction Banner */}
                  {bill.notes && (
                    <div className="p-2.5 bg-[#F4F1EE] border-b border-[#E0D7D0] text-xs text-[#4B3621] font-medium flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-[#4B3621] shrink-0" />
                      <span><strong>Chef Note:</strong> {bill.notes}</span>
                    </div>
                  )}

                  {/* Items List */}
                  <div className="p-3.5 space-y-2.5 flex-1 overflow-y-auto max-h-72">
                    {bill.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-lg bg-[#F9F7F5] border border-[#E0D7D0] space-y-1"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-bold text-[#2D241E]">
                            {item.name}
                          </span>
                          <span className="w-6 h-6 rounded-md bg-[#4B3621] text-amber-200 flex items-center justify-center font-bold text-xs shrink-0">
                            {item.quantity}
                          </span>
                        </div>

                        {item.selectedVariant && (
                          <div className="text-xs font-bold text-[#4B3621] pl-1">
                            Portion: {item.selectedVariant.name}
                          </div>
                        )}

                        {item.addons && item.addons.length > 0 && (
                          <div className="text-xs text-[#8B7E74] pl-1">
                            Add-ons: <span className="font-semibold text-[#2D241E]">{item.addons.map((a) => a.name).join(', ')}</span>
                          </div>
                        )}

                        {item.notes && (
                          <div className="text-[11px] text-rose-700 italic pl-1 font-medium">
                            * {item.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Card Footer: Action Controls & Thermal Reprint */}
                  <div className="p-2.5 bg-[#F4F1EE] border-t border-[#E0D7D0] flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => printReceipt(bill, settings, 'kot')}
                        className="p-1.5 rounded-md bg-white hover:bg-[#E0D7D0] text-[#2D241E] border border-[#E0D7D0] transition-colors cursor-pointer"
                        title="Reprint 80mm KOT Slip"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadKotPdf(bill, settings)}
                        className="p-1.5 rounded-md bg-white hover:bg-[#E0D7D0] text-[#2D241E] border border-[#E0D7D0] transition-colors cursor-pointer"
                        title="Download KOT PDF"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 flex-1 justify-end">
                      {isPreparing && (
                        <button
                          type="button"
                          onClick={() => onUpdateStatus(bill.id, 'Ready')}
                          className="py-1.5 px-3 bg-[#4B3621] hover:bg-[#3D2C1B] active:bg-[#2D241E] text-white rounded-md text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Mark Ready</span>
                        </button>
                      )}

                      {isReady && (
                        <button
                          type="button"
                          onClick={() => onUpdateStatus(bill.id, 'Served')}
                          className="py-1.5 px-3 bg-[#2D241E] hover:bg-[#1E1713] text-amber-200 rounded-md text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Mark Served</span>
                        </button>
                      )}

                      {(bill.status === 'Served' || bill.status === 'Completed') && (
                        <span className="text-xs font-bold text-emerald-800 px-2.5 py-1 bg-emerald-50 rounded-md border border-emerald-200">
                          ✓ Served
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
