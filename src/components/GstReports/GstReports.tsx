import React, { useState, useMemo } from 'react';
import { BillRecord, CafeSettings } from '../../types';
import { exportBillsToCsv } from '../../utils/csvExport';
import { exportGstReportPdf, downloadInvoicePdf } from '../../utils/pdfGenerator';
import { printReceipt } from '../../utils/printer';
import { BillDetailModal } from '../BillHistory/BillDetailModal';
import { EditInvoiceModal } from './EditInvoiceModal';
import { DayClosingReportModal } from './DayClosingReportModal';
import { ConfirmDeleteModal } from '../Common/ConfirmDeleteModal';
import { 
  FileSpreadsheet, 
  Download, 
  Calendar, 
  TrendingUp, 
  FileText, 
  PieChart, 
  Receipt, 
  CheckCircle2, 
  Trash2,
  Eye,
  Printer,
  Search,
  Edit3,
  Moon,
  Clock,
  Send,
  Sparkles,
  Share2,
  DollarSign,
  SunMedium
} from 'lucide-react';

interface GstReportsProps {
  bills: BillRecord[];
  settings: CafeSettings;
  onDeleteBill?: (billId: string) => void;
  onUpdateBill?: (updatedBill: BillRecord) => void;
}

type PeriodFilterType = 
  | 'today' 
  | 'yesterday' 
  | 'this_month' 
  | 'last_month' 
  | 'financial_year' 
  | 'specific_date' 
  | 'specific_month' 
  | 'custom_range' 
  | 'all';

