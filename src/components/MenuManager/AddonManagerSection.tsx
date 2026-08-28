import React, { useState, useEffect } from 'react';
import { GlobalAddon } from '../../types';
import { 
  getStoredAddons, 
  saveAddons, 
  addAddonItem, 
  updateAddonItem, 
  deleteAddonItem, 
  toggleAddonActive, 
  resetAddonsToDefault 
} from '../../utils/storage';
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
  AlertCircle
} from 'lucide-react';

export const AddonManagerSection: React.FC = () => {
  const [addons, setAddons] = useState<GlobalAddon[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editCategory, setEditCategory] = useState('General');

  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState<number>(20);
  const [newCategory, setNewCategory] = useState('Toppings & Extras');

  const [saveToast, setSaveToast] = useState<string | null>(null);

  const loadAddons = () => {
    setAddons(getStoredAddons());
  };

  useEffect(() => {
    loadAddons();
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
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditPrice(0);
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
    };

    updateAddonItem(updated);
    loadAddons();
    setEditingId(null);
    showNotification(`Updated "${updated.name}" price to ₹${updated.price}`);
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
    loadAddons();
    showNotification(`Updated price to ₹${newPriceVal}`);
  };

  const handleCreateNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || newPrice < 0) return;

    const newAddon: GlobalAddon = {
      id: `addon-${Date.now()}`,
      name: newName.trim(),
      price: Number(newPrice),
      category: newCategory.trim() || 'Toppings & Extras',
      isAvailable: true,
    };

    addAddonItem(newAddon);
    loadAddons();
    setIsCreating(false);
    setNewName('');
    setNewPrice(20);
    showNotification(`Added "${newAddon.name}" at ₹${newAddon.price}`);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Delete add-on "${name}"?`)) {
      deleteAddonItem(id);
      loadAddons();
      showNotification(`Deleted "${name}"`);
    }
  };

  const handleToggle = (id: string) => {
    toggleAddonActive(id);
    loadAddons();
  };

  const handleReset = () => {
    if (confirm('Reset all add-ons and extra prices to factory defaults? (Extra Cheese ₹20, Extra Topping ₹30, Cheesy Dip ₹25, etc.)')) {
      resetAddonsToDefault();
      loadAddons();
      showNotification('Reset add-on rates to default values');
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
              Manage extra prices for Extra Cheese, Extra Toppings, Dips, Sauces &amp; Ice Cream Scoops in POS
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

      {/* Create New Add-on Form Card (when open) */}
      {isCreating && (
        <div className="p-4 bg-amber-50/60 border-b border-amber-200 shrink-0">
          <form onSubmit={handleCreateNew} className="max-w-4xl mx-auto bg-white p-4 rounded-xl border border-amber-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#4B3621] flex items-center gap-1.5">
                <PlusCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>Create New Add-on / Customization</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="text-[#8B7E74] hover:text-[#2D241E] p-1"
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
                  placeholder="e.g. Extra Cheese, Extra Mayo, Scoop of Ice Cream"
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
                  placeholder="e.g. Pizza Toppings, Dips, Sauces, Ice Creams"
                  className="w-full bg-[#F9F7F5] border border-[#E0D7D0] rounded-lg p-2 text-xs text-[#2D241E] focus:outline-hidden focus:border-[#4B3621]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-3 py-1.5 rounded-lg border border-[#E0D7D0] text-xs font-bold text-[#8B7E74] hover:bg-[#F4F1EE]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-[#4B3621] hover:bg-[#3D2C1B] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
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
              <p className="font-bold text-[#4B3621]">Direct POS Integration:</p>
              <p>
                Any price changes made here (e.g. setting <strong>Extra Cheese to ₹25</strong> or <strong>Extra Topping to ₹35</strong>) immediately update across the POS Customizer and billing screen.
              </p>
            </div>
          </div>

          {/* Add-ons List */}
          <div className="bg-white rounded-xl border border-[#E0D7D0] shadow-xs overflow-hidden">
            <div className="p-3.5 bg-[#F9F7F5] border-b border-[#E0D7D0] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#4B3621] uppercase tracking-wider">
                  Configured Add-ons &amp; Customizations ({addons.length})
                </span>
              </div>
              <span className="text-[11px] text-[#8B7E74]">
                {addons.filter((a) => a.isAvailable).length} Active in POS
              </span>
            </div>

            {addons.length === 0 ? (
              <div className="p-8 text-center text-[#8B7E74]">
                <Layers className="w-8 h-8 mx-auto mb-2 text-[#E0D7D0]" />
                <p className="text-xs font-bold text-[#4B3621]">No add-ons configured</p>
                <p className="text-[11px] mt-1">Click "Add New Add-on" or "Reset Defaults" above</p>
              </div>
            ) : (
              <div className="divide-y divide-[#E0D7D0]">
                {addons.map((addon) => {
                  const isEditing = editingId === addon.id;

                  if (isEditing) {
                    return (
                      <div key={addon.id} className="p-3 bg-amber-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="bg-white border border-amber-300 rounded-lg p-2 text-xs font-bold text-[#2D241E]"
                            placeholder="Add-on Name"
                          />
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
                          <input
                            type="text"
                            value={editCategory}
                            onChange={(e) => setEditCategory(e.target.value)}
                            className="bg-white border border-amber-300 rounded-lg p-2 text-xs text-[#2D241E]"
                            placeholder="Category"
                          />
                        </div>

                        <div className="flex items-center gap-1.5 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(addon.id)}
                            className="p-1.5 rounded-lg bg-[#4B3621] text-white hover:bg-[#3D2C1B] transition-colors"
                            title="Save Changes"
                          >
                            <Check className="w-4 h-4 stroke-[3]" />
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="p-1.5 rounded-lg bg-white border border-[#E0D7D0] text-[#8B7E74] hover:bg-[#F4F1EE] transition-colors"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={addon.id}
                      className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                        addon.isAvailable ? 'hover:bg-[#F9F7F5]' : 'bg-gray-50/70 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleToggle(addon.id)}
                          className={`w-6 h-6 rounded-md flex items-center justify-center border transition-all cursor-pointer ${
                            addon.isAvailable
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'bg-white border-[#E0D7D0] text-[#8B7E74]'
                          }`}
                          title={addon.isAvailable ? 'Enabled in POS (Click to disable)' : 'Disabled in POS (Click to enable)'}
                        >
                          {addon.isAvailable && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-[#2D241E]">{addon.name}</span>
                            {addon.category && (
                              <span className="text-[10px] bg-[#F4F1EE] text-[#8B7E74] px-2 py-0.5 rounded-md font-medium border border-[#E0D7D0]">
                                {addon.category}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-[#8B7E74]">
                            Status: <strong className={addon.isAvailable ? 'text-emerald-700' : 'text-rose-600'}>{addon.isAvailable ? 'Active' : 'Disabled'}</strong>
                          </span>
                        </div>
                      </div>

                      {/* Right: Quick Price Editor & Actions */}
                      <div className="flex items-center gap-3">
                        {/* Quick Editable Price Field */}
                        <div className="flex items-center gap-1.5 bg-[#F9F7F5] border border-[#E0D7D0] rounded-lg px-2.5 py-1">
                          <span className="text-xs font-bold text-[#8B7E74]">Price:</span>
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
                            title="Edit Name & Category"
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
