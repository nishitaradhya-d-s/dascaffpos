import React, { useState, useEffect } from 'react';
import { 
  Bluetooth, 
  Check, 
  X, 
  RefreshCw, 
  Printer, 
  AlertCircle, 
  ExternalLink,
  Power
} from 'lucide-react';
import { 
  isBluetoothSupported, 
  isBluetoothPrinterConnected, 
  getConnectedDeviceName, 
  connectBluetoothPrinter, 
  disconnectBluetoothPrinter,
  isEmbeddedInIframe 
} from '../../utils/bluetoothPrinter';

interface BluetoothQuickConnectProps {
  compact?: boolean;
}

export const BluetoothQuickConnect: React.FC<BluetoothQuickConnectProps> = ({ compact = false }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isIframe, setIsIframe] = useState(false);

  useEffect(() => {
    setIsConnected(isBluetoothPrinterConnected());
    setDeviceName(getConnectedDeviceName());
    setIsIframe(isEmbeddedInIframe());

    const interval = setInterval(() => {
      setIsConnected(isBluetoothPrinterConnected());
      setDeviceName(getConnectedDeviceName());
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  const handleConnect = async () => {
    setIsConnecting(true);
    setErrorMessage(null);

    try {
      const res = await connectBluetoothPrinter();
      if (res.success) {
        setIsConnected(true);
        setDeviceName(res.deviceName || 'Thermal Printer');
        setShowModal(false);
      } else {
        setErrorMessage(res.error || 'Failed to connect Bluetooth printer.');
      }
    } catch (e: any) {
      setErrorMessage(e?.message || 'Bluetooth connection error.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    await disconnectBluetoothPrinter();
    setIsConnected(false);
    setDeviceName(null);
  };

  return (
    <>
      {/* Navbar Quick Trigger Button */}
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
          isConnected
            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 shadow-2xs'
            : 'bg-[#F9F7F5] hover:bg-[#E0D7D0] text-[#4B3621] border-[#E0D7D0]'
        }`}
        title={isConnected ? `Connected: ${deviceName}` : 'Connect Bluetooth Thermal Printer'}
      >
        <Bluetooth className={`w-3.5 h-3.5 ${isConnected ? 'text-emerald-600 animate-pulse' : 'text-[#4B3621]'}`} />
        <span className="hidden sm:inline">
          {isConnected ? (deviceName ? deviceName.slice(0, 12) : 'BT Connected') : 'Connect BT'}
        </span>
        <span className="sm:hidden">
          {isConnected ? 'BT' : 'BT'}
        </span>
        {isConnected && (
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        )}
      </button>

      {/* Quick Bluetooth Connect Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D241E]/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full overflow-hidden shadow-2xl border border-[#E0D7D0] animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="p-4 bg-[#4B3621] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/10 text-amber-200 flex items-center justify-center font-bold">
                  <Bluetooth className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider font-cinzel">
                    Bluetooth Thermal Printer
                  </h3>
                  <p className="text-[11px] text-amber-100/70 font-medium">
                    Direct ESC/POS Wireless Printing
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg bg-white/10 text-white/70 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-3.5 text-xs">
              {/* Connection Status Card */}
              <div
                className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                  isConnected
                    ? 'bg-emerald-50/80 border-emerald-200'
                    : 'bg-[#F9F7F5] border-[#E0D7D0]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      isConnected
                        ? 'bg-emerald-600 text-white'
                        : 'bg-[#E0D7D0] text-[#8B7E74]'
                    }`}
                  >
                    <Printer className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-[#2D241E] flex items-center gap-1.5">
                      <span>{isConnected ? 'Printer Connected' : 'Not Connected'}</span>
                      {isConnected && (
                        <span className="text-[9px] bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded-full font-bold">
                          Ready
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#8B7E74]">
                      {isConnected
                        ? `Paired Device: ${deviceName || 'Bluetooth POS Printer'}`
                        : 'Pair with your 80mm or 58mm POS thermal printer'}
                    </p>
                  </div>
                </div>

                {isConnected && (
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    className="p-2 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 transition-colors cursor-pointer font-bold flex items-center gap-1"
                    title="Disconnect Printer"
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span className="text-[10px]">Disconnect</span>
                  </button>
                )}
              </div>

              {/* Error Message if any */}
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-[11px] flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold">Connection Notice</p>
                    <p>{errorMessage}</p>
                  </div>
                </div>
              )}

              {/* Iframe Notice */}
              {isIframe && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-[11px] flex items-start gap-2">
                  <ExternalLink className="w-3.5 h-3.5 shrink-0 text-amber-700 mt-0.5" />
                  <div>
                    <span>Web Bluetooth works best in a dedicated tab. </span>
                    <button
                      type="button"
                      onClick={() => window.open(window.location.href, '_blank')}
                      className="underline font-bold text-amber-950 hover:text-black cursor-pointer ml-1"
                    >
                      Open in New Tab ↗
                    </button>
                  </div>
                </div>
              )}

              {/* Connect Button */}
              {!isConnected && (
                <button
                  type="button"
                  disabled={isConnecting}
                  onClick={handleConnect}
                  className="w-full py-2.5 px-4 bg-[#4B3621] hover:bg-[#3D2C1B] text-white font-bold rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-60 cursor-pointer"
                >
                  {isConnecting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Scanning Bluetooth Devices...</span>
                    </>
                  ) : (
                    <>
                      <Bluetooth className="w-4 h-4 text-amber-300" />
                      <span>Pair &amp; Connect Bluetooth Printer</span>
                    </>
                  )}
                </button>
              )}

              <div className="text-[10.5px] text-[#8B7E74] space-y-1 leading-relaxed bg-[#F4F1EE] p-2.5 rounded-lg border border-[#E0D7D0]">
                <p className="font-bold text-[#4B3621]">Quick Printing Instructions:</p>
                <p>1. Turn ON your 80mm / 58mm Bluetooth Thermal Printer.</p>
                <p>2. Click <strong>Pair &amp; Connect Bluetooth Printer</strong> and select your printer from the list.</p>
                <p>3. You can also print via standard system thermal print dialog at any time.</p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-[#F9F7F5] border-t border-[#E0D7D0] flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-1.5 bg-white border border-[#E0D7D0] hover:bg-[#F4F1EE] text-[#2D241E] font-bold rounded-lg text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
