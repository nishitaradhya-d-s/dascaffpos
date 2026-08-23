import React, { useState, useMemo } from 'react';
import { 
  RawMaterial, 
  Supplier, 
  WastageRecord, 
  PurchaseOrder, 
  RecipeMapping, 
  RecipeIngredient,
  MenuItem, 
  CafeSettings 
} from '../../types';
import { 
  getStoredRawMaterials, 
  saveRawMaterials, 
  getStoredSuppliers, 
  saveSuppliers, 
  getStoredWastage, 
  saveWastageRecord, 
  getStoredPurchaseOrders, 
  savePurchaseOrder,
  updateRawMaterialStock,
  getStoredRecipes,
  saveRecipeForMenuItem,
  saveAllRecipes
} from '../../utils/storage';
import { 
  Boxes, 
  AlertTriangle, 
  Truck, 
  Trash2, 
  Plus, 
  Edit3, 
  TrendingDown, 
  ClipboardList, 
  Utensils, 
  Search, 
  CheckCircle2, 
  RefreshCw, 
  DollarSign, 
  PackageCheck,
  Building2,
  X,
  Save,
  ArrowUpDown,
  History,
  Layers,
  Scale
} from 'lucide-react';

interface InventoryManagerProps {
  menuItems: MenuItem[];
  settings: CafeSettings;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({ menuItems, settings }) => {
  const [activeSubTab, setActiveSubTab] = useState<'raw_materials' | 'recipes' | 'purchases' | 'suppliers' | 'wastage' | 'adjustments'>('raw_materials');
  
  // Data States
  const [materials, setMaterials] = useState<RawMaterial[]>(() => getStoredRawMaterials());
  const [recipes, setRecipes] = useState<RecipeMapping[]>(() => getStoredRecipes());
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => getStoredSuppliers());
  const [wastages, setWastages] = useState<WastageRecord[]>(() => getStoredWastage());
  const [purchases, setPurchases] = useState<PurchaseOrder[]>(() => getStoredPurchaseOrders());

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLowStockOnly, setFilterLowStockOnly] = useState(false);

  // Modals
  const [isAddMaterialOpen, setIsAddMaterialOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<RawMaterial | null>(null);

  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const [isLogWastageOpen, setIsLogWastageOpen] = useState(false);
  const [isNewPurchaseOpen, setIsNewPurchaseOpen] = useState(false);
  const [isStockAdjustmentOpen, setIsStockAdjustmentOpen] = useState(false);

  // Recipe Editing Modal State
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [selectedRecipeItem, setSelectedRecipeItem] = useState<MenuItem | null>(null);
  const [tempIngredients, setTempIngredients] = useState<RecipeIngredient[]>([]);

  // Form States - Material
  const [matName, setMatName] = useState('');
  const [matUnit, setMatUnit] = useState<RawMaterial['unit']>('kg');
  const [matStock, setMatStock] = useState<number>(10);
  const [matMin, setMatMin] = useState<number>(3);
  const [matCost, setMatCost] = useState<number>(100);
  const [matSupplier, setMatSupplier] = useState('');

  // Form States - Supplier
  const [supName, setSupName] = useState('');
  const [supPerson, setSupPerson] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supEmail, setSupEmail] = useState('');
  const [supAddress, setSupAddress] = useState('');
  const [supItems, setSupItems] = useState('');

  // Form States - Wastage
  const [wasteMatId, setWasteMatId] = useState('');
  const [wasteQty, setWasteQty] = useState<number>(1);
  const [wasteReason, setWasteReason] = useState('Expired / Spoiled');
  const [wasteReporter, setWasteReporter] = useState('Kitchen Staff');

  // Form States - Stock Adjustment
  const [adjMatId, setAdjMatId] = useState('');
  const [adjNewStock, setAdjNewStock] = useState<number>(0);
  const [adjReason, setAdjReason] = useState('Physical Stock Count Audit');

  // Form States - Inward Purchase
  const [poSupplierId, setPoSupplierId] = useState('');
  const [poItems, setPoItems] = useState<{ rawMaterialId: string; quantity: number; unitPrice: number }[]>([
    { rawMaterialId: materials[0]?.id || '', quantity: 5, unitPrice: materials[0]?.costPerUnit || 100 }
  ]);

  // Inventory Totals
  const { totalItems, lowStockItems, totalValuation, totalExpenditure } = useMemo(() => {
    let lowCount = 0;
    let val = 0;
    let expVal = 0;
    materials.forEach((m) => {
      if (m.currentStock <= m.minThreshold) {
        lowCount++;
      }
      val += m.currentStock * m.costPerUnit;
      if (m.totalUsed) {
        expVal += m.totalUsed * m.costPerUnit;
      }
    });
    return {
      totalItems: materials.length,
      lowStockItems: lowCount,
      totalValuation: val,
      totalExpenditure: expVal,
    };
  }, [materials]);

  // Filtered Materials
  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      if (filterLowStockOnly && m.currentStock > m.minThreshold) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          m.name.toLowerCase().includes(q) ||
          (m.supplierName && m.supplierName.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [materials, filterLowStockOnly, searchQuery]);

  // Handlers - Recipe Edit
  const handleOpenRecipeEditor = (item: MenuItem) => {
    setSelectedRecipeItem(item);
    const existing = recipes.find(
      (r) => r.menuItemId === item.id || (r.menuItemName && r.menuItemName.toLowerCase() === item.name.toLowerCase())
    );
    if (existing && existing.ingredients && existing.ingredients.length > 0) {
      setTempIngredients([...existing.ingredients]);
    } else {
      // Prepopulate smart default based on category
      const itemName = item.name.toLowerCase();
      const defaultList: RecipeIngredient[] = [];
      if (itemName.includes('pizza') || item.category.includes('Pizza')) {
        defaultList.push(
          { rawMaterialId: 'rm-1', rawMaterialName: 'Mozzarella Cheese (Diced)', quantityRequired: 0.035, unit: 'kg' },
          { rawMaterialId: 'rm-2', rawMaterialName: 'Pizza Dough Base (7")', quantityRequired: 1, unit: 'pcs' },
          { rawMaterialId: 'rm-6', rawMaterialName: 'Pizza Marinara Sauce', quantityRequired: 0.030, unit: 'kg' }
        );
      } else if (itemName.includes('burger') || item.category.includes('Burger')) {
        defaultList.push(
          { rawMaterialId: 'rm-3', rawMaterialName: 'Burger Bun (Sesame)', quantityRequired: 1, unit: 'pcs' },
          { rawMaterialId: 'rm-12', rawMaterialName: 'Chipotle Mayo & Sauces', quantityRequired: 0.025, unit: 'kg' }
        );
      } else if (itemName.includes('fries') || item.category.includes('Fries')) {
        defaultList.push(
          { rawMaterialId: 'rm-7', rawMaterialName: 'Frozen Potato French Fries', quantityRequired: 0.120, unit: 'kg' }
        );
      }
      setTempIngredients(defaultList);
    }
    setIsRecipeModalOpen(true);
  };

  const handleAddIngredientRow = () => {
    const firstMat = materials[0];
    if (!firstMat) return;
    setTempIngredients([
      ...tempIngredients,
      {
        rawMaterialId: firstMat.id,
        rawMaterialName: firstMat.name,
        quantityRequired: 0.030,
        unit: firstMat.unit,
      },
    ]);
  };

  const handleUpdateIngredientRow = (index: number, field: 'rawMaterialId' | 'quantityRequired', val: any) => {
    const updated = [...tempIngredients];
    if (field === 'rawMaterialId') {
      const mat = materials.find((m) => m.id === val);
      updated[index] = {
        ...updated[index],
        rawMaterialId: val,
        rawMaterialName: mat?.name || '',
        unit: mat?.unit || 'kg',
      };
    } else {
      updated[index] = {
        ...updated[index],
        quantityRequired: Math.max(0, parseFloat(val) || 0),
      };
    }
    setTempIngredients(updated);
  };

  const handleRemoveIngredientRow = (index: number) => {
    setTempIngredients(tempIngredients.filter((_, i) => i !== index));
  };

  const handleSaveRecipe = () => {
    if (!selectedRecipeItem) return;
    saveRecipeForMenuItem(selectedRecipeItem.id, tempIngredients, selectedRecipeItem.name);
    setRecipes(getStoredRecipes());
    setIsRecipeModalOpen(false);
  };

  // Handlers - Material
  const handleOpenAddMaterial = () => {
    setEditingMaterial(null);
    setMatName('');
    setMatUnit('kg');
    setMatStock(10);
    setMatMin(3);
    setMatCost(100);
    setMatSupplier(suppliers[0]?.name || '');
    setIsAddMaterialOpen(true);
  };

  const handleOpenEditMaterial = (m: RawMaterial) => {
    setEditingMaterial(m);
    setMatName(m.name);
    setMatUnit(m.unit);
    setMatStock(m.currentStock);
    setMatMin(m.minThreshold);
    setMatCost(m.costPerUnit);
    setMatSupplier(m.supplierName || '');
    setIsAddMaterialOpen(true);
  };

  const handleSaveMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!matName.trim()) return;

    if (editingMaterial) {
      const updated = materials.map((m) =>
        m.id === editingMaterial.id
          ? {
              ...m,
              name: matName.trim(),
              unit: matUnit,
              currentStock: Number(matStock),
              minThreshold: Number(matMin),
              costPerUnit: Number(matCost),
              supplierName: matSupplier,
            }
          : m
      );
      setMaterials(updated);
      saveRawMaterials(updated);
    } else {
      const newMat: RawMaterial = {
        id: `rm-${Date.now()}`,
        name: matName.trim(),
        unit: matUnit,
        currentStock: Number(matStock),
        minThreshold: Number(matMin),
        costPerUnit: Number(matCost),
        supplierName: matSupplier,
        lastRestockedDate: new Date().toISOString(),
      };
      const updated = [newMat, ...materials];
      setMaterials(updated);
      saveRawMaterials(updated);
    }
    setIsAddMaterialOpen(false);
  };

  const handleDeleteMaterial = (id: string) => {
    if (confirm('Are you sure you want to delete this raw material item?')) {
      const updated = materials.filter((m) => m.id !== id);
      setMaterials(updated);
      saveRawMaterials(updated);
    }
  };

  // Handlers - Wastage
  const handleSaveWastage = (e: React.FormEvent) => {
    e.preventDefault();
    const targetMat = materials.find((m) => m.id === wasteMatId);
    if (!targetMat || wasteQty <= 0) return;

    const cost = +(wasteQty * targetMat.costPerUnit).toFixed(2);
    const newWaste: WastageRecord = {
      id: `wst-${Date.now()}`,
      date: new Date().toISOString(),
      rawMaterialId: targetMat.id,
      rawMaterialName: targetMat.name,
      quantity: Number(wasteQty),
      unit: targetMat.unit,
      reason: wasteReason,
      cost,
      reportedBy: wasteReporter.trim() || 'Staff',
    };

    saveWastageRecord(newWaste);
    setWastages(getStoredWastage());
    setMaterials(getStoredRawMaterials());
    setIsLogWastageOpen(false);
  };

  // Handlers - Stock Adjustment
  const handleSaveAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    const targetMat = materials.find((m) => m.id === adjMatId);
    if (!targetMat) return;

    const updated = materials.map((m) => {
      if (m.id === targetMat.id) {
        return { ...m, currentStock: Math.max(0, Number(adjNewStock)) };
      }
      return m;
    });

    setMaterials(updated);
    saveRawMaterials(updated);
    setIsStockAdjustmentOpen(false);
  };

  // Handlers - Supplier
  const handleOpenAddSupplier = () => {
    setEditingSupplier(null);
    setSupName('');
    setSupPerson('');
    setSupPhone('');
    setSupEmail('');
    setSupAddress('');
    setSupItems('');
    setIsAddSupplierOpen(true);
  };

  const handleOpenEditSupplier = (s: Supplier) => {
    setEditingSupplier(s);
    setSupName(s.name);
    setSupPerson(s.contactPerson);
    setSupPhone(s.phone);
    setSupEmail(s.email || '');
    setSupAddress(s.address || '');
    setSupItems(s.itemsSupplied.join(', '));
    setIsAddSupplierOpen(true);
  };

  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName.trim() || !supPhone.trim()) return;

    const itemsArray = supItems
      .split(',')
      .map((i) => i.trim())
      .filter(Boolean);

    if (editingSupplier) {
      const updated = suppliers.map((s) =>
        s.id === editingSupplier.id
          ? {
              ...s,
              name: supName.trim(),
              contactPerson: supPerson.trim(),
              phone: supPhone.trim(),
              email: supEmail.trim() || undefined,
              address: supAddress.trim() || undefined,
              itemsSupplied: itemsArray,
            }
          : s
      );
      setSuppliers(updated);
      saveSuppliers(updated);
    } else {
      const newSup: Supplier = {
        id: `sup-${Date.now()}`,
        name: supName.trim(),
        contactPerson: supPerson.trim(),
        phone: supPhone.trim(),
        email: supEmail.trim() || undefined,
        address: supAddress.trim() || undefined,
        itemsSupplied: itemsArray,
      };
      const updated = [newSup, ...suppliers];
      setSuppliers(updated);
      saveSuppliers(updated);
    }
    setIsAddSupplierOpen(false);
  };

  const handleDeleteSupplier = (id: string) => {
    if (confirm('Are you sure you want to remove this supplier?')) {
      const updated = suppliers.filter((s) => s.id !== id);
      setSuppliers(updated);
      saveSuppliers(updated);
    }
  };

  // Handlers - Inward Purchase
  const handleSavePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    const sup = suppliers.find((s) => s.id === poSupplierId);
    if (!sup || poItems.length === 0) return;

    let totalAmount = 0;
    const formattedItems = poItems.map((pi) => {
      const mat = materials.find((m) => m.id === pi.rawMaterialId);
      const rowTotal = pi.quantity * pi.unitPrice;
      totalAmount += rowTotal;
      return {
        rawMaterialId: pi.rawMaterialId,
        rawMaterialName: mat?.name || 'Raw Material',
        quantity: pi.quantity,
        unit: mat?.unit || 'kg',
        unitPrice: pi.unitPrice,
        totalPrice: rowTotal,
      };
    });

    const newPO: PurchaseOrder = {
      id: `po-${Date.now()}`,
      orderNumber: `PO-${String(purchases.length + 101).padStart(4, '0')}`,
      date: new Date().toISOString(),
      supplierId: sup.id,
      supplierName: sup.name,
      items: formattedItems,
      totalAmount,
      status: 'Received',
      paymentStatus: 'Paid',
    };

    // Auto-update raw material stock
    poItems.forEach((pi) => {
      updateRawMaterialStock(pi.rawMaterialId, pi.quantity);
    });

    savePurchaseOrder(newPO);
    setPurchases(getStoredPurchaseOrders());
    setMaterials(getStoredRawMaterials());
    setIsNewPurchaseOpen(false);
  };

  return (
    <div className="h-full flex-1 flex flex-col bg-[#F4F1EE] overflow-hidden select-none">
      {/* Top Header Bar */}
      <div className="p-4 bg-white border-b border-[#E0D7D0] space-y-3 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#4B3621] text-amber-200 flex items-center justify-center font-bold shadow-xs">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-[#2D241E] leading-tight flex items-center gap-2">
                <span>Inventory, Stock &amp; Recipe BOM Manager</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md">
                  Auto-Deduct Active
                </span>
              </h1>
              <p className="text-xs text-[#8B7E74] font-medium">
                Live raw materials register, auto-deductions on billing, purchase inward, wastage tracking &amp; recipes.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenAddMaterial}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#4B3621] hover:bg-[#3D2C1B] active:bg-[#2D241E] text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add Raw Material</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPoSupplierId(suppliers[0]?.id || '');
                setPoItems([{ rawMaterialId: materials[0]?.id || '', quantity: 10, unitPrice: materials[0]?.costPerUnit || 100 }]);
                setIsNewPurchaseOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Inward Stock (PO)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setWasteMatId(materials[0]?.id || '');
                setWasteQty(1);
                setIsLogWastageOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E0D7D0] hover:bg-[#F4F1EE] text-[#4B3621] rounded-lg text-xs font-bold transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Log Wastage</span>
            </button>
          </div>
        </div>

        {/* Sub-Tabs Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 border-t border-[#E0D7D0]">
          {[
            { id: 'raw_materials', label: '📦 Raw Material Stock', badge: totalItems },
            { id: 'recipes', label: '📖 Recipe BOM (Costing)', badge: menuItems.length },
            { id: 'purchases', label: '🚚 Inward Purchase Orders', badge: purchases.length },
            { id: 'suppliers', label: '🏢 Suppliers Directory', badge: suppliers.length },
            { id: 'wastage', label: '🗑️ Wastage & Spoilage', badge: wastages.length },
            { id: 'adjustments', label: '⚖️ Physical Stock Audit', badge: undefined },
          ].map((tab) => {
            const isSel = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  isSel
                    ? 'bg-[#4B3621] text-white shadow-2xs'
                    : 'bg-white border border-[#E0D7D0] text-[#8B7E74] hover:text-[#2D241E]'
                }`}
              >
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                      isSel ? 'bg-white/20 text-white' : 'bg-[#E0D7D0] text-[#2D241E]'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content View */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Metric Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white p-3.5 rounded-xl border border-[#E0D7D0] shadow-2xs">
            <div className="text-[10px] uppercase font-bold text-[#8B7E74]">TOTAL RAW MATERIALS</div>
            <div className="text-2xl font-bold text-[#2D241E] font-mono mt-0.5">
              {totalItems} <span className="text-xs font-normal text-[#8B7E74]">SKUs</span>
            </div>
            <div className="text-[11px] text-emerald-700 font-medium mt-1">Automatic POS Billing Linked</div>
          </div>

          <div
            onClick={() => setFilterLowStockOnly(!filterLowStockOnly)}
            className={`p-3.5 rounded-xl border shadow-2xs cursor-pointer transition-all ${
              lowStockItems > 0
                ? 'bg-amber-50 border-amber-300 hover:bg-amber-100'
                : 'bg-white border-[#E0D7D0]'
            }`}
          >
            <div className="text-[10px] uppercase font-bold text-amber-900 flex items-center justify-between">
              <span>LOW STOCK ALERTS</span>
              {lowStockItems > 0 && <AlertTriangle className="w-3.5 h-3.5 text-amber-700 animate-bounce" />}
            </div>
            <div className="text-2xl font-bold text-amber-900 font-mono mt-0.5">
              {lowStockItems} <span className="text-xs font-normal text-amber-800">Critical Items</span>
            </div>
            <div className="text-[11px] text-amber-800 font-medium mt-1">
              {filterLowStockOnly ? 'Showing Low Stock Only (Click to reset)' : 'Click to filter low stock'}
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-[#E0D7D0] shadow-2xs">
            <div className="text-[10px] uppercase font-bold text-[#8B7E74]">TOTAL STOCK VALUATION</div>
            <div className="text-2xl font-bold text-[#4B3621] font-mono mt-0.5">
              ₹{totalValuation.toFixed(2)}
            </div>
            <div className="text-[11px] text-[#8B7E74] font-medium mt-1">Real-time asset value</div>
          </div>

          <div className="bg-[#4B3621] text-white p-3.5 rounded-xl border border-[#3D2C1B] shadow-2xs">
            <div className="text-[10px] uppercase font-bold text-amber-200/90">MONTHLY SPOILAGE / WASTAGE</div>
            <div className="text-2xl font-bold text-white font-mono mt-0.5">
              ₹{wastages.reduce((sum, w) => sum + w.cost, 0).toFixed(2)}
            </div>
            <div className="text-[11px] text-amber-200/80 font-medium mt-1">
              {wastages.length} Logged incidents
            </div>
          </div>
        </div>

        {/* TAB 1: RAW MATERIAL STOCK REGISTER */}
        {activeSubTab === 'raw_materials' && (
          <div className="bg-white rounded-xl border border-[#E0D7D0] shadow-2xs overflow-hidden">
            {/* Search & Action Bar */}
            <div className="p-3 bg-[#F4F1EE] border-b border-[#E0D7D0] flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="relative flex-1 w-full">
                <Search className="w-3.5 h-3.5 text-[#8B7E74] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search raw material name, supplier, code..."
                  className="w-full bg-white border border-[#E0D7D0] rounded-lg py-1.5 pl-8 pr-3 text-xs text-[#2D241E] focus:outline-hidden focus:border-[#4B3621]"
                />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setFilterLowStockOnly(!filterLowStockOnly)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    filterLowStockOnly
                      ? 'bg-amber-600 text-white'
                      : 'bg-white border border-[#E0D7D0] text-[#8B7E74] hover:text-[#2D241E]'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Low Stock ({lowStockItems})</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F9F7F5] border-b border-[#E0D7D0] text-[10px] uppercase font-bold text-[#8B7E74]">
                  <th className="py-3 px-4">Material Name &amp; Unit</th>
                  <th className="py-3 px-4 text-center">Remaining Stock</th>
                  <th className="py-3 px-4 text-center">Billed Expenditure</th>
                  <th className="py-3 px-4 text-center">Min. Threshold</th>
                  <th className="py-3 px-4 text-right">Cost / Unit (₹)</th>
                  <th className="py-3 px-4 text-right">Stock Value (₹)</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4 text-center">Stock Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E0D7D0]/60">
                {filteredMaterials.map((m) => {
                  const isLow = m.currentStock <= m.minThreshold;
                  const val = m.currentStock * m.costPerUnit;
                  const used = m.totalUsed || 0;
                  return (
                    <tr key={m.id} className={`hover:bg-[#F9F7F5] transition-colors ${isLow ? 'bg-amber-50/40' : ''}`}>
                      <td className="py-3 px-4 font-bold text-[#2D241E]">
                        <div>{m.name}</div>
                        <div className="text-[10px] text-[#8B7E74] font-normal">Measured in: {m.unit}</div>
                      </td>

                      <td className="py-3 px-4 text-center font-mono font-bold text-sm">
                        <span className={isLow ? 'text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md' : 'text-[#2D241E]'}>
                          {m.currentStock} {m.unit}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center font-mono font-bold text-xs text-amber-900">
                        {used > 0 ? (
                          <span className="bg-amber-100/70 text-amber-950 px-2 py-0.5 rounded-md font-semibold">
                            {used.toFixed(3)} {m.unit}
                          </span>
                        ) : (
                          <span className="text-[#8B7E74]">0 {m.unit}</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center font-mono text-[#8B7E74]">
                        {m.minThreshold} {m.unit}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-[#2D241E]">
                        ₹{m.costPerUnit.toFixed(2)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-[#4B3621]">
                        ₹{val.toFixed(2)}
                      </td>

                      <td className="py-3 px-4 text-[#8B7E74]">
                        {m.supplierName || '—'}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-200">
                            <AlertTriangle className="w-3 h-3 text-rose-700" />
                            <span>Reorder Now</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                            <span>In Stock</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setAdjMatId(m.id);
                              setAdjNewStock(m.currentStock);
                              setIsStockAdjustmentOpen(true);
                            }}
                            className="p-1.5 rounded-md bg-[#F4F1EE] hover:bg-[#E0D7D0] text-[#2D241E] transition-colors cursor-pointer"
                            title="Quick Adjust Stock Count"
                          >
                            <ArrowUpDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditMaterial(m)}
                            className="p-1.5 rounded-md bg-[#F4F1EE] hover:bg-[#E0D7D0] text-[#2D241E] transition-colors cursor-pointer"
                            title="Edit Material"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteMaterial(m.id)}
                            className="p-1.5 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                            title="Delete Material"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: RECIPES & BOM MANAGEMENT */}
        {activeSubTab === 'recipes' && (
          <div className="bg-white rounded-xl border border-[#E0D7D0] p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E0D7D0] pb-3">
              <div>
                <h2 className="text-sm font-bold text-[#2D241E] flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-[#4B3621]" />
                  <span>Recipe &amp; Bill of Materials (BOM) Auto-Deductions</span>
                </h2>
                <p className="text-xs text-[#8B7E74] font-medium mt-0.5">
                  Configure raw materials needed per item. Stock is automatically subtracted &amp; logged when billing.
                </p>
              </div>
              <div className="text-xs font-bold text-[#4B3621] bg-[#F4F1EE] px-3 py-1.5 rounded-lg">
                Total Recipes: {menuItems.length} Menu Items
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {menuItems.map((item) => {
                const itemRecipe = recipes.find(
                  (r) => r.menuItemId === item.id || (r.menuItemName && r.menuItemName.toLowerCase() === item.name.toLowerCase())
                );
                
                const ingredients = itemRecipe?.ingredients || [];
                // Calculate food cost from ingredients
                let foodCost = 0;
                ingredients.forEach((ing) => {
                  const mat = materials.find((m) => m.id === ing.rawMaterialId);
                  if (mat) {
                    foodCost += ing.quantityRequired * mat.costPerUnit;
                  }
                });

                const finalCost = foodCost > 0 ? foodCost : Math.round(item.price * 0.32);
                const margin = Math.max(0, Math.round(((item.price - finalCost) / item.price) * 100));

                return (
                  <div key={item.id} className="p-3.5 rounded-xl border border-[#E0D7D0] bg-[#F9F7F5] space-y-2.5 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-bold text-xs text-[#2D241E]">{item.name}</div>
                          <div className="text-[10px] text-[#8B7E74]">{item.category}</div>
                        </div>
                        <div className="text-right font-mono font-bold text-xs text-[#4B3621]">
                          ₹{item.price}
                        </div>
                      </div>

                      <div className="text-[11px] text-[#2D241E] bg-white p-2.5 rounded-lg border border-[#E0D7D0]/60 space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] uppercase font-bold text-[#8B7E74]">
                          <span>Linked Ingredients:</span>
                          <span className="text-[#4B3621] font-mono">{ingredients.length} items</span>
                        </div>
                        
                        {ingredients.length > 0 ? (
                          <div className="space-y-1 font-mono text-[11px] text-[#2D241E]">
                            {ingredients.map((ing, iIdx) => (
                              <div key={iIdx} className="flex justify-between items-center bg-[#F9F7F5] px-2 py-0.5 rounded">
                                <span className="truncate max-w-[140px]">• {ing.rawMaterialName}</span>
                                <span className="font-bold text-[#4B3621]">{ing.quantityRequired} {ing.unit}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-[10px] text-[#8B7E74] italic py-1 text-center">
                            No custom recipe set yet. Click below to add ingredients.
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#E0D7D0] flex items-center justify-between">
                      <div className="text-[10px]">
                        <span className="text-[#8B7E74]">BOM Cost: </span>
                        <strong className="text-[#2D241E] font-mono">₹{finalCost.toFixed(2)}</strong>
                        <span className="ml-1 font-bold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded text-[9px]">
                          {margin}%
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenRecipeEditor(item)}
                        className="px-2.5 py-1 bg-[#4B3621] hover:bg-[#3D2C1B] text-white rounded-md text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit Recipe</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: INWARD PURCHASES & PO HISTORY */}
        {activeSubTab === 'purchases' && (
          <div className="bg-white rounded-xl border border-[#E0D7D0] shadow-2xs overflow-hidden">
            <div className="p-4 bg-[#F4F1EE] border-b border-[#E0D7D0] flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-[#2D241E]">Inward Purchase Orders (Goods Received)</h2>
                <p className="text-xs text-[#8B7E74] font-medium">
                  Logged deliveries automatically increase raw material stock counts and record vendor invoices.
                </p>
              </div>
            </div>

            {purchases.length === 0 ? (
              <div className="p-8 text-center text-[#8B7E74]">
                <PackageCheck className="w-10 h-10 mx-auto text-[#8B7E74]/50 mb-2" />
                <p className="text-xs font-bold">No purchase orders logged yet.</p>
                <button
                  type="button"
                  onClick={() => setIsNewPurchaseOpen(true)}
                  className="mt-3 px-3 py-1.5 bg-[#4B3621] text-white text-xs font-bold rounded-lg cursor-pointer"
                >
                  Log First Inward Delivery
                </button>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#F9F7F5] border-b border-[#E0D7D0] text-[10px] uppercase font-bold text-[#8B7E74]">
                    <th className="py-3 px-4">PO Number</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Supplier</th>
                    <th className="py-3 px-4">Items Received</th>
                    <th className="py-3 px-4 text-right">Total Invoice (₹)</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E0D7D0]/60">
                  {purchases.map((po) => (
                    <tr key={po.id} className="hover:bg-[#F9F7F5]">
                      <td className="py-3 px-4 font-mono font-bold text-[#4B3621]">{po.orderNumber}</td>
                      <td className="py-3 px-4 text-[#8B7E74]">
                        {new Date(po.date).toLocaleDateString('en-GB')}
                      </td>
                      <td className="py-3 px-4 font-bold text-[#2D241E]">{po.supplierName}</td>
                      <td className="py-3 px-4 text-[#2D241E]">
                        {po.items.map((i) => `${i.quantity} ${i.unit} ${i.rawMaterialName}`).join(', ')}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-[#2D241E]">
                        ₹{po.totalAmount.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                          {po.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* TAB 4: SUPPLIERS DIRECTORY */}
        {activeSubTab === 'suppliers' && (
          <div className="bg-white rounded-xl border border-[#E0D7D0] shadow-2xs overflow-hidden">
            <div className="p-4 bg-[#F4F1EE] border-b border-[#E0D7D0] flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-[#2D241E]">Approved Vendors &amp; Raw Material Suppliers</h2>
                <p className="text-xs text-[#8B7E74] font-medium">
                  Direct contact details, supplied product lines, and payment contacts.
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenAddSupplier}
                className="px-3 py-1.5 bg-[#4B3621] text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                + Add Supplier
              </button>
            </div>

            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F9F7F5] border-b border-[#E0D7D0] text-[10px] uppercase font-bold text-[#8B7E74]">
                  <th className="py-3 px-4">Supplier Firm Name</th>
                  <th className="py-3 px-4">Contact Person</th>
                  <th className="py-3 px-4">Mobile Phone</th>
                  <th className="py-3 px-4">Address / City</th>
                  <th className="py-3 px-4">Items Supplied</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E0D7D0]/60">
                {suppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-[#F9F7F5]">
                    <td className="py-3 px-4 font-bold text-[#2D241E]">{s.name}</td>
                    <td className="py-3 px-4 text-[#2D241E]">{s.contactPerson}</td>
                    <td className="py-3 px-4 font-mono font-bold text-[#4B3621]">{s.phone}</td>
                    <td className="py-3 px-4 text-[#8B7E74]">{s.address || '—'}</td>
                    <td className="py-3 px-4 text-[#2D241E]">
                      {s.itemsSupplied.join(', ') || 'Various Materials'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditSupplier(s)}
                          className="p-1.5 rounded-md bg-[#F4F1EE] hover:bg-[#E0D7D0] text-[#2D241E] cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSupplier(s.id)}
                          className="p-1.5 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer"
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
        )}

        {/* TAB 5: WASTAGE & SPOILAGE TRACKER */}
        {activeSubTab === 'wastage' && (
          <div className="bg-white rounded-xl border border-[#E0D7D0] shadow-2xs overflow-hidden">
            <div className="p-4 bg-[#F4F1EE] border-b border-[#E0D7D0] flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-[#2D241E]">Wastage, Spoilage &amp; Kitchen Loss Ledger</h2>
                <p className="text-xs text-[#8B7E74] font-medium">
                  Tracks broken items, expired ingredients, and cooking waste to calculate food loss metrics.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setWasteMatId(materials[0]?.id || '');
                  setWasteQty(1);
                  setIsLogWastageOpen(true);
                }}
                className="px-3 py-1.5 bg-rose-700 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                + Log Wastage
              </button>
            </div>

            {wastages.length === 0 ? (
              <div className="p-8 text-center text-[#8B7E74]">
                <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-600 mb-2" />
                <p className="text-xs font-bold">Zero wastage logged this session. Excellent efficiency!</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#F9F7F5] border-b border-[#E0D7D0] text-[10px] uppercase font-bold text-[#8B7E74]">
                    <th className="py-3 px-4">Date &amp; Time</th>
                    <th className="py-3 px-4">Material Wasted</th>
                    <th className="py-3 px-4 text-center">Quantity</th>
                    <th className="py-3 px-4 text-right">Estimated Loss (₹)</th>
                    <th className="py-3 px-4">Reason / Notes</th>
                    <th className="py-3 px-4">Reported By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E0D7D0]/60">
                  {wastages.map((w) => (
                    <tr key={w.id} className="hover:bg-[#F9F7F5]">
                      <td className="py-3 px-4 text-[#8B7E74] font-mono">
                        {new Date(w.date).toLocaleString('en-GB')}
                      </td>
                      <td className="py-3 px-4 font-bold text-[#2D241E]">{w.rawMaterialName}</td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-rose-700">
                        -{w.quantity} {w.unit}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-rose-700">
                        ₹{w.cost.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-[#2D241E]">{w.reason}</td>
                      <td className="py-3 px-4 text-[#8B7E74]">{w.reportedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* TAB 6: PHYSICAL STOCK AUDIT ADJUSTMENTS */}
        {activeSubTab === 'adjustments' && (
          <div className="bg-white rounded-xl border border-[#E0D7D0] p-5 space-y-4">
            <div>
              <h2 className="text-sm font-bold text-[#2D241E] flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-[#4B3621]" />
                <span>Physical Stock Audit &amp; Reconciliation</span>
              </h2>
              <p className="text-xs text-[#8B7E74] font-medium mt-0.5">
                Conduct regular physical stock audits, reconcile differences, and update exact warehouse counts.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-[#F9F7F5] rounded-xl border border-[#E0D7D0] space-y-3">
                <h3 className="font-bold text-xs text-[#2D241E]">Select Material To Reconcile</h3>
                <div className="space-y-2">
                  {materials.map((m) => (
                    <div
                      key={m.id}
                      className="p-2.5 bg-white rounded-lg border border-[#E0D7D0] flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-xs text-[#2D241E]">{m.name}</div>
                        <div className="text-[10px] text-[#8B7E74]">
                          System Count: <strong className="font-mono text-[#4B3621]">{m.currentStock} {m.unit}</strong>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setAdjMatId(m.id);
                          setAdjNewStock(m.currentStock);
                          setIsStockAdjustmentOpen(true);
                        }}
                        className="px-2.5 py-1 bg-[#4B3621] text-white rounded-md text-xs font-bold cursor-pointer"
                      >
                        Audit Count
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-[#F9F7F5] rounded-xl border border-[#E0D7D0] space-y-2">
                <h3 className="font-bold text-xs text-[#2D241E]">Audit Best Practices</h3>
                <ul className="text-xs text-[#8B7E74] space-y-1.5 list-disc pl-4 leading-relaxed">
                  <li>Count high-value materials (Cheese, Chicken, Coffee Beans) daily after closing shift.</li>
                  <li>Count dry groceries (Buns, Flours, Sauces) weekly.</li>
                  <li>Always enter honest physical counts so variances are captured accurately.</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: Add / Edit Raw Material */}
      {isAddMaterialOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D241E]/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full overflow-hidden shadow-2xl border border-[#E0D7D0] animate-in fade-in zoom-in duration-150">
            <div className="p-4 bg-[#4B3621] text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {editingMaterial ? 'Edit Raw Material' : 'Add New Raw Material'}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddMaterialOpen(false)}
                className="p-1 text-white/70 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMaterial} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#2D241E] mb-1">Material Name *</label>
                <input
                  type="text"
                  value={matName}
                  onChange={(e) => setMatName(e.target.value)}
                  placeholder="e.g. Mozzarella Cheese"
                  required
                  className="w-full bg-white border border-[#E0D7D0] rounded-lg p-2 font-bold text-[#2D241E] focus:outline-hidden focus:border-[#4B3621]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-[#2D241E] mb-1">Unit of Measure *</label>
                  <select
                    value={matUnit}
                    onChange={(e) => setMatUnit(e.target.value as any)}
                    className="w-full bg-white border border-[#E0D7D0] rounded-lg p-2 font-bold text-[#2D241E]"
                  >
                    <option value="kg">kg (Kilograms)</option>
                    <option value="g">g (Grams)</option>
                    <option value="L">L (Liters)</option>
                    <option value="ml">ml (Milliliters)</option>
                    <option value="pcs">pcs (Pieces / Units)</option>
                    <option value="packets">packets (Packets)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#2D241E] mb-1">Current Stock ({matUnit}) *</label>
                  <input
                    type="number"
                    step="any"
                    value={matStock}
                    onChange={(e) => setMatStock(parseFloat(e.target.value) || 0)}
                    required
                    className="w-full bg-white border border-[#E0D7D0] rounded-lg p-2 font-mono font-bold text-[#2D241E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-[#2D241E] mb-1">Min. Alert Level *</label>
                  <input
                    type="number"
                    step="any"
                    value={matMin}
                    onChange={(e) => setMatMin(parseFloat(e.target.value) || 0)}
                    required
                    className="w-full bg-white border border-[#E0D7D0] rounded-lg p-2 font-mono font-bold text-[#2D241E]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#2D241E] mb-1">Cost Per Unit (₹) *</label>
                  <input
                    type="number"
                    step="any"
                    value={matCost}
                    onChange={(e) => setMatCost(parseFloat(e.target.value) || 0)}
                    required
                    className="w-full bg-white border border-[#E0D7D0] rounded-lg p-2 font-mono font-bold text-[#2D241E]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#2D241E] mb-1">Supplier Firm Name</label>
                <select
                  value={matSupplier}
                  onChange={(e) => setMatSupplier(e.target.value)}
                  className="w-full bg-white border border-[#E0D7D0] rounded-lg p-2 text-[#2D241E]"
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#E0D7D0]">
                <button
                  type="button"
                  onClick={() => setIsAddMaterialOpen(false)}
                  className="px-3 py-2 bg-white border border-[#E0D7D0] rounded-lg text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#4B3621] text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Save Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Log Wastage */}
      {isLogWastageOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D241E]/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full overflow-hidden shadow-2xl border border-[#E0D7D0]">
            <div className="p-4 bg-rose-800 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Log Wastage / Spoilage Incident</h3>
              <button
                type="button"
                onClick={() => setIsLogWastageOpen(false)}
                className="p-1 text-white/70 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveWastage} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#2D241E] mb-1">Select Raw Material *</label>
                <select
                  value={wasteMatId}
                  onChange={(e) => setWasteMatId(e.target.value)}
                  className="w-full bg-white border border-[#E0D7D0] rounded-lg p-2 font-bold text-[#2D241E]"
                >
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} (In Stock: {m.currentStock} {m.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#2D241E] mb-1">Wasted Quantity *</label>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  value={wasteQty}
                  onChange={(e) => setWasteQty(parseFloat(e.target.value) || 0)}
                  required
                  className="w-full bg-white border border-[#E0D7D0] rounded-lg p-2 font-mono font-bold text-[#2D241E]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#2D241E] mb-1">Reason for Spoilage *</label>
                <select
                  value={wasteReason}
                  onChange={(e) => setWasteReason(e.target.value)}
                  className="w-full bg-white border border-[#E0D7D0] rounded-lg p-2 text-[#2D241E]"
                >
                  <option value="Expired / Past Best Before">Expired / Past Best Before</option>
                  <option value="Burned / Overcooked in Kitchen">Burned / Overcooked in Kitchen</option>
                  <option value="Dropped / Spilled on Floor">Dropped / Spilled on Floor</option>
                  <option value="Spoiled due to Power/Fridge Outage">Spoiled due to Power/Fridge Outage</option>
                  <option value="Customer Order Cancellation">Customer Order Cancellation</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#2D241E] mb-1">Reported By</label>
                <input
                  type="text"
                  value={wasteReporter}
                  onChange={(e) => setWasteReporter(e.target.value)}
                  className="w-full bg-white border border-[#E0D7D0] rounded-lg p-2 text-[#2D241E]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#E0D7D0]">
                <button
                  type="button"
                  onClick={() => setIsLogWastageOpen(false)}
                  className="px-3 py-2 bg-white border border-[#E0D7D0] rounded-lg text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Record Loss &amp; Deduct Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Quick Stock Adjustment */}
      {isStockAdjustmentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D241E]/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full overflow-hidden shadow-2xl border border-[#E0D7D0]">
            <div className="p-4 bg-[#4B3621] text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Audit Reconcile / Stock Adjustment</h3>
              <button
                type="button"
                onClick={() => setIsStockAdjustmentOpen(false)}
                className="p-1 text-white/70 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAdjustment} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#2D241E] mb-1">Select Raw Material</label>
                <select
                  value={adjMatId}
                  onChange={(e) => setAdjMatId(e.target.value)}
                  className="w-full bg-white border border-[#E0D7D0] rounded-lg p-2 font-bold text-[#2D241E]"
                >
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} (Current: {m.currentStock} {m.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#2D241E] mb-1">New Verified Physical Count *</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={adjNewStock}
                  onChange={(e) => setAdjNewStock(parseFloat(e.target.value) || 0)}
                  required
                  className="w-full bg-white border border-[#E0D7D0] rounded-lg p-2 font-mono font-bold text-[#2D241E] text-base"
                />
              </div>

              <div>
                <label className="block font-bold text-[#2D241E] mb-1">Audit Remark / Reason</label>
                <input
                  type="text"
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value)}
                  className="w-full bg-white border border-[#E0D7D0] rounded-lg p-2 text-[#2D241E]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#E0D7D0]">
                <button
                  type="button"
                  onClick={() => setIsStockAdjustmentOpen(false)}
                  className="px-3 py-2 bg-white border border-[#E0D7D0] rounded-lg text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#4B3621] text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Update Count
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Inward Purchase Order */}
      {isNewPurchaseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D241E]/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-lg w-full overflow-hidden shadow-2xl border border-[#E0D7D0]">
            <div className="p-4 bg-emerald-800 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Log Inward Stock Delivery (Vendor GRN)</h3>
              <button
                type="button"
                onClick={() => setIsNewPurchaseOpen(false)}
                className="p-1 text-white/70 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePurchase} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#2D241E] mb-1">Supplier Vendor *</label>
                <select
                  value={poSupplierId}
                  onChange={(e) => setPoSupplierId(e.target.value)}
                  required
                  className="w-full bg-white border border-[#E0D7D0] rounded-lg p-2 font-bold text-[#2D241E]"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#2D241E] mb-1">Received Raw Materials</label>
                {poItems.map((item, idx) => (
                  <div key={idx} className="flex gap-2 mb-2 items-center">
                    <select
                      value={item.rawMaterialId}
                      onChange={(e) => {
                        const updated = [...poItems];
                        updated[idx].rawMaterialId = e.target.value;
                        const mat = materials.find((m) => m.id === e.target.value);
                        if (mat) updated[idx].unitPrice = mat.costPerUnit;
                        setPoItems(updated);
                      }}
                      className="flex-1 bg-white border border-[#E0D7D0] rounded-lg p-1.5 font-bold text-[#2D241E]"
                    >
                      {materials.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.unit})
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      step="any"
                      min="0.1"
                      value={item.quantity}
                      onChange={(e) => {
                        const updated = [...poItems];
                        updated[idx].quantity = parseFloat(e.target.value) || 0;
                        setPoItems(updated);
                      }}
                      placeholder="Qty"
                      className="w-20 bg-white border border-[#E0D7D0] rounded-lg p-1.5 font-mono font-bold text-[#2D241E]"
                    />

                    <input
                      type="number"
                      step="any"
                      min="1"
                      value={item.unitPrice}
                      onChange={(e) => {
                        const updated = [...poItems];
                        updated[idx].unitPrice = parseFloat(e.target.value) || 0;
                        setPoItems(updated);
                      }}
                      placeholder="Rate ₹"
                      className="w-20 bg-white border border-[#E0D7D0] rounded-lg p-1.5 font-mono font-bold text-[#2D241E]"
                    />
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() =>
                    setPoItems([
                      ...poItems,
                      { rawMaterialId: materials[0]?.id || '', quantity: 5, unitPrice: materials[0]?.costPerUnit || 100 },
                    ])
                  }
                  className="mt-1 text-[11px] font-bold text-emerald-800 hover:underline cursor-pointer"
                >
                  + Add Another Item
                </button>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#E0D7D0]">
                <button
                  type="button"
                  onClick={() => setIsNewPurchaseOpen(false)}
                  className="px-3 py-2 bg-white border border-[#E0D7D0] rounded-lg text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-800 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Accept Delivery &amp; Add to Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: Add / Edit Supplier */}
      {isAddSupplierOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D241E]/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full overflow-hidden shadow-2xl border border-[#E0D7D0]">
            <div className="p-4 bg-[#4B3621] text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {editingSupplier ? 'Edit Vendor Supplier' : 'Add New Supplier'}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddSupplierOpen(false)}
                className="p-1 text-white/70 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#2D241E] mb-1">Company / Firm Name *</label>
                <input
                  type="text"
                  value={supName}
                  onChange={(e) => setSupName(e.target.value)}
                  placeholder="e.g. Dairy Fresh Foods"
                  required
                  className="w-full bg-white border border-[#E0D7D0] rounded-lg p-2 font-bold text-[#2D241E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-[#2D241E] mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={supPerson}
                    onChange={(e) => setSupPerson(e.target.value)}
                    placeholder="e.g. Ramesh Gowda"
                    className="w-full bg-white border border-[#E0D7D0] rounded-lg p-2 text-[#2D241E]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#2D241E] mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    value={supPhone}
                    onChange={(e) => setSupPhone(e.target.value)}
                    placeholder="e.g. 9845012345"
                    required
                    className="w-full bg-white border border-[#E0D7D0] rounded-lg p-2 font-mono font-bold text-[#2D241E]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#2D241E] mb-1">Items Supplied (comma separated)</label>
                <input
                  type="text"
                  value={supItems}
                  onChange={(e) => setSupItems(e.target.value)}
                  placeholder="e.g. Mozzarella Cheese, Fresh Malai Paneer"
                  className="w-full bg-white border border-[#E0D7D0] rounded-lg p-2 text-[#2D241E]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#E0D7D0]">
                <button
                  type="button"
                  onClick={() => setIsAddSupplierOpen(false)}
                  className="px-3 py-2 bg-white border border-[#E0D7D0] rounded-lg text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#4B3621] text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: Recipe / Bill of Materials (BOM) Ingredient Configurator */}
      {isRecipeModalOpen && selectedRecipeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D241E]/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-lg w-full overflow-hidden shadow-2xl border border-[#E0D7D0] flex flex-col max-h-[90vh]">
            <div className="p-4 bg-[#4B3621] text-white flex items-center justify-between shrink-0">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-200">
                  Recipe &amp; Raw Material Mapping
                </div>
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <span>{selectedRecipeItem.name}</span>
                  <span className="text-xs bg-[#3D2C1B] text-amber-200 px-2 py-0.5 rounded font-mono">
                    ₹{selectedRecipeItem.price}
                  </span>
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRecipeModalOpen(false)}
                className="p-1 text-white/70 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3.5 text-xs flex-1">
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-[#4B3621] space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-900">
                  <Scale className="w-4 h-4" />
                  <span>Automatic Billing Stock Deduction</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Specify exactly what raw materials are consumed per single order of <strong>{selectedRecipeItem.name}</strong>.
                  When this item is billed in POS, each ingredient's stock will automatically decrease with full precision (e.g. 0.030 kg Cheese).
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-[#2D241E] text-xs">Recipe Ingredients &amp; Quantities:</label>
                  <button
                    type="button"
                    onClick={handleAddIngredientRow}
                    className="flex items-center gap-1 text-[11px] font-bold text-[#4B3621] hover:underline cursor-pointer bg-[#F4F1EE] px-2 py-1 rounded"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Ingredient</span>
                  </button>
                </div>

                {tempIngredients.length === 0 ? (
                  <div className="p-6 text-center border-2 border-dashed border-[#E0D7D0] rounded-xl text-[#8B7E74]">
                    <Utensils className="w-8 h-8 mx-auto text-[#8B7E74]/40 mb-1" />
                    <p className="font-bold text-xs">No ingredients configured yet</p>
                    <p className="text-[11px] mt-0.5">Click "+ Add Ingredient" above to link raw materials.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {tempIngredients.map((row, idx) => {
                      const mat = materials.find((m) => m.id === row.rawMaterialId);
                      const unitCost = mat?.costPerUnit || 0;
                      const lineCost = row.quantityRequired * unitCost;

                      return (
                        <div key={idx} className="p-2.5 bg-[#F9F7F5] rounded-xl border border-[#E0D7D0] space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <label className="block text-[10px] uppercase font-bold text-[#8B7E74] mb-0.5">
                                Raw Material
                              </label>
                              <select
                                value={row.rawMaterialId}
                                onChange={(e) => handleUpdateIngredientRow(idx, 'rawMaterialId', e.target.value)}
                                className="w-full bg-white border border-[#E0D7D0] rounded-lg p-1.5 font-bold text-[#2D241E] text-xs focus:outline-hidden"
                              >
                                {materials.map((m) => (
                                  <option key={m.id} value={m.id}>
                                    {m.name} ({m.currentStock} {m.unit} in stock - ₹{m.costPerUnit}/{m.unit})
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="w-28">
                              <label className="block text-[10px] uppercase font-bold text-[#8B7E74] mb-0.5">
                                Qty per Order ({row.unit})
                              </label>
                              <input
                                type="number"
                                step="any"
                                min="0.001"
                                value={row.quantityRequired}
                                onChange={(e) => handleUpdateIngredientRow(idx, 'quantityRequired', e.target.value)}
                                placeholder="0.030"
                                className="w-full bg-white border border-[#E0D7D0] rounded-lg p-1.5 font-mono font-bold text-[#2D241E] text-xs focus:outline-hidden"
                              />
                            </div>

                            <div className="pt-4">
                              <button
                                type="button"
                                onClick={() => handleRemoveIngredientRow(idx)}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                                title="Remove Ingredient"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <div className="flex justify-between items-center text-[10px] text-[#8B7E74] px-1">
                            <span>Ingredient Cost: ₹{unitCost}/{row.unit}</span>
                            <span className="font-mono font-bold text-[#4B3621]">Cost: ₹{lineCost.toFixed(2)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-[#F9F7F5] border-t border-[#E0D7D0] flex justify-between items-center shrink-0">
              <div className="text-xs">
                <span className="text-[#8B7E74]">Total Portion Cost: </span>
                <strong className="text-[#2D241E] font-mono text-sm">
                  ₹{tempIngredients.reduce((sum, ing) => {
                    const mat = materials.find((m) => m.id === ing.rawMaterialId);
                    return sum + (ing.quantityRequired * (mat?.costPerUnit || 0));
                  }, 0).toFixed(2)}
                </strong>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsRecipeModalOpen(false)}
                  className="px-3 py-1.5 bg-white border border-[#E0D7D0] rounded-lg text-xs font-bold cursor-pointer hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveRecipe}
                  className="px-4 py-1.5 bg-[#4B3621] hover:bg-[#3D2C1B] text-white rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Recipe</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
