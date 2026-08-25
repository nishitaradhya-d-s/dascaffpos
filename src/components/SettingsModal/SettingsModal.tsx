import React, { useState } from 'react';
import { CafeSettings } from '../../types';
import { 
  X, 
  Save, 
  Building2, 
  Printer, 
  Lock, 
  RotateCcw, 
  Check, 
  FileText,
  Phone,
  Percent,
  Bluetooth,
  KeyRound,
  Eye,
  EyeOff,
  Hash,
  ExternalLink,
  Info
} from 'lucide-react';
import { resetInvoiceSequence } from '../../utils/storage';
import { 
  connectBluetoothPrinter, 
  disconnectBluetoothPrinter, 
  isBluetoothPrinterConnected, 
  getConnectedDeviceName, 
  isBluetoothSupported,
  isEmbeddedInIframe
} from '../../utils/bluetoothPrinter';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: CafeSettings;
  onSave?: (newSettings: CafeSettings) => void;
  onSaveSettings?: (newSettings: CafeSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
  onSaveSettings,
}) => {
  const [formData, setFormData] = useState<CafeSettings>({ ...settings });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [resetSeqNumber, setResetSeqNumber] = useState<number>(1);
  const [seqResetSuccess, setSeqResetSuccess] = useState(false);
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [showManagerPass, setShowManagerPass] = useState(false);
  const [btStatus, setBtStatus] = useState<string | null>(
    isBluetoothPrinterConnected() ? getConnectedDeviceName() : null
  );
  const [btLoading, setBtLoading] = useState(false);
  const [btAlertMessage, setBtAlertMessage] = useState<string | null>(null);

  // Keep form data synchronized when modal opens or settings change
  React.useEffect(() => {
    if (isOpen) {
      setFormData({ ...settings });
      setBtStatus(isBluetoothPrinterConnected() ? getConnectedDeviceName() : null);
      setBtAlertMessage(null);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleChange = (field: keyof CafeSettings, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleResetSequence = () => {
    resetInvoiceSequence(resetSeqNumber);
    setSeqResetSuccess(true);
    setTimeout(() => {
      setSeqResetSuccess(false);
    }, 2500);
  };

  const handleConnectBt = async () => {
    setBtLoading(true);
    const res = await connectBluetoothPrinter();
    setBtLoading(false);
    if (res.success) {
      setBtStatus(res.deviceName || 'Connected POS Printer');
      setBtAlertMessage(null);
    } else {
      setBtAlertMessage(res.error || 'Could not connect to Bluetooth printer');
    }
  };

  const handleOpenStandalone = () => {
    try {
      window.open(window.location.href, '_blank');
    } catch {
      // ignore
    }
  };

  const handleDisconnectBt = async () => {
    await disconnectBluetoothPrinter();
    setBtStatus(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof onSave === 'function') {
      onSave(formData);
    }
    if (typeof onSaveSettings === 'function') {
      onSaveSettings(formData);
    }
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D241E]/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl max-w-xl w-full overflow-hidden shadow-2xl border border-[#E0D7D0] animate-in fade-in zoom-in duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-[#4B3621] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 text-amber-200 flex items-center justify-center font-bold font-cinzel">
              DC
            </div>
            <div>
              <h2 className="text-base font-bold uppercase tracking-wider font-cinzel text-white">
                DAS CAFF POS &amp; Invoice Settings
              </h2>
              <p className="text-[11px] text-amber-100/70 font-medium">
                Business Details, Passwords, Counter Reset &amp; Thermal Printer
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 text-white/70 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Section 1: Business Identity */}
          <div className="bg-[#F9F7F5] p-4 rounded-xl border border-[#E0D7D0] space-y-3">
            <div className="flex items-center gap-1.5 font-bold text-[#2D241E] text-xs uppercase tracking-wider">
              <Building2 className="w-4 h-4 text-[#4B3621]" />
              <span>Cafe Business Identity</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#2D241E] mb-1">
                  Cafe Name (Header in Cinzel font)
                </label>
                <input
                  type="text"
                  value={formData.cafeName}
                  onChange={(e) => handleChange('cafeName', e.target.value)}
                  required
                  className="w-full bg-white border border-[#E0D7D0] rounded-lg p-2 font-bold text-[#2D241E] focus:outline-hidden focus:border-[#4B3621]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#2D241E] mb-1">Tagline</label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => handleChange('tagline', e.target.value)}
                  className="w-full bg-white border border-[#E0D7D0] rounded-lg p-2 text-[#2D241E] focus:outline-hidden focus:border-[#4B3621]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#2D241E] mb-1">
                Full Cafe Address (Printed on Bill)
              </label>
              <textarea
                rows={2}
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className="w-full bg-white border border-[#E0D7D0] rounded-lg p-2 text-[#2D241E] focus:outline-hidden focus:border-[#4B3621]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#2D241E] mb-1">
                  GSTIN (Tax ID)
                </label>
                <input
                  type="text"
                  value={formData.gstin || formData.gstNumber || ''}
                  onChange={(e) => {
                    handleChange('gstin', e.target.value);
                    handleChange('gstNumber', e.target.value);
                  }}
                  required
                  className="w-full bg-white border border-[#E0D7D0] rounded-lg p-2 font-mono font-bold text-[#2D241E] focus:outline-hidden focus:border-[#4B3621]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#2D241E] mb-1">
                  FSSAI License #
                </label>
                <input
                  type="text"
                  value={formData.fssaiNumber || ''}
                  onChange={(e) => handleChange('fssaiNumber', e.target.value)}
                  className="w-full bg-white border border-[#E0D7D0] rounded-lg p-2 font-mono text-[#2D241E] focus:outline-hidden focus:border-[#4B3621]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#2D241E] mb-1">
                  Contact Phone (Bill &amp; WhatsApp)
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full bg-white border border-[#E0D7D0] rounded-lg p-2 font-mono text-[#2D241E] focus:outline-hidden focus:border-[#4B3621]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#2D241E] mb-1">
                  UPI ID for Customer QR code
                </label>
                <input
                  type="text"
                  value={formData.upiId || ''}
                  onChange={(e) => handleChange('upiId', e.target.value)}
                  placeholder="e.g. 9876543210@upi"
                  className="w-full bg-white border border-[#E0D7D0] rounded-lg p-2 font-mono text-[#2D241E] focus:outline-hidden focus:border-[#4B3621]"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Password Management (Login & Admin) */}
          <div className="bg-[#F9F7F5] p-4 rounded-xl border border-[#E0D7D0] space-y-3">
            <div className="flex items-center gap-1.5 font-bold text-[#2D241E] text-xs uppercase tracking-wider">
              <KeyRound className="w-4 h-4 text-[#4B3621]" />
              <span>Password &amp; Access Management</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#2D241E] mb-1">
                  POS Staff Login Username
                </label>
                <input
                  type="text"
                  value={formData.loginUsername || 'DASCAFF'}
                  onChange={(e) => handleChange('loginUsername', e.target.value)}
                  required
                  className="w-full bg-white border border-[#E0D7D0] rounded-lg p-2 font-mono font-bold text-[#2D241E] focus:outline-hidden focus:border-[#4B3621]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#2D241E] mb-1">
                  POS Staff Login Password
                </label>
                <div className="relative">
                  <input
                    type={showLoginPass ? 'text' : 'password'}
                    value={formData.loginPassword || 'rakdas@098'}
                    onChange={(e) => handleChange('loginPassword', e.target.value)}
                    required
                    className="w-full bg-white border border-[#E0D7D0] rounded-lg p-2 pr-9 font-mono font-bold text-[#2D241E] focus:outline-hidden focus:border-[#4B3621]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPass(!showLoginPass)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black cursor-pointer"
                  >
                    {showLoginPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#2D241E] mb-1">
                Admin / Manager Security Password (for Reports, Settings &amp; Inventory)
              </label>
              <div className="relative">
                <input
                  type={showManagerPass ? 'text' : 'password'}
                  value={formData.managerPassword || ''}
                  onChange={(e) => handleChange('managerPassword', e.target.value)}
                  placeholder="Set Manager Password (optional)"
                  className="w-full bg-white border border-[#E0D7D0] rounded-lg p-2 pr-9 font-mono font-bold text-[#2D241E] focus:outline-hidden focus:border-[#4B3621]"
                />
                <button
                  type="button"
                  onClick={() => setShowManagerPass(!showManagerPass)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black cursor-pointer"
                >
                  {showManagerPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <span className="text-[10px] text-[#8B7E74]">Set a custom security password to restrict access to manager sections</span>
            </div>
          </div>

          {/* Section 3: Reset Invoice Sequence (Without deleting past bills) */}
          <div className="bg-[#F9F7F5] p-4 rounded-xl border border-[#E0D7D0] space-y-3">
            <div className="flex items-center gap-1.5 font-bold text-[#2D241E] text-xs uppercase tracking-wider">
              <RotateCcw className="w-4 h-4 text-[#4B3621]" />
              <span>Reset Invoice &amp; Check Number Sequence</span>
            </div>

            <p className="text-[11px] text-[#5C4D41]">
              Reset the numbering sequence (e.g. start next bill from <strong>INV-001</strong>). 
              <strong>Note:</strong> All your past bill records, customer history, and GST data will remain completely safe and never be deleted.
            </p>

            <div className="flex items-center gap-3">
              <div className="w-32">
                <label className="block text-[10px] font-bold text-[#2D241E] mb-1">Start Number</label>
                <input
                  type="number"
                  min="1"
                  value={resetSeqNumber}
                  onChange={(e) => setResetSeqNumber(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full bg-white border border-[#E0D7D0] rounded-lg p-2 font-mono font-bold text-center text-[#2D241E]"
                />
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={handleResetSequence}
                  className="py-2 px-3.5 bg-white border border-[#4B3621] text-[#4B3621] hover:bg-[#4B3621] hover:text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  {seqResetSuccess ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">Sequence Reset to {String(resetSeqNumber).padStart(3, '0')}!</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset Bill Sequence</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Section 4: Tax, Discount & Coupon Configuration */}
          <div className="bg-[#F9F7F5] p-4 rounded-xl border border-[#E0D7D0] space-y-3">
            <div className="flex items-center gap-1.5 font-bold text-[#2D241E] text-xs uppercase tracking-wider">
              <Percent className="w-4 h-4 text-[#4B3621]" />
              <span>Tax, Discount &amp; Coupon Configuration</span>
            </div>

            {/* 1. Discount Option ON/OFF Toggle */}
            <div className="bg-white p-3 rounded-lg border border-[#E0D7D0] flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-[#2D241E] flex items-center gap-1.5">
                  <span>1. Show Manual Discount (% / Flat ₹) in POS</span>
                  {formData.isDiscountEnabled !== false ? (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                      ENABLED (ON)
                    </span>
                  ) : (
                    <span className="text-[10px] bg-gray-100 text-gray-700 font-bold px-1.5 py-0.5 rounded">
                      DISABLED (OFF)
                    </span>
                  )}
                </div>
                <p className="text-[10.5px] text-[#8B7E74] mt-0.5">
                  When turned OFF, manual discount chips (0%, 5%, 10%...) and custom % / ₹ input boxes are hidden in POS billing.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
                <input
                  type="checkbox"
                  checked={formData.isDiscountEnabled !== false}
                  onChange={(e) => handleChange('isDiscountEnabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4B3621]"></div>
              </label>
            </div>

            {/* 2. Coupon Code Option ON/OFF Toggle */}
            <div className="bg-white p-3 rounded-lg border border-[#E0D7D0] flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-[#2D241E] flex items-center gap-1.5">
                  <span>2. Show Coupon Code Entry in POS</span>
                  {formData.isCouponEnabled !== false ? (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                      ENABLED (ON)
                    </span>
                  ) : (
                    <span className="text-[10px] bg-gray-100 text-gray-700 font-bold px-1.5 py-0.5 rounded">
                      DISABLED (OFF)
                    </span>
                  )}
                </div>
                <p className="text-[10.5px] text-[#8B7E74] mt-0.5">
                  When turned OFF, the coupon code text field and voucher auto-apply are hidden in POS billing.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
                <input
                  type="checkbox"
                  checked={formData.isCouponEnabled !== false}
                  onChange={(e) => handleChange('isCouponEnabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4B3621]"></div>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#2D241E] mb-1">
                  Default GST Rate (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="28"
                  value={formData.defaultGstRate}
                  onChange={(e) => handleChange('defaultGstRate', parseFloat(e.target.value) || 0)}
                  required
                  className="w-full bg-white border border-[#E0D7D0] rounded-lg p-2 font-mono font-bold text-[#2D241E] focus:outline-hidden focus:border-[#4B3621]"
                />
                <span className="text-[10px] text-[#8B7E74]">5% standard restaurant rate</span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#2D241E] mb-1">
                  Invoice Number Prefix
                </label>
                <input
                  type="text"
                  value={formData.invoicePrefix}
                  onChange={(e) => handleChange('invoicePrefix', e.target.value)}
                  className="w-full bg-white border border-[#E0D7D0] rounded-lg p-2 font-mono font-bold text-[#2D241E] focus:outline-hidden focus:border-[#4B3621]"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Thermal & Bluetooth Printer Configuration */}
          <div className="bg-[#F9F7F5] p-4 rounded-xl border border-[#E0D7D0] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-[#2D241E] text-xs uppercase tracking-wider">
                <Printer className="w-4 h-4 text-[#4B3621]" />
                <span>Thermal &amp; Bluetooth Printer</span>
              </div>

              {isBluetoothSupported() && (
                <div className="flex items-center gap-2">
                  {btStatus ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                        <Bluetooth className="w-3 h-3 text-emerald-600" />
                        {btStatus}
                      </span>
                      <button
                        type="button"
                        onClick={handleDisconnectBt}
                        className="text-[10px] text-red-600 underline hover:text-red-800 cursor-pointer"
                      >
                        Disconnect
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleConnectBt}
                      disabled={btLoading}
                      className="px-2.5 py-1 bg-white border border-[#4B3621] text-[#4B3621] hover:bg-[#F4F1EE] rounded-md font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Bluetooth className="w-3.5 h-3.5 text-[#4B3621]" />
                      <span>{btLoading ? 'Scanning...' : 'Pair Bluetooth Printer'}</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Bluetooth in iFrame helper notice */}
            {isEmbeddedInIframe() && (
              <div className="p-2.5 bg-amber-50 border border-amber-200/80 rounded-lg text-xs text-[#2D241E] flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1">
                  <div className="font-bold text-amber-900 text-[11px]">
                    Wireless Bluetooth Pairing Notice
                  </div>
                  <p className="text-[10.5px] text-amber-800 leading-relaxed">
                    Browser security policies disable Bluetooth hardware access inside embedded preview windows.
                    For direct wireless Bluetooth pairing, open the app in a standalone browser tab.
                  </p>
                  <button
                    type="button"
                    onClick={handleOpenStandalone}
                    className="mt-1 inline-flex items-center gap-1 px-2.5 py-1 bg-[#4B3621] text-white text-[10px] font-bold rounded-md hover:bg-[#3D2C1B] cursor-pointer"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Open App in New Tab to Pair</span>
                  </button>
                </div>
              </div>
            )}

            {/* Alert Message for BT */}
            {btAlertMessage && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start justify-between gap-2">
                <span className="text-[11px] leading-relaxed">{btAlertMessage}</span>
                <button
                  type="button"
                  onClick={() => setBtAlertMessage(null)}
                  className="text-rose-700 font-bold hover:text-rose-900 shrink-0 text-xs cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            <div className="text-[11px] text-[#2D241E] bg-white p-3 rounded-lg border border-[#E0D7D0]">
              Optimized for <strong>80mm Autocut Thermal Printers</strong> (e.g. Helett BillQuick Lite 80mm). 
              The receipt cuts cleanly right when text ends to eliminate paper waste.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#2D241E] mb-1">
                  Thermal Paper Width (mm)
                </label>
                <select
                  value={formData.printerWidth || formData.thermalPaperWidth || '80mm'}
                  onChange={(e) => {
                    handleChange('printerWidth', e.target.value);
                    handleChange('thermalPaperWidth', e.target.value);
                  }}
                  className="w-full bg-white border border-[#E0D7D0] rounded-lg p-2 font-bold text-[#2D241E] focus:outline-hidden"
                >
                  <option value="80mm">80mm / 3 inch (Helett BillQuick™ Autocut)</option>
                  <option value="58mm">58mm / 2 inch (Standard mini)</option>
                </select>
              </div>

              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.autoCut ?? formData.autoCutPaper ?? true}
                    onChange={(e) => {
                      handleChange('autoCut', e.target.checked);
                      handleChange('autoCutPaper', e.target.checked);
                    }}
                    className="rounded-md border-[#E0D7D0] text-[#4B3621] focus:ring-0 w-4 h-4 cursor-pointer"
                  />
                  <span className="font-bold text-[#2D241E] text-xs">Enable Auto-Cut Signal</span>
                </label>
              </div>
            </div>
          </div>

          {/* Footer Save Button */}
          <div className="pt-3 flex items-center justify-between border-t border-[#E0D7D0] shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 bg-white hover:bg-[#F4F1EE] text-[#4B3621] border border-[#E0D7D0] font-bold rounded-lg text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="py-2.5 px-6 bg-[#4B3621] hover:bg-[#3D2C1B] active:bg-[#2D241E] text-white font-bold rounded-lg text-xs transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save All Settings</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

