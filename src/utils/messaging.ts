import { BillRecord, CafeSettings } from '../types';

export function encodeBillToUrlSafeString(bill: BillRecord): string {
  try {
    const json = JSON.stringify(bill);
    return encodeURIComponent(btoa(unescape(encodeURIComponent(json))));
  } catch (e) {
    return bill.billNumber;
  }
}

export function decodeBillFromUrlSafeString(encoded: string): BillRecord | null {
  try {
    const decodedBtoa = atob(decodeURIComponent(encoded));
    const jsonStr = decodeURIComponent(escape(decodedBtoa));
    return JSON.parse(jsonStr) as BillRecord;
  } catch (e) {
    return null;
  }
}

export function generateWhatsAppMessage(bill: BillRecord, settings: CafeSettings): string {
  const customerGreeting = bill.customerName && bill.customerName !== 'Walk-in' 
    ? `Dear *${bill.customerName}*,` 
    : 'Dear Valued Guest,';

  return `${customerGreeting}

Thank you so much for visiting *${settings.cafeName}*! ❤️
✨ *We look forward to welcoming you back again soon!* ✨

Warm regards,
*Team ${settings.cafeName}*
📍 ${settings.address}
📞 ${settings.phone}`;
}

export function openWhatsAppShare(phone: string, bill: BillRecord, settings: CafeSettings): void {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const message = generateWhatsAppMessage(bill, settings);
  const encodedText = encodeURIComponent(message);
  
  const targetPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  const url = cleanPhone 
    ? `https://api.whatsapp.com/send?phone=${targetPhone}&text=${encodedText}`
    : `https://api.whatsapp.com/send?text=${encodedText}`;

  window.open(url, '_blank');
}
