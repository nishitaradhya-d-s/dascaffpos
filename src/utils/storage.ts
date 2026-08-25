import { 
  MenuItem, 
  CafeSettings, 
  BillRecord, 
  RawMaterial, 
  Supplier, 
  TableStatus, 
  StaffMember, 
  ShiftRecord, 
  CustomerRecord, 
  HeldBill, 
  WastageRecord,
  PurchaseOrder,
  RecipeMapping,
  RecipeIngredient,
  GlobalAddon,
  CouponCode
} from '../types';
import { DEFAULT_MENU_ITEMS } from '../data/defaultMenu';
import { DEFAULT_SETTINGS } from '../data/defaultSettings';
import { 
  DEFAULT_RAW_MATERIALS, 
  DEFAULT_SUPPLIERS, 
  DEFAULT_TABLES, 
  DEFAULT_STAFF, 
  DEFAULT_RECIPES, 
  DEFAULT_GLOBAL_ADDONS 
} from '../data/defaultInventory';

const KEYS = {
  SETTINGS: 'dascaff_settings_v3',
  MENU: 'dascaff_menu_v3',
  CATEGORIES: 'dascaff_categories_v3',
  ADDONS: 'dascaff_addons_v3',
  RECIPES: 'dascaff_recipes_v3',
  BILLS: 'dascaff_bills_v3',
  RAW_MATERIALS: 'dascaff_raw_materials_v3',
  SUPPLIERS: 'dascaff_suppliers_v3',
  TABLES: 'dascaff_tables_v3',
  STAFF: 'dascaff_staff_v3',
  CURRENT_SHIFT: 'dascaff_current_shift_v3',
  CUSTOMERS: 'dascaff_customers_v3',
  HELD_BILLS: 'dascaff_held_bills_v3',
  WASTAGE: 'dascaff_wastage_v3',
  PURCHASE_ORDERS: 'dascaff_purchase_orders_v3',
  AUTH_SESSION: 'dascaff_auth_session_v3',
  MANAGER_UNLOCKED: 'dascaff_manager_unlocked_v3',
  INVOICE_SEQ: 'dascaff_invoice_seq_v3',
  KOT_SEQ: 'dascaff_kot_seq_v3',
  SEQ_RESET_ACTIVE: 'dascaff_seq_reset_active_v3',
  COUPONS: 'dascaff_coupons_v3',
};

// Safe JSON parser
function safeParse<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.error(`Error reading ${key} from storage:`, e);
    return fallback;
  }
}

function safeSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error writing ${key} to storage:`, e);
  }
}

// 13. Coupon Codes Management
const DEFAULT_COUPONS: CouponCode[] = [
  {
    id: 'cpn-1',
    code: 'WELCOME10',
    type: 'percent',
    value: 10,
    minBillAmount: 100,
    description: '10% Off on orders above ₹100',
    isActive: true,
  },
  {
    id: 'cpn-2',
    code: 'DASCAFF50',
    type: 'flat',
    value: 50,
    minBillAmount: 300,
    description: 'Flat ₹50 Off on orders above ₹300',
    isActive: true,
  },
  {
    id: 'cpn-3',
    code: 'FESTIVE15',
    type: 'percent',
    value: 15,
    minBillAmount: 200,
    description: '15% Off on orders above ₹200',
    isActive: true,
  },
];

export function getStoredCoupons(): CouponCode[] {
  const parsed = safeParse<CouponCode[]>(KEYS.COUPONS, DEFAULT_COUPONS);
  const list = Array.isArray(parsed) ? parsed : DEFAULT_COUPONS;

  const seenIds = new Set<string>();
  const seenCodes = new Set<string>();
  const sanitized: CouponCode[] = [];

  for (const c of list) {
    if (!c || typeof c !== 'object') continue;
    let id = String(c.id || '').trim();
    const code = String(c.code || '').trim().toUpperCase();
    if (!code) continue;

    // Prevent duplicate codes or duplicate IDs
    if (seenCodes.has(code)) continue;

    if (!id || seenIds.has(id)) {
      id = `cpn-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    }

    seenIds.add(id);
    seenCodes.add(code);
    sanitized.push({
      ...c,
      id,
      code,
      type: c.type === 'flat' ? 'flat' : 'percent',
      value: Number(c.value) || 0,
      minBillAmount: c.minBillAmount ? Number(c.minBillAmount) : undefined,
      description: c.description ? String(c.description) : undefined,
      isActive: c.isActive !== false,
    });
  }

  // If sanitization cleaned up or altered the array, persist it back
  if (sanitized.length !== list.length) {
    safeSet(KEYS.COUPONS, sanitized);
  }

  return sanitized;
}

