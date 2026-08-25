import React, { useState, useEffect } from 'react';
import { CouponCode } from '../../types';
import { 
  getStoredCoupons, 
  addCouponCode, 
  deleteCouponCode, 
  toggleCouponActive,
  saveCoupons 
} from '../../utils/storage';
import { 
  Tag, 
  Plus, 
  Trash2, 
  Check, 
  X, 
  Percent, 
  IndianRupee, 
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Search,
  Sparkles,
  ShoppingBag,
  Info
} from 'lucide-react';

export const CouponManagerSection: React.FC = () => {
  const [coupons, setCoupons] = useState<CouponCode[]>(() => getStoredCoupons());
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newType, setNewType] = useState<'percent' | 'flat'>('percent');
  const [newValue, setNewValue] = useState<string>('');
  const [newMinBill, setNewMinBill] = useState<string>('');
  const [newDescription, setNewDescription] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refreshCoupons = () => {
    setCoupons(getStoredCoupons());
  };

  useEffect(() => {
    refreshCoupons();
  }, []);

  const handleAddCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const codeClean = newCode.trim().toUpperCase().replace(/\s+/g, '');
    if (!codeClean) {
      setErrorMessage('Please enter a coupon code name (e.g. DAS20, WELCOME10)');
      return;
    }

    const val = parseFloat(newValue);
    if (isNaN(val) || val <= 0) {
      setErrorMessage('Please enter a valid positive discount value');
      return;
    }

    if (newType === 'percent' && val > 100) {
      setErrorMessage('Percentage discount cannot exceed 100%');
      return;
    }

    const minAmount = newMinBill ? parseFloat(newMinBill) : 0;

    const exists = coupons.some((c) => c.code.toUpperCase() === codeClean);
    if (exists) {
      setErrorMessage(`Coupon code "${codeClean}" already exists! Please choose another code.`);
      return;
    }

    addCouponCode({
      code: codeClean,
      type: newType,
      value: val,
      minBillAmount: minAmount > 0 ? minAmount : undefined,
      description: newDescription.trim() || undefined,
      isActive: true,
    });

    refreshCoupons();

    // Reset form
    setNewCode('');
    setNewValue('');
    setNewMinBill('');
    setNewDescription('');
    setIsAdding(false);
  };

  const handleDelete = (couponId: string, code: string) => {
    if (window.confirm(`Are you sure you want to delete coupon code "${code}"?`)) {
      deleteCouponCode(couponId);
      refreshCoupons();
    }
  };

  const handleToggle = (couponId: string) => {
    toggleCouponActive(couponId);
    refreshCoupons();
  };

  const filteredCoupons = coupons.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.code.toLowerCase().includes(q) ||
      (c.description && c.description.toLowerCase().includes(q)) ||
      c.value.toString().includes(q)
    );
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#F4F1EE]">
      {/* Top Banner / Actions */}
      <div className="p-4 bg-white border-b border-[#E0D7D0] space-y-3 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#4B3621] text-amber-200 flex items-center justify-center font-bold shadow-xs">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-[#2D241E] leading-tight">
                  Coupon Codes &amp; Discount Vouchers
                </h2>
                <span className="text-xs bg-[#4B3621] text-amber-200 font-mono font-bold px-2 py-0.5 rounded-full">
                  {coupons.filter((c) => c.isActive).length} Active
                </span>
              </div>
              <p className="text-xs text-[#8B7E74] font-medium">
                Set coupon codes with % or flat ₹ discounts and min bill requirements. Cashiers can enter the code in POS billing to auto-apply discounts.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isAdding && (
              <button
                type="button"
                onClick={() => setIsAdding(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#4B3621] hover:bg-[#3D2C1B] active:bg-[#2D241E] text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>+ Create New Coupon Code</span>
              </button>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="w-3.5 h-3.5 text-[#8B7E74] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search coupons by code name or description..."
            className="w-full bg-[#F9F7F5] border border-[#E0D7D0] rounded-lg py-1.5 pl-8 pr-3 text-xs text-[#2D241E] focus:outline-hidden focus:border-[#4B3621]"
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Create Coupon Card/Form */}
        {isAdding && (
          <form
            onSubmit={handleAddCoupon}
            className="bg-white border-2 border-[#4B3621] rounded-xl p-4 shadow-md space-y-3.5 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b border-[#E0D7D0] pb-2.5">
              <span className="font-bold text-[#4B3621] text-xs uppercase tracking-wider flex items-center gap-1.5 font-cinzel">
                <Tag className="w-4 h-4 text-[#4B3621]" />
                <span>Create New Coupon Code</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setErrorMessage(null);
                }}
                className="p-1 text-[#8B7E74] hover:text-[#2D241E] rounded-md hover:bg-[#F4F1EE] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#2D241E] uppercase mb-1">
                  Coupon Code Name *
                </label>
                <input
                  type="text"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                  placeholder="e.g. WELCOME10, DAS50"
                  required
                  className="w-full bg-[#F9F7F5] border border-[#E0D7D0] rounded-lg p-2 font-mono font-black text-sm text-[#4B3621] uppercase tracking-wider focus:outline-hidden focus:border-[#4B3621] focus:bg-white"
                />
                <span className="text-[10px] text-[#8B7E74] mt-0.5 block">
                  Cashiers will enter this exact code in POS
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#2D241E] uppercase mb-1">
                  Discount Type *
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setNewType('percent')}
                    className={`py-2 px-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      newType === 'percent'
                        ? 'bg-[#4B3621] text-white shadow-xs'
                        : 'bg-[#F9F7F5] border border-[#E0D7D0] text-[#2D241E] hover:bg-white'
                    }`}
                  >
                    <Percent className="w-3.5 h-3.5" />
                    <span>Percentage %</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewType('flat')}
                    className={`py-2 px-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      newType === 'flat'
                        ? 'bg-[#4B3621] text-white shadow-xs'
                        : 'bg-[#F9F7F5] border border-[#E0D7D0] text-[#2D241E] hover:bg-white'
                    }`}
                  >
                    <IndianRupee className="w-3.5 h-3.5" />
                    <span>Flat ₹</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#2D241E] uppercase mb-1">
                  Discount Value ({newType === 'percent' ? '%' : '₹'}) *
                </label>
                <input
                  type="number"
                  min="0.1"
                  max={newType === 'percent' ? '100' : undefined}
                  step={newType === 'percent' ? '0.5' : '1'}
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder={newType === 'percent' ? 'e.g. 10 (for 10%)' : 'e.g. 50 (for ₹50 off)'}
                  required
                  className="w-full bg-[#F9F7F5] border border-[#E0D7D0] rounded-lg p-2 font-mono font-bold text-sm text-[#2D241E] focus:outline-hidden focus:border-[#4B3621] focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#2D241E] uppercase mb-1">
                  Minimum Bill Amount (Optional ₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={newMinBill}
                  onChange={(e) => setNewMinBill(e.target.value)}
                  placeholder="e.g. 200 (Leave blank for no minimum)"
                  className="w-full bg-[#F9F7F5] border border-[#E0D7D0] rounded-lg p-2 font-mono text-xs text-[#2D241E] focus:outline-hidden focus:border-[#4B3621] focus:bg-white"
                />
                <span className="text-[10px] text-[#8B7E74] mt-0.5 block">
                  Code will only apply if cart subtotal is at least this amount
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#2D241E] uppercase mb-1">
                  Description / Terms (Optional)
                </label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="e.g. 10% discount on total bill for family orders"
                  className="w-full bg-[#F9F7F5] border border-[#E0D7D0] rounded-lg p-2 text-xs text-[#2D241E] focus:outline-hidden focus:border-[#4B3621] focus:bg-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E0D7D0]">
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setErrorMessage(null);
                }}
                className="px-4 py-2 rounded-lg border border-[#E0D7D0] text-[#2D241E] hover:bg-[#F4F1EE] font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-[#4B3621] hover:bg-[#3D2C1B] text-white font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Save Coupon Code</span>
              </button>
            </div>
          </form>
        )}

        {/* Coupons List / Cards */}
        {filteredCoupons.length === 0 ? (
          <div className="text-center py-16 bg-white border border-[#E0D7D0] rounded-xl p-8 space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#F4F1EE] text-[#4B3621] flex items-center justify-center mx-auto">
              <Tag className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#2D241E]">No Coupon Codes Found</h3>
              <p className="text-xs text-[#8B7E74] max-w-sm mx-auto mt-1">
                {searchQuery
                  ? 'No coupons match your search keyword. Try clearing the filter.'
                  : 'Click "+ Create New Coupon Code" above to set up your first discount voucher.'}
              </p>
            </div>
            {!isAdding && (
              <button
                type="button"
                onClick={() => setIsAdding(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#4B3621] text-white font-bold text-xs rounded-lg hover:bg-[#3D2C1B] cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create First Coupon</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {filteredCoupons.map((coupon) => (
              <div
                key={coupon.id}
                className={`bg-white rounded-xl border p-4 transition-all flex flex-col justify-between space-y-3 ${
                  coupon.isActive
                    ? 'border-[#E0D7D0] shadow-xs hover:border-[#4B3621]/40'
                    : 'border-[#E0D7D0] bg-[#F9F7F5]/80 opacity-70'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-sm text-[#4B3621] bg-[#F4F1EE] px-2.5 py-1 rounded-md border border-[#E0D7D0] tracking-wider">
                        {coupon.code}
                      </span>
                      {coupon.isActive ? (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                          Active
                        </span>
                      ) : (
                        <span className="text-[10px] bg-gray-200 text-gray-700 font-bold px-2 py-0.5 rounded-full">
                          Disabled
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[#5C4D41] line-clamp-2">
                      {coupon.description || (coupon.type === 'percent' ? `${coupon.value}% discount on billing` : `Flat ₹${coupon.value} off`)}
                    </p>
                  </div>

                  {/* Value Badge */}
                  <div className="text-right shrink-0">
                    <div className="text-base font-black font-mono text-[#2D241E]">
                      {coupon.type === 'percent' ? `${coupon.value}%` : `₹${coupon.value}`}
                    </div>
                    <span className="text-[9px] uppercase font-bold text-[#8B7E74]">
                      {coupon.type === 'percent' ? 'Percentage OFF' : 'Flat Discount'}
                    </span>
                  </div>
                </div>

                {/* Requirements info */}
                <div className="pt-2 border-t border-[#E0D7D0] flex items-center justify-between text-[11px] text-[#8B7E74]">
                  <div>
                    {coupon.minBillAmount && coupon.minBillAmount > 0 ? (
                      <span className="font-medium text-[#4B3621]">
                        Min Bill: <strong>₹{coupon.minBillAmount}</strong>
                      </span>
                    ) : (
                      <span className="text-emerald-700 font-medium">No Min Bill Required</span>
                    )}
                  </div>

                  {/* Actions: Toggle and Delete */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggle(coupon.id)}
                      className={`px-2 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                        coupon.isActive
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-300'
                      }`}
                      title={coupon.isActive ? 'Disable Coupon' : 'Enable Coupon'}
                    >
                      {coupon.isActive ? (
                        <>
                          <ToggleRight className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Enabled</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-3.5 h-3.5 text-gray-500" />
                          <span>Disabled</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(coupon.id, coupon.code)}
                      className="p-1.5 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer"
                      title="Delete Coupon"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 bg-[#F9F7F5] border-t border-[#E0D7D0] flex items-center justify-between text-xs text-[#8B7E74] shrink-0">
        <div className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-[#4B3621]" />
          <span>
            Cashiers enter coupon codes in POS billing (Cart Panel). The discount auto-calculates according to the rules set here.
          </span>
        </div>
      </div>
    </div>
  );
};
