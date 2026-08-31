import { RawMaterial, Supplier, TableStatus, RecipeMapping, StaffMember, GlobalAddon } from '../types';

export const DEFAULT_RAW_MATERIALS: RawMaterial[] = [
  { id: 'rm-1', name: 'Mozzarella Cheese', unit: 'kg', currentStock: 24.5, minThreshold: 5.0, costPerUnit: 420, supplierName: 'Dairy Fresh Foods' },
  { id: 'rm-2', name: 'Pizza Dough Base (7")', unit: 'pcs', currentStock: 85, minThreshold: 20, costPerUnit: 18, supplierName: 'Artisan Bakes' },
  { id: 'rm-3', name: 'Burger Buns (Sesame)', unit: 'pcs', currentStock: 120, minThreshold: 30, costPerUnit: 12, supplierName: 'Artisan Bakes' },
  { id: 'rm-4', name: 'Chicken Breast / Chunks', unit: 'kg', currentStock: 18.0, minThreshold: 4.0, costPerUnit: 260, supplierName: 'Prime Poultry Co.' },
  { id: 'rm-5', name: 'Paneer (Fresh Malai)', unit: 'kg', currentStock: 14.0, minThreshold: 3.0, costPerUnit: 340, supplierName: 'Dairy Fresh Foods' },
  { id: 'rm-6', name: 'Pizza Marinara Sauce', unit: 'kg', currentStock: 12.5, minThreshold: 3.0, costPerUnit: 180, supplierName: 'Chef Basket Spices' },
  { id: 'rm-7', name: 'French Fries (Frozen cut)', unit: 'kg', currentStock: 30.0, minThreshold: 8.0, costPerUnit: 110, supplierName: 'Frosty Foods' },
  { id: 'rm-8', name: 'Full Cream Milk', unit: 'L', currentStock: 45.0, minThreshold: 10.0, costPerUnit: 62, supplierName: 'Nandini Milk Dairy' },
  { id: 'rm-9', name: 'Arabica Coffee Beans', unit: 'kg', currentStock: 8.5, minThreshold: 2.0, costPerUnit: 780, supplierName: 'Coorg Estate Roasters' },
  { id: 'rm-10', name: 'Chocolate Syrup & Ganache', unit: 'kg', currentStock: 9.0, minThreshold: 2.0, costPerUnit: 280, supplierName: 'Sweet Treat Supplies' },
  { id: 'rm-11', name: 'Fresh Mint & Lemons', unit: 'kg', currentStock: 6.0, minThreshold: 1.5, costPerUnit: 90, supplierName: 'Local Market Produce' },
  { id: 'rm-12', name: 'Chipotle & Burger Mayo', unit: 'kg', currentStock: 11.0, minThreshold: 3.0, costPerUnit: 160, supplierName: 'Chef Basket Spices' },
];

export const DEFAULT_SUPPLIERS: Supplier[] = [
  { id: 'sup-1', name: 'Dairy Fresh Foods', contactPerson: 'Ramesh Gowda', phone: '9845012345', email: 'dairyfresh@supply.in', address: 'BM Road, Hassan', itemsSupplied: ['Mozzarella Cheese', 'Paneer (Fresh Malai)'] },
  { id: 'sup-2', name: 'Artisan Bakes', contactPerson: 'Suresh Kumar', phone: '9845054321', email: 'artisanbakes@supply.in', address: 'Industrial Area, Hassan', itemsSupplied: ['Pizza Dough Base', 'Burger Buns'] },
  { id: 'sup-3', name: 'Prime Poultry Co.', contactPerson: 'Kiran Rao', phone: '9880098765', email: 'primepoultry@supply.in', address: 'Ring Road, Hassan', itemsSupplied: ['Chicken Breast / Chunks'] },
  { id: 'sup-4', name: 'Coorg Estate Roasters', contactPerson: 'Arun Somanna', phone: '9448011223', email: 'coorgroasters@supply.in', address: 'Madikeri, Coorg', itemsSupplied: ['Arabica Coffee Beans'] },
];

