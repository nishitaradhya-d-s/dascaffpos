import React, { useState, useMemo } from 'react';
import { BillRecord, CafeSettings } from '../../types';
import { printReceipt } from '../../utils/printer';
import { exportBillsToCsv } from '../../utils/csvExport';
import { downloadInvoicePdf } from '../../utils/pdfGenerator';
import { EditInvoiceModal } from './EditInvoiceModal';
import { ConfirmDeleteModal } from '../Common/ConfirmDeleteModal';
import { 
  Search, 
  Printer, 
  Download, 
  Eye, 
  Trash2, 
  FileSpreadsheet, 
  FileText,
  Layers,
  ChefHat,
  Receipt,
  Edit3,
  Calendar
} from 'lucide-react';

interface BillHistoryProps {
  bills: BillRecord[];
  settings: CafeSettings;
  onViewBill: (bill: BillRecord) => void;
  onDeleteBill: (billId: string) => void;
  onUpdateBill?: (updatedBill: BillRecord) => void;
}

export const BillHistory: React.FC<BillHistoryProps> = ({
  bills,
  settings,
  onViewBill,
  onDeleteBill,
  onUpdateBill,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | '7days' | 'month' | 'all' | 'custom'>('today');
  const [customDate, setCustomDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [orderTypeFilter, setOrderTypeFilter] = useState<string>('all');
  const [billToEdit, setBillToEdit] = useState<BillRecord | null>(null);
  const [billToDelete, setBillToDelete] = useState<BillRecord | null>(null);

  // Filter bills
  const filteredBills = useMemo(() => {
    const now = new Date();
    const todayYear = now.getFullYear();
    const todayMonth = now.getMonth();
    const todayDate = now.getDate();

    const yestDate = new Date(now);
    yestDate.setDate(now.getDate() - 1);

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);

    return bills.filter((bill) => {
      const bDate = new Date(bill.date);
      const isDateValid = !isNaN(bDate.getTime());
      if (!isDateValid) return true;

      // Date Filter
      if (dateFilter === 'today') {
        const isToday =
          bDate.getFullYear() === todayYear &&
          bDate.getMonth() === todayMonth &&
          bDate.getDate() === todayDate;
        if (!isToday) return false;
      } else if (dateFilter === 'yesterday') {
        const isYesterday =
          bDate.getFullYear() === yestDate.getFullYear() &&
          bDate.getMonth() === yestDate.getMonth() &&
          bDate.getDate() === yestDate.getDate();
        if (!isYesterday) return false;
      } else if (dateFilter === '7days') {
        if (bDate < sevenDaysAgo) return false;
      } else if (dateFilter === 'month') {
        if (bDate < firstOfMonth) return false;
      } else if (dateFilter === 'custom') {
        if (bill.date.slice(0, 10) !== customDate) return false;
      }

      // Order Type Filter
      if (orderTypeFilter !== 'all' && bill.orderType !== orderTypeFilter) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNo = bill.billNumber.toLowerCase().includes(q);
        const matchKot = bill.kotNumber.toLowerCase().includes(q);
        const matchCust = bill.customerName?.toLowerCase().includes(q);
        const matchPhone = bill.customerPhone?.includes(q);
        const matchTable = bill.tableNumber?.toLowerCase().includes(q);
        const matchItem = bill.items.some((i) => i.name.toLowerCase().includes(q));
        if (!matchNo && !matchKot && !matchCust && !matchPhone && !matchTable && !matchItem) {
          return false;
        }
      }

      return true;
    });
  }, [bills, dateFilter, orderTypeFilter, searchQuery]);

  // Metrics
  const { totalInvoices, taxableBase, gstCollected, grossRevenue } = useMemo(() => {
    let base = 0;
    let gst = 0;
    let gross = 0;

    filteredBills.forEach((b) => {
      if (b.status !== 'Cancelled') {
        base += b.taxDetails.taxableValue;
        gst += b.taxDetails.totalTax;
        gross += b.taxDetails.grandTotal;
      }
    });

    return {
      totalInvoices: filteredBills.length,
      taxableBase: base,
      gstCollected: gst,
      grossRevenue: gross,
    };
  }, [filteredBills]);

  return (
    <div className="h-full flex-1 flex flex-col bg-[#F4F1EE] overflow-hidden select-none">
      {/* Top Header */}
      <div className="p-4 bg-white border-b border-[#E0D7D0] space-y-3 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-base sm:text-lg font-bold text-[#2D241E] flex items-center gap-2">
              <span>Invoices &amp; Sales Register</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#F4F1EE] text-[#4B3621] font-bold border border-[#E0D7D0]">
                [{bills.length} Invoices]
              </span>
            </h1>
            <p className="text-xs text-[#8B7E74] font-medium">
              Search, filter, view item breakdowns, reprint thermal bills / KOTs, or export to CSV / PDF.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => exportBillsToCsv(filteredBills, 'dascaff_sales_register')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#4B3621] hover:bg-[#3D2C1B] active:bg-[#2D241E] text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (filteredBills.length > 0) {
                  downloadInvoicePdf(filteredBills[0], settings);
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#F4F1EE] border border-[#E0D7D0] text-[#4B3621] rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>GST Report (PDF)</span>
            </button>
          </div>
        </div>

        {/* 4 Metric Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          <div className="bg-[#F9F7F5] border border-[#E0D7D0] rounded-xl p-2.5">
            <div className="text-[10px] uppercase font-bold text-[#8B7E74]">TOTAL INVOICES</div>
            <div className="text-lg font-bold text-[#2D241E] font-mono mt-0.5">
              {totalInvoices}
            </div>
          </div>

          <div className="bg-[#F9F7F5] border border-[#E0D7D0] rounded-xl p-2.5">
            <div className="text-[10px] uppercase font-bold text-[#8B7E74]">TAXABLE SALES (BASE)</div>
            <div className="text-lg font-bold text-[#2D241E] font-mono mt-0.5">
              ₹{taxableBase.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div className="bg-[#F9F7F5] border border-[#E0D7D0] rounded-xl p-2.5">
            <div className="text-[10px] uppercase font-bold text-[#8B7E74]">GST COLLECTED</div>
            <div className="text-lg font-bold text-[#4B3621] font-mono mt-0.5">
              ₹{gstCollected.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div className="bg-[#4B3621] text-white border border-[#3D2C1B] rounded-xl p-2.5">
            <div className="text-[10px] uppercase font-bold text-amber-200/90">GROSS TOTAL REVENUE</div>
            <div className="text-lg font-bold text-white font-mono mt-0.5">
              ₹{grossRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* Search and Filters Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
          <div className="relative flex-1 w-full">
            <Search className="w-3.5 h-3.5 text-[#8B7E74] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Bill #, Customer, Phone, Item..."
              className="w-full bg-white border border-[#E0D7D0] rounded-lg py-1.5 pl-8 pr-3 text-xs text-[#2D241E] placeholder:text-[#8B7E74] focus:outline-hidden focus:border-[#4B3621]"
            />
          </div>

          {/* Date Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 shrink-0">
            {[
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: '7days', label: '7 Days' },
              { id: 'month', label: 'This Month' },
              { id: 'custom', label: '📅 Pick Date' },
              { id: 'all', label: 'All' },
            ].map((d) => {
              const isActive = dateFilter === d.id;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDateFilter(d.id as any)}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#4B3621] text-white shadow-2xs'
                      : 'bg-white border border-[#E0D7D0] text-[#8B7E74] hover:text-[#2D241E]'
                  }`}
                >
                  {d.label}
                </button>
              );
            })}
          </div>

          {dateFilter === 'custom' && (
            <input
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="bg-white border border-[#E0D7D0] rounded-lg px-2.5 py-1 text-xs font-bold font-mono text-[#2D241E] focus:outline-hidden focus:border-[#4B3621]"
            />
          )}

          {/* Order Type Dropdown */}
          <select
            value={orderTypeFilter}
            onChange={(e) => setOrderTypeFilter(e.target.value)}
            className="bg-white border border-[#E0D7D0] rounded-lg px-2.5 py-1.5 text-xs font-bold text-[#2D241E] focus:outline-hidden focus:border-[#4B3621] shrink-0"
          >
            <option value="all">All Order Types</option>
            <option value="Dine-In">Dine-In</option>
            <option value="Takeaway">Takeaway</option>
            <option value="Delivery">Delivery</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="flex-1 overflow-auto p-3 sm:p-4">
        {filteredBills.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-[#8B7E74] bg-white rounded-xl border border-[#E0D7D0]">
            <FileText className="w-10 h-10 text-[#8B7E74] mb-2" />
            <p className="text-sm font-bold text-[#2D241E]">No invoices match current filter</p>
            <p className="text-xs text-[#8B7E74] mt-1">Try switching date range or clearing search query.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-[#E0D7D0] overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F4F1EE] border-b border-[#E0D7D0] text-[10px] uppercase font-bold text-[#8B7E74] tracking-wider">
                  <th className="py-2.5 px-3">Date &amp; Time</th>
                  <th className="py-2.5 px-3">Invoice # / Check #</th>
                  <th className="py-2.5 px-3">Type &amp; Table</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Items Ordered</th>
                  <th className="py-2.5 px-3 text-right">Taxable</th>
                  <th className="py-2.5 px-3 text-right">GST</th>
                  <th className="py-2.5 px-3 text-right">Total Payable</th>
                  <th className="py-2.5 px-3 text-center">Payment</th>
                  <th className="py-2.5 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E0D7D0]/60">
                {filteredBills.map((bill) => {
                  const dateObj = new Date(bill.date);
                  const timeFormatted = dateObj.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true,
                  });
                  const dateFormatted = dateObj.toLocaleDateString('en-GB');

                  return (
                    <tr key={bill.id} className="hover:bg-[#F9F7F5] transition-colors">
                      <td className="py-2.5 px-3 whitespace-nowrap text-[#2D241E] font-medium">
                        <div>{dateFormatted}</div>
                        <div className="text-[10px] text-[#8B7E74] font-mono">{timeFormatted}</div>
                      </td>

                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="font-bold text-[#2D241E] font-mono">{bill.billNumber}</div>
                        <div className="text-[10px] text-[#8B7E74] font-mono">
                          CHECK NO: {bill.billNumber.replace('INV-', '')}
                        </div>
                      </td>

                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="font-bold text-[#2D241E]">{bill.orderType}</span>
                        {bill.tableNumber && (
                          <span className="text-[11px] text-[#8B7E74] font-mono ml-1">
                            ({bill.tableNumber})
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 whitespace-nowrap text-[#2D241E]">
                        {bill.customerName || 'Walk-in'}
                        {bill.customerPhone && (
                          <div className="text-[10px] text-[#8B7E74] font-mono">{bill.customerPhone}</div>
                        )}
                      </td>

                      <td className="py-2.5 px-3 max-w-xs">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#F4F1EE] text-[#4B3621] border border-[#E0D7D0] shrink-0">
                            {bill.items.reduce((s, i) => s + i.quantity, 0)} items
                          </span>
                          <span 
                            className="text-xs text-[#2D241E] font-medium truncate max-w-[220px]" 
                            title={bill.items.map((i) => `${i.name} (${i.quantity})`).join(', ')}
                          >
                            {bill.items.map((it) => `${it.name} x${it.quantity}`).join(', ')}
                          </span>
                        </div>
                      </td>

                      <td className="py-2.5 px-3 text-right font-mono font-medium text-[#2D241E] whitespace-nowrap">
                        ₹{bill.taxDetails.taxableValue.toFixed(2)}
                      </td>

                      <td className="py-2.5 px-3 text-right font-mono text-[#8B7E74] whitespace-nowrap">
                        {bill.taxDetails.gstRate}% (₹{bill.taxDetails.totalTax.toFixed(2)})
                      </td>

                      <td className="py-2.5 px-3 text-right font-mono font-bold text-[#4B3621] whitespace-nowrap">
                        ₹{bill.taxDetails.grandTotal.toFixed(2)}
                      </td>

                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                          bill.paymentMode === 'UPI'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : bill.paymentMode === 'Cash'
                            ? 'bg-[#F4F1EE] text-[#4B3621] border-[#E0D7D0]'
                            : 'bg-purple-50 text-purple-800 border-purple-200'
                        }`}>
                          {bill.paymentMode}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => onViewBill(bill)}
                            className="p-1.5 rounded-md bg-[#F4F1EE] hover:bg-[#E0D7D0] text-[#2D241E] transition-colors cursor-pointer"
                            title="View Invoice"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setBillToEdit(bill)}
                            className="p-1.5 rounded-md bg-[#F4F1EE] hover:bg-[#4B3621] text-[#4B3621] hover:text-white transition-colors cursor-pointer"
                            title="Edit Invoice"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => printReceipt(bill, settings, 'bill')}
                            className="p-1.5 rounded-md bg-[#F4F1EE] hover:bg-[#4B3621] text-[#2D241E] hover:text-white transition-colors cursor-pointer"
                            title="Reprint Bill"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => printReceipt(bill, settings, 'kot')}
                            className="p-1.5 rounded-md bg-[#F4F1EE] hover:bg-[#E0D7D0] text-[#2D241E] transition-colors cursor-pointer"
                            title="Reprint KOT"
                          >
                            <ChefHat className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => printReceipt(bill, settings, 'both')}
                            className="p-1.5 rounded-md bg-[#F4F1EE] hover:bg-[#4B3621] text-[#2D241E] hover:text-white transition-colors cursor-pointer"
                            title="Print Both"
                          >
                            <Layers className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setBillToDelete(bill)}
                            className="p-1.5 rounded-md bg-[#F4F1EE] hover:bg-rose-100 text-[#8B7E74] hover:text-rose-700 transition-colors cursor-pointer"
                            title="Delete Bill"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Invoice Modal */}
      {billToEdit && (
        <EditInvoiceModal
          bill={billToEdit}
          settings={settings}
          isOpen={Boolean(billToEdit)}
          onClose={() => setBillToEdit(null)}
          onSave={(updated) => {
            if (onUpdateBill) onUpdateBill(updated);
            setBillToEdit(null);
          }}
        />
      )}

      {/* Confirm Delete Modal */}
      {billToDelete && (
        <ConfirmDeleteModal
          isOpen={Boolean(billToDelete)}
          title="Delete Invoice"
          message="Are you sure you want to permanently delete this sales invoice?"
          itemIdentifier={`Invoice #${billToDelete.billNumber} (${billToDelete.customerName} - ₹${billToDelete.taxDetails.grandTotal.toFixed(2)})`}
          onConfirm={() => {
            onDeleteBill(billToDelete.id);
            setBillToDelete(null);
          }}
          onCancel={() => setBillToDelete(null)}
        />
      )}
    </div>
  );
};
