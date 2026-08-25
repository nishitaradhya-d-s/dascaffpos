import { BillRecord, CafeSettings } from '../types';
import { isBluetoothPrinterConnected, printDirectBluetooth } from './bluetoothPrinter';

/**
 * 80mm Direct POS Autocut Thermal Printer Output (Helett BillQuick Lite 80mm compatible)
 * Formats receipt exactly as specified in the reference OCR and cuts cleanly when text ends.
 */

export function formatBillDate(dateString: string): { dateStr: string; timeStr: string; fullFormatted: string } {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) {
      const now = new Date();
      return {
        dateStr: now.toLocaleDateString('en-GB'),
        timeStr: now.toLocaleTimeString('en-US', { hour12: true }),
        fullFormatted: now.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }),
      };
    }
    const day = d.getDate();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

    return {
      dateStr: `${String(day).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(year).slice(-2)}`,
      timeStr: time,
      fullFormatted: `${day} ${month} ${year} ${time}`,
    };
  } catch {
    return {
      dateStr: '',
      timeStr: '',
      fullFormatted: '',
    };
  }
}

/**
 * Generates HTML string for 80mm Tax Invoice Receipt
 */
export function generateTaxInvoiceHtml(bill: BillRecord, settings: CafeSettings): string {
  const { fullFormatted } = formatBillDate(bill.date);
  const checkNo = bill.checkNumber || bill.billNumber.replace(/[^0-9]/g, '') || '001';
  const tableDisplay = bill.orderType === 'Dine-In' && bill.tableNumber 
    ? (bill.tableNumber.replace(/[^0-9]/g, '') || bill.tableNumber) 
    : 'N/A';
  const isGst = bill.billType === 'GST_Customer';

  const itemsHtml = bill.items
    .map((item) => {
      let itemHtml = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2px;">
          <div style="flex: 1; padding-right: 8px;">
            <span>${item.quantity} EA</span> &nbsp;
            <span style="font-weight: 600;">${item.name}</span>
          </div>
          <div style="font-weight: 700; text-align: right; min-width: 60px;">
            ${item.totalPrice.toFixed(2)}
          </div>
        </div>
      `;

      if (item.selectedVariant) {
        itemHtml += `
          <div style="padding-left: 36px; font-size: 11px; color: #333; margin-top: -1px;">
            - ${item.selectedVariant.name}
          </div>
        `;
      }

      if (item.addons && item.addons.length > 0) {
        item.addons.forEach((addon) => {
          itemHtml += `
            <div style="padding-left: 36px; font-size: 11px; color: #333; margin-top: -1px;">
              + ${addon.name}
            </div>
          `;
        });
      }

      if (item.notes) {
        itemHtml += `
          <div style="padding-left: 36px; font-size: 10px; font-style: italic; color: #555;">
            * ${item.notes}
          </div>
        `;
      }

      return itemHtml;
    })
    .join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Receipt ${bill.billNumber}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
        <style>
          @page {
            size: 80mm auto;
            margin: 0mm;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          html, body {
            width: 76mm;
            max-width: 76mm;
            margin: 0 auto;
            padding: 2mm 1.5mm 3mm 1.5mm;
            font-family: 'JetBrains Mono', 'Courier New', Courier, monospace;
            font-size: 11.5px;
            line-height: 1.3;
            color: #000;
            background: #fff;
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact;
          }
          @media print {
            html, body {
              width: 76mm !important;
              max-width: 76mm !important;
              margin: 0 auto !important;
              padding: 1.5mm 1mm 2mm 1mm !important;
              height: auto !important;
            }
          }
          .cafe-title {
            font-family: 'Cinzel', serif;
            font-size: 19px;
            font-weight: 800;
            letter-spacing: 1.5px;
            text-align: center;
            text-transform: uppercase;
            margin-bottom: 2px;
          }
          .center {
            text-align: center;
          }
          .bold {
            font-weight: 700;
          }
          .divider {
            border-top: 1px dashed #000;
            margin: 5px 0;
          }
          .double-divider {
            border-top: 1.5px solid #000;
            margin: 6px 0;
          }
          .row {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .table-header {
            display: flex;
            justify-content: space-between;
            font-weight: 700;
            font-size: 11px;
            margin-bottom: 4px;
          }
          .grand-total {
            font-size: 15px;
            font-weight: 900;
            padding: 3px 0;
          }
          .tax-row {
            display: flex;
            justify-content: space-between;
            font-size: 11.5px;
            margin: 2px 0;
          }
          .meta-info {
            font-size: 11px;
            line-height: 1.3;
          }
          .footer-text {
            text-align: center;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.5px;
            margin-top: 6px;
          }
        </style>
      </head>
      <body>
        <!-- Header -->
        <div class="cafe-title">${settings.cafeName}</div>
        <div class="center bold" style="font-size: 13px; letter-spacing: 0.5px;">TAX INVOICE</div>
        <div class="center" style="font-size: 11px;">ORIGINAL</div>
        <div class="center meta-info" style="margin-top: 3px;">
          ${settings.address}<br>
          ${settings.cityStateZip}<br>
          Caff Phone No : ${settings.phone}
        </div>

        <div class="center bold" style="font-size: 14px; margin-top: 4px;">
          Invoice No : ${bill.billNumber}
        </div>
        <div class="center bold" style="font-size: 12px;">
          ${bill.orderType.toUpperCase()}
        </div>
        <div class="center" style="font-size: 11px;">
          ${fullFormatted}
        </div>

        <div class="divider"></div>

        <!-- Check & Customer Details -->
        <div class="row meta-info">
          <div>CHECK NO : ${checkNo}</div>
          <div>Table No: ${tableDisplay}</div>
        </div>
        <div class="row meta-info">
          <div>Customer Name:</div>
          <div>${bill.customerName || 'Walk-in'}</div>
        </div>
        ${bill.customerPhone ? `
        <div class="row meta-info">
          <div>Customer Mobile No :</div>
          <div>${bill.customerPhone}</div>
        </div>
        ` : ''}

        <div class="divider"></div>

        <!-- Items Table Header -->
        <div class="table-header">
          <div>QTY &nbsp; PRODUCT</div>
          <div>AMOUNT</div>
        </div>

        <!-- Items -->
        <div style="margin-bottom: 4px;">
          ${itemsHtml}
        </div>

        <div class="divider"></div>

        <!-- Subtotal and Taxes -->
        <div class="tax-row">
          <div>Sub Total</div>
          <div class="bold">${bill.taxDetails.subTotal.toFixed(2)}</div>
        </div>

        ${isGst ? `
          <div class="tax-row">
            <div>CGST ${bill.taxDetails.cgstRate}%</div>
            <div>${bill.taxDetails.cgstAmount.toFixed(2)}</div>
          </div>
          <div class="tax-row">
            <div>SGST ${bill.taxDetails.sgstRate}%</div>
            <div>${bill.taxDetails.sgstAmount.toFixed(2)}</div>
          </div>
        ` : ''}

        ${bill.taxDetails.discountAmount > 0 ? `
          <div class="tax-row">
            <div>Discount (${bill.taxDetails.discountPercent.toFixed(1)}%)</div>
            <div>-${bill.taxDetails.discountAmount.toFixed(2)}</div>
          </div>
        ` : ''}

        <div class="divider"></div>

        <!-- Total Payable -->
        <div class="row grand-total">
          <div>Total Payable</div>
          <div>${bill.taxDetails.grandTotal.toFixed(2)}</div>
        </div>

        <div class="divider"></div>

        <!-- Payment Details -->
        <div style="margin: 3px 0;">
          <div class="bold" style="font-size: 11.5px;">Payment Details:</div>
          <div class="row" style="font-size: 11.5px;">
            <div>Mode:</div>
            <div class="bold">${bill.paymentMode}</div>
          </div>
          ${bill.splitDetails && bill.paymentMode === 'Split' ? `
            <div style="font-size: 10.5px; color: #333; padding-left: 8px;">
              Cash: ${bill.splitDetails.cash.toFixed(2)} | UPI: ${bill.splitDetails.upi.toFixed(2)} | Card: ${bill.splitDetails.card.toFixed(2)}
            </div>
          ` : ''}
          ${bill.amountPaid && bill.amountPaid > 0 ? `
            <div class="row" style="font-size: 11.5px; margin-top: 2px;">
              <div>Cash Received</div>
              <div class="bold">₹${bill.amountPaid.toFixed(2)}</div>
            </div>
          ` : ''}
          ${bill.changeReturned && bill.changeReturned > 0 ? `
            <div class="row bold" style="font-size: 12px; margin-top: 2px; color: #000;">
              <div>Return Change</div>
              <div>₹${bill.changeReturned.toFixed(2)}</div>
            </div>
          ` : ''}
        </div>

        <div class="divider"></div>

        <!-- Tax Registration Details -->
        <div class="meta-info" style="line-height: 1.4;">
          ${settings.sac ? `<div>SAC : ${settings.sac}</div>` : ''}
          ${settings.gstin ? `<div>GST NO : ${settings.gstin}</div>` : ''}
          ${settings.cin ? `<div>CIN : ${settings.cin}</div>` : ''}
          ${settings.fssaiNumber ? `<div>FSSAI : ${settings.fssaiNumber}</div>` : ''}
        </div>

        <div class="divider"></div>

        <!-- Footer -->
        <div class="footer-text">
          ${settings.termsAndConditions || '*** HAVE A DELICIOUS DAY ***'}
        </div>
      </body>
    </html>
  `;
}

/**
 * Generates HTML string for 80mm Kitchen Order Ticket (KOT)
 * Specifically formatted to cut tightly right after the items end to avoid wasting expensive paper rolls!
 */
export function generateKotHtml(bill: BillRecord, settings: CafeSettings): string {
  const { dateStr, timeStr } = formatBillDate(bill.date);
  const kotNo = bill.kotNumber || '004';
  const tableDisplay = bill.tableNumber ? bill.tableNumber : 'T-1';

  const itemsHtml = bill.items
    .map((item) => {
      let itemHtml = `
        <div style="font-size: 13px; font-weight: 700; margin-bottom: 2px;">
          ${item.name} (${item.quantity})
        </div>
      `;

      if (item.selectedVariant) {
        itemHtml += `
          <div style="padding-left: 12px; font-size: 11px; font-weight: 600;">
            - ${item.selectedVariant.name}
          </div>
        `;
      }

      if (item.addons && item.addons.length > 0) {
        item.addons.forEach((addon) => {
          itemHtml += `
            <div style="padding-left: 12px; font-size: 11px; font-weight: 600;">
              + ${addon.name}
            </div>
          `;
        });
      }

      if (item.notes) {
        itemHtml += `
          <div style="padding-left: 12px; font-size: 11px; font-style: italic; color: #222;">
            * PREP: ${item.notes}
          </div>
        `;
      }

      return itemHtml;
    })
    .join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>KOT ${kotNo}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;700;800&display=swap" rel="stylesheet">
        <style>
          @page {
            size: 80mm auto;
            margin: 0mm;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          html, body {
            width: 76mm;
            max-width: 76mm;
            margin: 0 auto;
            padding: 2mm 1.5mm 3mm 1.5mm;
            font-family: 'JetBrains Mono', 'Courier New', Courier, monospace;
            font-size: 11.5px;
            line-height: 1.3;
            color: #000;
            background: #fff;
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact;
          }
          @media print {
            html, body {
              width: 76mm !important;
              max-width: 76mm !important;
              margin: 0 auto !important;
              padding: 1.5mm 1mm 2mm 1mm !important;
              height: auto !important;
            }
          }
          .kot-title {
            font-size: 16px;
            font-weight: 800;
            letter-spacing: 0.5px;
            margin-bottom: 2px;
          }
          .meta-line {
            font-size: 11.5px;
            font-weight: 500;
            line-height: 1.3;
          }
          .divider {
            border-top: 1px dashed #000;
            margin: 4px 0;
          }
          .footer-tag {
            text-align: center;
            font-weight: 700;
            font-size: 11.5px;
            letter-spacing: 1px;
            margin-top: 4px;
          }
        </style>
      </head>
      <body>
        <div class="kot-title">KOT No: ${kotNo}</div>
        <div class="meta-line">Date: ${dateStr} ${timeStr}</div>
        <div class="meta-line">Bill No: ${bill.billNumber}</div>
        <div class="meta-line" style="font-weight: 700;">Table: ${tableDisplay} (${bill.orderType})</div>

        <div class="divider"></div>

        <!-- Items with zero wasted space -->
        <div style="margin: 3px 0;">
          ${itemsHtml}
        </div>

        <div class="divider"></div>

        <div class="footer-tag">KITCHEN COPY</div>
      </body>
    </html>
  `;
}

/**
 * Triggers native 80mm printing via hidden iframe for zero dialog delay and accurate paper cut
 */
export function printReceipt(
  bill: BillRecord, 
  settings: CafeSettings, 
  mode: 'bill' | 'kot' | 'both' = 'bill'
): void {
  try {
    // If paired with a Bluetooth thermal POS printer, print directly with ESC/POS zero-waste cutter
    if (isBluetoothPrinterConnected()) {
      printDirectBluetooth(bill, settings, mode);
      return;
    }

    const printDoc = (htmlContent: string) => {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document;
      if (!doc) return;

      doc.open();
      doc.write(htmlContent);
      doc.close();

      iframe.contentWindow?.focus();
      setTimeout(() => {
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1500);
      }, 350);
    };

    if (mode === 'bill') {
      printDoc(generateTaxInvoiceHtml(bill, settings));
    } else if (mode === 'kot') {
      printDoc(generateKotHtml(bill, settings));
    } else if (mode === 'both') {
      printDoc(generateTaxInvoiceHtml(bill, settings));
      setTimeout(() => {
        printDoc(generateKotHtml(bill, settings));
      }, 800);
    }
  } catch (err) {
    console.error('Printing error:', err);
  }
}
