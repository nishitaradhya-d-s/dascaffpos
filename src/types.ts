export type OrderType = 'Dine-In' | 'Takeaway' | 'Delivery';
export type PaymentMode = 'Cash' | 'UPI' | 'Card' | 'Split';
export type OrderStatus = 'Preparing' | 'Ready' | 'Served' | 'Completed' | 'Cancelled';
export type BillType = 'GST_Customer' | 'NonGST_Owner';
export type ItemType = 'veg' | 'non-veg' | 'beverage';
export type StaffRole = 'Admin' | 'Cashier' | 'Kitchen' | 'Manager';
export type Category = 
  | 'All'
  | 'Pizza'
  | 'Burger'
  | 'Fries & Sides'
  | 'Beverages'
  | 'Desserts'
  | 'Pasta & Rolls'
  | 'Combos'
  | 'Coffee & Tea'
  | string;

export interface Variant {
  name: string; // e.g., "Regular", "Large", "Medium", "Double"
  price: number;
}

export interface Addon {
  id: string;
  name: string; // e.g., "Extra Cheese", "Peri Peri Seasoning", "Jalapenos"
  price: number;
  isAvailable?: boolean;
}

export interface GlobalAddon {
  id: string;
  name: string;
  price: number;
  category?: string;
  isAvailable: boolean;
}

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  type: ItemType;
  description?: string;
  isAvailable: boolean;
  isPopular?: boolean;
  variants?: Variant[];
  availableAddons?: Addon[];
  imageUrl?: string;
}

export interface CartItem {
  cartItemId: string;
  menuItemId: string;
  name: string;
  category: string;
  type: ItemType;
  unitPrice: number;
  quantity: number;
  selectedVariant?: Variant;
  addons?: Addon[];
  notes?: string;
  totalPrice: number;
}

export interface TaxDetails {
  subTotal: number;
  discountAmount: number;
  discountPercent: number;
  taxableValue: number;
  gstRate: number; // e.g. 5 or 2.3
  cgstRate: number; // e.g. 2.5 or 1.15
  sgstRate: number; // e.g. 2.5 or 1.15
  cgstAmount: number;
  sgstAmount: number;
  totalTax: number;
  roundOff: number;
  grandTotal: number;
}

export interface SplitPayment {
  cash: number;
  upi: number;
  card: number;
}

export interface BillRecord {
  id: string;
  billNumber: string; // e.g. "INV-004" or "INV-00125"
  kotNumber: string; // e.g. "004" or "KOT-004"
  checkNumber?: string; // e.g. "004"
  date: string; // ISO string
  orderType: OrderType;
  tableNumber?: string; // e.g. "T-1", "Table 3"
  customerName?: string;
  customerPhone?: string;
  items: CartItem[];
  taxDetails: TaxDetails;
  billType: BillType;
  paymentMode: PaymentMode;
  splitDetails?: SplitPayment;
  amountPaid?: number; // Cash tendered by customer (e.g. 200)
  changeReturned?: number; // Return change given (e.g. 20)
  status: OrderStatus;
  notes?: string;
  createdBy: string;
  cashierName?: string;
}

export interface TableStatus {
  id: string;
  number: string; // e.g. "T-1", "Table 1"
  name: string;
  capacity: number;
  status: 'vacant' | 'occupied' | 'billing' | 'reserved';
  currentBillId?: string;
  activeSince?: string;
  activeItemsCount?: number;
  activeTotal?: number;
}

export interface RawMaterial {
  id: string;
  name: string;
  unit: 'kg' | 'g' | 'L' | 'ml' | 'pcs' | 'packets';
  currentStock: number;
  totalUsed?: number;
  minThreshold: number;
  costPerUnit: number;
  supplierName?: string;
  lastRestockedDate?: string;
}

export interface RecipeIngredient {
  rawMaterialId: string;
  rawMaterialName?: string;
  quantityRequired: number; // in material unit (e.g., 0.03 for 30g if unit is kg, or 30 if unit is g)
  unit?: string;
}

export interface RecipeMapping {
  menuItemId: string;
  menuItemName?: string;
  ingredients: RecipeIngredient[];
}

export interface WastageRecord {
  id: string;
  date: string;
  rawMaterialId: string;
  rawMaterialName: string;
  quantity: number;
  unit: string;
  reason: string;
  cost: number;
  reportedBy: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email?: string;
  address?: string;
  itemsSupplied: string[];
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  date: string;
  supplierId: string;
  supplierName: string;
  items: {
    rawMaterialId: string;
    rawMaterialName: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    totalPrice: number;
  }[];
  totalAmount: number;
  status: 'Pending' | 'Received' | 'Paid' | 'Cancelled';
  paymentStatus: 'Paid' | 'Pending';
}

export interface StaffMember {
  id: string;
  name: string;
  role: StaffRole;
  phone: string;
  loginPin: string;
  isActive: boolean;
  shiftsCompleted?: number;
  totalSalesHandled?: number;
}

export interface ShiftRecord {
  id: string;
  staffId: string;
  staffName: string;
  startTime: string;
  endTime?: string;
  openingCash: number;
  closingCashExpected?: number;
  closingCashActual?: number;
  cashDifference?: number;
  totalBillsCount: number;
  totalSalesVolume: number;
  status: 'Open' | 'Closed';
  notes?: string;
}

export interface CustomerRecord {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  totalVisits: number;
  totalSpent: number;
  lastVisit: string;
  favoriteItems?: string[];
  notes?: string;
}

export interface HeldBill {
  id: string;
  heldAt: string;
  orderType: OrderType;
  tableNumber?: string;
  customerName?: string;
  customerPhone?: string;
  items: CartItem[];
  notes?: string;
}

export interface CafeSettings {
  cafeName: string; // e.g. "DAS CAFF"
  tagline: string; // e.g. "TAX INVOICE / ORIGINAL"
  address: string; // "D-MART ARENA-13 DEVARAYAPATNA , Hassan Town,"
  cityStateZip: string; // "Hassan, Hassan, Karnataka - 573201"
  phone: string; // "8088624970"
  email: string;
  gstin: string; // "29AAZFD7704R1Z5"
  gstNumber?: string; // alias for gstin
  fssaiNumber: string; // "11223344005566"
  cin: string; // "U55101KA2024PTC188920"
  sac: string; // "996331"
  defaultGstRate: number; // 5% (or 2.3% * 2 = 4.6%)
  cgstRate: number; // 2.5%
  sgstRate: number; // 2.5%
  isGstEnabled: boolean;
  invoicePrefix: string; // "INV-"
  kotPrefix: string; // "KOT-"
  termsAndConditions: string;
  currencySymbol: string; // "₹"
  printerWidth: '80mm' | '58mm';
  thermalPaperWidth?: '80mm' | '58mm'; // alias for printerWidth
  autoCut: boolean;
  autoCutPaper?: boolean; // alias for autoCut
  managerPassword?: string;
  loginUsername?: string;
  loginPassword?: string;
  invoiceStartSeq?: number;
  upiId?: string; // e.g. "dascaff@upi"
}
