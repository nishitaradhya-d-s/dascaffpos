import React, { useState, useMemo, useEffect } from 'react';
import { MenuItem, Category, ItemType, SectionHierarchy } from '../../types';
import { 
  getStoredCategories, 
  saveCategories, 
  getStoredCoupons, 
  getStoredAddons, 
  getStoredCombos, 
  normalizeCategoryName,
  getStoredSectionHierarchies,
  saveSectionHierarchies
} from '../../utils/storage';
import { CouponManagerSection } from './CouponManagerSection';
import { AddonManagerSection } from './AddonManagerSection';
import { ComboManagerSection } from './ComboManagerSection';
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
  PackageOpen,
  Save,
  FolderPlus,
  LayoutGrid,
  Tag,
  Layers,
  Utensils,
  ChevronRight,
  FolderTree,
  Sparkles
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
  const [activeSubTab, setActiveSubTab] = useState<'menu' | 'coupons' | 'addons' | 'combos'>('menu');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState<string>('All');
  const [selectedSubCat, setSelectedSubCat] = useState<string>('All');
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Section Hierarchies (Section -> Sub-sections)
  const [sectionHierarchies, setSectionHierarchies] = useState<SectionHierarchy[]>(() => getStoredSectionHierarchies());

  // Dynamic Categories / Sections with strict deduplication
  const [categories, setCategories] = useState<string[]>(() => {
    const stored = getStoredCategories().map(normalizeCategoryName);
    const fromItems = menuItems.map((m) => normalizeCategoryName(m.category));
    const fromHierarchies = getStoredSectionHierarchies().map((h) => normalizeCategoryName(h.section));
    const seen = new Set<string>();
    const cleaned: string[] = [];
    [...stored, ...fromItems, ...fromHierarchies].forEach((c) => {
      if (!c) return;
      const lower = c.toLowerCase();
      if (lower === 'combos' || lower === 'all') return;
      if (!seen.has(lower)) {
        seen.add(lower);
        cleaned.push(c);
      }
    });
    return cleaned;
  });

  const [isManageSectionsOpen, setIsManageSectionsOpen] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [activeSectionForSub, setActiveSectionForSub] = useState<string>('');
  const [newSubSectionName, setNewSubSectionName] = useState('');

  // Form State for editing / creating
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Pizzas');
  const [subCategory, setSubCategory] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [type, setType] = useState<ItemType>('veg');
  const [description, setDescription] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [isPopular, setIsPopular] = useState(false);

  // Keep hierarchies and categories synced
  useEffect(() => {
    setSectionHierarchies(getStoredSectionHierarchies());
  }, [isManageSectionsOpen]);

  const allCategoryPills = useMemo(() => ['All', ...categories], [categories]);

  // Sub-sections available for the currently selected category in the form
  const availableSubSectionsForForm = useMemo(() => {
    const matched = sectionHierarchies.find(
      (h) => h.section.toLowerCase() === category.toLowerCase()
    );
    const subSet = new Set<string>();
    if (matched && matched.subSections) {
      matched.subSections.forEach((s) => subSet.add(s.trim()));
    }
    // Also include subCategories from existing menu items
    menuItems.forEach((m) => {
      if (m.category.toLowerCase() === category.toLowerCase() && m.subCategory) {
        subSet.add(m.subCategory.trim());
      }
    });
    return Array.from(subSet).filter(Boolean);
  }, [category, sectionHierarchies, menuItems]);

  // Available sub-sections for selected category tab
  const availableSubCatsForTable = useMemo(() => {
    if (selectedCat === 'All') return [];
    const matched = sectionHierarchies.find(
      (h) => h.section.toLowerCase() === selectedCat.toLowerCase()
    );
    const subSet = new Set<string>();
    if (matched && matched.subSections) {
      matched.subSections.forEach((s) => subSet.add(s.trim()));
    }
    menuItems.forEach((m) => {
      if (m.category.toLowerCase() === selectedCat.toLowerCase() && m.subCategory) {
        subSet.add(m.subCategory.trim());
      }
    });
    const arr = Array.from(subSet).filter(Boolean);
    return arr.length > 0 ? ['All', ...arr] : [];
  }, [selectedCat, sectionHierarchies, menuItems]);

  const filteredItems = menuItems.filter((i) => {
    const norm = normalizeCategoryName(i.category);
    if (selectedCat !== 'All' && norm !== selectedCat) return false;
    if (selectedSubCat !== 'All') {
      const iSub = (i.subCategory || '').trim().toLowerCase();
      if (iSub !== selectedSubCat.trim().toLowerCase()) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        i.name.toLowerCase().includes(q) ||
        (i.category && i.category.toLowerCase().includes(q)) ||
        (i.subCategory && i.subCategory.toLowerCase().includes(q)) ||
        (i.description && i.description.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleStartEdit = (item: MenuItem) => {
    setEditingItem(item);
    setIsCreating(false);
    setName(item.name);
    setCategory(normalizeCategoryName(item.category));
    setSubCategory(item.subCategory || '');
    setPrice(item.price);
    setType(item.type);
    setDescription(item.description || '');
    setIsAvailable(item.isAvailable);
    setIsPopular(item.isPopular || false);
  };

  const handleStartCreate = (defaultCategory?: string, defaultSubCategory?: string) => {
    setEditingItem(null);
    setIsCreating(true);
    setName('');
    const targetCat = defaultCategory || (selectedCat !== 'All' ? selectedCat : categories[0] || 'Pizzas');
    const targetSub = defaultSubCategory || (selectedSubCat !== 'All' ? selectedSubCat : '');
    setCategory(normalizeCategoryName(targetCat));
    setSubCategory(targetSub);
    setPrice(99);
    setType('veg');
    setDescription('');
    setIsAvailable(true);
    setIsPopular(false);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || price < 0) return;
    const finalCategory = normalizeCategoryName(category);
    const finalSubCategory = subCategory.trim() || undefined;

    // Automatically ensure this subCategory is recorded in sectionHierarchies
    if (finalSubCategory) {
      const currentHierarchies = [...sectionHierarchies];
      const foundIdx = currentHierarchies.findIndex(
        (h) => h.section.toLowerCase() === finalCategory.toLowerCase()
      );
      if (foundIdx >= 0) {
        if (!currentHierarchies[foundIdx].subSections.some((s) => s.toLowerCase() === finalSubCategory.toLowerCase())) {
          currentHierarchies[foundIdx].subSections.push(finalSubCategory);
          setSectionHierarchies(currentHierarchies);
          saveSectionHierarchies(currentHierarchies);
        }
      } else {
        currentHierarchies.push({
          section: finalCategory,
          subSections: [finalSubCategory],
        });
        setSectionHierarchies(currentHierarchies);
        saveSectionHierarchies(currentHierarchies);
      }
    }

    if (isCreating) {
      const newItem: MenuItem = {
        id: `item-${Date.now()}`,
        name: name.trim(),
        category: finalCategory,
        subCategory: finalSubCategory,
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
            category: finalCategory,
            subCategory: finalSubCategory,
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

  // Manage Section & Sub-Section Actions
  const handleAddSection = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newSectionName.trim();
    if (!clean) return;
    if (categories.some((c) => c.toLowerCase() === clean.toLowerCase())) {
      alert('Section already exists');
      return;
    }
    const updated = [...categories, clean];
    setCategories(updated);
    saveCategories(updated);

    // Also update hierarchies
    const updatedH = [...sectionHierarchies];
    if (!updatedH.some((h) => h.section.toLowerCase() === clean.toLowerCase())) {
      updatedH.push({ section: clean, subSections: [] });
      setSectionHierarchies(updatedH);
      saveSectionHierarchies(updatedH);
    }

    setNewSectionName('');
    setActiveSectionForSub(clean);
  };

  const handleDeleteSection = (sec: string) => {
    if (confirm(`Delete section "${sec}"? Note: Items belonging to this section won't be deleted.`)) {
      const updated = categories.filter((c) => c.toLowerCase() !== sec.toLowerCase());
      setCategories(updated);
      saveCategories(updated);

      const updatedH = sectionHierarchies.filter((h) => h.section.toLowerCase() !== sec.toLowerCase());
      setSectionHierarchies(updatedH);
      saveSectionHierarchies(updatedH);

      if (selectedCat.toLowerCase() === sec.toLowerCase()) setSelectedCat('All');
      if (activeSectionForSub.toLowerCase() === sec.toLowerCase()) setActiveSectionForSub('');
    }
  };

  const handleAddSubSection = (sectionName: string, e: React.FormEvent) => {
    e.preventDefault();
    const subClean = newSubSectionName.trim();
    if (!subClean) return;

    const updatedH = [...sectionHierarchies];
    const targetIdx = updatedH.findIndex((h) => h.section.toLowerCase() === sectionName.toLowerCase());

    if (targetIdx >= 0) {
      if (updatedH[targetIdx].subSections.some((s) => s.toLowerCase() === subClean.toLowerCase())) {
        alert('Sub-section already exists in this section');
        return;
      }
      updatedH[targetIdx].subSections.push(subClean);
    } else {
      updatedH.push({
        section: sectionName,
        subSections: [subClean],
      });
    }

    setSectionHierarchies(updatedH);
    saveSectionHierarchies(updatedH);
    setNewSubSectionName('');
  };

  const handleDeleteSubSection = (sectionName: string, subName: string) => {
    const updatedH = sectionHierarchies.map((h) => {
      if (h.section.toLowerCase() === sectionName.toLowerCase()) {
        return {
          ...h,
          subSections: h.subSections.filter((s) => s.toLowerCase() !== subName.toLowerCase()),
        };
      }
      return h;
    });
    setSectionHierarchies(updatedH);
    saveSectionHierarchies(updatedH);
  };

  const couponsList = useMemo(() => getStoredCoupons(), [activeSubTab]);
  const activeCouponsCount = useMemo(() => couponsList.filter((c) => c.isActive).length, [couponsList]);

  const addonsList = useMemo(() => getStoredAddons(), [activeSubTab]);
  const activeAddonsCount = useMemo(() => addonsList.filter((a) => a.isAvailable).length, [addonsList]);

  const combosList = useMemo(() => getStoredCombos(), [activeSubTab]);
  const activeCombosCount = useMemo(() => combosList.filter((c) => c.isAvailable).length, [combosList]);

  const renderSubTabBar = () => (
    <div className="bg-[#4B3621] px-4 pt-3 flex items-center justify-between border-b border-[#3D2C1B] overflow-x-auto no-scrollbar">
      <div className="flex items-center gap-1.5 min-w-max">
        {/* Tab 1: Menu Items */}
        <button
          type="button"
          onClick={() => setActiveSubTab('menu')}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-t-lg font-bold text-xs transition-colors cursor-pointer ${
            activeSubTab === 'menu'
              ? 'bg-[#F4F1EE] text-[#4B3621] shadow-xs'
              : 'text-amber-100/70 hover:text-white hover:bg-white/5'
          }`}
        >
          <UtensilsCrossed className="w-4 h-4" />
          <span>Menu Items &amp; Rates</span>
          <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
            activeSubTab === 'menu' ? 'bg-[#4B3621] text-amber-200' : 'bg-white/10 text-white'
          }`}>
            {menuItems.length}
          </span>
        </button>

        {/* Tab 2: Coupons */}
        <button
          type="button"
          onClick={() => setActiveSubTab('coupons')}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-t-lg font-bold text-xs transition-colors cursor-pointer ${
            activeSubTab === 'coupons'
              ? 'bg-[#F4F1EE] text-[#4B3621] shadow-xs'
              : 'text-amber-100/70 hover:text-white hover:bg-white/5'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Coupon Codes</span>
          <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
            activeSubTab === 'coupons' ? 'bg-[#4B3621] text-amber-200' : 'bg-white/10 text-white'
          }`}>
            {activeCouponsCount}
          </span>
        </button>

        {/* Tab 3: Add-ons & Extra Prices (Extra Cheese, Toppings, Dips) */}
        <button
          type="button"
          onClick={() => setActiveSubTab('addons')}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-t-lg font-bold text-xs transition-colors cursor-pointer ${
            activeSubTab === 'addons'
              ? 'bg-[#F4F1EE] text-[#4B3621] shadow-xs'
              : 'text-amber-100/70 hover:text-white hover:bg-white/5'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Add-ons Rates (Extra Cheese &amp; Toppings)</span>
          <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
            activeSubTab === 'addons' ? 'bg-[#4B3621] text-amber-200' : 'bg-white/10 text-white'
          }`}>
            {activeAddonsCount}
          </span>
        </button>

        {/* Tab 4: Combos & Meal Bundles Builder */}
        <button
          type="button"
          onClick={() => setActiveSubTab('combos')}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-t-lg font-bold text-xs transition-colors cursor-pointer ${
            activeSubTab === 'combos'
              ? 'bg-[#F4F1EE] text-[#4B3621] shadow-xs'
              : 'text-amber-100/70 hover:text-white hover:bg-white/5'
          }`}
        >
          <PackageOpen className="w-4 h-4 text-amber-300" />
          <span>Combos &amp; Meal Deals</span>
          <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
            activeSubTab === 'combos' ? 'bg-[#4B3621] text-amber-200' : 'bg-white/10 text-white'
          }`}>
            {activeCombosCount}
          </span>
        </button>
      </div>
    </div>
  );

  if (activeSubTab === 'coupons') {
    return (
      <div className="h-full flex-1 flex flex-col bg-[#F4F1EE] overflow-hidden select-none">
        {renderSubTabBar()}
        <CouponManagerSection />
      </div>
    );
  }

  if (activeSubTab === 'addons') {
    return (
      <div className="h-full flex-1 flex flex-col bg-[#F4F1EE] overflow-hidden select-none">
        {renderSubTabBar()}
        <AddonManagerSection />
      </div>
    );
  }

  if (activeSubTab === 'combos') {
    return (
      <div className="h-full flex-1 flex flex-col bg-[#F4F1EE] overflow-hidden select-none">
        {renderSubTabBar()}
        <ComboManagerSection menuItems={menuItems} />
      </div>
    );
  }

  return (
    <div className="h-full flex-1 flex flex-col bg-[#F4F1EE] overflow-hidden select-none">
      {renderSubTabBar()}

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
                Organize sections &amp; sub-sections (e.g. Pizza → Creamy Pizzas), rates, descriptions, and portions.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveSectionForSub(categories[0] || 'Pizzas');
                setIsManageSectionsOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F4F1EE] hover:bg-[#E0D7D0] text-[#4B3621] border border-[#E0D7D0] rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              <FolderTree className="w-3.5 h-3.5 text-[#4B3621]" />
              <span>Sections &amp; Sub-Sections</span>
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
              placeholder="Search items by name, section, sub-section, or ingredients..."
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
                  onClick={() => {
                    setSelectedCat(c);
                    setSelectedSubCat('All');
                  }}
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

        {/* Sub-sections Pills in MenuManager for fast sub-section filtering & direct item adding */}
        {availableSubCatsForTable.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-[#E0D7D0]/60 pb-0.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8B7E74] shrink-0 flex items-center gap-1">
              <Layers className="w-3 h-3 text-[#4B3621]" />
              <span>Sub-Sections:</span>
            </span>
            {availableSubCatsForTable.map((sub) => {
              const isSubSelected = selectedSubCat === sub;
              return (
                <div key={sub} className="flex items-center shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelectedSubCat(sub)}
                    className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                      isSubSelected
                        ? 'bg-[#2D241E] text-white shadow-2xs'
                        : 'bg-[#F4F1EE] border border-[#E0D7D0] text-[#4B3621] hover:bg-white'
                    }`}
                  >
                    {sub}
                  </button>
                </div>
              );
            })}

            {selectedSubCat !== 'All' && (
              <button
                type="button"
                onClick={() => handleStartCreate(selectedCat, selectedSubCat)}
                className="ml-auto text-[10px] font-bold px-2 py-0.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-md flex items-center gap-1 border border-amber-300 cursor-pointer shrink-0"
              >
                <Plus className="w-3 h-3" />
                <span>+ Add Item to "{selectedSubCat}"</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Area: Items Table */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        <div className="bg-white rounded-xl border border-[#E0D7D0] shadow-2xs overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F4F1EE] border-b border-[#E0D7D0] text-[10px] uppercase font-bold text-[#8B7E74] tracking-wider">
                <th className="py-2.5 px-3">Item Details</th>
                <th className="py-2.5 px-3">Section / Hierarchy</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3 text-right">Selling Price</th>
                <th className="py-2.5 px-3 text-center">In Stock</th>
                <th className="py-2.5 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E0D7D0]/60">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#8B7E74]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Utensils className="w-8 h-8 text-[#E0D7D0]" />
                      <p className="font-semibold text-xs text-[#2D241E]">
                        No items found {selectedSubCat !== 'All' ? `in "${selectedSubCat}"` : selectedCat !== 'All' ? `in "${selectedCat}"` : ''}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleStartCreate(selectedCat !== 'All' ? selectedCat : undefined, selectedSubCat !== 'All' ? selectedSubCat : undefined)}
                        className="mt-1 px-4 py-1.5 bg-[#4B3621] hover:bg-[#3D2C1B] text-white rounded-lg font-bold text-xs cursor-pointer shadow-xs flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>
                          + Add First Item {selectedSubCat !== 'All' ? `to "${selectedSubCat}"` : selectedCat !== 'All' ? `to "${selectedCat}"` : ''}
                        </span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
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

                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-[#2D241E]">{item.category}</span>
                        {item.subCategory && (
                          <>
                            <span className="text-[#8B7E74]">/</span>
                            <span className="text-[11px] font-semibold text-[#4B3621] bg-[#F4F1EE] border border-[#E0D7D0] px-1.5 py-0.5 rounded-md">
                              {item.subCategory}
                            </span>
                          </>
                        )}
                      </div>
                    </td>

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
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Edit / Create Form Modal Popup */}
        {(editingItem || isCreating) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D241E]/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-[#E0D7D0] animate-in zoom-in-95 duration-150">
              <div className="p-4 bg-[#4B3621] text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-400/20 text-amber-300 flex items-center justify-center font-bold">
                    <Utensils className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider font-cinzel">
                      {isCreating ? 'Add New Menu Item' : 'Edit Menu Item Details'}
                    </h3>
                    <p className="text-[11px] text-amber-200">
                      Configure rates, section, sub-section, description &amp; availability
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setEditingItem(null);
                    setIsCreating(false);
                  }}
                  className="p-1.5 rounded-lg bg-white/10 text-white/70 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveItem} className="p-5 space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-[#2D241E] mb-1">Item Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Belgian Chocolate Shake or Paneer Creamy Pizza"
                    required
                    className="w-full bg-[#F9F7F5] border border-[#E0D7D0] rounded-lg p-2.5 font-bold text-[#2D241E] focus:outline-hidden focus:border-[#4B3621]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#2D241E] mb-1">Section (Category) *</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-[#F9F7F5] border border-[#E0D7D0] rounded-lg p-2.5 text-[#2D241E] font-bold focus:outline-hidden focus:border-[#4B3621]"
                    >
                      {categories.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-[#2D241E] mb-1">Sub-Section (e.g. Creamy Pizzas)</label>
                    <input
                      type="text"
                      list="sub-sections-list"
                      value={subCategory}
                      onChange={(e) => setSubCategory(e.target.value)}
                      placeholder="e.g. Creamy Pizzas"
                      className="w-full bg-[#F9F7F5] border border-[#E0D7D0] rounded-lg p-2.5 text-[#2D241E] font-bold focus:outline-hidden focus:border-[#4B3621]"
                    />
                    <datalist id="sub-sections-list">
                      {availableSubSectionsForForm.map((sub) => (
                        <option key={sub} value={sub} />
                      ))}
                    </datalist>

                    {/* Quick Pick Sub-Section Chips */}
                    {availableSubSectionsForForm.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        <span className="text-[10px] text-[#8B7E74] font-medium">Quick Pick:</span>
                        {availableSubSectionsForForm.map((sub) => (
                          <button
                            key={sub}
                            type="button"
                            onClick={() => setSubCategory(sub)}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition-all cursor-pointer border ${
                              subCategory.trim().toLowerCase() === sub.trim().toLowerCase()
                                ? 'bg-[#4B3621] text-white border-[#4B3621] shadow-2xs'
                                : 'bg-white border-[#E0D7D0] text-[#4B3621] hover:bg-[#F4F1EE]'
                            }`}
                          >
                            {sub}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#2D241E] mb-1">Selling Price (₹) *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8B7E74]">₹</span>
                      <input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                        min="0"
                        required
                        className="w-full bg-[#F9F7F5] border border-[#E0D7D0] rounded-lg py-2.5 pl-7 pr-3 text-[#2D241E] font-mono font-bold focus:outline-hidden focus:border-[#4B3621]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-[#2D241E] mb-1">Dietary Type</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['veg', 'non-veg', 'beverage'] as ItemType[]).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setType(t)}
                          className={`py-2 rounded-lg text-center font-bold capitalize transition-all cursor-pointer border text-[11px] ${
                            type === t
                              ? 'bg-[#4B3621] text-white border-[#4B3621]'
                              : 'bg-white border-[#E0D7D0] text-[#8B7E74] hover:bg-[#F4F1EE]'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-[#2D241E] mb-1">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    placeholder="Ingredients and preparation notes for customer and KOT"
                    className="w-full bg-[#F9F7F5] border border-[#E0D7D0] rounded-lg p-2.5 text-[#2D241E] focus:outline-hidden focus:border-[#4B3621]"
                  />
                </div>

                <div className="flex items-center justify-between pt-1 pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAvailable}
                      onChange={(e) => setIsAvailable(e.target.checked)}
                      className="rounded-md border-[#E0D7D0] text-[#4B3621] w-4 h-4 cursor-pointer"
                    />
                    <span className="font-bold text-[#2D241E]">In Stock (Available in Billing)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPopular}
                      onChange={(e) => setIsPopular(e.target.checked)}
                      className="rounded-md border-[#E0D7D0] text-[#4B3621] w-4 h-4 cursor-pointer"
                    />
                    <span className="font-bold text-[#2D241E]">Best Seller Tag</span>
                  </label>
                </div>

                <div className="pt-3 flex justify-end gap-2 border-t border-[#E0D7D0]">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingItem(null);
                      setIsCreating(false);
                    }}
                    className="px-4 py-2 rounded-lg border border-[#E0D7D0] font-bold text-[#8B7E74] hover:bg-[#F4F1EE] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#4B3621] hover:bg-[#3D2C1B] active:bg-[#2D241E] text-white font-bold rounded-lg transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isCreating ? 'Create Item' : 'Save Changes'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: Manage Sections & Sub-Sections */}
      {isManageSectionsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D241E]/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-2xl w-full overflow-hidden shadow-2xl border border-[#E0D7D0] animate-in fade-in zoom-in duration-150 flex flex-col max-h-[90vh]">
            <div className="p-4 bg-[#4B3621] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <FolderTree className="w-5 h-5 text-amber-200" />
                <div>
                  <h3 className="font-bold text-sm">Sections &amp; Sub-Sections Hierarchy</h3>
                  <p className="text-[11px] text-amber-200">
                    Add/edit main Sections (e.g. Pizza) and their Sub-Sections (e.g. Creamy Pizzas)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsManageSectionsOpen(false)}
                className="p-1 text-white/70 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-5 text-xs">
              {/* Add New Main Section */}
              <form onSubmit={handleAddSection} className="space-y-1.5 bg-[#F9F7F5] p-3 rounded-xl border border-[#E0D7D0]">
                <label className="block font-bold text-[#2D241E]">
                  Create New Main Section (e.g. Milkshakes, Waffles, Desserts)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSectionName}
                    onChange={(e) => setNewSectionName(e.target.value)}
                    placeholder="Section name (e.g. Momos, Milkshakes)..."
                    className="flex-1 bg-white border border-[#E0D7D0] rounded-lg p-2 font-bold text-[#2D241E] focus:outline-hidden focus:border-[#4B3621]"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#4B3621] hover:bg-[#3D2C1B] text-white rounded-lg font-bold cursor-pointer transition-all shadow-2xs"
                  >
                    + Add Section
                  </button>
                </div>
              </form>

              {/* Sections & Sub-sections List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-[11px] uppercase tracking-wider text-[#8B7E74]">
                    Configured Sections &amp; Sub-Sections ({categories.length} Sections)
                  </h4>
                  <span className="text-[11px] text-[#8B7E74]">
                    Select a section below to add or remove its sub-sections
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
                  {categories.map((sec) => {
                    const hierarchy = sectionHierarchies.find((h) => h.section.toLowerCase() === sec.toLowerCase());
                    const subSections = hierarchy ? hierarchy.subSections : [];
                    const isSelectedSec = activeSectionForSub.toLowerCase() === sec.toLowerCase();

                    return (
                      <div
                        key={sec}
                        className={`p-3 rounded-xl border transition-all ${
                          isSelectedSec
                            ? 'border-[#4B3621] bg-[#FAF8F5] ring-2 ring-[#4B3621]/20 shadow-xs'
                            : 'border-[#E0D7D0] bg-white hover:border-[#8B7E74]'
                        }`}
                      >
                        {/* Section Header */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5">
                            <FolderPlus className="w-4 h-4 text-[#4B3621]" />
                            <span className="font-bold text-sm text-[#2D241E]">{sec}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setIsManageSectionsOpen(false);
                                handleStartCreate(sec);
                              }}
                              className="text-[10px] font-bold px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-md transition-colors cursor-pointer flex items-center gap-1"
                              title={`Add new item in ${sec}`}
                            >
                              <Plus className="w-3 h-3 text-amber-700" />
                              <span>Add Item</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setActiveSectionForSub(isSelectedSec ? '' : sec);
                                setNewSubSectionName('');
                              }}
                              className={`text-[11px] font-bold px-2.5 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
                                isSelectedSec ? 'bg-[#4B3621] text-white shadow-2xs' : 'bg-[#F4F1EE] text-[#4B3621] hover:bg-[#E0D7D0]'
                              }`}
                            >
                              <span>{isSelectedSec ? 'Editing Sub-Sections' : '+ Manage Sub'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteSection(sec)}
                              className="p-1 text-[#8B7E74] hover:text-rose-600 cursor-pointer"
                              title="Delete Section"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Sub-sections Pills */}
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-1.5">
                            {subSections.length === 0 ? (
                              <span className="text-[11px] text-[#8B7E74] italic">No sub-sections yet. Click '+ Manage Sub' to add.</span>
                            ) : (
                              subSections.map((sub) => {
                                const itemCount = menuItems.filter(
                                  (m) =>
                                    m.category.toLowerCase() === sec.toLowerCase() &&
                                    (m.subCategory || '').toLowerCase().trim() === sub.toLowerCase().trim()
                                ).length;

                                return (
                                  <div
                                    key={sub}
                                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold bg-[#F4F1EE] text-[#4B3621] border border-[#E0D7D0] pl-2 pr-1.5 py-1 rounded-md shadow-2xs"
                                  >
                                    <span className="font-bold">{sub}</span>
                                    <span className="text-[10px] text-[#8B7E74] bg-white px-1.5 py-0.2 rounded-full border border-[#E0D7D0]">
                                      {itemCount} {itemCount === 1 ? 'item' : 'items'}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setIsManageSectionsOpen(false);
                                        handleStartCreate(sec, sub);
                                      }}
                                      className="text-[10px] font-bold px-1.5 py-0.5 bg-[#4B3621] hover:bg-[#3D2C1B] text-white rounded cursor-pointer transition-colors flex items-center gap-0.5 ml-0.5"
                                      title={`Add new item inside ${sub}`}
                                    >
                                      <Plus className="w-2.5 h-2.5" />
                                      <span>Add</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteSubSection(sec, sub)}
                                      className="text-[#8B7E74] hover:text-rose-600 cursor-pointer ml-0.5"
                                      title={`Remove sub-section ${sub}`}
                                    >
                                      ✕
                                    </button>
                                  </div>
                                );
                              })
                            )}
                          </div>

                          {/* Quick Add Sub-section input box shown when this section is selected */}
                          {isSelectedSec && (
                            <form
                              onSubmit={(e) => handleAddSubSection(sec, e)}
                              className="bg-white p-2.5 rounded-lg border border-[#4B3621]/40 flex flex-col gap-1.5 mt-2"
                            >
                              <div className="text-[10px] font-bold uppercase text-[#4B3621]">
                                Add Sub-Section inside {sec}
                              </div>
                              <div className="flex gap-1.5">
                                <input
                                  type="text"
                                  autoFocus
                                  value={newSubSectionName}
                                  onChange={(e) => setNewSubSectionName(e.target.value)}
                                  placeholder={`e.g. Creamy Pizzas, Loaded ${sec}...`}
                                  className="flex-1 bg-[#F9F7F5] border border-[#E0D7D0] rounded-md p-1.5 text-xs text-[#2D241E] font-medium focus:outline-hidden focus:border-[#4B3621] focus:bg-white"
                                />
                                <button
                                  type="submit"
                                  className="px-3 py-1.5 bg-[#4B3621] hover:bg-[#3D2C1B] text-white rounded-md text-xs font-bold cursor-pointer transition-all shadow-2xs"
                                >
                                  + Add Sub
                                </button>
                              </div>
                            </form>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-4 bg-[#F9F7F5] border-t border-[#E0D7D0] flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setIsManageSectionsOpen(false)}
                className="px-5 py-2 bg-[#4B3621] hover:bg-[#3D2C1B] text-white rounded-lg font-bold cursor-pointer transition-all shadow-xs"
              >
                Save &amp; Finish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