export function saveCoupons(coupons: CouponCode[]): void {
  // Deduplicate before saving
  const seenIds = new Set<string>();
  const seenCodes = new Set<string>();
  const unique: CouponCode[] = [];

  for (const c of coupons) {
    if (!c || !c.code) continue;
    const code = c.code.trim().toUpperCase();
    if (seenCodes.has(code)) continue;

    let id = c.id ? String(c.id).trim() : '';
    if (!id || seenIds.has(id)) {
      id = `cpn-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    }

    seenIds.add(id);
    seenCodes.add(code);
    unique.push({
      ...c,
      id,
      code,
    });
  }

  safeSet(KEYS.COUPONS, unique);
}

export function addCouponCode(coupon: Omit<CouponCode, 'id'>): CouponCode {
  const coupons = getStoredCoupons();
  const codeClean = coupon.code.trim().toUpperCase();
  
  // Remove if matching code already exists
  const filtered = coupons.filter((c) => c.code.toUpperCase() !== codeClean);

  const newCoupon: CouponCode = {
    ...coupon,
    id: `cpn-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    code: codeClean,
  };
  
  filtered.unshift(newCoupon);
  saveCoupons(filtered);
  return newCoupon;
}

export function deleteCouponCode(couponId: string): void {
  const coupons = getStoredCoupons();
  const updated = coupons.filter((c) => c.id !== couponId);
  saveCoupons(updated);
}

export function toggleCouponActive(couponId: string): void {
  const coupons = getStoredCoupons();
  const target = coupons.find((c) => c.id === couponId);
  if (target) {
    target.isActive = !target.isActive;
    saveCoupons(coupons);
  }
}

export function getStoredSettings(): CafeSettings {
  const settings = safeParse<CafeSettings>(KEYS.SETTINGS, DEFAULT_SETTINGS);
  // Clean up legacy rakesh@das if present
  if (settings.managerPassword === 'rakesh@das') {
    settings.managerPassword = '';
    safeSet(KEYS.SETTINGS, settings);
  }
  return settings;
}

export function saveSettings(settings: CafeSettings): void {
  safeSet(KEYS.SETTINGS, settings);
}

// 2. Menu Items & Categories
export function getStoredMenu(): MenuItem[] {
  return safeParse<MenuItem[]>(KEYS.MENU, DEFAULT_MENU_ITEMS);
}

export function saveMenu(menu: MenuItem[]): void {
  safeSet(KEYS.MENU, menu);
}

export function resetMenuToDefault(): MenuItem[] {
  saveMenu(DEFAULT_MENU_ITEMS);
  return DEFAULT_MENU_ITEMS;
}

export function getStoredCategories(): string[] {
  const defaultCats = ['Pizza', 'Burger', 'Fries & Sides', 'Beverages', 'Desserts', 'Pasta & Rolls', 'Combos', 'Coffee & Tea'];
  return safeParse<string[]>(KEYS.CATEGORIES, defaultCats);
}

export function saveCategories(categories: string[]): void {
  safeSet(KEYS.CATEGORIES, categories);
}

// Global Add-ons & Extra Flavours
export function getStoredAddons(): GlobalAddon[] {
  return safeParse<GlobalAddon[]>(KEYS.ADDONS, DEFAULT_GLOBAL_ADDONS);
}

export function saveAddons(addons: GlobalAddon[]): void {
  safeSet(KEYS.ADDONS, addons);
}

// 3. Recipes / BOM Management
export function getStoredRecipes(): RecipeMapping[] {
  return safeParse<RecipeMapping[]>(KEYS.RECIPES, DEFAULT_RECIPES);
}

export function saveAllRecipes(recipes: RecipeMapping[]): void {
  safeSet(KEYS.RECIPES, recipes);
}

export function saveRecipeForMenuItem(menuItemId: string, ingredients: RecipeIngredient[], menuItemName?: string): void {
  const recipes = getStoredRecipes();
  const existingIdx = recipes.findIndex((r) => r.menuItemId === menuItemId);
  if (existingIdx >= 0) {
    recipes[existingIdx] = {
      menuItemId,
      menuItemName: menuItemName || recipes[existingIdx].menuItemName,
      ingredients,
    };
  } else {
    recipes.push({
      menuItemId,
      menuItemName,
      ingredients,
    });
  }
  saveAllRecipes(recipes);
}

// 4. Bills & Invoices
export function getStoredBills(): BillRecord[] {
  return safeParse<BillRecord[]>(KEYS.BILLS, []);
}

export function saveBillRecord(bill: BillRecord): void {
  const bills = getStoredBills();
  const existingIdx = bills.findIndex((b) => b.id === bill.id);
  if (existingIdx >= 0) {
    bills[existingIdx] = bill;
  } else {
    bills.unshift(bill); // latest first
  }
  safeSet(KEYS.BILLS, bills);

  // Update customer CRM
  if (bill.customerPhone) {
    recordCustomerVisit(bill.customerName || 'Customer', bill.customerPhone, bill.taxDetails.grandTotal);
  }
}

export function deleteBillRecord(billId: string): void {
  const bills = getStoredBills().filter((b) => b.id !== billId);
  safeSet(KEYS.BILLS, bills);
}

// Sequence generators with explicit reset capability without deleting bill history
export function resetInvoiceSequence(startNumber: number = 1): void {
  safeSet(KEYS.INVOICE_SEQ, Math.max(0, startNumber - 1));
  safeSet(KEYS.KOT_SEQ, Math.max(0, startNumber - 1));
  safeSet(KEYS.SEQ_RESET_ACTIVE, true);
}

export function getNextInvoiceNumber(prefix: string = 'INV-'): string {
  const isResetActive = safeParse<boolean>(KEYS.SEQ_RESET_ACTIVE, false);
  let currentSeq = safeParse<number>(KEYS.INVOICE_SEQ, -1);

  if (currentSeq === -1 || !isResetActive) {
    const bills = getStoredBills();
    let maxSeq = 0;
    bills.forEach((b) => {
      const numPart = b.billNumber.replace(/[^0-9]/g, '');
      const parsed = parseInt(numPart, 10);
      if (!isNaN(parsed) && parsed > maxSeq) {
        maxSeq = parsed;
      }
    });
    currentSeq = maxSeq;
  }

  const nextSeq = currentSeq + 1;
  safeSet(KEYS.INVOICE_SEQ, nextSeq);
  return `${prefix}${String(nextSeq).padStart(3, '0')}`;
}

export function getNextKotNumber(): string {
  const isResetActive = safeParse<boolean>(KEYS.SEQ_RESET_ACTIVE, false);
  let currentSeq = safeParse<number>(KEYS.KOT_SEQ, -1);

  if (currentSeq === -1 || !isResetActive) {
    const bills = getStoredBills();
    let maxKot = 0;
    bills.forEach((b) => {
      const numPart = (b.kotNumber || '').replace(/[^0-9]/g, '');
      const parsed = parseInt(numPart, 10);
      if (!isNaN(parsed) && parsed > maxKot) {
        maxKot = parsed;
      }
    });
    currentSeq = maxKot;
  }

  const nextSeq = currentSeq + 1;
  safeSet(KEYS.KOT_SEQ, nextSeq);
  return String(nextSeq).padStart(3, '0');
}

// 4. Tables
export function getStoredTables(): TableStatus[] {
  return safeParse<TableStatus[]>(KEYS.TABLES, DEFAULT_TABLES);
}

export function saveTables(tables: TableStatus[]): void {
  safeSet(KEYS.TABLES, tables);
}

export function updateTableStatus(tableNumber: string, status: TableStatus['status'], billId?: string, totalAmount?: number): void {
  const tables = getStoredTables();
  const target = tables.find((t) => t.number.toLowerCase() === tableNumber.toLowerCase() || t.name.toLowerCase() === tableNumber.toLowerCase());
  if (target) {
    target.status = status;
    target.currentBillId = billId;
    target.activeTotal = totalAmount;
    target.activeSince = status === 'occupied' || status === 'billing' ? new Date().toISOString() : undefined;
    saveTables(tables);
  }
}

// 5. Inventory & Raw Materials
export function getStoredRawMaterials(): RawMaterial[] {
  return safeParse<RawMaterial[]>(KEYS.RAW_MATERIALS, DEFAULT_RAW_MATERIALS);
}

export function saveRawMaterials(materials: RawMaterial[]): void {
  safeSet(KEYS.RAW_MATERIALS, materials);
}

export function updateRawMaterialStock(materialId: string, deltaQty: number): void {
  const list = getStoredRawMaterials();
  const item = list.find((m) => m.id === materialId);
  if (item) {
    item.currentStock = Math.max(0, +(item.currentStock + deltaQty).toFixed(3));
    item.lastRestockedDate = new Date().toISOString();
    saveRawMaterials(list);
  }
}

// Auto-deduct inventory dynamically based on recipes and bill items
export function deductInventoryForBill(bill: BillRecord): void {
  const materials = getStoredRawMaterials();
  const recipes = getStoredRecipes();
  let changed = false;

  bill.items.forEach((ci) => {
    const qty = ci.quantity || 1;

    // 1. Try finding explicit recipe by menuItemId or item name match
    const recipe = recipes.find(
      (r) => r.menuItemId === ci.menuItemId || 
             (r.menuItemName && r.menuItemName.toLowerCase() === ci.name.toLowerCase())
    );

    if (recipe && recipe.ingredients && recipe.ingredients.length > 0) {
      recipe.ingredients.forEach((ing) => {
        const mat = materials.find((m) => m.id === ing.rawMaterialId);
        if (mat) {
          const deduction = ing.quantityRequired * qty;
          mat.currentStock = Math.max(0, +(mat.currentStock - deduction).toFixed(3));
          mat.totalUsed = +((mat.totalUsed || 0) + deduction).toFixed(3);
          changed = true;
        }
      });
    } else {
      // 2. Intelligent fallback recipe if no custom recipe mapping exists yet
      const itemName = ci.name.toLowerCase();
      if (itemName.includes('pizza')) {
        const cheese = materials.find((m) => m.id === 'rm-1');
        const dough = materials.find((m) => m.id === 'rm-2');
        const sauce = materials.find((m) => m.id === 'rm-6');
        if (cheese) {
          const used = 0.035 * qty; // 35g cheese per pizza
          cheese.currentStock = Math.max(0, +(cheese.currentStock - used).toFixed(3));
          cheese.totalUsed = +((cheese.totalUsed || 0) + used).toFixed(3);
          changed = true;
        }
        if (dough) {
          const used = 1 * qty;
          dough.currentStock = Math.max(0, dough.currentStock - used);
          dough.totalUsed = +((dough.totalUsed || 0) + used).toFixed(3);
          changed = true;
        }
        if (sauce) {
          const used = 0.03 * qty;
          sauce.currentStock = Math.max(0, +(sauce.currentStock - used).toFixed(3));
          sauce.totalUsed = +((sauce.totalUsed || 0) + used).toFixed(3);
          changed = true;
        }
      } else if (itemName.includes('burger')) {
        const bun = materials.find((m) => m.id === 'rm-3');
        const mayo = materials.find((m) => m.id === 'rm-12');
        if (bun) {
          const used = 1 * qty;
          bun.currentStock = Math.max(0, bun.currentStock - used);
          bun.totalUsed = +((bun.totalUsed || 0) + used).toFixed(3);
          changed = true;
        }
        if (mayo) {
          const used = 0.02 * qty;
          mayo.currentStock = Math.max(0, +(mayo.currentStock - used).toFixed(3));
          mayo.totalUsed = +((mayo.totalUsed || 0) + used).toFixed(3);
          changed = true;
        }
      } else if (itemName.includes('fries')) {
        const fries = materials.find((m) => m.id === 'rm-7');
        if (fries) {
          const used = 0.12 * qty;
          fries.currentStock = Math.max(0, +(fries.currentStock - used).toFixed(3));
          fries.totalUsed = +((fries.totalUsed || 0) + used).toFixed(3);
          changed = true;
        }
      } else if (itemName.includes('chicken')) {
        const chicken = materials.find((m) => m.id === 'rm-4');
        if (chicken) {
          const used = 0.07 * qty;
          chicken.currentStock = Math.max(0, +(chicken.currentStock - used).toFixed(3));
          chicken.totalUsed = +((chicken.totalUsed || 0) + used).toFixed(3);
          changed = true;
        }
      } else if (itemName.includes('coffee') || itemName.includes('frappe')) {
        const beans = materials.find((m) => m.id === 'rm-9');
        const milk = materials.find((m) => m.id === 'rm-8');
        if (beans) {
          const used = 0.015 * qty;
          beans.currentStock = Math.max(0, +(beans.currentStock - used).toFixed(3));
          beans.totalUsed = +((beans.totalUsed || 0) + used).toFixed(3);
          changed = true;
        }
        if (milk) {
          const used = 0.20 * qty;
          milk.currentStock = Math.max(0, +(milk.currentStock - used).toFixed(3));
          milk.totalUsed = +((milk.totalUsed || 0) + used).toFixed(3);
          changed = true;
        }
      } else if (itemName.includes('mojito')) {
        const mint = materials.find((m) => m.id === 'rm-11');
        if (mint) {
          const used = 0.03 * qty;
          mint.currentStock = Math.max(0, +(mint.currentStock - used).toFixed(3));
          mint.totalUsed = +((mint.totalUsed || 0) + used).toFixed(3);
          changed = true;
        }
      }
    }

    // 3. Deduct for any optional addons attached to this cart item (e.g. Extra Cheese)
    if (ci.addons && ci.addons.length > 0) {
      ci.addons.forEach((addon) => {
        const addonName = addon.name.toLowerCase();
        if (addonName.includes('cheese')) {
          const cheese = materials.find((m) => m.id === 'rm-1');
          if (cheese) {
            const extraCheese = 0.02 * qty; // 20g extra cheese
            cheese.currentStock = Math.max(0, +(cheese.currentStock - extraCheese).toFixed(3));
            cheese.totalUsed = +((cheese.totalUsed || 0) + extraCheese).toFixed(3);
            changed = true;
          }
        }
      });
    }
  });

  if (changed) {
    saveRawMaterials(materials);
  }
}

// 6. Wastage Records
export function getStoredWastage(): WastageRecord[] {
  return safeParse<WastageRecord[]>(KEYS.WASTAGE, []);
}

export function saveWastageRecord(record: WastageRecord): void {
  const list = getStoredWastage();
  list.unshift(record);
  safeSet(KEYS.WASTAGE, list);

  // Deduct from stock
  updateRawMaterialStock(record.rawMaterialId, -record.quantity);
}

// 7. Suppliers & Purchase Orders
export function getStoredSuppliers(): Supplier[] {
  return safeParse<Supplier[]>(KEYS.SUPPLIERS, DEFAULT_SUPPLIERS);
}

export function saveSuppliers(suppliers: Supplier[]): void {
  safeSet(KEYS.SUPPLIERS, suppliers);
}

export function getStoredPurchaseOrders(): PurchaseOrder[] {
  return safeParse<PurchaseOrder[]>(KEYS.PURCHASE_ORDERS, []);
}

export function savePurchaseOrder(po: PurchaseOrder): void {
  const orders = getStoredPurchaseOrders();
  const idx = orders.findIndex((o) => o.id === po.id);
  if (idx >= 0) {
    orders[idx] = po;
  } else {
    orders.unshift(po);
  }
  safeSet(KEYS.PURCHASE_ORDERS, orders);
}

// 8. Staff & Shifts
export function getStoredStaff(): StaffMember[] {
  return safeParse<StaffMember[]>(KEYS.STAFF, DEFAULT_STAFF);
}

export function saveStaff(staff: StaffMember[]): void {
  safeSet(KEYS.STAFF, staff);
}

export function getCurrentShift(): ShiftRecord | null {
  return safeParse<ShiftRecord | null>(KEYS.CURRENT_SHIFT, null);
}

export function saveCurrentShift(shift: ShiftRecord | null): void {
  safeSet(KEYS.CURRENT_SHIFT, shift);
}

// 9. Customers CRM
export function getStoredCustomers(): CustomerRecord[] {
  return safeParse<CustomerRecord[]>(KEYS.CUSTOMERS, [
    { id: 'c-1', name: 'Walk-in', phone: '******46252', totalVisits: 8, totalSpent: 4890, lastVisit: '2026-08-22T22:52:05.000Z' },
    { id: 'c-2', name: 'Praveen Gowda', phone: '9845012399', email: 'praveen@gmail.com', totalVisits: 14, totalSpent: 12450, lastVisit: '2026-08-21T19:30:00.000Z' },
    { id: 'c-3', name: 'Ananya Sharma', phone: '9980011223', email: 'ananya@gmail.com', totalVisits: 5, totalSpent: 3820, lastVisit: '2026-08-22T16:15:00.000Z' },
  ]);
}

export function recordCustomerVisit(name: string, phone: string, amount: number): void {
  if (!phone) return;
  const list = getStoredCustomers();
  const existing = list.find((c) => c.phone.replace(/[^0-9]/g, '') === phone.replace(/[^0-9]/g, ''));
  if (existing) {
    existing.totalVisits += 1;
    existing.totalSpent += amount;
    existing.lastVisit = new Date().toISOString();
    if (name && name !== 'Walk-in') existing.name = name;
  } else {
    list.unshift({
      id: `cust-${Date.now()}`,
      name: name || 'Walk-in',
      phone,
      totalVisits: 1,
      totalSpent: amount,
      lastVisit: new Date().toISOString(),
    });
  }
  safeSet(KEYS.CUSTOMERS, list);
}

// 10. Held Bills
export function getStoredHeldBills(): HeldBill[] {
  return safeParse<HeldBill[]>(KEYS.HELD_BILLS, []);
}

export function saveHeldBill(held: HeldBill): void {
  const list = getStoredHeldBills();
  list.unshift(held);
  safeSet(KEYS.HELD_BILLS, list);
}

export function removeHeldBill(id: string): void {
  const list = getStoredHeldBills().filter((h) => h.id !== id);
  safeSet(KEYS.HELD_BILLS, list);
}

// 11. Authentication & Security
export function checkIsAuthenticated(): boolean {
  return localStorage.getItem(KEYS.AUTH_SESSION) === 'true';
}

export function setAuthSession(isAuthed: boolean, remember: boolean = true): void {
  if (isAuthed) {
    localStorage.setItem(KEYS.AUTH_SESSION, 'true');
  } else {
    localStorage.removeItem(KEYS.AUTH_SESSION);
  }
}

export function clearAuthSession(): void {
  localStorage.removeItem(KEYS.AUTH_SESSION);
  localStorage.removeItem(KEYS.MANAGER_UNLOCKED);
}

export function checkManagerUnlocked(): boolean {
  return sessionStorage.getItem(KEYS.MANAGER_UNLOCKED) === 'true' || localStorage.getItem(KEYS.MANAGER_UNLOCKED) === 'true';
}

export function setManagerUnlocked(unlocked: boolean): void {
  if (unlocked) {
    sessionStorage.setItem(KEYS.MANAGER_UNLOCKED, 'true');
  } else {
    sessionStorage.removeItem(KEYS.MANAGER_UNLOCKED);
    localStorage.removeItem(KEYS.MANAGER_UNLOCKED);
  }
}

export function verifyManagerPassword(password: string, settings?: CafeSettings): boolean {
  const customTarget = settings?.managerPassword?.trim();
  if (customTarget) {
    return password === customTarget;
  }
  const loginPass = settings?.loginPassword?.trim() || 'rakdas@098';
  return password === loginPass || password === 'admin' || password === '1234';
}

export function verifyLoginCredentials(username: string, pinOrPass: string, settings?: CafeSettings): boolean {
  const staff = getStoredStaff();
  const staffMatch = staff.find(
    (s) => s.isActive && (s.name.toLowerCase() === username.toLowerCase() || s.phone === username) && s.loginPin === pinOrPass
  );
  if (staffMatch) return true;

  const validUser = (settings?.loginUsername || 'DASCAFF').trim().toLowerCase();
  const validPass = (settings?.loginPassword || 'rakdas@098').trim();

  if (username.trim().toLowerCase() === validUser && pinOrPass === validPass) {
    return true;
  }

  // Also support default admin credentials
  if (
    (username.trim().toUpperCase() === 'DASCAFF' || username.trim().toLowerCase() === 'admin') &&
    (pinOrPass === 'rakdas@098' || pinOrPass === 'admin' || pinOrPass === '1234')
  ) {
    return true;
  }

  return false;
}

// Seed initial authentic sample bills matching user's invoice exactly if clean database
export function seedSampleBillsIfEmpty(settings: CafeSettings): BillRecord[] {
  const existing = getStoredBills();
  if (existing.length > 0) return existing;

  const sampleBill: BillRecord = {
    id: 'bill-sample-004',
    billNumber: 'INV-004',
    kotNumber: '004',
    checkNumber: '004',
    date: '2026-08-22T22:52:05.000Z',
    orderType: 'Dine-In',
    tableNumber: 'T-1',
    customerName: 'Walk-in',
    customerPhone: '******46252',
    items: [
      {
        cartItemId: 'item-1',
        menuItemId: 'pizza-1',
        name: 'Onion Caps & Paneer',
        category: 'Pizza',
        type: 'veg',
        unitPrice: 119,
        quantity: 1,
        totalPrice: 119,
      },
      {
        cartItemId: 'item-2',
        menuItemId: 'burger-1',
        name: 'Mexican Azteca Burger',
        category: 'Burger',
        type: 'veg',
        unitPrice: 99,
        quantity: 1,
        totalPrice: 99,
      },
      {
        cartItemId: 'item-3',
        menuItemId: 'burger-2',
        name: 'Cheesy Supreme Burger',
        category: 'Burger',
        type: 'veg',
        unitPrice: 109,
        quantity: 1,
        totalPrice: 109,
      },
      {
        cartItemId: 'item-4',
        menuItemId: 'chicken-1',
        name: 'Thandoori Chicken',
        category: 'Fries & Sides',
        type: 'non-veg',
        unitPrice: 339,
        quantity: 1,
        selectedVariant: { name: 'Large', price: 339 },
        addons: [{ id: 'addon-cheese', name: 'Extra Cheese', price: 40 }],
        totalPrice: 339,
      },
    ],
    taxDetails: {
      subTotal: 666.0,
      discountAmount: 76.63,
      discountPercent: 11.0,
      taxableValue: 589.37,
      gstRate: 4.6,
      cgstRate: 2.3,
      sgstRate: 2.3,
      cgstAmount: 15.32,
      sgstAmount: 15.32,
      totalTax: 30.64,
      roundOff: 0.0,
      grandTotal: 620.0,
    },
    billType: 'GST_Customer',
    paymentMode: 'Cash',
    status: 'Completed',
    createdBy: 'Staff',
    cashierName: 'DASCAFF Admin',
  };

  const sampleBills: BillRecord[] = [sampleBill];
  safeSet(KEYS.BILLS, sampleBills);
  return sampleBills;
}
