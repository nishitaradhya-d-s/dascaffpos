import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ComboItem, ComboSlot, ComboSlotOption, ItemType, MenuItem } from '../../types';
import { 
  getStoredCombos, 
  saveCombos, 
  addComboItem, 
  deleteComboItem, 
  toggleComboActive, 
  resetCombosToDefault,
  getStoredCategories,
  normalizeCategoryName 
} from '../../utils/storage';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  RotateCcw, 
  PackageOpen, 
  Save, 
  Layers,
  UtensilsCrossed,
  CheckCircle2,
  ListPlus,
  HelpCircle,
  Coffee,
  Tag
} from 'lucide-react';

interface ComboManagerSectionProps {
  menuItems: MenuItem[];
}

export const ComboManagerSection: React.FC<ComboManagerSectionProps> = ({ menuItems }) => {
  const [combos, setCombos] = useState<ComboItem[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingComboId, setEditingComboId] = useState<string | null>(null);
  const modalScrollRef = useRef<HTMLDivElement>(null);

  // Form states
  const [name, setName] = useState('');
  const [price, setPrice] = useState<number>(149);
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ItemType>('veg');
  const [slots, setSlots] = useState<ComboSlot[]>([
    {
      id: 'slot-1',
      title: 'Choose 1 Burger',
      type: 'category',
      category: 'Burger',
      requiredCount: 1,
    },
    {
      id: 'slot-2',
      title: 'Choose 1 Beverage (Unlisted / Bottled)',
      type: 'custom_items',
      requiredCount: 1,
      customOptions: [
        { id: 'c-pepsi', name: 'Pepsi Can (300ml)', type: 'beverage', isCustomUnlisted: true },
        { id: 'c-coke', name: 'Coca Cola Can (300ml)', type: 'beverage', isCustomUnlisted: true },
        { id: 'c-sprite', name: 'Sprite (300ml)', type: 'beverage', isCustomUnlisted: true },
        { id: 'c-thumsup', name: 'Thums Up (300ml)', type: 'beverage', isCustomUnlisted: true },
        { id: 'c-water', name: 'Chilled Mineral Water (500ml)', type: 'beverage', isCustomUnlisted: true },
      ],
    },
  ]);

  const [newCustomItemName, setNewCustomItemName] = useState<{ [slotId: string]: string }>({});
  const [saveToast, setSaveToast] = useState<string | null>(null);

  const categories = useMemo(() => {
    const stored = getStoredCategories();
    const fromItems = Array.from(new Set(menuItems.map((m) => m.category)));
    return Array.from(new Set([...stored, ...fromItems])).filter((c) => c !== 'Combos' && c !== 'All');
  }, [menuItems]);

  const loadCombos = () => {
    setCombos(getStoredCombos());
  };

  useEffect(() => {
    loadCombos();
  }, []);

  const showNotification = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(null), 3000);
  };

  const handleStartCreate = () => {
    setEditingComboId(null);
    setName('');
    setPrice(149);
    setDescription('1 Burger from Menu + 1 Cold Drink (Pepsi / Coke / Sprite)');
    setType('veg');
    setSlots([
      {
        id: `slot-${Date.now()}-1`,
        title: 'Choose 1 Burger',
        type: 'category',
        category: categories[0] || 'Burger',
        requiredCount: 1,
      },
      {
        id: `slot-${Date.now()}-2`,
        title: 'Choose 1 Cold Drink (Unlisted Items)',
        type: 'custom_items',
        requiredCount: 1,
        customOptions: [
          { id: 'opt-pepsi', name: 'Pepsi Can (300ml)', type: 'beverage', isCustomUnlisted: true },
          { id: 'opt-coke', name: 'Coca Cola Can (300ml)', type: 'beverage', isCustomUnlisted: true },
          { id: 'opt-sprite', name: 'Sprite (300ml)', type: 'beverage', isCustomUnlisted: true },
          { id: 'opt-water', name: 'Mineral Water Bottle (500ml)', type: 'beverage', isCustomUnlisted: true },
        ],
      },
    ]);
    setIsCreating(true);
  };

  const handleStartEdit = (combo: ComboItem) => {
    setEditingComboId(combo.id);
    setName(combo.name);
    setPrice(combo.price);
    setDescription(combo.description || '');
    setType(combo.type);
    setSlots(combo.slots || []);
    setIsCreating(true);
  };

  const handleAddSlot = (slotType: 'category' | 'custom_items') => {
    const defaultCat = categories[0] || 'Menu';
    const newSlot: ComboSlot = {
      id: `slot-${Date.now()}`,
      title: slotType === 'category' ? `Choose 1 ${defaultCat}` : 'Select 1 Drink / Unlisted Item',
      type: slotType,
      category: slotType === 'category' ? defaultCat : undefined,
      requiredCount: 1,
      customOptions: slotType === 'custom_items' ? [
        { id: `c-${Date.now()}-1`, name: 'Coca Cola (300ml)', type: 'beverage', isCustomUnlisted: true },
        { id: `c-${Date.now()}-2`, name: 'Pepsi (300ml)', type: 'beverage', isCustomUnlisted: true },
        { id: `c-${Date.now()}-3`, name: 'Sprite (300ml)', type: 'beverage', isCustomUnlisted: true },
      ] : undefined,
    };
    setSlots([...slots, newSlot]);
    // Auto-scroll to the newly added slot immediately
    setTimeout(() => {
      if (modalScrollRef.current) {
        modalScrollRef.current.scrollTo({
          top: modalScrollRef.current.scrollHeight,
          behavior: 'smooth',
        });
      }
    }, 50);
  };

  const handleRemoveSlot = (slotId: string) => {
    if (slots.length <= 1) {
      alert('A combo must have at least one selection slot.');
      return;
    }
    setSlots(slots.filter((s) => s.id !== slotId));
  };

  const handleUpdateSlotTitle = (slotId: string, title: string) => {
    setSlots(slots.map((s) => (s.id === slotId ? { ...s, title } : s)));
  };

  const handleUpdateSlotCategory = (slotId: string, category: string) => {
    setSlots(slots.map((s) => {
      if (s.id !== slotId) return s;
      // Auto sync title so it never retains outdated category names like Pizza when French Fries is chosen
      return {
        ...s,
        category,
        title: `Choose 1 ${category}`,
      };
    }));
  };

  const handleAddCustomOption = (slotId: string) => {
    const itemText = (newCustomItemName[slotId] || '').trim();
    if (!itemText) return;

    setSlots(slots.map((s) => {
      if (s.id !== slotId) return s;
      const existing = s.customOptions || [];
      const newOpt: ComboSlotOption = {
        id: `opt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: itemText,
        type: 'beverage',
        isCustomUnlisted: true,
      };
      return {
        ...s,
        customOptions: [...existing, newOpt],
      };
    }));

    setNewCustomItemName({ ...newCustomItemName, [slotId]: '' });
  };

  const handleRemoveCustomOption = (slotId: string, optionId: string) => {
    setSlots(slots.map((s) => {
      if (s.id !== slotId) return s;
      return {
        ...s,
        customOptions: (s.customOptions || []).filter((o) => o.id !== optionId),
      };
    }));
  };

  const handleSaveCombo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || price < 0 || slots.length === 0) {
      alert('Please enter valid combo details and at least 1 selection slot.');
      return;
    }

    const comboId = editingComboId || `combo-${Date.now()}`;
    const newCombo: ComboItem = {
      id: comboId,
      name: name.trim(),
      price: Number(price),
      description: description.trim() || undefined,
      type,
      isAvailable: true,
      slots,
    };

    addComboItem(newCombo);
    loadCombos();
    setIsCreating(false);
    setEditingComboId(null);
    showNotification(`Saved Combo "${newCombo.name}" at ₹${newCombo.price}`);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Delete combo "${name}"?`)) {
      deleteComboItem(id);
      loadCombos();
      showNotification(`Deleted combo "${name}"`);
    }
  };

  const handleToggle = (id: string) => {
    toggleComboActive(id);
    loadCombos();
  };

  const handleResetDefaults = () => {
    if (confirm('Reset all combos to factory default combo meals?')) {
      resetCombosToDefault();
      loadCombos();
      showNotification('Reset combo meals to defaults');
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#F4F1EE]">
      {/* Toast Notification */}
      {saveToast && (
        <div className="bg-emerald-700 text-white text-xs px-4 py-2 flex items-center justify-between font-bold shrink-0 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            <span>{saveToast}</span>
          </div>
          <button type="button" onClick={() => setSaveToast(null)} className="text-white/70 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="p-4 bg-white border-b border-[#E0D7D0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#4B3621] text-amber-200 flex items-center justify-center font-bold shadow-xs">
            <PackageOpen className="w-5 h-5 text-amber-200" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#4B3621] uppercase tracking-wider font-cinzel">
              Combo Meals &amp; Bundles Builder
            </h2>
            <p className="text-xs text-[#8B7E74]">
              Build combos with menu categories and add custom unlisted items (like Coke, Pepsi, Water, Dips)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-3 py-2 border border-[#E0D7D0] hover:bg-[#F4F1EE] text-[#8B7E74] hover:text-[#2D241E] rounded-lg text-xs font-bold transition-all cursor-pointer"
            title="Reset combos to default meals"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={handleStartCreate}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#4B3621] hover:bg-[#3D2C1B] text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Create New Combo</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="max-w-5xl mx-auto space-y-4">
          {/* Create/Edit Combo Modal Popup Dialog */}
          {isCreating && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#2D241E]/60 backdrop-blur-xs animate-in fade-in duration-150">
              <div className="bg-white rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl border border-[#E0D7D0] flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
                {/* Modal Header */}
                <div className="p-4 bg-[#4B3621] text-white flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-400/20 text-amber-300 flex items-center justify-center font-bold">
                      <PackageOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider font-cinzel">
                        {editingComboId ? 'Edit Combo Meal Deal' : 'Build New Combo Meal Deal'}
                      </h3>
                      <p className="text-[11px] text-amber-200 font-medium">
                        Configure bundle price, categories & unlisted custom items
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="p-1.5 rounded-lg bg-white/10 text-white/70 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveCombo} className="flex flex-col flex-1 overflow-hidden">
                  <div ref={modalScrollRef} className="p-5 space-y-4 overflow-y-auto flex-1">
                    {/* Basic Information */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-[#4B3621] mb-1">
                      Combo Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Burger &amp; Cold Drink Meal Deal, Pizza Feast Combo"
                      className="w-full bg-[#F9F7F5] border border-[#E0D7D0] rounded-lg p-2.5 text-xs font-bold text-[#2D241E] focus:outline-hidden focus:border-[#4B3621]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#4B3621] mb-1">
                      Combo Price (₹) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8B7E74]">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        required
                        value={price}
                        onChange={(e) => setPrice(Number(e.target.value))}
                        className="w-full bg-[#F9F7F5] border border-[#E0D7D0] rounded-lg py-2.5 pl-7 pr-3 text-xs font-bold font-mono text-[#2D241E] focus:outline-hidden focus:border-[#4B3621]"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-[#4B3621] mb-1">
                      Combo Summary / Description
                    </label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="e.g. Choice of 1 Burger + 1 Cold Beverage (Coke/Pepsi) + Salted Fries"
                      className="w-full bg-[#F9F7F5] border border-[#E0D7D0] rounded-lg p-2 text-xs text-[#2D241E] focus:outline-hidden focus:border-[#4B3621]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#4B3621] mb-1">
                      Dietary Type
                    </label>
                    <div className="grid grid-cols-3 gap-1">
                      {(['veg', 'non-veg', 'beverage'] as ItemType[]).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setType(t)}
                          className={`py-2 px-1 text-center rounded-lg text-[11px] font-bold capitalize transition-all border cursor-pointer ${
                            type === t
                              ? 'bg-[#4B3621] text-white border-[#4B3621]'
                              : 'bg-white text-[#8B7E74] border-[#E0D7D0] hover:bg-[#F4F1EE]'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Slots Builder */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#4B3621]">
                        Combo Selection Slots &amp; Options ({slots.length})
                      </h4>
                      <p className="text-[11px] text-[#8B7E74]">
                        When selected in POS billing, the cashier will be prompted to pick items from each slot below.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleAddSlot('category')}
                        className="px-2.5 py-1.5 bg-[#F4F1EE] hover:bg-[#E0D7D0] text-[#4B3621] rounded-lg text-xs font-bold flex items-center gap-1 border border-[#E0D7D0] cursor-pointer"
                        title="Add slot with menu category items"
                      >
                        <ListPlus className="w-3.5 h-3.5" />
                        <span>+ Category Slot</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAddSlot('custom_items')}
                        className="px-2.5 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg text-xs font-bold flex items-center gap-1 border border-amber-300 cursor-pointer"
                        title="Add slot with unlisted custom items like Coke, Pepsi, Water"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[3]" />
                        <span>+ Unlisted Items (Coke/Pepsi)</span>
                      </button>
                    </div>
                  </div>

                  {/* Slot Cards */}
                  <div className="space-y-3">
                    {slots.map((slot, index) => (
                      <div
                        key={slot.id}
                        className="p-3.5 bg-[#F9F7F5] rounded-xl border border-[#E0D7D0] space-y-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-1">
                            <span className="w-5 h-5 rounded-full bg-[#4B3621] text-amber-200 text-[10px] font-bold flex items-center justify-center">
                              {index + 1}
                            </span>
                            <input
                              type="text"
                              value={slot.title}
                              onChange={(e) => handleUpdateSlotTitle(slot.id, e.target.value)}
                              placeholder="Slot Title (e.g. Choose 1 Burger)"
                              className="bg-white border border-[#E0D7D0] rounded-lg px-2.5 py-1.5 text-xs font-bold text-[#2D241E] flex-1 max-w-sm"
                            />
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-white border border-[#E0D7D0] text-[#8B7E74]">
                              {slot.type === 'category' ? 'Menu Category' : 'Unlisted Custom Items'}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveSlot(slot.id)}
                            className="text-rose-600 hover:text-rose-800 p-1.5 rounded-lg hover:bg-rose-50 cursor-pointer"
                            title="Remove Slot"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Slot Type: Category Selection */}
                        {slot.type === 'category' && (
                          <div className="bg-white p-3 rounded-lg border border-[#E0D7D0] space-y-2">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-2">
                                <label className="text-[11px] font-bold text-[#4B3621]">Select Menu Category:</label>
                                <select
                                  value={slot.category || categories[0]}
                                  onChange={(e) => handleUpdateSlotCategory(slot.id, e.target.value)}
                                  className="bg-[#F9F7F5] border border-[#E0D7D0] rounded-lg px-2.5 py-1 text-xs font-bold text-[#2D241E] focus:outline-hidden focus:border-[#4B3621]"
                                >
                                  {categories.map((c) => (
                                    <option key={c} value={c}>
                                      {c}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {slot.category && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateSlotTitle(slot.id, `Choose 1 ${slot.category}`)}
                                  className="text-[10px] font-bold text-[#4B3621] hover:text-[#2D241E] bg-[#F4F1EE] hover:bg-[#E0D7D0] border border-[#E0D7D0] px-2 py-0.5 rounded-md cursor-pointer transition-colors"
                                  title="Reset slot title to match selected category"
                                >
                                  🔄 Set title to "Choose 1 {slot.category}"
                                </button>
                              )}
                            </div>

                            {/* Preview of Category Items */}
                            <div className="text-[11px] text-[#8B7E74] flex items-center gap-1.5 flex-wrap">
                              <span>Available options:</span>
                              {menuItems
                                .filter((m) => m.category === slot.category)
                                .slice(0, 6)
                                .map((m) => (
                                  <span key={m.id} className="bg-[#F4F1EE] px-1.5 py-0.5 rounded text-[10px] font-medium text-[#4B3621] border border-[#E0D7D0]">
                                    {m.name}
                                  </span>
                                ))}
                              {menuItems.filter((m) => m.category === slot.category).length > 6 && (
                                <span className="text-[10px] text-[#8B7E74]">
                                  +{menuItems.filter((m) => m.category === slot.category).length - 6} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Slot Type: Unlisted Custom Items (Coke, Pepsi, Sprite, etc.) */}
                        {slot.type === 'custom_items' && (
                          <div className="bg-white p-3 rounded-lg border border-amber-200 space-y-2.5">
                            <div className="flex items-center justify-between">
                              <label className="text-[11px] font-bold text-amber-900 flex items-center gap-1">
                                <Coffee className="w-3.5 h-3.5 text-amber-600" />
                                <span>Unlisted Custom Options (e.g. Coke, Pepsi, Water, Dips):</span>
                              </label>
                            </div>

                            {/* List of custom options in this slot */}
                            <div className="flex flex-wrap gap-1.5">
                              {(slot.customOptions || []).map((opt) => (
                                <span
                                  key={opt.id}
                                  className="bg-amber-50 text-amber-950 border border-amber-200 text-xs px-2 py-1 rounded-lg flex items-center gap-1 font-medium"
                                >
                                  <span>{opt.name}</span>
                                  {opt.priceDelta && (
                                    <span className="text-[10px] font-mono text-emerald-700 font-bold">
                                      +₹{opt.priceDelta}
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveCustomOption(slot.id, opt.id)}
                                    className="text-amber-800/70 hover:text-rose-700 ml-1 p-0.5"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </span>
                              ))}
                            </div>

                            {/* Add option to slot */}
                            <div className="flex items-center gap-2 pt-1">
                              <input
                                type="text"
                                value={newCustomItemName[slot.id] || ''}
                                onChange={(e) =>
                                  setNewCustomItemName({ ...newCustomItemName, [slot.id]: e.target.value })
                                }
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddCustomOption(slot.id);
                                  }
                                }}
                                placeholder="Add item (e.g. Pepsi 300ml, Coca Cola, Sprite, Water, Dip)"
                                className="bg-[#F9F7F5] border border-[#E0D7D0] rounded-lg px-2.5 py-1.5 text-xs text-[#2D241E] flex-1"
                              />
                              <button
                                type="button"
                                onClick={() => handleAddCustomOption(slot.id)}
                                className="px-3 py-1.5 bg-[#4B3621] hover:bg-[#3D2C1B] text-white rounded-lg text-xs font-bold"
                              >
                                Add Option
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="flex justify-end gap-2 p-4 bg-[#F9F7F5] border-t border-[#E0D7D0] shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsCreating(false)}
                      className="px-4 py-2 rounded-lg border border-[#E0D7D0] text-xs font-bold text-[#8B7E74] hover:bg-[#F4F1EE] cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-lg bg-[#4B3621] hover:bg-[#3D2C1B] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{editingComboId ? 'Update Combo Meal' : 'Save Combo Meal'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Combos List Cards */}
          <div className="bg-white rounded-xl border border-[#E0D7D0] shadow-xs overflow-hidden">
            <div className="p-3.5 bg-[#F9F7F5] border-b border-[#E0D7D0] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#4B3621] uppercase tracking-wider">
                  Configured Combo Meals ({combos.length})
                </span>
              </div>
              <span className="text-[11px] text-[#8B7E74]">
                {combos.filter((c) => c.isAvailable).length} Active in POS Billing
              </span>
            </div>

            {combos.length === 0 ? (
              <div className="p-8 text-center text-[#8B7E74]">
                <UtensilsCrossed className="w-8 h-8 mx-auto mb-2 text-[#E0D7D0]" />
                <p className="text-xs font-bold text-[#4B3621]">No combo meals created</p>
                <p className="text-[11px] mt-1">Click "Create New Combo" or "Reset Defaults" above</p>
              </div>
            ) : (
              <div className="divide-y divide-[#E0D7D0]">
                {combos.map((combo) => (
                  <div
                    key={combo.id}
                    className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                      combo.isAvailable ? 'hover:bg-[#F9F7F5]' : 'bg-gray-50/70 opacity-60'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => handleToggle(combo.id)}
                        className={`w-6 h-6 rounded-md flex items-center justify-center border transition-all cursor-pointer mt-1 ${
                          combo.isAvailable
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'bg-white border-[#E0D7D0] text-[#8B7E74]'
                        }`}
                        title={combo.isAvailable ? 'Active in POS (Click to disable)' : 'Disabled in POS (Click to enable)'}
                      >
                        {combo.isAvailable && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              combo.type === 'veg' ? 'bg-emerald-500' : combo.type === 'non-veg' ? 'bg-rose-500' : 'bg-amber-500'
                            }`}
                          />
                          <h4 className="text-sm font-bold text-[#2D241E]">{combo.name}</h4>
                          <span className="bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            COMBO MEAL
                          </span>
                        </div>

                        {combo.description && (
                          <p className="text-xs text-[#8B7E74]">{combo.description}</p>
                        )}

                        {/* Slots Summary */}
                        <div className="flex items-center gap-2 flex-wrap pt-1">
                          {combo.slots.map((s, idx) => (
                            <span
                              key={s.id}
                              className="bg-[#F4F1EE] border border-[#E0D7D0] text-[11px] text-[#4B3621] px-2 py-0.5 rounded-md font-medium"
                            >
                              Slot {idx + 1}: <strong>{s.title}</strong>{' '}
                              {s.type === 'category' ? `(${s.category})` : `(${s.customOptions?.length || 0} unlisted)`}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right: Price & Actions */}
                    <div className="flex items-center gap-3 self-end md:self-center">
                      <div className="text-right">
                        <div className="text-sm font-bold font-mono text-[#4B3621]">
                          ₹{combo.price.toFixed(0)}
                        </div>
                        <span className="text-[10px] text-[#8B7E74]">Bundle Price</span>
                      </div>

                      <div className="flex items-center gap-1 border-l border-[#E0D7D0] pl-3">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(combo)}
                          className="p-2 text-[#8B7E74] hover:text-[#4B3621] hover:bg-[#F4F1EE] rounded-lg transition-colors cursor-pointer"
                          title="Edit Combo"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(combo.id, combo.name)}
                          className="p-2 text-[#8B7E74] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Combo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
