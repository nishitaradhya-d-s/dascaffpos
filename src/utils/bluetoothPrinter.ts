import { BillRecord, CafeSettings } from '../types';
import { formatBillDate } from './printer';

/**
 * Web Bluetooth ESC/POS Direct Thermal Printer Utility
 * Supports 80mm & 58mm Bluetooth thermal printers (POS-80, PT-210, MPT-II, etc.)
 * Connects directly and triggers ESC/POS cut commands immediately when receipt text ends,
 * avoiding unnecessary paper waste.
 */

// Bluetooth GATT Service / Characteristic UUIDs commonly used by POS Printers
const PRINTER_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb', // Standard Printer Service
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // Nordic UART
  '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC
  '0000ffe0-0000-1000-8000-00805f9b34fb', // Common HM-10 / CC2541
];

let connectedDevice: any = null;
let writeCharacteristic: any = null;

export function isBluetoothSupported(): boolean {
  return typeof navigator !== 'undefined' && 'bluetooth' in navigator && typeof (navigator as any).bluetooth?.requestDevice === 'function';
}

export function isEmbeddedInIframe(): boolean {
  try {
    return typeof window !== 'undefined' && window.self !== window.top;
  } catch {
    return true;
  }
}

export function isBluetoothPrinterConnected(): boolean {
  return !!(connectedDevice && connectedDevice.gatt?.connected && writeCharacteristic);
}

export function getConnectedDeviceName(): string | null {
  return connectedDevice?.name || null;
}

/**
 * Prompt browser Bluetooth pairing dialog to connect POS Thermal Printer
 */
export async function connectBluetoothPrinter(): Promise<{ 
  success: boolean; 
  deviceName?: string; 
  error?: string;
  isIframeRestricted?: boolean;
}> {
  if (!isBluetoothSupported()) {
    return {
      success: false,
      error: 'Web Bluetooth is not supported in this browser. Please use Google Chrome, Microsoft Edge, or a Chromium-based POS browser on Android / Windows / Mac.',
    };
  }

  if (isEmbeddedInIframe()) {
    return {
      success: false,
      isIframeRestricted: true,
      error: 'Web Bluetooth device pairing is restricted by browser security policies inside embedded iframe previews. Please click "Open in New Tab" to connect directly, or use the standard Thermal Print button which works with any installed printer driver.',
    };
  }

  try {
    const device = await (navigator as any).bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: PRINTER_SERVICES,
    });

    if (!device) {
      return { success: false, error: 'No Bluetooth printer was selected.' };
    }

    const server = await device.gatt.connect();

    // Try finding the writable characteristic across services
    let charFound = null;
    for (const serviceUuid of PRINTER_SERVICES) {
      try {
        const service = await server.getPrimaryService(serviceUuid);
        const characteristics = await service.getCharacteristics();
        for (const c of characteristics) {
          if (c.properties.write || c.properties.writeWithoutResponse) {
            charFound = c;
            break;
          }
        }
      } catch {
        // service not present on this device, continue
      }
      if (charFound) break;
    }

    if (!charFound) {
      // Fallback search in all services
      try {
        const services = await server.getPrimaryServices();
        for (const s of services) {
          const chars = await s.getCharacteristics();
          for (const c of chars) {
            if (c.properties.write || c.properties.writeWithoutResponse) {
              charFound = c;
              break;
            }
          }
          if (charFound) break;
        }
      } catch {
        // Continue fallback
      }
    }

    if (!charFound) {
      return {
        success: false,
        error: 'Found Bluetooth device, but no ESC/POS printer data channel was detected.',
      };
    }

    connectedDevice = device;
    writeCharacteristic = charFound;

    device.addEventListener('gattserverdisconnected', () => {
      writeCharacteristic = null;
    });

    return {
      success: true,
      deviceName: device.name || 'Bluetooth POS Printer',
    };
  } catch (error: any) {
    const msg = error?.message || '';
    const isSecurityErr = 
      error?.name === 'SecurityError' || 
      msg.includes('permissions policy') || 
      msg.includes('disallowed') || 
      msg.includes('sandboxed') ||
      msg.includes('denied');

    if (isSecurityErr) {
      return {
        success: false,
        isIframeRestricted: true,
        error: 'Web Bluetooth pairing is restricted inside embedded preview windows. Click "Open in New Tab" to connect your printer directly, or use standard Thermal Print.',
      };
    }

    if (msg.includes('User cancelled') || msg.includes('User canceled') || error?.name === 'NotFoundError') {
      return {
        success: false,
        error: 'Bluetooth pairing was cancelled.',
      };
    }

    return {
      success: false,
      error: msg || 'Bluetooth connection could not be established.',
    };
  }
}

