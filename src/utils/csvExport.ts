import { BillRecord } from '../types';

export function exportBillsToCsv(bills: BillRecord[], filename: string = 'dascaff_sales_register'): void {
  const headers = [
    'Invoice Number',
    'Date',
    'Time',
    'Order Type',
    'Table',
    'Customer Name',
    'Customer Phone',
    'Items Ordered',
    'Total Items Qty',
    'Sub Total',
    'Taxable Base',
    'GST Rate (%)',
    'CGST Amount',
    'SGST Amount',
    'Discount Amount',
    'Round Off',
    'Grand Total',
    'Payment Mode',
    'Status',
  ];

  const rows = bills.map((b) => {
    const d = new Date(b.date);
    const dateFormatted = isNaN(d.getTime()) ? b.date : d.toLocaleDateString('en-GB');
    const timeFormatted = isNaN(d.getTime()) ? '' : d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

    const itemsSummary = b.items
      .map((i) => `${i.name}${i.selectedVariant ? ` (${i.selectedVariant.name})` : ''} x${i.quantity}`)
      .join('; ');

    const totalQty = b.items.reduce((s, i) => s + i.quantity, 0);

    return [
      `"${b.billNumber}"`,
      `"${dateFormatted}"`,
      `"${timeFormatted}"`,
      `"${b.orderType}"`,
      `"${b.tableNumber || '-'}"`,
      `"${(b.customerName || 'Walk-in').replace(/"/g, '""')}"`,
      `"${b.customerPhone || '-'}"`,
      `"${itemsSummary.replace(/"/g, '""')}"`,
      totalQty,
      b.taxDetails.subTotal.toFixed(2),
      b.taxDetails.taxableValue.toFixed(2),
      b.taxDetails.gstRate,
      b.taxDetails.cgstAmount.toFixed(2),
      b.taxDetails.sgstAmount.toFixed(2),
      b.taxDetails.discountAmount.toFixed(2),
      b.taxDetails.roundOff.toFixed(2),
      b.taxDetails.grandTotal.toFixed(2),
      `"${b.paymentMode}"`,
      `"${b.status}"`,
    ];
  });

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
