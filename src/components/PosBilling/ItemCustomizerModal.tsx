import React, { useState, useEffect, useMemo } from 'react';
import { MenuItem, Variant, Addon, CartItem } from '../../types';
import { getStoredAddons } from '../../utils/storage';
import { X, Check, Plus, Minus, Layers } from 'lucide-react';

interface ItemCustomizerModalProps {
  item: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (item: CartItem) => void;
}

export const ItemCustomizerModal: React.FC<ItemCustomizerModalProps> = ({
  item,
  isOpen,
  onClose,
  onAddToCart,
}) => {
  const [selectedVariant, setSelectedVariant] = useState<Variant | undefined>(undefined);
  const [selectedAddons, setSelectedAddons] = useState<Addon[]>([]);
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');

  // Fetch updated add-ons with current prices from storage
  const effectiveAddons: Addon[] = useMemo(() => {
    if (!item) return [];
    const storedGlobalAddons = getStoredAddons().filter((a) => a.isAvailable);

    // If item has specific add-ons configured, update their prices from global storage
    if (item.availableAddons && item.availableAddons.length > 0) {
      return item.availableAddons.map((itemAddon) => {
        const matched = storedGlobalAddons.find(
          (g) => g.id === itemAddon.id || g.name.toLowerCase() === itemAddon.name.toLowerCase()
        );
        return matched ? { ...itemAddon, price: matched.price } : itemAddon;
      });
    }

    // Default global add-ons applicable to savory / hot / cold items
    return storedGlobalAddons.map((g) => ({
      id: g.id,
      name: g.name,
      price: g.price,
    }));
  }, [item, isOpen]);

  useEffect(() => {
    if (item) {
      if (item.variants && item.variants.length > 0) {
        setSelectedVariant(item.variants[0]);
      } else {
        setSelectedVariant(undefined);
      }
      setSelectedAddons([]);
      setQuantity(1);
      setNotes('');
    }
  }, [item, isOpen]);

  if (!isOpen || !item) return null;

  // Calculate Base Unit Price
  const basePrice = selectedVariant ? selectedVariant.price : item.price;
  const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0);
  const unitPrice = basePrice + addonsTotal;
  const totalPrice = unitPrice * quantity;

  const toggleAddon = (addon: Addon) => {
    if (selectedAddons.some((a) => a.id === addon.id)) {
      setSelectedAddons(selectedAddons.filter((a) => a.id !== addon.id));
    } else {
      setSelectedAddons([...selectedAddons, addon]);
    }
  };

  const handleAdd = () => {
    const cartItemId = `${item.id}-${selectedVariant?.name || 'default'}-${selectedAddons
      .map((a) => a.id)
      .join('-')}-${Date.now()}`;

    const cartItem: CartItem = {
      cartItemId,
      menuItemId: item.id,
      name: item.name,
      category: item.category,
      type: item.type,
      unitPrice,
      quantity,
      selectedVariant,
      addons: selectedAddons,
      notes: notes.trim() || undefined,
      totalPrice,
    };

    onAddToCart(cartItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D241E]/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl max-w-md w-full overflow-hidden shadow-2xl border border-[#E0D7D0] animate-in fade-in zoom-in duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-[#4B3621] text-white flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  item.type === 'veg'
                    ? 'bg-emerald-400'
                    : item.type === 'non-veg'
                    ? 'bg-rose-400'
                    : 'bg-amber-400'
                }`}
              />
              <h3 className="text-base font-bold text-white leading-tight">{item.name}</h3>
            </div>
            <p className="text-xs text-amber-200 font-medium mt-0.5">{item.category}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 text-white/70 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Variants / Portion Sizes */}
          {item.variants && item.variants.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-[#2D241E] uppercase tracking-wider mb-2">
                Select Portion / Size
              </label>
              <div className="grid grid-cols-2 gap-2">
                {item.variants.map((v) => {
                  const isSel = selectedVariant?.name === v.name;
                  return (
                    <button
                      key={v.name}
                      type="button"
                      onClick={() => setSelectedVariant(v)}
                      className={`p-3 rounded-lg border text-left transition-all flex items-center justify-between cursor-pointer ${
                        isSel
                          ? 'border-[#4B3621] bg-[#F4F1EE] text-[#2D241E] shadow-2xs font-bold'
                          : 'border-[#E0D7D0] hover:border-[#8B7E74] text-[#8B7E74]'
                      }`}
                    >
                      <span className="text-xs font-bold">{v.name}</span>
                      <span className="text-xs font-bold text-[#4B3621] font-mono">
                        ₹{v.price.toFixed(0)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add-ons & Extra Flavor */}
          {effectiveAddons.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-[#2D241E] uppercase tracking-wider flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-amber-700" />
                  <span>Optional Add-ons &amp; Extra Flavor</span>
                </label>
                <span className="text-[10px] text-[#8B7E74]">Updated Rates</span>
              </div>
              <div className="space-y-1.5">
                {effectiveAddons.map((addon) => {
                  const isChecked = selectedAddons.some((a) => a.id === addon.id);
                  return (
                    <button
                      key={addon.id}
                      type="button"
                      onClick={() => toggleAddon(addon)}
                      className={`w-full p-2.5 rounded-lg border text-left transition-all flex items-center justify-between cursor-pointer ${
                        isChecked
                          ? 'border-[#4B3621] bg-[#F4F1EE] text-[#2D241E]'
                          : 'border-[#E0D7D0] hover:border-[#8B7E74] text-[#8B7E74]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded-md flex items-center justify-center border ${
                            isChecked
                              ? 'bg-[#4B3621] border-[#4B3621] text-white'
                              : 'border-[#E0D7D0] bg-white'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className="text-xs font-medium text-[#2D241E]">{addon.name}</span>
                      </div>
                      <span className="text-xs font-bold text-[#4B3621] font-mono">
                        +₹{addon.price.toFixed(0)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Special Preparation Instructions / Notes */}
          <div>
            <label className="block text-xs font-bold text-[#2D241E] uppercase tracking-wider mb-1.5">
              Kitchen Instructions / Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Less spicy, oat milk, extra crispy, no onion"
              className="w-full bg-white border border-[#E0D7D0] rounded-lg p-2.5 text-xs text-[#2D241E] placeholder:text-[#8B7E74] focus:outline-hidden focus:border-[#4B3621]"
            />
          </div>
        </div>

        {/* Footer: Quantity & Add Button */}
        <div className="p-4 bg-[#F9F7F5] border-t border-[#E0D7D0] flex items-center justify-between gap-3 shrink-0">
          {/* Quantity selector */}
          <div className="flex items-center bg-white border border-[#E0D7D0] rounded-lg p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-8 h-8 flex items-center justify-center text-[#2D241E] hover:bg-[#F4F1EE] rounded-md transition-colors cursor-pointer"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="px-3 text-sm font-bold text-[#2D241E] min-w-8 text-center">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity(quantity + 1)}
              className="w-8 h-8 flex items-center justify-center text-[#2D241E] hover:bg-[#F4F1EE] rounded-md transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Add to Bill */}
          <button
            type="button"
            onClick={handleAdd}
            className="flex-1 py-3 px-4 bg-[#4B3621] hover:bg-[#3D2C1B] active:bg-[#2D241E] text-white font-bold rounded-lg text-xs sm:text-sm transition-all shadow-xs flex items-center justify-between cursor-pointer"
          >
            <span>Add to Bill</span>
            <span className="font-mono text-sm">₹{totalPrice.toFixed(2)}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