export async function disconnectBluetoothPrinter(): Promise<void> {
  if (connectedDevice && connectedDevice.gatt?.connected) {
    await connectedDevice.gatt.disconnect();
  }
  connectedDevice = null;
  writeCharacteristic = null;
}

/**
 * Helper to encode text and send chunks via Bluetooth GATT
 */
async function sendRawBytes(bytes: Uint8Array): Promise<void> {
  if (!writeCharacteristic) throw new Error('Printer not connected');

  // Chunk bytes to 512 bytes MTU
  const chunkSize = 128;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.slice(i, i + chunkSize);
    if (writeCharacteristic.writeValueWithoutResponse) {
      await writeCharacteristic.writeValueWithoutResponse(chunk);
    } else {
      await writeCharacteristic.writeValue(chunk);
    }
  }
}

/**
 * Builds ESC/POS byte sequence for Tax Invoice Receipt
 */
function buildEscPosTaxInvoice(bill: BillRecord, settings: CafeSettings): Uint8Array {
  const encoder = new TextEncoder();
  const buffer: number[] = [];

  const write = (str: string) => {
    const encoded = encoder.encode(str);
    for (let i = 0; i < encoded.length; i++) buffer.push(encoded[i]);
  };

  const command = (...bytes: number[]) => {
    buffer.push(...bytes);
  };

  // ESC @: Initialize Printer
  command(0x1B, 0x40);

  // Center align
  command(0x1B, 0x61, 1);
  // Double height & bold for Cafe Name
  command(0x1B, 0x21, 0x30);
  write(`${settings.cafeName}\n`);

  // Regular font
  command(0x1B, 0x21, 0x00);
  command(0x1B, 0x45, 1); // Bold ON
  write(`TAX INVOICE\n`);
  command(0x1B, 0x45, 0); // Bold OFF
  write(`ORIGINAL\n`);

  write(`${settings.address}\n`);
  write(`${settings.cityStateZip}\n`);
  write(`Caff Phone No : ${settings.phone}\n`);

  command(0x1B, 0x45, 1);
  write(`Invoice No : ${bill.billNumber}\n`);
  write(`${bill.orderType.toUpperCase()}\n`);
  command(0x1B, 0x45, 0);

  const { fullFormatted } = formatBillDate(bill.date);
  write(`${fullFormatted}\n`);

  // Divider
  write(`------------------------------------------------\n`);

  // Left align for metadata
  command(0x1B, 0x61, 0);
  const checkNo = bill.checkNumber || bill.billNumber.replace(/[^0-9]/g, '') || '001';
  const tableDisplay = bill.orderType === 'Dine-In' && bill.tableNumber 
    ? (bill.tableNumber.replace(/[^0-9]/g, '') || bill.tableNumber) 
    : 'N/A';

  write(`CHECK NO : ${checkNo.padEnd(16)} Table No: ${tableDisplay}\n`);
  write(`Customer Name: ${(bill.customerName || 'Walk-in')}\n`);
  if (bill.customerPhone) {
    write(`Customer Mobile No : ${bill.customerPhone}\n`);
  }

  write(`------------------------------------------------\n`);
  write(`QTY   PRODUCT                           AMOUNT\n`);
  write(`------------------------------------------------\n`);

  bill.items.forEach((item) => {
    const qtyStr = `${item.quantity} EA`.padEnd(6);
    const priceStr = item.totalPrice.toFixed(2).padStart(8);
    const maxNameLen = 48 - qtyStr.length - priceStr.length;
    const nameStr = item.name.length > maxNameLen ? item.name.substring(0, maxNameLen) : item.name.padEnd(maxNameLen);

    write(`${qtyStr}${nameStr}${priceStr}\n`);

    if (item.selectedVariant) {
      write(`      • ${item.selectedVariant.name}\n`);
    }
    if (item.addons && item.addons.length > 0) {
      item.addons.forEach((a) => {
        write(`      • ${a.name}\n`);
      });
    }
    if (item.comboSelections && item.comboSelections.length > 0) {
      item.comboSelections.forEach((cs) => {
        write(`      • ${cs.selectedName}\n`);
      });
    }
  });

  write(`------------------------------------------------\n`);
  write(`Sub Total:                             ${bill.taxDetails.subTotal.toFixed(2).padStart(8)}\n`);

  if (bill.taxDetails.cgstAmount > 0) {
    write(`CGST ${bill.taxDetails.cgstRate.toFixed(2)}%:                          ${bill.taxDetails.cgstAmount.toFixed(2).padStart(8)}\n`);
    write(`SGST ${bill.taxDetails.sgstRate.toFixed(2)}%:                          ${bill.taxDetails.sgstAmount.toFixed(2).padStart(8)}\n`);
  }

  if (bill.taxDetails.discountAmount > 0) {
    write(`Discount (${bill.taxDetails.discountPercent.toFixed(1)}%):                  -${bill.taxDetails.discountAmount.toFixed(2).padStart(8)}\n`);
  }

  write(`================================================\n`);
  // Total Payable (Double width / bold)
  command(0x1B, 0x45, 1);
  write(`TOTAL PAYABLE:                         ${bill.taxDetails.grandTotal.toFixed(2).padStart(8)}\n`);
  command(0x1B, 0x45, 0);
  write(`================================================\n`);

  write(`Payment Mode: ${bill.paymentMode}\n`);
  if (bill.amountPaid && bill.amountPaid > 0) {
    write(`Cash Received: ₹${bill.amountPaid.toFixed(2)}\n`);
  }
  if (bill.changeReturned && bill.changeReturned > 0) {
    command(0x1B, 0x45, 1);
    write(`Return Change: ₹${bill.changeReturned.toFixed(2)}\n`);
    command(0x1B, 0x45, 0);
  }

  write(`------------------------------------------------\n`);
  if (settings.sac) write(`SAC : ${settings.sac}\n`);
  if (settings.gstin) write(`GST NO : ${settings.gstin}\n`);
  if (settings.cin) write(`CIN : ${settings.cin}\n`);
  if (settings.fssaiNumber) write(`FSSAI : ${settings.fssaiNumber}\n`);

  write(`------------------------------------------------\n`);
  command(0x1B, 0x61, 1); // Center
  write(`${settings.termsAndConditions || '*** HAVE A DELICIOUS DAY ***'}\n\n`);

  // Direct cut without feeding excess blank paper (GS V 65 0)
  command(0x1D, 0x56, 0x41, 0x00);

  return new Uint8Array(buffer);
}