export const GstReports: React.FC<GstReportsProps> = ({ 
  bills, 
  settings, 
  onDeleteBill,
  onUpdateBill 
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilterType>('today');
  
  // Specific Date & Month states
  const todayIso = new Date().toISOString().slice(0, 10);
  const currentMonthIso = new Date().toISOString().slice(0, 7);
  
  const [specificDate, setSpecificDate] = useState<string>(todayIso);
  const [specificMonth, setSpecificMonth] = useState<string>(currentMonthIso);
  const [fromDate, setFromDate] = useState<string>(todayIso);
  const [toDate, setToDate] = useState<string>(todayIso);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBillForDetail, setSelectedBillForDetail] = useState<BillRecord | null>(null);
  const [billToEdit, setBillToEdit] = useState<BillRecord | null>(null);
  const [billToDelete, setBillToDelete] = useState<BillRecord | null>(null);
  const [isDayClosingModalOpen, setIsDayClosingModalOpen] = useState(false);

  // Today's specific bills for live revenue & day-closing
  const todayBills = useMemo(() => {
    const now = new Date();
    const cYear = now.getFullYear();
    const cMonth = now.getMonth();
    const cDate = now.getDate();

    return bills.filter((b) => {
      if (b.status === 'Cancelled') return false;
      const bd = new Date(b.date);
      return (
        bd.getDate() === cDate &&
        bd.getMonth() === cMonth &&
        bd.getFullYear() === cYear
      );
    });
  }, [bills]);

  // Today's total revenue quick metrics
  const todayRevenue = useMemo(() => {
    const gross = todayBills.reduce((s, b) => s + (b.taxDetails.grandTotal || 0), 0);
    const taxable = todayBills.reduce((s, b) => s + (b.taxDetails.taxableValue || 0), 0);
    const cgst = todayBills.reduce((s, b) => s + (b.taxDetails.cgstAmount || 0), 0);
    const sgst = todayBills.reduce((s, b) => s + (b.taxDetails.sgstAmount || 0), 0);
    const totalTax = cgst + sgst;
    return {
      gross,
      taxable,
      cgst,
      sgst,
      totalTax,
      count: todayBills.length,
    };
  }, [todayBills]);

  // Filter bills by selected period & dates
  const filteredBills = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    return bills.filter((b) => {
      if (b.status === 'Cancelled') return false;
      const bDate = new Date(b.date);
      const bDateIso = b.date.slice(0, 10);
      const bMonthIso = b.date.slice(0, 7);

      let periodMatch = true;

      if (selectedPeriod === 'today') {
        periodMatch = (
          bDate.getDate() === now.getDate() &&
          bDate.getMonth() === currentMonth &&
          bDate.getFullYear() === currentYear
        );
      } else if (selectedPeriod === 'yesterday') {
        const yest = new Date();
        yest.setDate(yest.getDate() - 1);
        periodMatch = (
          bDate.getDate() === yest.getDate() &&
          bDate.getMonth() === yest.getMonth() &&
          bDate.getFullYear() === yest.getFullYear()
        );
      } else if (selectedPeriod === 'this_month') {
        periodMatch = bDate.getMonth() === currentMonth && bDate.getFullYear() === currentYear;
      } else if (selectedPeriod === 'last_month') {
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const yearOfLastMonth = currentMonth === 0 ? currentYear - 1 : currentYear;
        periodMatch = bDate.getMonth() === lastMonth && bDate.getFullYear() === yearOfLastMonth;
      } else if (selectedPeriod === 'financial_year') {
        const fyStart = new Date(currentMonth >= 3 ? currentYear : currentYear - 1, 3, 1);
        periodMatch = bDate >= fyStart;
      } else if (selectedPeriod === 'specific_date') {
        periodMatch = bDateIso === specificDate;
      } else if (selectedPeriod === 'specific_month') {
        periodMatch = bMonthIso === specificMonth;
      } else if (selectedPeriod === 'custom_range') {
        periodMatch = bDateIso >= fromDate && bDateIso <= toDate;
      }

      if (!periodMatch) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          b.billNumber.toLowerCase().includes(q) ||
          (b.customerPhone && b.customerPhone.includes(q)) ||
          (b.customerName && b.customerName.toLowerCase().includes(q)) ||
          (b.tableNumber && b.tableNumber.toLowerCase().includes(q))
        );
      }

      return true;
    });
  }, [bills, selectedPeriod, specificDate, specificMonth, fromDate, toDate, searchQuery]);

  // Aggregate GST Data (B2C and B2B Breakdown)
  const gstMetrics = useMemo(() => {
    let totalTaxable = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalTax = 0;
    let grandTotal = 0;

    const rateBuckets: Record<number, { taxable: number; cgst: number; sgst: number; totalTax: number }> = {
      5: { taxable: 0, cgst: 0, sgst: 0, totalTax: 0 },
      12: { taxable: 0, cgst: 0, sgst: 0, totalTax: 0 },
      18: { taxable: 0, cgst: 0, sgst: 0, totalTax: 0 },
    };

    filteredBills.forEach((b) => {
      totalTaxable += b.taxDetails.taxableValue;
      totalCgst += b.taxDetails.cgstAmount;
      totalSgst += b.taxDetails.sgstAmount;
      totalTax += b.taxDetails.totalTax;
      grandTotal += b.taxDetails.grandTotal;

      const rate = b.taxDetails.gstRate;
      if (!rateBuckets[rate]) {
        rateBuckets[rate] = { taxable: 0, cgst: 0, sgst: 0, totalTax: 0 };
      }
      rateBuckets[rate].taxable += b.taxDetails.taxableValue;
      rateBuckets[rate].cgst += b.taxDetails.cgstAmount;
      rateBuckets[rate].sgst += b.taxDetails.sgstAmount;
      rateBuckets[rate].totalTax += b.taxDetails.totalTax;
    });

    return {
      totalInvoices: filteredBills.length,
      totalTaxable,
      totalCgst,
      totalSgst,
      totalTax,
      grandTotal,
      rateBuckets,
    };
  }, [filteredBills]);

  // Hourly / Time-Slot Sales Breakdown (e.g. 10 PM - 12 AM night rush analysis)
  const timeSlotAnalytics = useMemo(() => {
    const slots = [
      { id: 'morning', label: '08:00 AM - 10:00 AM (Breakfast)', start: 8, end: 10 },
      { id: 'late_morning', label: '10:00 AM - 12:00 PM (Coffee Rush)', start: 10, end: 12 },
      { id: 'lunch', label: '12:00 PM - 03:00 PM (Lunch Rush)', start: 12, end: 15 },
      { id: 'afternoon', label: '03:00 PM - 06:00 PM (High Tea & Snacks)', start: 15, end: 18 },
      { id: 'evening', label: '06:00 PM - 08:00 PM (Dinner Opening)', start: 18, end: 20 },
      { id: 'dinner_peak', label: '08:00 PM - 10:00 PM (Peak Dinner)', start: 20, end: 22 },
      { id: 'night_rush', label: '10:00 PM - 12:00 AM (Night Rush)', start: 22, end: 24 },
      { id: 'late_night', label: '12:00 AM - 08:00 AM (Late Night / Dawn)', start: 0, end: 8 },
    ];

    const slotData = slots.map((s) => ({
      ...s,
      orderCount: 0,
      revenue: 0,
    }));

    filteredBills.forEach((b) => {
      const billHour = new Date(b.date).getHours();
      const amount = b.taxDetails.grandTotal;

      const target = slotData.find((s) => {
        if (s.start === 0 && s.end === 8) {
          return billHour >= 0 && billHour < 8;
        }
        return billHour >= s.start && billHour < s.end;
      });

      if (target) {
        target.orderCount += 1;
        target.revenue += amount;
      }
    });

    const maxSlotRevenue = Math.max(...slotData.map((s) => s.revenue), 1);
    const activeSlots = slotData.filter((s) => s.orderCount > 0);

    return {
      allSlots: slotData,
      activeSlots,
      maxSlotRevenue,
      totalPeriodRevenue: gstMetrics.grandTotal,
    };
  }, [filteredBills, gstMetrics.grandTotal]);

  const handleShareTodayRevenue = () => {
    const todayFormatted = new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    let text = `📊 *${settings.cafeName.toUpperCase()} - TODAY'S SALES & REVENUE REPORT*\n`;
    text += `📅 *Date:* ${todayFormatted}\n`;
    text += `─────────────────────────\n`;
    text += `💰 *Gross Revenue:* ₹${todayRevenue.gross.toFixed(2)}\n`;
    text += `🧾 *Invoices Count:* ${todayRevenue.count}\n`;
    text += `📈 *Taxable Sales:* ₹${todayRevenue.taxable.toFixed(2)}\n`;
    text += `🏛️ *Total GST (5%):* ₹${todayRevenue.totalTax.toFixed(2)}\n`;
    text += `  • CGST (2.5%): ₹${todayRevenue.cgst.toFixed(2)}\n`;
    text += `  • SGST (2.5%): ₹${todayRevenue.sgst.toFixed(2)}\n`;
    text += `─────────────────────────\n`;
    text += `✨ *Generated from POS System*`;

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleSaveEditedInvoice = (updated: BillRecord) => {
    if (onUpdateBill) {
      onUpdateBill(updated);
    }
  };

  const getReportTitle = () => {
    if (selectedPeriod === 'today') return `GST Report (Today - ${todayIso})`;
    if (selectedPeriod === 'yesterday') return `GST Report (Yesterday)`;
    if (selectedPeriod === 'specific_date') return `GST Report (${specificDate})`;
    if (selectedPeriod === 'specific_month') return `GST Report (${specificMonth})`;
    if (selectedPeriod === 'custom_range') return `GST Report (${fromDate} to ${toDate})`;
    return `GST Report (${selectedPeriod.replace('_', ' ').toUpperCase()})`;
  };

  return (
    <div className="h-full flex-1 flex flex-col bg-[#F4F1EE] overflow-hidden select-none">
      {/* Top Header */}
      <div className="p-3 sm:p-4 bg-white border-b border-[#E0D7D0] space-y-3 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-base sm:text-lg font-bold text-[#2D241E] flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-[#4B3621]" />
              <span>GSTR-1 &amp; GST Audit Compliance Reports</span>
            </h1>
            <p className="text-xs text-[#8B7E74] font-medium">
              Taxable values, CGST / SGST breakdown, hourly peak analytics, and one-click WhatsApp shop-closing reports.
            </p>
          </div>

          {/* Key Actions: Day-Closing Report, Share Revenue, PDF & Excel */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* End of Day Store Closing Report Button */}
            <button
              type="button"
              onClick={() => setIsDayClosingModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
              title="Send today's total store revenue, taxes, and payment breakdown to owner's WhatsApp"
            >
              <Moon className="w-3.5 h-3.5 text-amber-200" />
              <span>🌙 Day-End WhatsApp Summary</span>
            </button>

            {/* Quick Share Today's Revenue */}
            <button
              type="button"
              onClick={handleShareTodayRevenue}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
              title="Share Today's Total Sales on WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Share Today Sales</span>
              <span className="sm:hidden">Share</span>
            </button>

            <button
              type="button"
              onClick={() => exportGstReportPdf(filteredBills, settings, getReportTitle())}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-800 hover:bg-rose-900 active:bg-rose-950 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
              title="Download official GST audit report in PDF format"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PDF Report</span>
            </button>

            <button
              type="button"
              onClick={() => exportBillsToCsv(filteredBills, `gstr1_report_${selectedPeriod}`)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#4B3621] hover:bg-[#3D2C1B] active:bg-[#2D241E] text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
              title="Export GSTR-1 spreadsheet in Excel / CSV format"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel (CSV)</span>
            </button>
          </div>
        </div>

        {/* GST Period Switcher & Filter Pills */}
        <div className="flex flex-col gap-2 pt-1 border-t border-[#E0D7D0]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 max-w-full">
              {[
                { id: 'today', label: 'Today' },
                { id: 'yesterday', label: 'Yesterday' },
                { id: 'this_month', label: 'This Month' },
                { id: 'last_month', label: 'Last Month' },
                { id: 'financial_year', label: 'FY 2025-26' },
                { id: 'specific_date', label: '📅 Particular Date' },
                { id: 'specific_month', label: '🗓️ Particular Month' },
                { id: 'custom_range', label: 'Custom Range' },
                { id: 'all', label: 'All Time' },
              ].map((p) => {
                const isSel = selectedPeriod === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPeriod(p.id as any)}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      isSel
                        ? 'bg-[#4B3621] text-white shadow-2xs'
                        : 'bg-[#F4F1EE] text-[#8B7E74] hover:bg-[#E0D7D0] hover:text-[#2D241E]'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            {/* GSTIN Badge */}
            <div className="flex items-center gap-2">
              <div className="text-[11px] font-mono font-bold bg-[#F4F1EE] text-[#4B3621] px-2.5 py-1 rounded-md border border-[#E0D7D0]">
                GSTIN: {settings.gstin || settings.gstNumber || 'NOT REGISTERED'}
              </div>
            </div>
          </div>

          {/* Date Picker row for Particular Date */}
          {selectedPeriod === 'specific_date' && (
            <div className="flex items-center gap-2 p-2 bg-[#F9F7F5] rounded-lg border border-[#E0D7D0] animate-in fade-in duration-100">
              <Calendar className="w-4 h-4 text-[#4B3621]" />
              <span className="text-xs font-bold text-[#4B3621]">Select Specific Date:</span>
              <input
                type="date"
                value={specificDate}
                onChange={(e) => setSpecificDate(e.target.value)}
                className="bg-white border border-[#E0D7D0] rounded-lg px-2.5 py-1 text-xs font-bold font-mono text-[#2D241E] focus:outline-hidden focus:border-[#4B3621]"
              />
              <span className="text-[11px] text-[#8B7E74]">
                Showing invoices settled on {new Date(specificDate + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            </div>
          )}

          {/* Month Picker for Particular Month */}
          {selectedPeriod === 'specific_month' && (
            <div className="flex items-center gap-2 p-2 bg-[#F9F7F5] rounded-lg border border-[#E0D7D0] animate-in fade-in duration-100">
              <Calendar className="w-4 h-4 text-[#4B3621]" />
              <span className="text-xs font-bold text-[#4B3621]">Select Month &amp; Year:</span>
              <input
                type="month"
                value={specificMonth}
                onChange={(e) => setSpecificMonth(e.target.value)}
                className="bg-white border border-[#E0D7D0] rounded-lg px-2.5 py-1 text-xs font-bold font-mono text-[#2D241E] focus:outline-hidden focus:border-[#4B3621]"
              />
              <span className="text-[11px] text-[#8B7E74]">
                Showing entire month of {new Date(specificMonth + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
              </span>
            </div>
          )}

          {/* Custom Date Range Pickers */}
          {selectedPeriod === 'custom_range' && (
            <div className="flex flex-wrap items-center gap-2 p-2 bg-[#F9F7F5] rounded-lg border border-[#E0D7D0] animate-in fade-in duration-100">
              <span className="text-xs font-bold text-[#4B3621]">From:</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="bg-white border border-[#E0D7D0] rounded-lg px-2.5 py-1 text-xs font-bold font-mono text-[#2D241E]"
              />
              <span className="text-xs font-bold text-[#4B3621]">To:</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="bg-white border border-[#E0D7D0] rounded-lg px-2.5 py-1 text-xs font-bold font-mono text-[#2D241E]"
              />
              <span className="text-[11px] text-[#8B7E74]">
                Range: {fromDate} to {toDate}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Today's High-Level Revenue Spotlight (Live Summary Card) */}
        <div className="bg-gradient-to-r from-[#4B3621] via-[#3D2C1B] to-[#2D241E] text-white p-4 rounded-xl shadow-xs border border-[#4B3621] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase font-bold text-amber-200 tracking-wider">
                TODAY'S LIVE REVENUE &amp; PERFORMANCE
              </span>
              <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-400/30 font-bold">
                {todayRevenue.count} Invoices Today
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black font-mono text-white">
                ₹{todayRevenue.gross.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-xs text-amber-100/70 font-mono">
                (Taxable: ₹{todayRevenue.taxable.toFixed(2)} | GST: ₹{todayRevenue.totalTax.toFixed(2)})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShareTodayRevenue}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share Today's Sales</span>
            </button>
            <button
              type="button"
              onClick={() => setIsDayClosingModalOpen(true)}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-[#2D241E] font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Moon className="w-3.5 h-3.5" />
              <span>Close Store Report</span>
            </button>
          </div>
        </div>

        {/* Selected Period Metric Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="bg-white p-3 rounded-xl border border-[#E0D7D0] shadow-2xs space-y-1">
            <div className="text-[10px] uppercase font-bold text-[#8B7E74] flex items-center gap-1">
              <Receipt className="w-3.5 h-3.5 text-[#4B3621]" />
              <span>SELECTED INVOICES</span>
            </div>
            <div className="text-xl font-bold text-[#2D241E] font-mono">
              {gstMetrics.totalInvoices}
            </div>
            <div className="text-[10px] text-emerald-700 font-bold">100% Tax Compliant</div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-[#E0D7D0] shadow-2xs space-y-1">
            <div className="text-[10px] uppercase font-bold text-[#8B7E74]">TAXABLE SALES (BASE)</div>
            <div className="text-xl font-bold text-[#2D241E] font-mono">
              ₹{gstMetrics.totalTaxable.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-[#8B7E74]">Net of GST 5%</div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-[#E0D7D0] shadow-2xs space-y-1">
            <div className="text-[10px] uppercase font-bold text-[#8B7E74]">CGST (2.5%)</div>
            <div className="text-xl font-bold text-[#4B3621] font-mono">
              ₹{gstMetrics.totalCgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-[#8B7E74]">Central Tax</div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-[#E0D7D0] shadow-2xs space-y-1">
            <div className="text-[10px] uppercase font-bold text-[#8B7E74]">SGST (2.5%)</div>
            <div className="text-xl font-bold text-[#4B3621] font-mono">
              ₹{gstMetrics.totalSgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-[#8B7E74]">State Tax</div>
          </div>

          <div className="col-span-2 lg:col-span-1 bg-[#4B3621] text-white p-3 rounded-xl border border-[#3D2C1B] shadow-2xs space-y-1">
            <div className="text-[10px] uppercase font-bold text-amber-200/90 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-amber-200" />
              <span>TOTAL REVENUE</span>
            </div>
            <div className="text-xl font-bold text-white font-mono">
              ₹{gstMetrics.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-amber-100/70">Selected Period Gross</div>
          </div>
        </div>

        {/* Feature 2: Hourly / Time-Slot Sales Analytics (Peak Rush Analysis) */}
        <div className="bg-white rounded-xl border border-[#E0D7D0] overflow-hidden shadow-2xs space-y-2">
          <div className="p-3 bg-[#F9F7F5] border-b border-[#E0D7D0] flex items-center justify-between">
            <div className="font-bold text-xs text-[#2D241E] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#4B3621]" />
              <span>Hourly &amp; Peak Time Sales Breakdown ({getReportTitle()})</span>
            </div>
            <span className="text-[10px] text-[#8B7E74]">
              Analysis of rush hours, lunch &amp; late night sales
            </span>
          </div>

          <div className="p-3">
            {timeSlotAnalytics.activeSlots.length === 0 ? (
              <div className="py-6 text-center text-xs text-[#8B7E74]">
                No sales recorded yet during this period.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {timeSlotAnalytics.allSlots
                  .filter((slot) => slot.orderCount > 0)
                  .map((slot) => {
                    const pct = timeSlotAnalytics.totalPeriodRevenue > 0
                      ? ((slot.revenue / timeSlotAnalytics.totalPeriodRevenue) * 100).toFixed(1)
                      : '0';
                    const isPeak = slot.revenue === timeSlotAnalytics.maxSlotRevenue && slot.revenue > 0;

                    return (
                      <div
                        key={slot.id}
                        className={`p-3 rounded-xl border transition-all ${
                          isPeak
                            ? 'bg-amber-50/70 border-amber-300 shadow-xs'
                            : 'bg-[#F9F7F5] border-[#E0D7D0]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="font-bold text-xs text-[#2D241E] flex items-center gap-1.5">
                            <span>{slot.label}</span>
                            {isPeak && (
                              <span className="text-[9px] bg-amber-500 text-white font-bold px-1.5 py-0.5 rounded-full">
                                🔥 Peak Sales
                              </span>
                            )}
                          </div>
                          <div className="text-xs font-mono font-bold text-[#4B3621]">
                            ₹{slot.revenue.toFixed(2)}
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-[#E0D7D0] h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isPeak ? 'bg-amber-600' : 'bg-[#4B3621]'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(5, parseFloat(pct)))}%` }}
                          ></div>
                        </div>

                        <div className="flex justify-between items-center text-[10px] text-[#8B7E74] mt-1 font-mono">
                          <span>{slot.orderCount} Orders Settled</span>
                          <span>{pct}% of Period Total</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>

        {/* GST Rate-Wise Summary (GSTR-1 Table 7 B2CS) */}
        <div className="bg-white rounded-xl border border-[#E0D7D0] overflow-hidden shadow-2xs">
          <div className="p-3 bg-[#F9F7F5] border-b border-[#E0D7D0] flex items-center justify-between">
            <div className="font-bold text-xs text-[#2D241E] flex items-center gap-1.5">
              <PieChart className="w-3.5 h-3.5 text-[#4B3621]" />
              <span>GSTR-1 Table 7: B2CS Rate-Wise Tax Liability Breakdown</span>
            </div>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md">
              SAC Code: 996331
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#F4F1EE] text-[#8B7E74] font-bold border-b border-[#E0D7D0]">
                <tr>
                  <th className="py-2 px-3">GST Rate</th>
                  <th className="py-2 px-3">Service Category</th>
                  <th className="py-2 px-3 text-right">Taxable Base Value (₹)</th>
                  <th className="py-2 px-3 text-right">CGST (₹)</th>
                  <th className="py-2 px-3 text-right">SGST (₹)</th>
                  <th className="py-2 px-3 text-right">Total Tax Liability (₹)</th>
                  <th className="py-2 px-3 text-right">Total Invoice Value (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E0D7D0]/60">
                {Object.entries(gstMetrics.rateBuckets).map(([rateStr, bucket]) => {
                  const rate = parseInt(rateStr, 10);
                  const data = bucket as { taxable: number; cgst: number; sgst: number; totalTax: number };
                  const totalWithTax = data.taxable + data.totalTax;
                  return (
                    <tr key={rate} className="hover:bg-[#F9F7F5]">
                      <td className="py-2 px-3 font-bold font-mono text-[#4B3621]">
                        {rate}% (Restaurant Rate)
                      </td>
                      <td className="py-2 px-3 text-[#8B7E74]">Restaurant / Food &amp; Beverage Services (SAC 996331)</td>
                      <td className="py-2 px-3 text-right font-mono font-medium text-[#2D241E]">
                        ₹{data.taxable.toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-[#8B7E74]">
                        ₹{data.cgst.toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-[#8B7E74]">
                        ₹{data.sgst.toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-[#4B3621]">
                        ₹{data.totalTax.toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-[#2D241E]">
                        ₹{totalWithTax.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tax Invoices Register Table with Search, Edit & Delete */}
        <div className="bg-white rounded-xl border border-[#E0D7D0] overflow-hidden shadow-2xs space-y-2">
          <div className="p-3 bg-[#F9F7F5] border-b border-[#E0D7D0] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="font-bold text-xs text-[#2D241E] flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#4B3621]" />
              <span>Tax Invoice Register ({filteredBills.length} Invoices)</span>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#8B7E74] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Invoice #, Phone, Name..."
                className="w-full sm:w-64 bg-white border border-[#E0D7D0] rounded-lg py-1 pl-8 pr-3 text-xs text-[#2D241E] focus:outline-hidden focus:border-[#4B3621]"
              />
            </div>
          </div>

          {filteredBills.length === 0 ? (
            <div className="py-12 text-center text-[#8B7E74] space-y-2">
              <FileSpreadsheet className="w-8 h-8 mx-auto text-[#8B7E74]/60" />
              <div className="font-bold text-sm text-[#4B3621]">No Tax Invoices Found</div>
              <p className="text-xs">No settled invoices match the selected date or search filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F4F1EE] text-[#8B7E74] font-bold border-b border-[#E0D7D0]">
                  <tr>
                    <th className="py-2.5 px-3">Invoice #</th>
                    <th className="py-2.5 px-3">Date &amp; Time</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Payment</th>
                    <th className="py-2.5 px-3 text-right">Taxable (₹)</th>
                    <th className="py-2.5 px-3 text-right">CGST (₹)</th>
                    <th className="py-2.5 px-3 text-right">SGST (₹)</th>
                    <th className="py-2.5 px-3 text-right font-bold text-[#4B3621]">Total (₹)</th>
                    <th className="py-2.5 px-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E0D7D0]/60">
                  {filteredBills.map((b) => (
                    <tr key={b.id} className="hover:bg-[#F9F7F5] transition-colors">
                      <td className="py-2.5 px-3 font-bold font-mono text-[#4B3621]">
                        {b.billNumber}
                      </td>

                      <td className="py-2.5 px-3 text-[#8B7E74] whitespace-nowrap">
                        {new Date(b.date).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                        })}{' '}
                        {new Date(b.date).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      <td className="py-2.5 px-3 text-[#2D241E]">
                        <div className="font-bold">{b.customerName || 'Walk-in'}</div>
                        {b.customerPhone && (
                          <div className="text-[10px] text-[#8B7E74] font-mono">{b.customerPhone}</div>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-[#2D241E]">
                        <div>{b.orderType}</div>
                        {b.tableNumber && (
                          <div className="text-[10px] text-[#8B7E74] font-bold">T-{b.tableNumber}</div>
                        )}
                      </td>

                      <td className="py-2.5 px-3 font-semibold text-[#2D241E]">
                        <span className="px-2 py-0.5 rounded-md bg-[#F4F1EE] border border-[#E0D7D0] text-[10px]">
                          {b.paymentMode}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-right font-mono text-[#2D241E]">
                        ₹{b.taxDetails.taxableValue.toFixed(2)}
                      </td>

                      <td className="py-2.5 px-3 text-right font-mono text-[#8B7E74]">
                        ₹{b.taxDetails.cgstAmount.toFixed(2)}
                      </td>

                      <td className="py-2.5 px-3 text-right font-mono text-[#8B7E74]">
                        ₹{b.taxDetails.sgstAmount.toFixed(2)}
                      </td>

                      <td className="py-2.5 px-3 text-right font-mono font-bold text-[#4B3621] text-sm">
                        ₹{b.taxDetails.grandTotal.toFixed(2)}
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* View Button */}
                          <button
                            type="button"
                            onClick={() => setSelectedBillForDetail(b)}
                            className="p-1.5 rounded-md bg-[#F4F1EE] hover:bg-[#E0D7D0] text-[#2D241E] transition-colors cursor-pointer"
                            title="View Full Bill Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => setBillToEdit(b)}
                            className="p-1.5 rounded-md bg-[#F4F1EE] hover:bg-[#4B3621] text-[#4B3621] hover:text-white transition-colors cursor-pointer"
                            title="Edit Invoice Details"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Print Button */}
                          <button
                            type="button"
                            onClick={() => printReceipt(b, settings, 'both')}
                            className="p-1.5 rounded-md bg-[#F4F1EE] hover:bg-[#E0D7D0] text-[#4B3621] transition-colors cursor-pointer"
                            title="Print Slip"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* PDF Download Button */}
                          <button
                            type="button"
                            onClick={() => downloadInvoicePdf(b, settings)}
                            className="p-1.5 rounded-md bg-[#F4F1EE] hover:bg-[#E0D7D0] text-rose-700 transition-colors cursor-pointer"
                            title="Download PDF Invoice"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => setBillToDelete(b)}
                            className="p-1.5 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                            title="Delete Bill Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* GST Compliance Footnote */}
        <div className="bg-[#4B3621] text-white rounded-xl p-4 flex items-start gap-3 border border-[#3D2C1B]">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <div className="font-bold text-white uppercase tracking-wider">
              Legal GST Invoicing Compliance Notice
            </div>
            <p className="text-amber-100/90 leading-relaxed">
              Every invoice generated contains sequential check &amp; invoice numbering ({settings.invoicePrefix}
              0001), exact SAC code 996331 (Restaurant &amp; Cafe Services), registered GSTIN{' '}
              <strong className="text-amber-200 font-mono">{settings.gstin || settings.gstNumber}</strong>, FSSAI Lic #{' '}
              <strong className="text-amber-200 font-mono">{settings.fssaiNumber}</strong>, and itemized CGST + SGST tax breakdown compliant with Rule 46 of CGST Rules 2017.
            </p>
          </div>
        </div>
      </div>

      {/* Bill Detail Modal */}
      {selectedBillForDetail && (
        <BillDetailModal
          bill={selectedBillForDetail}
          settings={settings}
          onClose={() => setSelectedBillForDetail(null)}
        />
      )}

      {/* Edit Invoice Modal */}
      {billToEdit && (
        <EditInvoiceModal
          bill={billToEdit}
          settings={settings}
          isOpen={Boolean(billToEdit)}
          onClose={() => setBillToEdit(null)}
          onSave={handleSaveEditedInvoice}
        />
      )}

      {/* Day Closing Summary to WhatsApp Modal */}
      <DayClosingReportModal
        isOpen={isDayClosingModalOpen}
        onClose={() => setIsDayClosingModalOpen(false)}
        todayBills={todayBills}
        settings={settings}
      />

      {/* Confirm Delete Invoice Modal */}
      {billToDelete && (
        <ConfirmDeleteModal
          isOpen={Boolean(billToDelete)}
          title="Delete Tax Invoice"
          message="Are you sure you want to permanently delete this GST Tax Invoice from the audit register?"
          itemIdentifier={`Invoice #${billToDelete.billNumber} • ${billToDelete.customerName || 'Walk-in'} (₹${billToDelete.taxDetails.grandTotal.toFixed(2)})`}
          onConfirm={() => {
            if (onDeleteBill) {
              onDeleteBill(billToDelete.id);
            }
            setBillToDelete(null);
          }}
          onCancel={() => setBillToDelete(null)}
        />
      )}
    </div>
  );
};
