import React, { useState, useEffect } from 'react';
import { ComboItem, ComboSlot, MenuItem, CartItem } from '../../types';
import { X, Check, Plus, Minus, PackageOpen, UtensilsCrossed } from 'lucide-react';

interface ComboSelectorModalProps {
  combo: ComboItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (item: CartItem) => void;
  menuItems: MenuItem[];
}

export const ComboSelectorModal: React.FC<ComboSelectorModalProps> = ({
  combo,
  isOpen,
  onClose,
  onAddToCart,
  menuItems,
}) => {
  // Key: slotId, Value: { name: string, priceDelta?: number }
  const [selections, setSelections] = useState<{ [slotId: string]: { name: string; priceDelta?: number } }>({});
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (combo && combo.slots) {
      const initial: { [slotId: string]: { name: string; priceDelta?: number } } = {};
      combo.slots.forEach((slot) => {
        if (slot.type === 'category' && slot.category) {
          const matching = menuItems.filter((m) => m.category === slot.category && m.isAvailable);
          if (matching.length > 0) {
            initial[slot.id] = { name: matching[0].name };
          }
        } else if (slot.customOptions && slot.customOptions.length > 0) {
          initial[slot.id] = {
            name: slot.customOptions[0].name,
            priceDelta: slot.customOptions[0].priceDelta,
          };
        }
      });
      setSelections(initial);
      setQuantity(1);
      setNotes('');
    }
  }, [combo, menuItems]);

  if (!isOpen || !combo) return null;

  // Calculate Unit Price with any slot price delta
  let extraDelta = 0;
  Object.values(selections).forEach((s: { name: string; priceDelta?: number }) => {
    if (s && s.priceDelta) extraDelta += s.priceDelta;
  });

  const unitPrice = combo.price + extraDelta;
  const totalPrice = unitPrice * quantity;

  const handleSelectOption = (slotId: string, name: string, priceDelta?: number) => {
    setSelections((prev) => ({
      ...prev,
      [slotId]: { name, priceDelta },
    }));
  };

  const handleAdd = () => {
    const formattedSelections = combo.slots.map((slot) => ({
      slotTitle: slot.title,
      selectedName: selections[slot.id]?.name || 'Standard',
      priceDelta: selections[slot.id]?.priceDelta,
    }));

    const formattedSummary = formattedSelections
      .map((s) => `• ${s.selectedName}`)
      .join(', ');

    const cartItemId = `combo-${combo.id}-${Date.now()}`;

    const cartItem: CartItem = {
      cartItemId,
      menuItemId: combo.id,
      name: combo.name,
      category: 'Combos',
      type: combo.type,
      unitPrice,
      quantity,
      comboSelections: formattedSelections,
      notes: notes.trim() 
        ? `${formattedSummary} (Note: ${notes.trim()})`
        : formattedSummary,
      totalPrice,
      isCombo: true,
    };

    onAddToCart(cartItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D241E]/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl max-w-lg w-full overflow-hidden shadow-2xl border border-[#E0D7D0] animate-in fade-in zoom-in duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-[#4B3621] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400/20 text-amber-300 flex items-center justify-center font-bold">
              <PackageOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    combo.type === 'veg' ? 'bg-emerald-400' : 'bg-rose-400'
                  }`}
                />
                <h3 className="text-base font-bold text-white leading-tight">{combo.name}</h3>
              </div>
              <p className="text-[11px] text-amber-200 font-medium">
                {combo.description || 'Special Meal Deal Bundle'}
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

        {/* Live Active Selection Banner */}
        <div className="bg-amber-50 border-b border-amber-200/80 px-4 py-2 flex items-center justify-between text-xs text-amber-950 font-medium shrink-0">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <span className="font-bold text-[#4B3621] shrink-0">Your Meal Combo:</span>
            <span className="truncate text-[#2D241E] font-semibold">
              {Object.values(selections).map((s: { name: string }) => s.name).filter(Boolean).join(' + ') || 'Select items below'}
            </span>
          </div>
          <div className="text-xs font-bold font-mono text-[#4B3621] shrink-0 ml-2">
            ₹{totalPrice.toFixed(0)}
          </div>
        </div>

        {/* Content Body: Slots & Selectors */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1">
          {combo.slots.map((slot, index) => {
            const currentSelection = selections[slot.id]?.name;

            // Generate clean label that reflects current category
            const slotDisplayTitle = slot.type === 'category' && slot.category
              ? (slot.title && slot.title.toLowerCase().includes(slot.category.toLowerCase()) ? slot.title : `Choose from ${slot.category}`)
              : slot.title;

            return (
              <div key={slot.id} className="space-y-2.5 bg-[#FAF8F6] p-3.5 rounded-xl border border-[#E0D7D0]">
                <div className="flex items-center justify-between flex-wrap gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#4B3621] text-amber-200 text-[10px] font-bold flex items-center justify-center">
                      {index + 1}
                    </span>
                    <label className="text-xs font-bold text-[#2D241E] uppercase tracking-wider">
                      {slotDisplayTitle}
                    </label>
                  </div>

                  {slot.type === 'category' && slot.category && (
                    <span className="text-[10px] font-bold text-[#4B3621] bg-white border border-[#E0D7D0] px-2 py-0.5 rounded-full">
                      Category: {slot.category}
                    </span>
                  )}
                </div>

                {/* Real-time chosen indicator for this slot */}
                {currentSelection && (
                  <div className="text-[11px] text-[#4B3621] font-semibold flex items-center justify-between bg-white border border-amber-200 px-2.5 py-1 rounded-lg shadow-2xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-emerald-700 font-bold">✓ Selected:</span>
                      <strong className="text-[#2D241E]">{currentSelection}</strong>
                    </div>
                    {selections[slot.id]?.priceDelta ? (
                      <span className="text-[10px] font-mono font-bold text-emerald-700">
                        +₹{selections[slot.id]?.priceDelta}
                      </span>
                    ) : null}
                  </div>
                )}

                {/* Option Choice 1: From Category in Menu */}
                {slot.type === 'category' && slot.category && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {menuItems
                      .filter((m) => m.category === slot.category && m.isAvailable)
                      .map((item) => {
                        const isSelected = currentSelection === item.name;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleSelectOption(slot.id, item.name)}
                            className={`p-2.5 rounded-lg border text-left transition-all flex items-center justify-between cursor-pointer ${
                              isSelected
                                ? 'border-[#4B3621] bg-[#F4F1EE] text-[#2D241E] shadow-2xs font-bold ring-1 ring-[#4B3621]'
                                : 'border-[#E0D7D0] hover:border-[#8B7E74] bg-white text-[#8B7E74]'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-2 h-2 rounded-full shrink-0 ${
                                  item.type === 'veg' ? 'bg-emerald-500' : 'bg-rose-500'
                                }`}
                              />
                              <span className="text-xs font-medium text-[#2D241E] truncate max-w-[140px]">
                                {item.name}
                              </span>
                            </div>
                            <div
                              className={`w-4 h-4 rounded-md flex items-center justify-center border shrink-0 ${
                                isSelected
                                  ? 'bg-[#4B3621] border-[#4B3621] text-white'
                                  : 'border-[#E0D7D0] bg-white'
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                          </button>
                        );
                      })}
                  </div>
                )}

                {/* Option Choice 2: Unlisted Custom Items (Coke, Pepsi, Sprite, etc.) */}
                {slot.type === 'custom_items' && slot.customOptions && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {slot.customOptions.map((opt) => {
                      const isSelected = currentSelection === opt.name;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleSelectOption(slot.id, opt.name, opt.priceDelta)}
                          className={`p-2.5 rounded-lg border text-left transition-all flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'border-[#4B3621] bg-[#F4F1EE] text-[#2D241E] shadow-2xs font-bold ring-1 ring-[#4B3621]'
                              : 'border-[#E0D7D0] hover:border-[#8B7E74] bg-white text-[#8B7E74]'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-[#2D241E]">{opt.name}</span>
                            {opt.priceDelta && (
                              <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1 rounded">
                                +₹{opt.priceDelta}
                              </span>
                            )}
                          </div>
                          <div
                            className={`w-4 h-4 rounded-md flex items-center justify-center border shrink-0 ${
                              isSelected
                                ? 'bg-[#4B3621] border-[#4B3621] text-white'
                                : 'border-[#E0D7D0] bg-white'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Mixed Slot */}
                {slot.type === 'mixed' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {slot.customOptions?.map((opt) => {
                      const isSelected = currentSelection === opt.name;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleSelectOption(slot.id, opt.name, opt.priceDelta)}
                          className={`p-2.5 rounded-lg border text-left transition-all flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'border-[#4B3621] bg-[#F4F1EE] text-[#2D241E] shadow-2xs font-bold ring-1 ring-[#4B3621]'
                              : 'border-[#E0D7D0] hover:border-[#8B7E74] bg-white text-[#8B7E74]'
                          }`}
                        >
                          <span className="text-xs font-medium text-[#2D241E]">{opt.name}</span>
                          <div
                            className={`w-4 h-4 rounded-md flex items-center justify-center border shrink-0 ${
                              isSelected
                                ? 'bg-[#4B3621] border-[#4B3621] text-white'
                                : 'border-[#E0D7D0] bg-white'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Kitchen Instructions / Notes */}
          <div>
            <label className="block text-xs font-bold text-[#2D241E] uppercase tracking-wider mb-1.5">
              Kitchen Instructions / Drink Customization
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Extra cold drink, spicy seasoning on fries, no mayonnaise"
              className="w-full bg-white border border-[#E0D7D0] rounded-lg p-2.5 text-xs text-[#2D241E] placeholder:text-[#8B7E74] focus:outline-hidden focus:border-[#4B3621]"
            />
          </div>
        </div>

        {/* Footer */}
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
            <span>Add Combo to Bill</span>
            <span className="font-mono text-sm">₹{totalPrice.toFixed(2)}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