export const DEFAULT_TABLES: TableStatus[] = [
  { id: 'tbl-1', number: 'T-1', name: 'Table 1', capacity: 4, status: 'vacant' },
  { id: 'tbl-2', number: 'T-2', name: 'Table 2', capacity: 2, status: 'vacant' },
  { id: 'tbl-3', number: 'T-3', name: 'Table 3', capacity: 4, status: 'vacant' },
  { id: 'tbl-4', number: 'T-4', name: 'Table 4', capacity: 6, status: 'vacant' },
  { id: 'tbl-5', number: 'T-5', name: 'Table 5', capacity: 4, status: 'vacant' },
  { id: 'tbl-6', number: 'T-6', name: 'Table 6', capacity: 2, status: 'vacant' },
  { id: 'tbl-7', number: 'T-7', name: 'Table 7', capacity: 8, status: 'vacant' },
  { id: 'tbl-8', number: 'T-8', name: 'Table 8', capacity: 4, status: 'vacant' },
  { id: 'tbl-9', number: 'T-9', name: 'Table 9', capacity: 4, status: 'vacant' },
  { id: 'tbl-10', number: 'T-10', name: 'Table 10 (Outdoor)', capacity: 4, status: 'vacant' },
  { id: 'tbl-11', number: 'T-11', name: 'Table 11 (Outdoor)', capacity: 4, status: 'vacant' },
  { id: 'tbl-12', number: 'T-12', name: 'Table 12 (Lounge)', capacity: 6, status: 'vacant' },
];

export const DEFAULT_STAFF: StaffMember[] = [
  { id: 'staff-1', name: 'DASCAFF Admin', role: 'Admin', phone: '8088624970', loginPin: 'rakdas@098', isActive: true, shiftsCompleted: 142, totalSalesHandled: 489200 },
  { id: 'staff-2', name: 'Cashier Terminal 1', role: 'Cashier', phone: '9845112233', loginPin: '1234', isActive: true, shiftsCompleted: 85, totalSalesHandled: 234100 },
  { id: 'staff-3', name: 'Kitchen Master Chef', role: 'Kitchen', phone: '9845223344', loginPin: '0000', isActive: true, shiftsCompleted: 98, totalSalesHandled: 0 },
  { id: 'staff-4', name: 'Operations Manager', role: 'Manager', phone: '9845334455', loginPin: '4321', isActive: true, shiftsCompleted: 110, totalSalesHandled: 340900 },
];

export const DEFAULT_GLOBAL_ADDONS: GlobalAddon[] = [
  { id: 'addon-cheese', name: 'Extra Cheese', price: 20, isAvailable: true, applicableSections: ['Pizzas', 'Burgers', 'Sandwiches', 'Pastas', 'Maggies'] },
  { id: 'addon-topping', name: 'Extra Topping', price: 30, isAvailable: true, applicableSections: ['Pizzas'] },
  { id: 'addon-dip', name: 'Cheesy Dip', price: 25, isAvailable: true, applicableSections: ['Pizzas', 'Burgers', 'French Fries', 'Sides', 'Wraps'] },
  { id: 'addon-jalapeno', name: 'Jalapeno & Olives', price: 25, isAvailable: true, applicableSections: ['Pizzas', 'Burgers', 'Sandwiches', 'Pastas'] },
  { id: 'addon-periperi', name: 'Peri Peri Seasoning', price: 15, isAvailable: true, applicableSections: ['French Fries', 'Sides', 'Burgers'] },
  { id: 'addon-sauce', name: 'Spicy Chipotle Sauce', price: 20, isAvailable: true, applicableSections: ['Burgers', 'Sandwiches', 'French Fries', 'Sides', 'Wraps'] },
];

