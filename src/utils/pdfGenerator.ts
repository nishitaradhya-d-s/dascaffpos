import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BillRecord, CafeSettings } from '../types';
import { formatBillDate } from './printer';

/**
 * Generates an official 80mm PDF for Tax Invoice
 */
export function generateInvoicePdfDoc(bill: BillRecord, settings: CafeSettings): jsPDF {
  const { fullFormatted } = formatBillDate(bill.date);
  const checkNo = bill.checkNumber || bill.billNumber.replace(/[^0-9]/g, '') || '004';
  const tableDisplay = bill.tableNumber ? bill.tableNumber.replace(/[^0-9]/g, '') || bill.tableNumber : '1';
  const isGst = bill.billType === 'GST_Customer';

  // Calculate dynamic receipt height based on item count
  const estimatedHeight = 160 + bill.items.length * 10;
  const doc = new jsPDF({
    unit: 'mm',
    format: [80, Math.max(180, estimatedHeight)],
  });

  const pageWidth = 80;
  let y = 8;

  // Header Title
  doc.setFont('courier', 'bold');
  doc.setFontSize(13);
  doc.text(settings.cafeName, pageWidth / 2, y, { align: 'center' });
  y += 4.5;

  doc.setFontSize(9.5);
  doc.text('TAX INVOICE', pageWidth / 2, y, { align: 'center' });
  y += 3.5;

  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  doc.text('ORIGINAL', pageWidth / 2, y, { align: 'center' });
  y += 3.5;

  doc.setFontSize(7.5);
  const addressLines = doc.splitTextToSize(`${settings.address} ${settings.cityStateZip}`, 68);
  doc.text(addressLines, pageWidth / 2, y, { align: 'center' });
  y += addressLines.length * 3 + 1;

  doc.text(`Caff Phone No : ${settings.phone}`, pageWidth / 2, y, { align: 'center' });
  y += 3.5;

  doc.setFont('courier', 'bold');
  doc.setFontSize(8.5);
  doc.text(`Invoice No : ${bill.billNumber}`, pageWidth / 2, y, { align: 'center' });
  y += 3.5;

  doc.text(bill.orderType.toUpperCase(), pageWidth / 2, y, { align: 'center' });
  y += 3.5;

  doc.setFont('courier', 'normal');
  doc.setFontSize(7.5);
  doc.text(fullFormatted, pageWidth / 2, y, { align: 'center' });
  y += 3;

  // Dashed Line
  doc.setLineDashPattern([1, 1], 0);
  doc.line(6, y, 74, y);
  y += 3.5;

  // Meta Info
  doc.setFontSize(7.5);
  doc.text(`CHECK NO : ${checkNo}`, 6, y);
  doc.text(`Table No: ${tableDisplay}`, 74, y, { align: 'right' });
  y += 3.5;

  doc.text(`Customer Name: ${bill.customerName || 'Walk-in'}`, 6, y);
  y += 3.5;

  if (bill.customerPhone) {
    doc.text(`Customer Mobile No : ${bill.customerPhone}`, 6, y);
    y += 3.5;
  }

  doc.line(6, y, 74, y);
  y += 3.5;

  // Table header
  doc.setFont('courier', 'bold');
  doc.text('QTY   PRODUCT', 6, y);
  doc.text('AMOUNT', 74, y, { align: 'right' });
  y += 3.5;

  doc.setFont('courier', 'normal');
  // Items
  bill.items.forEach((item) => {
    doc.setFont('courier', 'normal');
    doc.text(`${item.quantity} EA  ${item.name}`, 6, y);
    doc.setFont('courier', 'bold');
    doc.text(item.totalPrice.toFixed(2), 74, y, { align: 'right' });
    y += 3.5;

    if (item.selectedVariant) {
      doc.setFont('courier', 'normal');
      doc.setFontSize(6.5);
      doc.text(`       • ${item.selectedVariant.name}`, 6, y);
      doc.setFontSize(7.5);
      y += 3;
    }

    if (item.addons && item.addons.length > 0) {
      doc.setFont('courier', 'normal');
      doc.setFontSize(6.5);
      item.addons.forEach((a) => {
        doc.text(`       • ${a.name}`, 6, y);
        y += 3;
      });
      doc.setFontSize(7.5);
    }

    if (item.comboSelections && item.comboSelections.length > 0) {
      doc.setFont('courier', 'normal');
      doc.setFontSize(6.5);
      item.comboSelections.forEach((cs) => {
        doc.text(`       • ${cs.selectedName}`, 6, y);
        y += 3;
      });
      doc.setFontSize(7.5);
    }
  });

  y += 1;
  doc.line(6, y, 74, y);
  y += 3.5;

  // Subtotals
  doc.setFont('courier', 'normal');
  doc.text('Sub Total', 6, y);
  doc.text(bill.taxDetails.subTotal.toFixed(2), 74, y, { align: 'right' });
  y += 3.5;

  if (isGst) {
    doc.text(`CGST ${bill.taxDetails.cgstRate}%`, 6, y);
    doc.text(bill.taxDetails.cgstAmount.toFixed(2), 74, y, { align: 'right' });
    y += 3.5;

    doc.text(`SGST ${bill.taxDetails.sgstRate}%`, 6, y);
    doc.text(bill.taxDetails.sgstAmount.toFixed(2), 74, y, { align: 'right' });
    y += 3.5;
  }

  if (bill.taxDetails.discountAmount > 0) {
    doc.text(`Discount (${bill.taxDetails.discountPercent.toFixed(1)}%)`, 6, y);
    doc.text(`-${bill.taxDetails.discountAmount.toFixed(2)}`, 74, y, { align: 'right' });
    y += 3.5;
  }

  doc.line(6, y, 74, y);
  y += 3.5;

  // Total Payable
  doc.setFont('courier', 'bold');
  doc.setFontSize(9);
  doc.text('Total Payable', 6, y);
  doc.text(bill.taxDetails.grandTotal.toFixed(2), 74, y, { align: 'right' });
  y += 4;

  doc.setLineDashPattern([1, 1], 0);
  doc.line(6, y, 74, y);
  y += 3.5;

  // Payment Details
  doc.setFont('courier', 'bold');
  doc.setFontSize(7.5);
  doc.text('Payment Details:', 6, y);
  y += 3.5;
  doc.setFont('courier', 'normal');
  doc.text(`Mode: ${bill.paymentMode}`, 6, y);
  y += 3.5;

  doc.line(6, y, 74, y);
  y += 3.5;

  // Registration info
  doc.setFontSize(6.5);
  if (settings.sac) { doc.text(`SAC : ${settings.sac}`, 6, y); y += 3; }
  if (settings.gstin) { doc.text(`GST NO : ${settings.gstin}`, 6, y); y += 3; }
  if (settings.cin) { doc.text(`CIN : ${settings.cin}`, 6, y); y += 3; }
  if (settings.fssaiNumber) { doc.text(`FSSAI : ${settings.fssaiNumber}`, 6, y); y += 3; }

  doc.line(6, y, 74, y);
  y += 3.5;

  doc.setFont('courier', 'bold');
  doc.setFontSize(7.5);
  doc.text(settings.termsAndConditions || '*** HAVE A DELICIOUS DAY ***', pageWidth / 2, y, { align: 'center' });

  return doc;
}

