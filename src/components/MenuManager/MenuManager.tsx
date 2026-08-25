import React, { useState, useMemo } from 'react';
import { MenuItem, Category, ItemType } from '../../types';
import { getStoredCategories, saveCategories, getStoredCoupons } from '../../utils/storage';
import { CouponManagerSection } from './CouponManagerSection';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  RotateCcw, 
  UtensilsCrossed, 
  SlidersHorizontal,
  Sparkles,
  Save,
  FolderPlus,
  LayoutGrid,
  Tag
} from 'lucide-react';

interface MenuManagerProps {
  menuItems: MenuItem[];
  onSaveMenu: (newMenu: MenuItem[]) => void;
  onResetMenu: () => void;
}

export const MenuManager: React.FC<MenuManagerProps> = ({
  menuItems,
  onSaveMenu,
  onResetMenu,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'menu' | 'coupons'>('menu');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState<string>('All');
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Dynamic Categories / Sections
  const [categories, setCategories] = useState<string[]>(() => {
    const stored = getStoredCategories();
    // Also include any categories present in current menu items
    const fromItems = Array.from(new Set(menuItems.map((m) => m.category)));
    const merged = Array.from(new Set([...stored, ...fromItems]));
    return merged;
  });

  const [isManageSectionsOpen, setIsManageSectionsOpen] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');

  // Form State for editing / creating
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Creamy Pizzas');
  const [price, setPrice] = useState<number>(0);
  const [type, setType] = useState<ItemType>('veg');
  const [description, setDescription] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [isPopular, setIsPopular] = useState(false);

  const allCategoryPills = useMemo(() => ['All', ...categories], [categories]);

  const filteredItems = menuItems.filter((i) => {
    if (selectedCat !== 'All' && i.category !== selectedCat) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        i.name.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q) ||
        (i.description && i.description.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleStartEdit = (item: MenuItem) => {
    setEditingItem(item);
    setIsCreating(false);
    setName(item.name);
    setCategory(item.category);
    setPrice(item.price);
    setType(item.type);
    setDescription(item.description || '');
    setIsAvailable(item.isAvailable);
    setIsPopular(item.isPopular || false);
  };

  const handleStartCreate = (defaultCategory?: string) => {
    setEditingItem(null);
    setIsCreating(true);
    setName('');
    setCategory(defaultCategory || (selectedCat !== 'All' ? selectedCat : categories[0] || 'Creamy Pizzas'));
    setPrice(99);
    setType('veg');
    setDescription('');
    setIsAvailable(true);
    setIsPopular(false);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || price < 0) return;

    if (isCreating) {
      const newItem: MenuItem = {
        id: `item-${Date.now()}`,
        name: name.trim(),
        category,
        price,
        type,
        description: description.trim() || undefined,
        isAvailable,
        isPopular,
      };
      onSaveMenu([newItem, ...menuItems]);
    } else if (editingItem) {
      const updated = menuItems.map((it) => {
        if (it.id === editingItem.id) {
          return {
            ...it,
            name: name.trim(),
            category,
            price,
            type,
            description: description.trim() || undefined,
            isAvailable,
            isPopular,
          };
        }
        return it;
      });
      onSaveMenu(updated);
    }

    setEditingItem(null);
    setIsCreating(false);
  };

  const handleDeleteItem = (id: string) => {
    if (confirm('Are you sure you want to delete this menu item?')) {
      onSaveMenu(menuItems.filter((i) => i.id !== id));
      if (editingItem?.id === id) {
        setEditingItem(null);
      }
    }
  };

  const handleToggleAvailability = (id: string) => {
    const updated = menuItems.map((it) => {
      if (it.id === id) {
        return { ...it, isAvailable: !it.isAvailable };
      }
      return it;
    });
    onSaveMenu(updated);
  };

  const handleAddSection = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newSectionName.trim();
    if (!clean) return;
    if (categories.includes(clean)) {
      alert('Section already exists');
      return;
    }
    const updated = [...categories, clean];
    setCategories(updated);
    saveCategories(updated);
    setNewSectionName('');
    setSelectedCat(clean);
  };

  const handleDeleteSection = (sec: string) => {
    if (confirm(`Delete section "${sec}"? Note: Items belonging to this section won't be deleted.`)) {
      const updated = categories.filter((c) => c !== sec);
      setCategories(updated);
      saveCategories(updated);
      if (selectedCat === sec) setSelectedCat('All');
    }
  };

  const couponsList = useMemo(() => getStoredCoupons(), [activeSubTab]);
  const activeCouponsCount = useMemo(() => couponsList.filter((c) => c.isActive).length, [couponsList]);

  if (activeSubTab === 'coupons') {
    return (
      <div className="h-full flex-1 flex flex-col bg-[#F4F1EE] overflow-hidden select-none">
        {/* Sub-Tab Navigation Bar */}
        <div className="bg-[#4B3621] px-4 pt-3 flex items-center justify-between border-b border-[#3D2C1B]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveSubTab('menu')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-bold text-xs transition-colors cursor-pointer text-amber-100/70 hover:text-white hover:bg-white/5"
            >
              <UtensilsCrossed className="w-4 h-4" />
              <span>Menu Items &amp; Rates Catalog</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('coupons')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-bold text-xs transition-colors cursor-pointer bg-[#F4F1EE] text-[#4B3621] shadow-xs"
            >
              <Tag className="w-4 h-4 text-[#4B3621]" />
              <span>Coupon Codes &amp; Vouchers</span>
              <span className="bg-[#4B3621] text-amber-200 text-[10px] font-mono px-1.5 py-0.2 rounded-full">
                {activeCouponsCount}
              </span>
            </button>
          </div>
        </div>

        <CouponManagerSection />
      </div>
    );
  }

  return (
    <div className="h-full flex-1 flex flex-col bg-[#F4F1EE] overflow-hidden select-none">
      {/* Sub-Tab Navigation Bar */}
      <div className="bg-[#4B3621] px-4 pt-3 flex items-center justify-between border-b border-[#3D2C1B]">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('menu')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-bold text-xs transition-colors cursor-pointer bg-[#F4F1EE] text-[#4B3621] shadow-xs"
          >
            <UtensilsCrossed className="w-4 h-4 text-[#4B3621]" />
            <span>Menu Items &amp; Rates Catalog</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('coupons')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-bold text-xs transition-colors cursor-pointer text-amber-100/70 hover:text-white hover:bg-white/5"
          >
            <Tag className="w-4 h-4" />
            <span>Coupon Codes &amp; Vouchers</span>
            <span className="bg-amber-200/20 text-amber-200 text-[10px] font-mono px-1.5 py-0.2 rounded-full">
              {activeCouponsCount}
            </span>
          </button>
        </div>
      </div>

      {/* Top Header */}
      <div className="p-4 bg-white border-b border-[#E0D7D0] space-y-3 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#4B3621] text-amber-200 flex items-center justify-center font-bold shadow-xs">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-[#2D241E] leading-tight">
                Menu &amp; Rates Catalog Manager
              </h1>
              <p className="text-xs text-[#8B7E74] font-medium">
                Add sections (Milkshakes, Combos, etc.), manage prices, descriptions, and portion variants.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsManageSectionsOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F4F1EE] hover:bg-[#E0D7D0] text-[#4B3621] border border-[#E0D7D0] rounded-lg text-xs font-bold transition-all cursor-pointer"
            >
              <FolderPlus className="w-3.5 h-3.5 text-[#4B3621]" />
              <span>+ Add / Manage Sections</span>
            </button>

            <button
              type="button"
              onClick={() => handleStartCreate()}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#4B3621] hover:bg-[#3D2C1B] active:bg-[#2D241E] text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add New Item</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (confirm('Reset menu back to factory defaults?')) {
                  onResetMenu();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#F4F1EE] text-[#4B3621] border border-[#E0D7D0] rounded-lg text-xs font-bold transition-colors cursor-pointer"
              title="Reset Menu"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Default</span>
            </button>
          </div>
        </div>

        {/* Search & Dynamic Category Pills */}
        <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
          <div className="relative flex-1 w-full">
            <Search className="w-3.5 h-3.5 text-[#8B7E74] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search items by name, section, or ingredients..."
              className="w-full bg-white border border-[#E0D7D0] rounded-lg py-1.5 pl-8 pr-3 text-xs text-[#2D241E] focus:outline-hidden focus:border-[#4B3621]"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 max-w-full shrink-0">
            {allCategoryPills.map((c) => {
              const isSel = selectedCat === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedCat(c)}
                  className={`px-3 py-1 rounded-md text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isSel
                      ? 'bg-[#4B3621] text-white shadow-2xs'
                      : 'bg-white border border-[#E0D7D0] text-[#8B7E74] hover:text-[#2D241E]'
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Area: Grid & Edit Drawer */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col lg:flex-row gap-4">
        {/* Items List Table/Grid */}
        <div className="flex-1 overflow-y-auto space-y-2">
          <div className="bg-white rounded-xl border border-[#E0D7D0] shadow-2xs overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F4F1EE] border-b border-[#E0D7D0] text-[10px] uppercase font-bold text-[#8B7E74] tracking-wider">
                  <th className="py-2.5 px-3">Item Details</th>
                  <th className="py-2.5 px-3">Section / Category</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3 text-right">Selling Price</th>
                  <th className="py-2.5 px-3 text-center">In Stock</th>
                  <th className="py-2.5 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E0D7D0]/60">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-[#F9F7F5] transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            item.type === 'veg'
                              ? 'bg-emerald-600'
                              : item.type === 'non-veg'
                              ? 'bg-rose-600'
                              : 'bg-amber-600'
                          }`}
                        />
                        <div>
                          <div className="font-bold text-[#2D241E]">{item.name}</div>
                          {item.description && (
                            <div className="text-[10px] text-[#8B7E74] line-clamp-1 max-w-sm">
                              {item.description}
                            </div>
                          )}
                        </div>
                        {item.isPopular && (
                          <span className="text-[9px] font-bold text-[#4B3621] bg-[#F4F1EE] border border-[#E0D7D0] px-1.5 py-0.5 rounded-md">
                            Best
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-2.5 px-3 font-semibold text-[#2D241E]">{item.category}</td>

                    <td className="py-2.5 px-3 uppercase text-[10px] font-bold text-[#8B7E74]">
                      {item.type}
                    </td>

                    <td className="py-2.5 px-3 text-right font-bold font-mono text-[#4B3621] text-sm">
                      ₹{item.price.toFixed(0)}
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleAvailability(item.id)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md cursor-pointer transition-all border ${
                          item.isAvailable
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                        }`}
                      >
                        {item.isAvailable ? 'Available' : 'Sold Out'}
                      </button>
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(item)}
                          className="p-1.5 rounded-md bg-[#F4F1EE] hover:bg-[#E0D7D0] text-[#2D241E] transition-colors cursor-pointer"
                          title="Edit Item"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1.5 rounded-md bg-[#F4F1EE] hover:bg-rose-100 text-[#8B7E74] hover:text-rose-700 transition-colors cursor-pointer"
                          title="Delete Item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit / Create Form Panel */}
        {(editingItem || isCreating) && (
          <div className="w-full lg:w-80 bg-white rounded-xl p-4 border border-[#E0D7D0] shadow-sm space-y-4 shrink-0">
            <div className="flex items-center justify-between pb-2 border-b border-[#E0D7D0]">
              <h3 className="text-sm font-bold text-[#2D241E] uppercase">
                {isCreating ? 'Create Menu Item' : 'Edit Menu Item'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setEditingItem(null);
                  setIsCreating(false);
                }}
                className="p-1 text-[#8B7E74] hover:text-[#2D241E] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#2D241E] mb-1">Item Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Belgian Chocolate Shake"
                  required
                  className="w-full bg-white border border-[#E0D7D0] rounded-lg p-2 font-medium text-[#2D241E] focus:outline-hidden focus:border-[#4B3621]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-[#2D241E] mb-1">Section / Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-white border border-[#E0D7D0] rounded-lg p-2 text-[#2D241E] font-medium focus:outline-hidden focus:border-[#4B3621]"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#2D241E] mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                    min="0"
                    required
                    className="w-full bg-white border border-[#E0D7D0] rounded-lg p-2 text-[#2D241E] font-mono font-bold focus:outline-hidden focus:border-[#4B3621]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#2D241E] mb-1">Dietary Type</label>
                <div className="grid grid-cols-3 gap-1">
                  {(['veg', 'non-veg', 'beverage'] as ItemType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={`p-2 rounded-lg text-center font-bold capitalize transition-all cursor-pointer ${
                        type === t
                          ? 'bg-[#4B3621] text-white shadow-2xs'
                          : 'bg-white border border-[#E0D7D0] text-[#8B7E74] hover:text-[#2D241E]'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#2D241E] mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Ingredients and description for customer and KOT"
                  className="w-full bg-white border border-[#E0D7D0] rounded-lg p-2 text-[#2D241E] focus:outline-hidden focus:border-[#4B3621]"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAvailable}
                    onChange={(e) => setIsAvailable(e.target.checked)}
                    className="rounded-md border-[#E0D7D0] text-[#4B3621] w-4 h-4 cursor-pointer"
                  />
                  <span className="font-bold text-[#2D241E]">In Stock</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPopular}
                    onChange={(e) => setIsPopular(e.target.checked)}
                    className="rounded-md border-[#E0D7D0] text-[#4B3621] w-4 h-4 cursor-pointer"
                  />
                  <span className="font-bold text-[#2D241E]">Best Seller</span>
                </label>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-[#4B3621] hover:bg-[#3D2C1B] active:bg-[#2D241E] text-white font-bold rounded-lg text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Item</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* MODAL: Manage Sections / Categories */}
      {isManageSectionsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D241E]/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full overflow-hidden shadow-2xl border border-[#E0D7D0] animate-in fade-in zoom-in duration-150">
            <div className="p-4 bg-[#4B3621] text-white flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-amber-200" />
                <span>Add &amp; Manage Menu Sections</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsManageSectionsOpen(false)}
                className="p-1 text-white/70 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4 text-xs">
              <form onSubmit={handleAddSection} className="space-y-2">
                <label className="block font-bold text-[#2D241E]">
                  Create New Section (e.g. Milkshakes, Waffles, Combos)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSectionName}
                    onChange={(e) => setNewSectionName(e.target.value)}
                    placeholder="Type section name..."
                    className="flex-1 bg-white border border-[#E0D7D0] rounded-lg p-2 font-bold text-[#2D241E] focus:outline-hidden focus:border-[#4B3621]"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#4B3621] text-white rounded-lg font-bold cursor-pointer hover:bg-[#3D2C1B]"
                  >
                    Add
                  </button>
                </div>
              </form>

              <div>
                <h4 className="font-bold text-[11px] uppercase text-[#8B7E74] mb-2">
                  Existing Menu Sections ({categories.length})
                </h4>
                <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                  {categories.map((sec) => (
                    <div
                      key={sec}
                      className="p-2 bg-[#F9F7F5] rounded-lg border border-[#E0D7D0] flex items-center justify-between"
                    >
                      <span className="font-bold text-[#2D241E]">{sec}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteSection(sec)}
                        className="p-1 text-[#8B7E74] hover:text-rose-600 cursor-pointer"
                        title="Delete Section"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end border-t border-[#E0D7D0]">
                <button
                  type="button"
                  onClick={() => setIsManageSectionsOpen(false)}
                  className="px-4 py-2 bg-[#4B3621] text-white rounded-lg font-bold cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
