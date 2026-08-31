import React, { useState, useEffect, useMemo } from 'react';
import { GlobalAddon, SectionHierarchy } from '../../types';
import { 
  getStoredAddons, 
  saveAddons, 
  addAddonItem, 
  updateAddonItem, 
  deleteAddonItem, 
  toggleAddonActive, 
  resetAddonsToDefault,
  getStoredCategories,
  getStoredSectionHierarchies,
  normalizeCategoryName
} from '../../utils/storage';
import { 
  saveAddonsToFirestore,
  subscribeToAddonsFromFirestore 
} from '../../services/firebase';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  RotateCcw, 
  PlusCircle, 
  Save, 
  DollarSign,
  Layers,
  CheckCircle2,
  AlertCircle,
  Tag
} from 'lucide-react';

export const AddonManagerSection: React.FC = () => {
  const [addons, setAddons] = useState<GlobalAddon[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editCategory, setEditCategory] = useState('General');
  const [editSections, setEditSections] = useState<string[]>([]);

  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState<number>(20);
  const [newCategory, setNewCategory] = useState('Toppings & Extras');
  const [newSections, setNewSections] = useState<string[]>(['Pizzas', 'Burgers']);

  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [filterSection, setFilterSection] = useState<string>('All');

  // Available sections from storage
  const availableSections = useMemo(() => {
    const hierarchies = getStoredSectionHierarchies();
    const list = hierarchies.map((h) => h.section).filter(Boolean);
    if (list.length > 0) return list;
    return getStoredCategories().filter((c) => c !== 'All' && c !== 'Combos');
  }, []);

  const loadAddons = () => {
    setAddons(getStoredAddons());
  };

  useEffect(() => {
    loadAddons();
    const unsubscribe = subscribeToAddonsFromFirestore((cloudAddons) => {
      if (cloudAddons && Array.isArray(cloudAddons)) {
        setAddons(cloudAddons);
      }
    });
    return () => unsubscribe();
  }, []);

  const showNotification = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(null), 3000);
  };

  const handleStartEdit = (addon: GlobalAddon) => {
    setEditingId(addon.id);
    setEditName(addon.name);
    setEditPrice(addon.price);
    setEditCategory(addon.category || 'General');
    setEditSections(addon.applicableSections || []);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditPrice(0);
    setEditSections([]);
  };

  const handleSaveEdit = (id: string) => {
    if (!editName.trim() || editPrice < 0) return;
    const existing = addons.find((a) => a.id === id);
    if (!existing) return;

    const updated: GlobalAddon = {
      ...existing,
      name: editName.trim(),
      price: Number(editPrice),
      category: editCategory.trim() || 'General',
      applicableSections: editSections.length > 0 ? editSections : undefined,
    };

    updateAddonItem(updated);
    const list = getStoredAddons();
    saveAddonsToFirestore(list).catch(() => {});
    setAddons(list);
    setEditingId(null);
    showNotification(`Updated "${updated.name}"`);
  };

  const handleQuickPriceChange = (id: string, newPriceVal: number) => {
    if (newPriceVal < 0 || isNaN(newPriceVal)) return;
    const existing = addons.find((a) => a.id === id);
    if (!existing) return;

    const updated: GlobalAddon = {
      ...existing,
      price: newPriceVal,
    };
    updateAddonItem(updated);
    const list = getStoredAddons();
    saveAddonsToFirestore(list).catch(() => {});
    setAddons(list);
    showNotification(`Updated price to ₹${newPriceVal}`);
  };

  const handleToggleSectionForAddon = (addon: GlobalAddon, section: string) => {
    const currentSections = addon.applicableSections || [];
    let updatedSections: string[];

    if (section === 'All') {
      updatedSections = []; // empty means applies to All
    } else {
      if (currentSections.includes(section)) {
        updatedSections = currentSections.filter((s) => s !== section);
      } else {
        updatedSections = [...currentSections, section];
      }
    }

    const updated: GlobalAddon = {
      ...addon,
      applicableSections: updatedSections.length > 0 ? updatedSections : undefined,
    };
    updateAddonItem(updated);
    const list = getStoredAddons();
    saveAddonsToFirestore(list).catch(() => {});
    setAddons(list);
    showNotification(`Updated sections for "${addon.name}"`);
  };

  const handleCreateNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || newPrice < 0) return;

    const newAddon: GlobalAddon = {
      id: `addon-${Date.now()}`,
      name: newName.trim(),
      price: Number(newPrice),
      category: newCategory.trim() || 'Toppings & Extras',
      applicableSections: newSections.length > 0 ? newSections : undefined,
      isAvailable: true,
    };

    addAddonItem(newAddon);
    const list = getStoredAddons();
    saveAddonsToFirestore(list).catch(() => {});
    setAddons(list);
    setIsCreating(false);
    setNewName('');
    setNewPrice(20);
    setNewSections(['Pizzas', 'Burgers']);
    showNotification(`Added "${newAddon.name}" at ₹${newAddon.price}`);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Delete add-on "${name}"?`)) {
      deleteAddonItem(id);
      const list = getStoredAddons();
      saveAddonsToFirestore(list).catch(() => {});
      setAddons(list);
      showNotification(`Deleted "${name}"`);
    }
  };

  const handleToggle = (id: string) => {
    toggleAddonActive(id);
    const list = getStoredAddons();
    saveAddonsToFirestore(list).catch(() => {});
    setAddons(list);
  };

  const handleReset = () => {
    if (confirm('Reset all add-ons and extra prices to factory defaults? (Extra Cheese ₹20, Extra Topping ₹30, Cheesy Dip ₹25, etc.)')) {
      resetAddonsToDefault();
      const list = getStoredAddons();
      saveAddonsToFirestore(list).catch(() => {});
      setAddons(list);
      showNotification('Reset add-on rates to default values');
    }
  };

  // Filtered addons by section view
  const displayedAddons = useMemo(() => {
    if (filterSection === 'All') return addons;
    return addons.filter((a) => {
      if (!a.applicableSections || a.applicableSections.length === 0) return true;
      return a.applicableSections.some((s) => s.toLowerCase() === filterSection.toLowerCase());
    });
  }, [addons, filterSection]);

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

      {/* Header Bar */}
      <div className="p-4 bg-white border-b border-[#E0D7D0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-700 text-white flex items-center justify-center font-bold shadow-xs">
            <Layers className="w-5 h-5 text-amber-200" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#4B3621] uppercase tracking-wider font-cinzel">
              Add-ons &amp; Customizations Rates
            </h2>
            <p className="text-xs text-[#8B7E74]">
              Assign add-ons (Extra Cheese, Topping, Dips) to specific sections (Pizza, Burger, etc.) with live POS rates
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 border border-[#E0D7D0] hover:bg-[#F4F1EE] text-[#8B7E74] hover:text-[#2D241E] rounded-lg text-xs font-bold transition-all cursor-pointer"
            title="Reset Add-on rates to default"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#4B3621] hover:bg-[#3D2C1B] text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add New Add-on</span>
          </button>
        </div>
      </div>

      {/* Section Filter Pills */}
      <div className="bg-white border-b border-[#E0D7D0] px-4 py-2 flex items-center gap-1.5 overflow-x-auto shrink-0 scrollbar-none">
        <span className="text-[11px] font-bold text-[#8B7E74] uppercase tracking-wider mr-1 shrink-0">Filter by Section:</span>
        <button
          type="button"
          onClick={() => setFilterSection('All')}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
            filterSection === 'All'
              ? 'bg-[#4B3621] text-white shadow-2xs'
              : 'bg-[#F4F1EE] text-[#4B3621] hover:bg-[#E0D7D0]'
          }`}
        >
          All Add-ons ({addons.length})
        </button>
        {availableSections.map((sec) => {
          const isSel = filterSection === sec;
          const count = addons.filter(
            (a) => !a.applicableSections || a.applicableSections.length === 0 || a.applicableSections.some((s) => s.toLowerCase() === sec.toLowerCase())
          ).length;

          return (
            <button
              key={sec}
              type="button"
              onClick={() => setFilterSection(sec)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                isSel
                  ? 'bg-[#4B3621] text-white shadow-2xs'
                  : 'bg-[#F4F1EE] border border-[#E0D7D0] text-[#4B3621] hover:bg-white'
              }`}
            >
              <span>{sec}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                isSel ? 'bg-white/20 text-white' : 'bg-white text-[#8B7E74]'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Create New Add-on Form Card (when open) */}
      {isCreating && (
        <div className="p-4 bg-amber-50/60 border-b border-amber-200 shrink-0">
          <form onSubmit={handleCreateNew} className="max-w-4xl mx-auto bg-white p-4 rounded-xl border border-amber-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#4B3621] flex items-center gap-1.5">
                <PlusCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>Create New Add-on &amp; Assign to Sections</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="text-[#8B7E74] hover:text-[#2D241E] p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#4B3621] mb-1">Add-on Name *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Extra Cheese, Extra Topping, Cheesy Dip"
                  className="w-full bg-[#F9F7F5] border border-[#E0D7D0] rounded-lg p-2 text-xs font-bold text-[#2D241E] focus:outline-hidden focus:border-[#4B3621]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#4B3621] mb-1">Price (₹) *</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8B7E74]">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={newPrice}
                    onChange={(e) => setNewPrice(Number(e.target.value))}
                    className="w-full bg-[#F9F7F5] border border-[#E0D7D0] rounded-lg py-2 pl-6 pr-2 text-xs font-bold text-[#2D241E] focus:outline-hidden focus:border-[#4B3621]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#4B3621] mb-1">Category / Group</label>
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="e.g. Pizza Extras, Dips, Sauces"
                  className="w-full bg-[#F9F7F5] border border-[#E0D7D0] rounded-lg p-2 text-xs text-[#2D241E] focus:outline-hidden focus:border-[#4B3621]"
                />
              </div>
            </div>

            {/* Applicable Sections Picker */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold text-[#4B3621] flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-amber-700" />
                  <span>Applicable Sections (Select which sections can use this add-on)</span>
                </label>
                <button
                  type="button"
                  onClick={() => setNewSections([])}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer ${
                    newSections.length === 0 ? 'bg-[#4B3621] text-white' : 'bg-[#F4F1EE] text-[#4B3621] hover:bg-[#E0D7D0]'
                  }`}
                >
                  All Sections
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {availableSections.map((sec) => {
                  const isChecked = newSections.includes(sec);
                  return (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => {
                        if (isChecked) {
                          setNewSections(newSections.filter((s) => s !== sec));
                        } else {
                          setNewSections([...newSections, sec]);
                        }
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                        isChecked
                          ? 'bg-[#4B3621] border-[#4B3621] text-white shadow-2xs'
                          : 'bg-[#F9F7F5] border-[#E0D7D0] text-[#4B3621] hover:bg-white'
                      }`}
                    >
                      <div className={`w-3 h-3 rounded-xs flex items-center justify-center border ${
                        isChecked ? 'bg-white text-[#4B3621]' : 'border-[#8B7E74]'
                      }`}>
                        {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                      <span>{sec}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-[#8B7E74] mt-1">
                {newSections.length === 0
                  ? 'Currently selected: Appears in ALL sections'
                  : `Currently selected: Appears ONLY in ${newSections.join(', ')}`}
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-1 border-t border-amber-100">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-3 py-1.5 rounded-lg border border-[#E0D7D0] text-xs font-bold text-[#8B7E74] hover:bg-[#F4F1EE] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-[#4B3621] hover:bg-[#3D2C1B] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Add-on</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Content Area: Add-ons Table / Grid */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="max-w-5xl mx-auto space-y-4">
          {/* Quick Notice */}
          <div className="bg-white p-3 rounded-xl border border-[#E0D7D0] shadow-2xs flex items-start gap-2.5 text-xs text-[#8B7E74]">
            <Layers className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-[#4B3621]">Section-Specific POS Integration:</p>
              <p>
                When you select <strong>Pizza</strong> or <strong>Burger</strong> for an add-on (e.g. <strong>Extra Cheese ₹20</strong> or <strong>Extra Topping ₹30</strong>), it will automatically appear in POS billing when customizing items in that specific section.
              </p>
            </div>
          </div>

          {/* Add-ons List */}
          <div className="bg-white rounded-xl border border-[#E0D7D0] shadow-xs overflow-hidden">
            <div className="p-3.5 bg-[#F9F7F5] border-b border-[#E0D7D0] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#4B3621] uppercase tracking-wider">
                  Configured Add-ons &amp; Section Assignments ({displayedAddons.length})
                </span>
              </div>
              <span className="text-[11px] text-[#8B7E74]">
                {displayedAddons.filter((a) => a.isAvailable).length} Active in POS
              </span>
            </div>

            {displayedAddons.length === 0 ? (
              <div className="p-8 text-center text-[#8B7E74]">
                <Layers className="w-8 h-8 mx-auto mb-2 text-[#E0D7D0]" />
                <p className="text-xs font-bold text-[#4B3621]">No add-ons found for {filterSection}</p>
                <p className="text-[11px] mt-1">Click "Add New Add-on" or switch filter to "All Add-ons"</p>
              </div>
            ) : (
              <div className="divide-y divide-[#E0D7D0]">
                {displayedAddons.map((addon) => {
                  const isEditing = editingId === addon.id;
                  const isAllSections = !addon.applicableSections || addon.applicableSections.length === 0;

                  if (isEditing) {
                    return (
                      <div key={addon.id} className="p-3.5 bg-amber-50/50 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-[#4B3621] mb-0.5">Name</label>
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="w-full bg-white border border-amber-300 rounded-lg p-2 text-xs font-bold text-[#2D241E]"
                              placeholder="Add-on Name"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-[#4B3621] mb-0.5">Price (₹)</label>
                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8B7E74]">₹</span>
                              <input
                                type="number"
                                min="0"
                                value={editPrice}
                                onChange={(e) => setEditPrice(Number(e.target.value))}
                                className="w-full bg-white border border-amber-300 rounded-lg py-2 pl-6 pr-2 text-xs font-bold text-[#2D241E]"
                                placeholder="Price in ₹"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-[#4B3621] mb-0.5">Category</label>
                            <input
                              type="text"
                              value={editCategory}
                              onChange={(e) => setEditCategory(e.target.value)}
                              className="w-full bg-white border border-amber-300 rounded-lg p-2 text-xs text-[#2D241E]"
                              placeholder="Category"
                            />
                          </div>
                        </div>

                        {/* Edit Applicable Sections */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[10px] font-bold text-[#4B3621]">Applicable Sections</label>
                            <button
                              type="button"
                              onClick={() => setEditSections([])}
                              className={`text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer ${
                                editSections.length === 0 ? 'bg-[#4B3621] text-white' : 'bg-[#F4F1EE] text-[#4B3621]'
                              }`}
                            >
                              All Sections
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {availableSections.map((sec) => {
                              const isChecked = editSections.includes(sec);
                              return (
                                <button
                                  key={sec}
                                  type="button"
                                  onClick={() => {
                                    if (isChecked) {
                                      setEditSections(editSections.filter((s) => s !== sec));
                                    } else {
                                      setEditSections([...editSections, sec]);
                                    }
                                  }}
                                  className={`px-2 py-0.5 rounded-md text-[11px] font-bold border transition-all cursor-pointer ${
                                    isChecked
                                      ? 'bg-[#4B3621] border-[#4B3621] text-white'
                                      : 'bg-white border-[#E0D7D0] text-[#4B3621]'
                                  }`}
                                >
                                  {sec}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1 border-t border-amber-200">
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="px-3 py-1 rounded-lg bg-white border border-[#E0D7D0] text-[#8B7E74] hover:bg-[#F4F1EE] text-xs font-bold cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(addon.id)}
                            className="px-3 py-1 rounded-lg bg-[#4B3621] text-white hover:bg-[#3D2C1B] text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Save</span>
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={addon.id}
                      className={`p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors ${
                        addon.isAvailable ? 'hover:bg-[#F9F7F5]' : 'bg-gray-50/70 opacity-60'
                      }`}
                    >
                      <div className="flex items-start sm:items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleToggle(addon.id)}
                          className={`w-6 h-6 rounded-md flex items-center justify-center border transition-all cursor-pointer shrink-0 mt-0.5 sm:mt-0 ${
                            addon.isAvailable
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'bg-white border-[#E0D7D0] text-[#8B7E74]'
                          }`}
                          title={addon.isAvailable ? 'Enabled in POS (Click to disable)' : 'Disabled in POS (Click to enable)'}
                        >
                          {addon.isAvailable && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-[#2D241E]">{addon.name}</span>
                            {addon.category && (
                              <span className="text-[10px] bg-[#F4F1EE] text-[#8B7E74] px-2 py-0.5 rounded-md font-medium border border-[#E0D7D0]">
                                {addon.category}
                              </span>
                            )}
                          </div>

                          {/* Display Applicable Sections */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-bold text-[#8B7E74]">Shows in:</span>
                            {isAllSections ? (
                              <span className="text-[10px] font-bold bg-amber-100/70 text-amber-900 px-2 py-0.5 rounded-md border border-amber-200">
                                All Sections
                              </span>
                            ) : (
                              addon.applicableSections!.map((sec) => (
                                <span
                                  key={sec}
                                  className="text-[10px] font-bold bg-[#F4F1EE] text-[#4B3621] px-2 py-0.5 rounded-md border border-[#E0D7D0]"
                                >
                                  {sec}
                                </span>
                              ))
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Quick Price Editor & Actions */}
                      <div className="flex items-center gap-3 self-end md:self-center">
                        {/* Quick Editable Price Field */}
                        <div className="flex items-center gap-1.5 bg-[#F9F7F5] border border-[#E0D7D0] rounded-lg px-2.5 py-1">
                          <span className="text-xs font-bold text-[#8B7E74]">Rate:</span>
                          <span className="text-xs font-bold text-[#4B3621]">₹</span>
                          <input
                            type="number"
                            min="0"
                            value={addon.price}
                            onChange={(e) => handleQuickPriceChange(addon.id, Number(e.target.value))}
                            className="w-16 bg-white border border-[#E0D7D0] rounded px-1.5 py-0.5 text-xs font-bold font-mono text-[#4B3621] text-right focus:outline-hidden focus:border-[#4B3621]"
                            title="Edit price directly here"
                          />
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(addon)}
                            className="p-1.5 text-[#8B7E74] hover:text-[#4B3621] hover:bg-[#F4F1EE] rounded-lg transition-colors cursor-pointer"
                            title="Edit Name, Category & Sections"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(addon.id, addon.name)}
                            className="p-1.5 text-[#8B7E74] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Add-on"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