/**
 * Generates an official 80mm PDF for Kitchen Order Ticket (KOT)
 * Tight height to cut cleanly when items end
 */
export function generateKotPdfDoc(bill: BillRecord, settings: CafeSettings): jsPDF {
  const { dateStr, timeStr } = formatBillDate(bill.date);
  const kotNo = bill.kotNumber || '004';
  const tableDisplay = bill.tableNumber ? bill.tableNumber : 'T-1';

  const estimatedHeight = 70 + bill.items.length * 9;
  const doc = new jsPDF({
    unit: 'mm',
    format: [80, Math.max(90, estimatedHeight)],
  });

  const pageWidth = 80;
  let y = 7;

  doc.setFont('courier', 'bold');
  doc.setFontSize(11);
  doc.text(`KOT No: ${kotNo}`, 6, y);
  y += 4.5;

  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  doc.text(`Date: ${dateStr} ${timeStr}`, 6, y);
  y += 4;

  doc.text(`Bill No: ${bill.billNumber}`, 6, y);
  y += 4;

  doc.setFont('courier', 'bold');
  doc.text(`Customer: ${bill.customerName || 'Walk-in'}`, 6, y);
  y += 4;

  if (bill.customerPhone) {
    doc.setFont('courier', 'normal');
    doc.text(`Phone: ${bill.customerPhone}`, 6, y);
    y += 4;
  }

  doc.setFont('courier', 'bold');
  doc.text(`Table: ${tableDisplay} (${bill.orderType})`, 6, y);
  y += 3;

  doc.setLineDashPattern([1, 1], 0);
  doc.line(6, y, 74, y);
  y += 4;

  // Items
  bill.items.forEach((item) => {
    doc.setFont('courier', 'bold');
    doc.setFontSize(9);
    doc.text(`${item.name} (${item.quantity})`, 6, y);
    y += 3.5;

    if (item.selectedVariant) {
      doc.setFont('courier', 'normal');
      doc.setFontSize(7.5);
      doc.text(`  • ${item.selectedVariant.name}`, 6, y);
      y += 3;
    }

    if (item.addons && item.addons.length > 0) {
      doc.setFont('courier', 'normal');
      doc.setFontSize(7.5);
      item.addons.forEach((a) => {
        doc.text(`  • ${a.name}`, 6, y);
        y += 3;
      });
    }

    if (item.comboSelections && item.comboSelections.length > 0) {
      doc.setFont('courier', 'normal');
      doc.setFontSize(7.5);
      item.comboSelections.forEach((cs) => {
        doc.text(`  • ${cs.selectedName}`, 6, y);
        y += 3;
      });
    }

    if (item.notes) {
      doc.setFont('courier', 'italic');
      doc.setFontSize(7);
      doc.text(`  * Note: ${item.notes}`, 6, y);
      y += 3;
    }
  });

  y += 1;
  doc.line(6, y, 74, y);
  y += 4;

  doc.setFont('courier', 'bold');
  doc.setFontSize(8);
  doc.text('KITCHEN COPY', pageWidth / 2, y, { align: 'center' });

  return doc;
}