export const DEFAULT_RECIPES: RecipeMapping[] = [
  // Pizza items (30g - 40g cheese, 1 base, 0.04kg sauce)
  {
    menuItemId: 'cp-1',
    menuItemName: 'Creamy Corn Pizza',
    ingredients: [
      { rawMaterialId: 'rm-1', rawMaterialName: 'Mozzarella Cheese', quantityRequired: 0.03, unit: 'kg' }, // 30g
      { rawMaterialId: 'rm-2', rawMaterialName: 'Pizza Dough Base (7")', quantityRequired: 1, unit: 'pcs' },
      { rawMaterialId: 'rm-6', rawMaterialName: 'Pizza Marinara Sauce', quantityRequired: 0.03, unit: 'kg' },
    ]
  },
  {
    menuItemId: 'cp-2',
    menuItemName: 'Onion Caps Pizza',
    ingredients: [
      { rawMaterialId: 'rm-1', rawMaterialName: 'Mozzarella Cheese', quantityRequired: 0.03, unit: 'kg' },
      { rawMaterialId: 'rm-2', rawMaterialName: 'Pizza Dough Base (7")', quantityRequired: 1, unit: 'pcs' },
      { rawMaterialId: 'rm-6', rawMaterialName: 'Pizza Marinara Sauce', quantityRequired: 0.03, unit: 'kg' },
    ]
  },
  {
    menuItemId: 'cp-3',
    menuItemName: 'Mushroom Classic Pizza',
    ingredients: [
      { rawMaterialId: 'rm-1', rawMaterialName: 'Mozzarella Cheese', quantityRequired: 0.035, unit: 'kg' },
      { rawMaterialId: 'rm-2', rawMaterialName: 'Pizza Dough Base (7")', quantityRequired: 1, unit: 'pcs' },
      { rawMaterialId: 'rm-6', rawMaterialName: 'Pizza Marinara Sauce', quantityRequired: 0.03, unit: 'kg' },
    ]
  },
  {
    menuItemId: 'cp-4',
    menuItemName: 'Onion Caps & Paneer Pizza',
    ingredients: [
      { rawMaterialId: 'rm-1', rawMaterialName: 'Mozzarella Cheese', quantityRequired: 0.035, unit: 'kg' },
      { rawMaterialId: 'rm-2', rawMaterialName: 'Pizza Dough Base (7")', quantityRequired: 1, unit: 'pcs' },
      { rawMaterialId: 'rm-5', rawMaterialName: 'Paneer (Fresh Malai)', quantityRequired: 0.04, unit: 'kg' },
      { rawMaterialId: 'rm-6', rawMaterialName: 'Pizza Marinara Sauce', quantityRequired: 0.03, unit: 'kg' },
    ]
  },
  {
    menuItemId: 'cp-5',
    menuItemName: 'Corn & Capsicum Pizza',
    ingredients: [
      { rawMaterialId: 'rm-1', rawMaterialName: 'Mozzarella Cheese', quantityRequired: 0.035, unit: 'kg' },
      { rawMaterialId: 'rm-2', rawMaterialName: 'Pizza Dough Base (7")', quantityRequired: 1, unit: 'pcs' },
      { rawMaterialId: 'rm-6', rawMaterialName: 'Pizza Marinara Sauce', quantityRequired: 0.03, unit: 'kg' },
    ]
  },
  // Burger Items
  {
    menuItemId: 'bg-1',
    menuItemName: 'Veggie Crisp Burger',
    ingredients: [
      { rawMaterialId: 'rm-3', rawMaterialName: 'Burger Buns (Sesame)', quantityRequired: 1, unit: 'pcs' },
      { rawMaterialId: 'rm-12', rawMaterialName: 'Chipotle & Burger Mayo', quantityRequired: 0.02, unit: 'kg' },
    ]
  },
  {
    menuItemId: 'bg-2',
    menuItemName: 'Crispy Chicken Burger',
    ingredients: [
      { rawMaterialId: 'rm-3', rawMaterialName: 'Burger Buns (Sesame)', quantityRequired: 1, unit: 'pcs' },
      { rawMaterialId: 'rm-4', rawMaterialName: 'Chicken Breast / Chunks', quantityRequired: 0.07, unit: 'kg' },
      { rawMaterialId: 'rm-12', rawMaterialName: 'Chipotle & Burger Mayo', quantityRequired: 0.02, unit: 'kg' },
    ]
  },
  // Fries
  {
    menuItemId: 'fr-1',
    menuItemName: 'Classic Salted French Fries',
    ingredients: [
      { rawMaterialId: 'rm-7', rawMaterialName: 'French Fries (Frozen cut)', quantityRequired: 0.12, unit: 'kg' },
    ]
  },
  {
    menuItemId: 'fr-2',
    menuItemName: 'Peri Peri Crispy Fries',
    ingredients: [
      { rawMaterialId: 'rm-7', rawMaterialName: 'French Fries (Frozen cut)', quantityRequired: 0.12, unit: 'kg' },
    ]
  },
  // Beverages / Coffee
  {
    menuItemId: 'bev-1',
    menuItemName: 'Classic Cold Coffee',
    ingredients: [
      { rawMaterialId: 'rm-8', rawMaterialName: 'Full Cream Milk', quantityRequired: 0.20, unit: 'L' },
      { rawMaterialId: 'rm-9', rawMaterialName: 'Arabica Coffee Beans', quantityRequired: 0.015, unit: 'kg' },
    ]
  },
  {
    menuItemId: 'bev-2',
    menuItemName: 'Virgin Blue Curacao Mojito',
    ingredients: [
      { rawMaterialId: 'rm-11', rawMaterialName: 'Fresh Mint & Lemons', quantityRequired: 0.03, unit: 'kg' },
    ]
  },
];