/**
 * Builds ESC/POS byte sequence for KOT Kitchen Ticket
 */
function buildEscPosKot(bill: BillRecord): Uint8Array {
  const encoder = new TextEncoder();
  const buffer: number[] = [];

  const write = (str: string) => {
    const encoded = encoder.encode(str);
    for (let i = 0; i < encoded.length; i++) buffer.push(encoded[i]);
  };

  const command = (...bytes: number[]) => {
    buffer.push(...bytes);
  };

  // Initialize
  command(0x1B, 0x40);

  // Center align
  command(0x1B, 0x61, 1);
  command(0x1B, 0x21, 0x30); // Double size & bold
  const kotNo = bill.kotNumber || '001';
  write(`KOT: ${kotNo}\n`);

  command(0x1B, 0x21, 0x00); // Regular
  command(0x1B, 0x61, 0); // Left align
  const { dateStr, timeStr } = formatBillDate(bill.date);
  write(`Date: ${dateStr} ${timeStr}\n`);
  write(`Bill: ${bill.billNumber}\n`);
  command(0x1B, 0x45, 1);
  write(`Customer: ${bill.customerName || 'Walk-in'}\n`);
  if (bill.customerPhone) {
    write(`Phone: ${bill.customerPhone}\n`);
  }
  write(`Table: ${bill.tableNumber || 'T-1'} (${bill.orderType})\n`);
  command(0x1B, 0x45, 0);

  write(`------------------------------------------------\n`);
  command(0x1B, 0x45, 1);

  bill.items.forEach((item) => {
    write(`${item.name}  x ${item.quantity}\n`);
    if (item.selectedVariant) {
      write(`  - ${item.selectedVariant.name}\n`);
    }
    if (item.addons && item.addons.length > 0) {
      item.addons.forEach((a) => {
        write(`  + ${a.name}\n`);
      });
    }
    if (item.notes) {
      write(`  * Prep: ${item.notes}\n`);
    }
  });

  command(0x1B, 0x45, 0);
  write(`------------------------------------------------\n`);
  command(0x1B, 0x61, 1);
  command(0x1B, 0x45, 1);
  write(`KITCHEN COPY\n\n`);
  command(0x1B, 0x45, 0);

  // Cut directly at text end
  command(0x1D, 0x56, 0x41, 0x00);

  return new Uint8Array(buffer);
}

/**
 * Direct Print to Bluetooth Thermal Printer
 */
export async function printDirectBluetooth(
  bill: BillRecord,
  settings: CafeSettings,
  mode: 'bill' | 'kot' | 'both' = 'bill'
): Promise<boolean> {
  if (!isBluetoothPrinterConnected()) {
    return false;
  }

  try {
    if (mode === 'bill' || mode === 'both') {
      const bytes = buildEscPosTaxInvoice(bill, settings);
      await sendRawBytes(bytes);
    }

    if (mode === 'kot' || mode === 'both') {
      if (mode === 'both') {
        // Small delay between bill & kot cut
        await new Promise((r) => setTimeout(r, 400));
      }
      const bytes = buildEscPosKot(bill);
      await sendRawBytes(bytes);
    }

    return true;
  } catch (err) {
    console.error('Error during bluetooth print:', err);
    return false;
  }
}