export function downloadInvoicePdf(bill: BillRecord, settings: CafeSettings): void {
  const doc = generateInvoicePdfDoc(bill, settings);
  doc.save(`${bill.billNumber}_Tax_Invoice.pdf`);
}

export function downloadKotPdf(bill: BillRecord, settings: CafeSettings): void {
  const doc = generateKotPdfDoc(bill, settings);
  doc.save(`KOT_${bill.kotNumber || '001'}.pdf`);
}

export function downloadBothPdfs(bill: BillRecord, settings: CafeSettings): void {
  downloadInvoicePdf(bill, settings);
  setTimeout(() => {
    downloadKotPdf(bill, settings);
  }, 400);
}

/**
 * Generates comprehensive Multi-page GST Tax Filing & Sales Register Report PDF
 */
export function exportGstReportPdf(bills: BillRecord[], settings: CafeSettings, title: string = 'Monthly GST Tax Report'): void {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  let totalGross = 0;
  let totalTaxable = 0;
  let totalTax = 0;
  let totalCgst = 0;
  let totalSgst = 0;

  const validBills = bills.filter((b) => b.status !== 'Cancelled');
  validBills.forEach((b) => {
    totalGross += b.taxDetails.grandTotal;
    totalTaxable += b.taxDetails.taxableValue;
    totalTax += b.taxDetails.totalTax;
    totalCgst += b.taxDetails.cgstAmount;
    totalSgst += b.taxDetails.sgstAmount;
  });

  // Title Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(settings.cafeName, 14, 15);

  doc.setFontSize(11);
  doc.text(title.toUpperCase(), 14, 21);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`GSTIN: ${settings.gstin} | Address: ${settings.address}, ${settings.cityStateZip} | Phone: ${settings.phone}`, 14, 26);

  // Summary Metrics Strip
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 30, 269, 14, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(`Total Invoices: ${validBills.length}`, 18, 38);
  doc.text(`Taxable Value: ₹${totalTaxable.toFixed(2)}`, 70, 38);
  doc.text(`CGST Output: ₹${totalCgst.toFixed(2)}`, 130, 38);
  doc.text(`SGST Output: ₹${totalSgst.toFixed(2)}`, 180, 38);
  doc.text(`Gross Sales: ₹${totalGross.toFixed(2)}`, 230, 38);

  const tableRows = validBills.map((b) => {
    const d = new Date(b.date);
    const dateFormatted = isNaN(d.getTime()) ? b.date : d.toLocaleDateString('en-GB');
    const timeFormatted = isNaN(d.getTime()) ? '' : d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    return [
      b.billNumber,
      `${dateFormatted} ${timeFormatted}`,
      b.orderType,
      b.customerName || 'Walk-in',
      b.paymentMode,
      `Rs. ${b.taxDetails.taxableValue.toFixed(2)}`,
      `${b.taxDetails.gstRate}%`,
      `Rs. ${b.taxDetails.cgstAmount.toFixed(2)}`,
      `Rs. ${b.taxDetails.sgstAmount.toFixed(2)}`,
      `Rs. ${b.taxDetails.grandTotal.toFixed(2)}`,
    ];
  });

  autoTable(doc, {
    startY: 48,
    head: [['Invoice No', 'Date & Time', 'Type', 'Customer', 'Payment', 'Taxable Val', 'GST %', 'CGST Amt', 'SGST Amt', 'Total Amount']],
    body: tableRows,
    theme: 'striped',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 7.5,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    foot: [[
      'TOTALS',
      '',
      '',
      '',
      '',
      `Rs. ${totalTaxable.toFixed(2)}`,
      '',
      `Rs. ${totalCgst.toFixed(2)}`,
      `Rs. ${totalSgst.toFixed(2)}`,
      `Rs. ${totalGross.toFixed(2)}`,
    ]],
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 8,
    },
  });

  doc.save(`DAS_CAFF_GST_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
}
