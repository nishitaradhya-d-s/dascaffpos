import React, { useState, useMemo, useEffect } from 'react';
import { MenuItem, Category, CartItem, ComboItem, SectionHierarchy, GlobalAddon } from '../../types';
import { 
  getStoredCategories, 
  getStoredCombos, 
  normalizeCategoryName,
  getStoredSectionHierarchies,
  getStoredAddons
} from '../../utils/storage';
import { 
  Search, 
  Plus, 
  Minus, 
  SlidersHorizontal, 
  PackageOpen, 
  Utensils, 
  Layers, 
  UtensilsCrossed, 
  ChevronRight, 
  Sparkles,
  ArrowLeft,
  X,
  Tag,
  ChevronDown,
  Check
} from 'lucide-react';

interface MenuGridProps {
  menuItems: MenuItem[];
  onOpenCustomizer: (item: MenuItem) => void;
  onQuickAdd: (item: MenuItem) => void;
  onUpdateCartQuantityByMenuItemId: (menuItemId: string, delta: number) => void;
  cartItems: CartItem[];
  onSelectCombo?: (combo: ComboItem) => void;
}

export const MenuGrid: React.FC<MenuGridProps> = ({
  menuItems,
  onOpenCustomizer,
  onQuickAdd,
  onUpdateCartQuantityByMenuItemId,
  cartItems,
  onSelectCombo,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'veg' | 'non-veg'>('all');
  const [combos, setCombos] = useState<ComboItem[]>(() => getStoredCombos().filter((c) => c.isAvailable));
  const [sectionHierarchies, setSectionHierarchies] = useState<SectionHierarchy[]>(() => getStoredSectionHierarchies());
  const [allAddons, setAllAddons] = useState<GlobalAddon[]>(() => getStoredAddons());
  const [isSubSectionModalOpen, setIsSubSectionModalOpen] = useState(false);

  // Refresh combos, addons & section hierarchies when rendering
  useEffect(() => {
    setCombos(getStoredCombos().filter((c) => c.isAvailable));
    setSectionHierarchies(getStoredSectionHierarchies());
    setAllAddons(getStoredAddons());
  }, []);

  // When clicking a category tab, check if it has sub-sections and pop up the sub-section modal
  const handleCategorySelect = (category: string, autoOpenPopup: boolean = true) => {
    setSelectedCategory(category);
    setSelectedSubCategory('All');

    if (category === 'All' || category === 'Combos') {
      setIsSubSectionModalOpen(false);
      return;
    }

    if (autoOpenPopup) {
      // Check if this category has sub-sections
      const matchedHierarchy = sectionHierarchies.find(
        (h) => h.section.toLowerCase() === category.toLowerCase()
      );
      const hasDefinedSubs = matchedHierarchy && matchedHierarchy.subSections && matchedHierarchy.subSections.length > 0;
      const hasItemSubs = menuItems.some(
        (m) => normalizeCategoryName(m.category) === category && m.subCategory && m.subCategory.trim().length > 0
      );

      if (hasDefinedSubs || hasItemSubs) {
        setIsSubSectionModalOpen(true);
      }
    }
  };

  // Back to All Sections handler
  const handleBackToAllSections = () => {
    setSelectedCategory('All');
    setSelectedSubCategory('All');
    setIsSubSectionModalOpen(false);
  };

  // Dynamic Categories from both stored categories list, menu items, and Combos with deduplication
  const dynamicCategories = useMemo(() => {
    const fromItems = menuItems.map((m) => normalizeCategoryName(m.category)).filter(Boolean);
    const stored = getStoredCategories().map(normalizeCategoryName);
    const seen = new Set<string>();
    const cleaned: string[] = [];
    [...fromItems, ...stored].forEach((c) => {
      if (!c) return;
      const lower = c.toLowerCase();
      if (lower === 'combos' || lower === 'all') return;
      if (!seen.has(lower)) {
        seen.add(lower);
        cleaned.push(c);
      }
    });
    return ['All', 'Combos', ...cleaned];
  }, [menuItems]);

  // Compute available Sub-sections for current selected category
  const availableSubCategories = useMemo(() => {
    if (selectedCategory === 'Combos') return [];

    const subSet = new Set<string>();

    // 1. Check defined hierarchies in storage
    if (selectedCategory !== 'All') {
      const matchedHierarchy = sectionHierarchies.find(
        (h) => h.section.toLowerCase() === selectedCategory.toLowerCase()
      );
      if (matchedHierarchy && matchedHierarchy.subSections) {
        matchedHierarchy.subSections.forEach((sub) => subSet.add(sub.trim()));
      }
    } else {
      sectionHierarchies.forEach((h) => {
        h.subSections.forEach((sub) => subSet.add(sub.trim()));
      });
    }

    // 2. Also check all active menu items under this category
    menuItems.forEach((item) => {
      if (selectedCategory !== 'All' && normalizeCategoryName(item.category) !== selectedCategory) {
        return;
      }
      if (item.subCategory && item.subCategory.trim()) {
        subSet.add(item.subCategory.trim());
      }
    });

    const list = Array.from(subSet).filter(Boolean);
    return list.length > 0 ? ['All', ...list] : [];
  }, [selectedCategory, sectionHierarchies, menuItems]);

  // Section-specific add-ons for the currently selected section
  const sectionSpecificAddons = useMemo(() => {
    if (selectedCategory === 'All' || selectedCategory === 'Combos') {
      return allAddons.filter((a) => a.isAvailable);
    }
    const catNorm = normalizeCategoryName(selectedCategory).toLowerCase().trim();
    return allAddons.filter((a) => {
      if (!a.isAvailable) return false;
      if (!a.applicableSections || a.applicableSections.length === 0) return true;
      return a.applicableSections.some((sec) => {
        const s = normalizeCategoryName(sec).toLowerCase().trim();
        return s === 'all' || s === catNorm || s.includes(catNorm) || catNorm.includes(s);
      });
    });
  }, [allAddons, selectedCategory]);

  // Count items per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { 
      All: menuItems.length,
      Combos: combos.length,
    };
    menuItems.forEach((m) => {
      const norm = normalizeCategoryName(m.category);
      counts[norm] = (counts[norm] || 0) + 1;
    });
    return counts;
  }, [menuItems, combos]);

  // Count items per subcategory under currently selected category
  const subCategoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: 0 };
    menuItems.forEach((m) => {
      if (!m.isAvailable) return;
      if (selectedCategory !== 'All' && normalizeCategoryName(m.category) !== selectedCategory) {
        return;
      }
      counts['All'] = (counts['All'] || 0) + 1;
      if (m.subCategory) {
        const sub = m.subCategory.trim();
        counts[sub] = (counts[sub] || 0) + 1;
      }
    });
    return counts;
  }, [menuItems, selectedCategory]);

  // Filter items
  const filteredItems = useMemo(() => {
    if (selectedCategory === 'Combos') return [];

    return menuItems.filter((item) => {
      if (!item.isAvailable) return false;

      // Category filter
      if (selectedCategory !== 'All' && normalizeCategoryName(item.category) !== selectedCategory) {
        return false;
      }

      // Sub-category filter
      if (selectedSubCategory !== 'All') {
        const itemSub = (item.subCategory || '').trim().toLowerCase();
        if (itemSub !== selectedSubCategory.trim().toLowerCase()) {
          return false;
        }
      }

      // Veg/Non-veg filter
      if (typeFilter !== 'all') {
        if (typeFilter === 'veg' && item.type !== 'veg') return false;
        if (typeFilter === 'non-veg' && item.type !== 'non-veg') return false;
      }

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchCat = (item.category || '').toLowerCase().includes(q);
        const matchSub = (item.subCategory || '').toLowerCase().includes(q);
        const matchDesc = item.description?.toLowerCase().includes(q);
        if (!matchName && !matchCat && !matchSub && !matchDesc) return false;
      }

      return true;
    });
  }, [menuItems, selectedCategory, selectedSubCategory, typeFilter, searchQuery]);

  // Filter Combos - only shown when "Combos" category is selected OR when user actively searches
  const filteredCombos = useMemo(() => {
    const isSearchActive = searchQuery.trim().length > 0;
    if (selectedCategory !== 'Combos' && !isSearchActive) return [];

    return combos.filter((combo) => {
      if (!combo.isAvailable) return false;

      if (typeFilter !== 'all') {
        if (typeFilter === 'veg' && combo.type !== 'veg') return false;
        if (typeFilter === 'non-veg' && combo.type !== 'non-veg') return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = combo.name.toLowerCase().includes(q);
        const matchDesc = combo.description?.toLowerCase().includes(q);
        const matchSlot = combo.slots?.some(
          (s) =>
            s.title.toLowerCase().includes(q) ||
            s.customOptions?.some((o) => o.name.toLowerCase().includes(q))
        );
        if (!matchName && !matchDesc && !matchSlot) return false;
      }

      return true;
    });
  }, [combos, selectedCategory, typeFilter, searchQuery]);

  // Map of quantities in cart
  const cartQtyMap = useMemo(() => {
    const map: Record<string, number> = {};
    cartItems.forEach((ci) => {
      map[ci.menuItemId] = (map[ci.menuItemId] || 0) + ci.quantity;
    });
    return map;
  }, [cartItems]);

  const totalCartQty = useMemo(() => {
    return cartItems.reduce((acc, curr) => acc + curr.quantity, 0);
  }, [cartItems]);

  const totalCartSubtotal = useMemo(() => {
    return cartItems.reduce((acc, curr) => acc + curr.totalPrice, 0);
  }, [cartItems]);

  return (
    <div className="h-full flex flex-col bg-[#F4F1EE] overflow-hidden relative">
      {/* ======================================================== */}
      {/* POPUP: SUB-SECTION SELECTION & ITEMS MODAL               */}
      {/* ======================================================== */}
      {isSubSectionModalOpen && selectedCategory !== 'All' && selectedCategory !== 'Combos' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#2D241E]/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl border border-[#E0D7D0] flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 bg-[#4B3621] text-white flex items-center justify-between shrink-0 shadow-xs">
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Hierarchical Back Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (selectedSubCategory !== 'All') {
                      setSelectedSubCategory('All');
                    } else {
                      handleBackToAllSections();
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-all cursor-pointer shadow-2xs"
                  title={selectedSubCategory !== 'All' ? `Back to ${selectedCategory} Sub-Sections` : "Return to all sections"}
                >
                  <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
                  <span>
                    {selectedSubCategory !== 'All' ? `← ${selectedCategory} Sub-Sections` : '← All Sections'}
                  </span>
                </button>

                {selectedSubCategory !== 'All' && (
                  <button
                    type="button"
                    onClick={handleBackToAllSections}
                    className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-black/20 hover:bg-black/40 text-amber-200 text-xs font-medium transition-all cursor-pointer"
                    title="Jump directly to all sections"
                  >
                    <span>All Sections</span>
                  </button>
                )}

                <div>
                  <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wide flex items-center gap-1.5">
                    <span>{selectedCategory}</span>
                    {selectedSubCategory !== 'All' && (
                      <>
                        <span className="text-amber-400">›</span>
                        <span className="text-amber-300 font-extrabold">{selectedSubCategory}</span>
                      </>
                    )}
                  </h3>
                  <p className="text-[11px] text-amber-200/90 font-medium">
                    {selectedSubCategory === 'All' 
                      ? 'Choose a sub-section to view items or tap any tab above' 
                      : `Showing ${selectedSubCategory} items (${filteredItems.length})`}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsSubSectionModalOpen(false)}
                className="p-2 rounded-lg bg-white/10 text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
                title="Close popup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-Section Quick Switch Tabs */}
            {availableSubCategories.length > 1 && (
              <div className="bg-[#F8F5F2] border-b border-[#E0D7D0] px-4 py-2.5 flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0">
                <span className="text-[11px] font-extrabold text-[#8B7E74] uppercase tracking-wider shrink-0 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-amber-800" />
                  <span>Sub-Sections:</span>
                </span>

                {availableSubCategories.map((sub) => {
                  const isSubSelected = selectedSubCategory === sub;
                  const count = subCategoryCounts[sub] || 0;

                  return (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => setSelectedSubCategory(sub)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-extrabold whitespace-nowrap transition-all shrink-0 cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                        isSubSelected
                          ? 'bg-[#4B3621] text-white shadow-xs scale-102'
                          : 'bg-white border border-[#E0D7D0] text-[#4B3621] hover:border-[#4B3621] hover:bg-[#FDFCFB]'
                      }`}
                    >
                      <span>{sub === 'All' ? `Overview` : sub}</span>
                      {count > 0 && (
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                          isSubSelected ? 'bg-white/25 text-white' : 'bg-[#F4F1EE] text-[#8B7E74]'
                        }`}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Modal Body: Sub-Section Overview OR Items Grid */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 bg-[#FAF9F7] space-y-4">
              {/* VIEW 1: Sub-sections Overview Cards when selectedSubCategory === 'All' */}
              {selectedSubCategory === 'All' ? (
                <div className="space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#8B7E74]">
                    Select a sub-section to view &amp; add items:
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {availableSubCategories
                      .filter((s) => s !== 'All')
                      .map((sub) => {
                        const count = subCategoryCounts[sub] || 0;

                        return (
                          <button
                            key={sub}
                            type="button"
                            onClick={() => setSelectedSubCategory(sub)}
                            className="p-4 rounded-xl border-2 border-[#E0D7D0] bg-white hover:border-[#4B3621] hover:shadow-md transition-all text-left flex items-center justify-between cursor-pointer group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 group-hover:bg-[#4B3621] group-hover:text-white transition-colors flex items-center justify-center font-bold text-sm shrink-0">
                                <Layers className="w-5 h-5" />
                              </div>
                              <div>
                                <div className="text-sm font-extrabold text-[#2D241E] group-hover:text-[#4B3621] transition-colors">
                                  {sub}
                                </div>
                                <div className="text-xs text-[#8B7E74]">
                                  {count} delicious items available
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 text-xs font-bold text-[#4B3621] group-hover:translate-x-1 transition-transform">
                              <span>View Items</span>
                              <ChevronRight className="w-4 h-4" />
                            </div>
                          </button>
                        );
                      })}

                    {/* View All Items in this category Card */}
                    <button
                      type="button"
                      onClick={() => setIsSubSectionModalOpen(false)}
                      className="p-4 rounded-xl border-2 border-amber-300 bg-amber-50/70 hover:bg-amber-100 hover:border-amber-500 hover:shadow-md transition-all text-left flex items-center justify-between cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-800 text-amber-100 flex items-center justify-center font-bold text-sm shrink-0">
                          <Utensils className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-sm font-extrabold text-[#2D241E]">
                            All {selectedCategory} Items
                          </div>
                          <div className="text-xs text-[#8B7E74]">
                            {categoryCounts[selectedCategory] || 0} total items in full grid
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-bold text-amber-900 group-hover:translate-x-1 transition-transform">
                        <span>Show All</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </button>
                  </div>
                </div>
              ) : (
                /* VIEW 2: Items Grid for the chosen sub-category (e.g. Veg Burger or Creamy Pizza) */
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-white p-2.5 px-3 rounded-xl border border-[#E0D7D0] shadow-2xs">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedSubCategory('All')}
                        className="p-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-950 transition-colors cursor-pointer border border-amber-300 shadow-2xs flex items-center gap-1"
                        title={`Back to ${selectedCategory} Sub-Sections`}
                      >
                        <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
                        <span className="text-xs font-bold hidden sm:inline">Back to Sub-Sections</span>
                      </button>
                      <div>
                        <h4 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#4B3621]">
                          {selectedSubCategory} ({filteredItems.length} Items)
                        </h4>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedSubCategory('All')}
                      className="text-xs font-bold text-amber-900 hover:text-[#4B3621] bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg border border-amber-200 cursor-pointer flex items-center gap-1 transition-colors"
                    >
                      <span>← {selectedCategory} Sub-Sections</span>
                    </button>
                  </div>

                  {filteredItems.length === 0 ? (
                    <div className="h-48 flex flex-col items-center justify-center text-center p-6 text-[#8B7E74]">
                      <Utensils className="w-8 h-8 text-[#8B7E74]/60 mb-2" />
                      <p className="text-sm font-bold text-[#2D241E]">No items found in {selectedSubCategory}</p>
                      <button
                        type="button"
                        onClick={() => setSelectedSubCategory('All')}
                        className="mt-2.5 px-3 py-1.5 rounded-lg bg-[#4B3621] text-white text-xs font-bold cursor-pointer"
                      >
                        View All Sub-Sections
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {filteredItems.map((item) => {
                        const inCartQty = cartQtyMap[item.id] || 0;
                        const hasVariants = item.variants && item.variants.length > 0;

                        return (
                          <div
                            key={item.id}
                            className="bg-white rounded-xl p-3.5 border border-[#E0D7D0] hover:border-[#4B3621] transition-all shadow-2xs hover:shadow-sm flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-center justify-between gap-1 mb-1.5">
                                <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-[#8B7E74]">
                                  {item.type === 'veg' && (
                                    <span className="w-3.5 h-3.5 border border-emerald-600 rounded-xs flex items-center justify-center shrink-0">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                                    </span>
                                  )}
                                  {item.type === 'non-veg' && (
                                    <span className="w-3.5 h-3.5 border border-rose-600 rounded-xs flex items-center justify-center shrink-0">
                                      <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                                    </span>
                                  )}
                                  {item.type === 'beverage' && (
                                    <span className="w-3.5 h-3.5 border border-sky-600 rounded-xs flex items-center justify-center shrink-0">
                                      <span className="w-1.5 h-1.5 rounded-full bg-sky-600"></span>
                                    </span>
                                  )}
                                  <span className="truncate max-w-[130px]">{item.category}</span>
                                  {item.subCategory && (
                                    <>
                                      <span className="text-[#E0D7D0]">•</span>
                                      <span className="text-[#4B3621] font-semibold truncate max-w-[120px]">{item.subCategory}</span>
                                    </>
                                  )}
                                </div>

                                {item.isPopular && (
                                  <span className="text-[9px] font-extrabold text-white bg-[#4B3621] px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                                    POPULAR
                                  </span>
                                )}
                              </div>

                              <h4 className="text-sm font-extrabold text-[#2D241E] leading-tight mb-1">
                                {item.name}
                              </h4>

                              {item.description && (
                                <p className="text-[11px] text-[#8B7E74] line-clamp-2 mb-2 leading-relaxed">
                                  {item.description}
                                </p>
                              )}
                            </div>

                            {/* Price & Add Controls */}
                            <div className="flex items-center justify-between pt-2.5 border-t border-[#E0D7D0]/60 mt-1">
                              <div>
                                <div className="text-sm sm:text-base font-black font-mono text-[#4B3621]">
                                  ₹{item.price.toFixed(0)}
                                </div>
                                {hasVariants && (
                                  <div className="text-[9px] text-[#8B7E74] font-semibold">Multiple Portions</div>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5">
                                {/* Customize button */}
                                <button
                                  type="button"
                                  onClick={() => onOpenCustomizer(item)}
                                  className="p-1.5 rounded-lg bg-[#F4F1EE] text-[#4B3621] hover:bg-[#E0D7D0] transition-colors cursor-pointer border border-[#E0D7D0]"
                                  title="Customize with Add-ons, Extra Cheese, etc."
                                >
                                  <SlidersHorizontal className="w-3.5 h-3.5" />
                                </button>

                                {/* Quantity controls */}
                                {inCartQty > 0 ? (
                                  <div className="flex items-center bg-[#2D241E] text-white rounded-lg p-0.5 shadow-2xs">
                                    <button
                                      type="button"
                                      onClick={() => onUpdateCartQuantityByMenuItemId(item.id, -1)}
                                      className="w-6 h-6 rounded-md flex items-center justify-center text-[#E0D7D0] hover:text-white hover:bg-[#4B3621] transition-colors cursor-pointer"
                                    >
                                      <Minus className="w-3 h-3" />
                                    </button>
                                    <span className="px-2 text-xs font-bold font-mono text-white min-w-5 text-center">
                                      {inCartQty}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => onQuickAdd(item)}
                                      className="w-6 h-6 rounded-md flex items-center justify-center text-[#E0D7D0] hover:text-white hover:bg-[#4B3621] transition-colors cursor-pointer"
                                    >
                                      <Plus className="w-3 h-3" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => onQuickAdd(item)}
                                    className="px-3 py-1.5 rounded-lg bg-[#4B3621] hover:bg-[#3D2C1B] active:bg-[#2D241E] text-white font-extrabold text-xs transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                                  >
                                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                                    <span>Add</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 sm:p-4 bg-white border-t border-[#E0D7D0] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 text-xs text-[#4B3621] font-bold">
                <Utensils className="w-4 h-4 text-[#4B3621]" />
                <span>
                  Cart: <strong className="font-mono text-[#2D241E]">{totalCartQty} items</strong> (₹{totalCartSubtotal.toFixed(2)})
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (selectedSubCategory !== 'All') {
                      setSelectedSubCategory('All');
                    } else {
                      handleBackToAllSections();
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl border border-[#E0D7D0] text-xs font-bold text-[#4B3621] hover:bg-[#F4F1EE] transition-all cursor-pointer flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>
                    {selectedSubCategory !== 'All' ? `← ${selectedCategory} Sub-Sections` : '← All Sections'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsSubSectionModalOpen(false)}
                  className="px-5 py-2 rounded-xl bg-[#4B3621] hover:bg-[#3D2C1B] text-white text-xs sm:text-sm font-extrabold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>Done &amp; View Screen</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Search & Filter Bar */}
      <div className="p-3 bg-white border-b border-[#E0D7D0] shadow-2xs space-y-3 shrink-0">
        <div className="flex items-center gap-2">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#8B7E74] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search item, sub-category, combo (e.g. Creamy Pizza, Burger, Mojito...)"
              className="w-full bg-[#FDFCFB] border border-[#E0D7D0] rounded-lg py-2 pl-9 pr-3 text-xs sm:text-sm text-[#2D241E] placeholder:text-[#8B7E74] focus:outline-hidden focus:border-[#4B3621] focus:bg-white"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#8B7E74] hover:text-[#2D241E] cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Type Filter Pills */}
          <div className="flex items-center bg-[#F4F1EE] p-0.5 rounded-lg border border-[#E0D7D0] shrink-0">
            <button
              type="button"
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                typeFilter === 'all' ? 'bg-white text-[#2D241E] shadow-2xs' : 'text-[#8B7E74] hover:text-[#2D241E]'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('veg')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                typeFilter === 'veg' ? 'bg-emerald-50 text-emerald-800 font-bold shadow-2xs' : 'text-[#8B7E74] hover:text-[#2D241E]'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              <span>Veg</span>
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('non-veg')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                typeFilter === 'non-veg' ? 'bg-rose-50 text-rose-800 font-bold shadow-2xs' : 'text-[#8B7E74] hover:text-[#2D241E]'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-600"></span>
              <span>Non-Veg</span>
            </button>
          </div>
        </div>

        {/* Section (Main Category) Horizontal Scrolling Tabs - Enlarged Size for Quick POS Touch */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {/* Quick Hierarchical Back Button if a category is selected */}
          {selectedCategory !== 'All' && (
            <button
              type="button"
              onClick={() => {
                if (selectedSubCategory !== 'All') {
                  setSelectedSubCategory('All');
                  setIsSubSectionModalOpen(true);
                } else {
                  handleBackToAllSections();
                }
              }}
              className="px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl bg-amber-200 border-2 border-amber-400 text-amber-950 hover:bg-amber-300 text-xs sm:text-sm font-black whitespace-nowrap transition-all shrink-0 cursor-pointer flex items-center gap-1.5 shadow-xs"
              title={selectedSubCategory !== 'All' ? `Back to ${selectedCategory} Sub-Sections` : "Return to all menu sections"}
            >
              <ArrowLeft className="w-4 h-4 stroke-[3]" />
              <span>
                {selectedSubCategory !== 'All'
                  ? `← ${selectedCategory.toUpperCase()} SUB-SECTIONS`
                  : '← ALL SECTIONS'}
              </span>
            </button>
          )}

          {dynamicCategories.map((cat) => {
            const isSelected = selectedCategory === cat;
            const count = categoryCounts[cat] || 0;
            const isComboTab = cat === 'Combos';

            return (
              <button
                key={cat}
                type="button"
                onClick={() => handleCategorySelect(cat, true)}
                className={`px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl text-xs sm:text-sm md:text-base font-extrabold whitespace-nowrap transition-all shrink-0 cursor-pointer flex items-center gap-2 ${
                  isSelected
                    ? isComboTab ? 'bg-amber-800 text-amber-100 shadow-md ring-2 ring-amber-600/40' : 'bg-[#4B3621] text-white shadow-md ring-2 ring-[#4B3621]/30'
                    : isComboTab ? 'bg-amber-50 border-2 border-amber-300 text-amber-900 hover:bg-amber-100' : 'bg-white border-2 border-[#E0D7D0] text-[#2D241E] hover:border-[#4B3621] hover:bg-[#FDFCFB]'
                }`}
              >
                {isComboTab && <PackageOpen className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300" />}
                <span>{cat === 'All' ? 'ALL SECTIONS' : cat.toUpperCase()}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-[#F4F1EE] text-[#8B7E74]'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Real-time tap banner */}
      <div className="bg-[#E0D7D0]/40 border-b border-[#E0D7D0] px-3.5 py-1.5 flex items-center justify-between text-xs text-[#4B3621] font-semibold shrink-0">
        <div className="flex items-center gap-1.5">
          <Utensils className="w-3.5 h-3.5 text-[#4B3621]" />
          <span>Tap ⚙️ on any item to customize with Extra Cheese, Toppings &amp; Add-ons</span>
        </div>
        <div className="flex items-center gap-2">
          <span>Selected: <strong className="text-[#2D241E] font-mono">{totalCartQty} items</strong></span>
          <span>|</span>
          <span>Live Subtotal: <strong className="text-[#4B3621] font-mono">₹{totalCartSubtotal.toFixed(2)}</strong></span>
        </div>
      </div>

      {/* Menu Cards Grid */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
        {/* If Combos are present and matching */}
        {filteredCombos.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <PackageOpen className="w-4 h-4 text-amber-700" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#4B3621]">
                Special Meal Combos &amp; Deals ({filteredCombos.length})
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {filteredCombos.map((combo) => (
                <div
                  key={combo.id}
                  className="bg-white rounded-xl p-3.5 border-2 border-amber-200 hover:border-amber-500 transition-all shadow-xs hover:shadow-md flex flex-col justify-between relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 bg-amber-500 text-white font-bold text-[9px] px-2 py-0.5 rounded-bl-lg uppercase tracking-wider">
                    COMBO DEAL
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          combo.type === 'veg' ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                      />
                      <h4 className="text-sm font-bold text-[#2D241E] leading-tight pr-16">
                        {combo.name}
                      </h4>
                    </div>

                    {combo.description && (
                      <p className="text-[11px] text-[#8B7E74] mb-2 leading-relaxed">
                        {combo.description}
                      </p>
                    )}

                    {/* Slots summary */}
                    <div className="space-y-1 mb-2.5">
                      {combo.slots.map((s, idx) => {
                        const displaySlotTitle = s.type === 'category' && s.category
                          ? (s.title && s.title.toLowerCase().includes(s.category.toLowerCase()) ? s.title : `Choose ${s.category}`)
                          : s.title;

                        return (
                          <div
                            key={s.id}
                            className="bg-amber-50/70 border border-amber-200/80 rounded-md px-2 py-1 text-[10px] text-amber-950 flex items-center justify-between"
                          >
                            <span className="font-bold truncate max-w-[170px]">
                              Slot {idx + 1}: {displaySlotTitle}
                            </span>
                            <span className="text-[9px] text-amber-800 shrink-0 font-medium ml-1">
                              {s.type === 'category' ? `[${s.category}]` : `[${s.customOptions?.length || 0} unlisted]`}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-amber-100 mt-1">
                    <div>
                      <div className="text-sm font-bold font-mono text-[#4B3621]">
                        ₹{combo.price.toFixed(0)}
                      </div>
                      <span className="text-[9px] text-[#8B7E74]">Bundle Price</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onSelectCombo && onSelectCombo(combo)}
                      className="px-3 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <UtensilsCrossed className="w-3.5 h-3.5" />
                      <span>Select Items</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Regular Menu Items */}
        {selectedCategory !== 'Combos' && (
          <div className="space-y-3">
            {/* Active Sub-category Banner when filtered to a specific sub-category on main screen */}
            {selectedCategory !== 'All' && selectedSubCategory !== 'All' && (
              <div className="bg-amber-50/90 border border-amber-300/80 rounded-xl p-2.5 px-3.5 flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-2 text-xs font-black text-[#4B3621]">
                  <span>{selectedCategory.toUpperCase()}</span>
                  <span className="text-amber-500 font-bold">›</span>
                  <span className="text-amber-950 bg-amber-200/90 px-2 py-0.5 rounded-md font-extrabold">{selectedSubCategory}</span>
                  <span className="text-[#8B7E74] font-semibold">({filteredItems.length} items)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSubCategory('All');
                      setIsSubSectionModalOpen(true);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white border border-amber-300 text-amber-950 hover:bg-amber-100 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Sub-Sections</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleBackToAllSections}
                    className="px-2.5 py-1 rounded-lg bg-[#4B3621] text-white hover:bg-[#3D2C1B] text-xs font-bold transition-colors cursor-pointer"
                  >
                    All Sections
                  </button>
                </div>
              </div>
            )}

            {selectedCategory === 'All' && filteredCombos.length > 0 && (
              <div className="flex items-center gap-2 mb-2 pt-2 border-t border-[#E0D7D0]">
                <Utensils className="w-4 h-4 text-[#4B3621]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#4B3621]">
                  A La Carte Menu ({filteredItems.length})
                </h3>
              </div>
            )}

            {filteredItems.length === 0 && filteredCombos.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-[#8B7E74]">
                <Utensils className="w-8 h-8 text-[#8B7E74]/60 mb-2" />
                <p className="text-sm font-bold text-[#2D241E]">No menu items found</p>
                <p className="text-xs text-[#8B7E74] mt-1">Try changing category/sub-section or clearing the search query.</p>
                {selectedCategory !== 'All' && (
                  <div className="flex items-center gap-2 mt-3">
                    {selectedSubCategory !== 'All' && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSubCategory('All');
                          setIsSubSectionModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-amber-100 border border-amber-300 text-amber-950 hover:bg-amber-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Back to {selectedCategory} Sub-Sections</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleBackToAllSections}
                      className="px-3 py-1.5 rounded-lg bg-[#4B3621] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to All Sections</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5 sm:gap-3">
                {filteredItems.map((item) => {
                  const inCartQty = cartQtyMap[item.id] || 0;
                  const hasVariants = item.variants && item.variants.length > 0;

                  return (
                    <div
                      key={item.id}
                      className="bg-white rounded-xl p-3 border border-[#E0D7D0] hover:border-[#4B3621] transition-colors shadow-2xs hover:shadow-sm flex flex-col justify-between group relative overflow-hidden"
                    >
                      {/* Card Header & Body */}
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-[#8B7E74]">
                            {item.type === 'veg' && (
                              <span className="w-3 h-3 border border-emerald-600 rounded-xs flex items-center justify-center shrink-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                              </span>
                            )}
                            {item.type === 'non-veg' && (
                              <span className="w-3 h-3 border border-rose-600 rounded-xs flex items-center justify-center shrink-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                              </span>
                            )}
                            {item.type === 'beverage' && (
                              <span className="w-3 h-3 border border-sky-600 rounded-xs flex items-center justify-center shrink-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-sky-600"></span>
                              </span>
                            )}
                            <span className="truncate max-w-[120px]">{item.category}</span>
                            {item.subCategory && (
                              <>
                                <span className="text-[#E0D7D0]">•</span>
                                <span className="text-[#4B3621] font-semibold truncate max-w-[110px]">{item.subCategory}</span>
                              </>
                            )}
                          </div>

                          {item.isPopular && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-white bg-[#4B3621] px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                              BEST
                            </span>
                          )}
                        </div>

                        <h3 className="text-xs sm:text-sm font-bold text-[#2D241E] leading-tight mb-1">
                          {item.name}
                        </h3>

                        {item.description && (
                          <p className="text-[11px] text-[#8B7E74] line-clamp-2 mb-2 leading-relaxed">
                            {item.description}
                          </p>
                        )}
                      </div>

                      {/* Card Bottom: Price & Add Controls */}
                      <div className="flex items-center justify-between pt-2 border-t border-[#E0D7D0]/60 mt-1">
                        <div>
                          <div className="text-sm font-bold font-mono text-[#4B3621]">
                            ₹{item.price.toFixed(0)}
                          </div>
                          {hasVariants && (
                            <div className="text-[9px] text-[#8B7E74] font-medium">Reg / Large</div>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          {/* Customize button (always available to add Extra Cheese, Extra Toppings, etc.) */}
                          <button
                            type="button"
                            onClick={() => onOpenCustomizer(item)}
                            className="p-1.5 rounded-lg bg-[#F4F1EE] text-[#4B3621] hover:bg-[#E0D7D0] transition-colors cursor-pointer border border-[#E0D7D0]"
                            title="Customize with Extra Cheese, Toppings & Portions"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                          </button>

                          {/* Quantity or Add Button */}
                          {inCartQty > 0 ? (
                            <div className="flex items-center bg-[#2D241E] text-white rounded-lg p-0.5 shadow-2xs">
                              <button
                                type="button"
                                onClick={() => onUpdateCartQuantityByMenuItemId(item.id, -1)}
                                className="w-6 h-6 rounded-md flex items-center justify-center text-[#E0D7D0] hover:text-white hover:bg-[#4B3621] transition-colors cursor-pointer"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="px-2 text-xs font-bold font-mono text-white min-w-5 text-center">
                                {inCartQty}
                              </span>
                              <button
                                type="button"
                                onClick={() => onQuickAdd(item)}
                                className="w-6 h-6 rounded-md flex items-center justify-center text-[#E0D7D0] hover:text-white hover:bg-[#4B3621] transition-colors cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onQuickAdd(item)}
                              className="px-2.5 py-1.5 rounded-lg bg-[#4B3621] hover:bg-[#3D2C1B] active:bg-[#2D241E] text-white font-bold text-xs transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                            >
                              <Plus className="w-3 h-3 stroke-[3]" />
                              <span>Add</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};


