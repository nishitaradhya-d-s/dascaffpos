import React, { useState, useMemo } from 'react';
import { MenuItem, Category, CartItem } from '../../types';
import { getStoredCategories } from '../../utils/storage';
import { Search, Plus, Minus, SlidersHorizontal, Sparkles, Utensils } from 'lucide-react';

interface MenuGridProps {
  menuItems: MenuItem[];
  onOpenCustomizer: (item: MenuItem) => void;
  onQuickAdd: (item: MenuItem) => void;
  onUpdateCartQuantityByMenuItemId: (menuItemId: string, delta: number) => void;
  cartItems: CartItem[];
}

export const MenuGrid: React.FC<MenuGridProps> = ({
  menuItems,
  onOpenCustomizer,
  onQuickAdd,
  onUpdateCartQuantityByMenuItemId,
  cartItems,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'veg' | 'non-veg'>('all');

  // Dynamic Categories from both stored categories list and menu items
  const dynamicCategories = useMemo(() => {
    const fromItems = menuItems.map((m) => m.category).filter(Boolean);
    const stored = getStoredCategories();
    const merged = Array.from(new Set([...fromItems, ...stored]));
    return ['All', ...merged];
  }, [menuItems]);

  // Count items per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: menuItems.length };
    menuItems.forEach((m) => {
      counts[m.category] = (counts[m.category] || 0) + 1;
    });
    return counts;
  }, [menuItems]);

  // Filter items
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      if (!item.isAvailable) return false;

      // Category filter
      if (selectedCategory !== 'All' && item.category !== selectedCategory) {
        return false;
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
        const matchCat = item.category.toLowerCase().includes(q);
        const matchDesc = item.description?.toLowerCase().includes(q);
        if (!matchName && !matchCat && !matchDesc) return false;
      }

      return true;
    });
  }, [menuItems, selectedCategory, typeFilter, searchQuery]);

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
    <div className="h-full flex flex-col bg-[#F4F1EE] overflow-hidden">
      {/* Top Search & Filter Bar */}
      <div className="p-3 bg-white border-b border-[#E0D7D0] shadow-2xs space-y-2.5 shrink-0">
        <div className="flex items-center gap-2">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#8B7E74] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search food item (e.g., Creamy Pizza, Burger, Mojito, ...)"
              className="w-full bg-[#FDFCFB] border border-[#E0D7D0] rounded-lg py-1.5 pl-9 pr-3 text-xs sm:text-sm text-[#2D241E] placeholder:text-[#8B7E74] focus:outline-hidden focus:border-[#4B3621] focus:bg-white"
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
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                typeFilter === 'all' ? 'bg-white text-[#2D241E] shadow-2xs' : 'text-[#8B7E74] hover:text-[#2D241E]'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('veg')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                typeFilter === 'veg' ? 'bg-emerald-50 text-emerald-800 font-bold shadow-2xs' : 'text-[#8B7E74] hover:text-[#2D241E]'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
              <span>Veg</span>
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('non-veg')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                typeFilter === 'non-veg' ? 'bg-rose-50 text-rose-800 font-bold shadow-2xs' : 'text-[#8B7E74] hover:text-[#2D241E]'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
              <span>Non-Veg</span>
            </button>
          </div>
        </div>

        {/* Category Horizontal Scrolling Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          {dynamicCategories.map((cat) => {
            const isSelected = selectedCategory === cat;
            const count = categoryCounts[cat] || 0;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#4B3621] text-white shadow-xs'
                    : 'bg-white border border-[#E0D7D0] text-[#2D241E] hover:bg-[#FDFCFB]'
                }`}
              >
                <span>{cat === 'All' ? 'ALL ITEMS' : cat.toUpperCase()}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
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
          <span>Tap any item to add &amp; calculate bill in real-time</span>
        </div>
        <div className="flex items-center gap-2">
          <span>Selected: <strong className="text-[#2D241E] font-mono">{totalCartQty} items</strong></span>
          <span>|</span>
          <span>Live Subtotal: <strong className="text-[#4B3621] font-mono">₹{totalCartSubtotal.toFixed(2)}</strong></span>
        </div>
      </div>

      {/* Menu Cards Grid */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4">
        {filteredItems.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-[#8B7E74]">
            <Sparkles className="w-8 h-8 text-[#8B7E74]/60 mb-2" />
            <p className="text-sm font-bold text-[#2D241E]">No menu items found</p>
            <p className="text-xs text-[#8B7E74] mt-1">Try changing category or clearing the search query.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5 sm:gap-3">
            {filteredItems.map((item) => {
              const inCartQty = cartQtyMap[item.id] || 0;
              const hasVariants = item.variants && item.variants.length > 0;
              const hasAddons = item.availableAddons && item.availableAddons.length > 0;

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
                        <span className="truncate">{item.category}</span>
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
                      {/* Customize button if item has variants or addons */}
                      {(hasVariants || hasAddons) && (
                        <button
                          type="button"
                          onClick={() => onOpenCustomizer(item)}
                          className="p-1.5 rounded-lg bg-[#F4F1EE] text-[#4B3621] hover:bg-[#E0D7D0] transition-colors cursor-pointer border border-[#E0D7D0]"
                          title="Customize size & addons"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                        </button>
                      )}

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
    </div>
  );
};
