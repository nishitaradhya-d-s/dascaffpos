import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDoc,
  getDocs, 
  onSnapshot, 
  query, 
  writeBatch
} from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { 
  BillRecord, 
  MenuItem, 
  ComboItem, 
  CafeSettings, 
  TableStatus, 
  RawMaterial,
  GlobalAddon,
  CouponCode
} from '../types';
import { 
  getStoredBills, 
  saveBillRecord, 
  getStoredMenu, 
  saveMenu, 
  getStoredCategories,
  saveCategories,
  getStoredCombos, 
  saveCombos, 
  getStoredSettings, 
  saveSettings,
  getStoredTables,
  saveTables,
  getStoredAddons,
  saveAddons,
  getStoredCoupons,
  saveCoupons,
  getStoredRawMaterials,
  saveRawMaterials
} from '../utils/storage';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);
export const auth = getAuth(app);

// Transparent anonymous authentication (No email or personal credentials required)
let isAuthInitialized = false;
export async function initAnonymousAuth(): Promise<void> {
  if (isAuthInitialized) return;
  try {
    if (!auth.currentUser) {
      await signInAnonymously(auth);
      console.log('Firebase Anonymous Auth connected successfully for POS sync');
    }
    isAuthInitialized = true;
  } catch (err) {
    console.warn('Anonymous auth note (fallback to direct Firestore access):', err);
  }
}

// Ensure auth is kicked off in background
initAnonymousAuth();

// ==========================================
// 1. BILLS & INVOICES CLOUD SYNC
// ==========================================
const BILLS_COLLECTION = 'bills';

/**
 * Save a single bill to Firestore
 */
export async function saveBillToFirestore(bill: BillRecord): Promise<void> {
  try {
    const docRef = doc(db, BILLS_COLLECTION, bill.id);
    const sanitized = JSON.parse(JSON.stringify(bill));
    await setDoc(docRef, {
      ...sanitized,
      updatedAt: new Date().toISOString(),
      timestamp: new Date(bill.date).getTime() || Date.now(),
    }, { merge: true });

    // Also update cloud invoice sequence
    const numPart = bill.billNumber.replace(/[^0-9]/g, '');
    const seq = parseInt(numPart, 10);
    if (!isNaN(seq) && seq > 0) {
      saveSequenceToFirestore(seq).catch(() => {});
    }
  } catch (error) {
    console.error('Error saving bill to Firestore:', error);
  }
}

/**
 * Delete a bill from Firestore
 */
export async function deleteBillFromFirestore(billId: string): Promise<void> {
  try {
    const docRef = doc(db, BILLS_COLLECTION, billId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting bill from Firestore:', error);
  }
}

/**
 * Real-time listener for Bills across all browsers
 */
export function subscribeToBillsFromFirestore(
  onUpdate: (bills: BillRecord[]) => void,
  onError?: (error: Error) => void
): () => void {
  try {
    const billsCol = collection(db, BILLS_COLLECTION);
    const q = query(billsCol);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const cloudBills: BillRecord[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as BillRecord;
          if (data && data.id) {
            cloudBills.push(data);
          }
        });

        // Sort descending by date
        cloudBills.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        if (cloudBills.length > 0) {
          // Merge with local storage non-destructively
          const localBills = getStoredBills();
          const localMap = new Map<string, BillRecord>();
          localBills.forEach((b) => localMap.set(b.id, b));
          
          // Overwrite/insert with cloud bills
          cloudBills.forEach((b) => localMap.set(b.id, b));
          
          const merged = Array.from(localMap.values()).sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );

          // Update local storage so offline cache is updated
          try {
            localStorage.setItem('dascaff_bills_v3', JSON.stringify(merged));
          } catch (e) {
            console.warn('LocalStorage bill update note:', e);
          }

          onUpdate(merged);
        } else {
          // Cloud is empty; if local has bills, trigger migration
          const localBills = getStoredBills();
          if (localBills.length > 0) {
            uploadLocalBillsToCloud(localBills);
            onUpdate(localBills);
          }
        }
      },
      (error) => {
        console.warn('Firestore bills sync listener note:', error);
        if (onError) onError(error);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn('Firestore subscription init note:', err);
    return () => {};
  }
}

/**
 * Bulk upload local bills to Cloud (Migration for existing bills taken till now)
 */
export async function uploadLocalBillsToCloud(billsToUpload?: BillRecord[]): Promise<{ uploaded: number; total: number }> {
  try {
    const bills = billsToUpload || getStoredBills();
    if (!bills || bills.length === 0) return { uploaded: 0, total: 0 };

    let count = 0;
    const batchSize = 200;
    for (let i = 0; i < bills.length; i += batchSize) {
      const chunk = bills.slice(i, i + batchSize);
      const batch = writeBatch(db);
      
      chunk.forEach((bill) => {
        if (!bill.id) return;
        const docRef = doc(db, BILLS_COLLECTION, bill.id);
        const sanitized = JSON.parse(JSON.stringify(bill));
        batch.set(docRef, {
          ...sanitized,
          updatedAt: new Date().toISOString(),
          timestamp: new Date(bill.date).getTime() || Date.now(),
        }, { merge: true });
        count++;
      });

      await batch.commit();
    }

    console.log(`Successfully migrated ${count} bills to Cloud Firestore.`);
    return { uploaded: count, total: bills.length };
  } catch (error) {
    console.error('Error uploading local bills to Firestore:', error);
    throw error;
  }
}

// ==========================================
// 2. INVOICE SEQUENCE CLOUD SYNC
// ==========================================
export async function saveSequenceToFirestore(seq: number): Promise<void> {
  try {
    const docRef = doc(db, 'config', 'invoice_sequence');
    await setDoc(docRef, {
      lastInvoiceSeq: seq,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    console.error('Error saving sequence to Firestore:', error);
  }
}

export function subscribeToSequenceFromFirestore(onUpdate: (seq: number) => void): () => void {
  try {
    const docRef = doc(db, 'config', 'invoice_sequence');
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data && typeof data.lastInvoiceSeq === 'number') {
          onUpdate(data.lastInvoiceSeq);
        }
      }
    });
    return unsubscribe;
  } catch (err) {
    return () => {};
  }
}

// ==========================================
// 3. RESTAURANT SETTINGS CLOUD SYNC
// ==========================================
export async function saveSettingsToFirestore(settings: CafeSettings): Promise<void> {
  try {
    const docRef = doc(db, 'config', 'restaurant_settings');
    await setDoc(docRef, {
      ...JSON.parse(JSON.stringify(settings)),
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    console.error('Error saving settings to Firestore:', error);
  }
}

export function subscribeToSettingsFromFirestore(onUpdate: (settings: CafeSettings) => void): () => void {
  try {
    const docRef = doc(db, 'config', 'restaurant_settings');
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as CafeSettings;
        if (data && (data.cafeName || (data as any).restaurantName)) {
          saveSettings(data);
          onUpdate(data);
        }
      } else {
        const current = getStoredSettings();
        saveSettingsToFirestore(current);
      }
    });
    return unsubscribe;
  } catch (err) {
    return () => {};
  }
}

// ==========================================
// 4. MENU ITEMS & CATEGORIES CLOUD SYNC
// ==========================================
export async function saveMenuToFirestore(menu: MenuItem[]): Promise<void> {
  try {
    const docRef = doc(db, 'config', 'menu_catalog');
    await setDoc(docRef, {
      items: JSON.parse(JSON.stringify(menu)),
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    console.error('Error saving menu to Firestore:', error);
  }
}

export function subscribeToMenuFromFirestore(onUpdate: (menu: MenuItem[]) => void): () => void {
  try {
    const docRef = doc(db, 'config', 'menu_catalog');
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data && Array.isArray(data.items) && data.items.length > 0) {
          saveMenu(data.items);
          onUpdate(data.items);
        }
      } else {
        const current = getStoredMenu();
        if (current.length > 0) {
          saveMenuToFirestore(current);
        }
      }
    });
    return unsubscribe;
  } catch (err) {
    return () => {};
  }
}

export async function saveCategoriesToFirestore(categories: string[]): Promise<void> {
  try {
    const docRef = doc(db, 'config', 'categories_catalog');
    await setDoc(docRef, {
      categories: JSON.parse(JSON.stringify(categories)),
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    console.error('Error saving categories to Firestore:', error);
  }
}

export function subscribeToCategoriesFromFirestore(onUpdate: (categories: string[]) => void): () => void {
  try {
    const docRef = doc(db, 'config', 'categories_catalog');
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data && Array.isArray(data.categories) && data.categories.length > 0) {
          saveCategories(data.categories);
          onUpdate(data.categories);
        }
      } else {
        const current = getStoredCategories();
        if (current.length > 0) {
          saveCategoriesToFirestore(current);
        }
      }
    });
    return unsubscribe;
  } catch (err) {
    return () => {};
  }
}

// ==========================================
// 5. COMBOS & MEAL DEALS CLOUD SYNC
// ==========================================
export async function saveCombosToFirestore(combos: ComboItem[]): Promise<void> {
  try {
    const docRef = doc(db, 'config', 'combos_catalog');
    await setDoc(docRef, {
      combos: JSON.parse(JSON.stringify(combos)),
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    console.error('Error saving combos to Firestore:', error);
  }
}

export function subscribeToCombosFromFirestore(onUpdate: (combos: ComboItem[]) => void): () => void {
  try {
    const docRef = doc(db, 'config', 'combos_catalog');
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data && Array.isArray(data.combos)) {
          saveCombos(data.combos);
          onUpdate(data.combos);
        }
      } else {
        const current = getStoredCombos();
        if (current.length > 0) {
          saveCombosToFirestore(current);
        }
      }
    });
    return unsubscribe;
  } catch (err) {
    return () => {};
  }
}

// ==========================================
// 6. GLOBAL ADD-ONS & EXTRA RATES CLOUD SYNC
// ==========================================
export async function saveAddonsToFirestore(addons: GlobalAddon[]): Promise<void> {
  try {
    const docRef = doc(db, 'config', 'addons_catalog');
    await setDoc(docRef, {
      addons: JSON.parse(JSON.stringify(addons)),
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    console.error('Error saving addons to Firestore:', error);
  }
}

export function subscribeToAddonsFromFirestore(onUpdate: (addons: GlobalAddon[]) => void): () => void {
  try {
    const docRef = doc(db, 'config', 'addons_catalog');
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data && Array.isArray(data.addons)) {
          saveAddons(data.addons);
          onUpdate(data.addons);
        }
      } else {
        const current = getStoredAddons();
        if (current.length > 0) {
          saveAddonsToFirestore(current);
        }
      }
    });
    return unsubscribe;
  } catch (err) {
    return () => {};
  }
}

// ==========================================
// 7. COUPON CODES CLOUD SYNC
// ==========================================
export async function saveCouponsToFirestore(coupons: CouponCode[]): Promise<void> {
  try {
    const docRef = doc(db, 'config', 'coupons_catalog');
    await setDoc(docRef, {
      coupons: JSON.parse(JSON.stringify(coupons)),
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    console.error('Error saving coupons to Firestore:', error);
  }
}

export function subscribeToCouponsFromFirestore(onUpdate: (coupons: CouponCode[]) => void): () => void {
  try {
    const docRef = doc(db, 'config', 'coupons_catalog');
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data && Array.isArray(data.coupons)) {
          saveCoupons(data.coupons);
          onUpdate(data.coupons);
        }
      } else {
        const current = getStoredCoupons();
        if (current.length > 0) {
          saveCouponsToFirestore(current);
        }
      }
    });
    return unsubscribe;
  } catch (err) {
    return () => {};
  }
}

// ==========================================
// 8. TABLE STATUSES CLOUD SYNC
// ==========================================
export async function saveTablesToFirestore(tables: TableStatus[]): Promise<void> {
  try {
    const docRef = doc(db, 'config', 'tables_status');
    await setDoc(docRef, {
      tables: JSON.parse(JSON.stringify(tables)),
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    console.error('Error saving tables to Firestore:', error);
  }
}

export function subscribeToTablesFromFirestore(onUpdate: (tables: TableStatus[]) => void): () => void {
  try {
    const docRef = doc(db, 'config', 'tables_status');
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data && Array.isArray(data.tables) && data.tables.length > 0) {
          saveTables(data.tables);
          onUpdate(data.tables);
        }
      } else {
        const current = getStoredTables();
        if (current.length > 0) {
          saveTablesToFirestore(current);
        }
      }
    });
    return unsubscribe;
  } catch (err) {
    return () => {};
  }
}

// ==========================================
// 9. INVENTORY & RAW MATERIALS CLOUD SYNC
// ==========================================
export async function saveRawMaterialsToFirestore(materials: RawMaterial[]): Promise<void> {
  try {
    const docRef = doc(db, 'config', 'raw_materials_catalog');
    await setDoc(docRef, {
      materials: JSON.parse(JSON.stringify(materials)),
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    console.error('Error saving raw materials to Firestore:', error);
  }
}

export function subscribeToRawMaterialsFromFirestore(onUpdate: (materials: RawMaterial[]) => void): () => void {
  try {
    const docRef = doc(db, 'config', 'raw_materials_catalog');
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data && Array.isArray(data.materials)) {
          saveRawMaterials(data.materials);
          onUpdate(data.materials);
        }
      } else {
        const current = getStoredRawMaterials();
        if (current.length > 0) {
          saveRawMaterialsToFirestore(current);
        }
      }
    });
    return unsubscribe;
  } catch (err) {
    return () => {};
  }
}

// ==========================================
// 10. ONE-CLICK COMPLETE CLOUD DATABASE SYNC
// ==========================================
/**
 * One-click full synchronization (Uploads and syncs all local data: bills, menu, combos, settings, tables, inventory)
 */
export async function performFullCloudSync(): Promise<{
  billsCount: number;
  menuCount: number;
  combosCount: number;
}> {
  await initAnonymousAuth();

  const bills = getStoredBills();
  const menu = getStoredMenu();
  const categories = getStoredCategories();
  const combos = getStoredCombos();
  const addons = getStoredAddons();
  const coupons = getStoredCoupons();
  const settings = getStoredSettings();
  const tables = getStoredTables();
  const materials = getStoredRawMaterials();

  await Promise.all([
    uploadLocalBillsToCloud(bills),
    saveMenuToFirestore(menu),
    saveCategoriesToFirestore(categories),
    saveCombosToFirestore(combos),
    saveAddonsToFirestore(addons),
    saveCouponsToFirestore(coupons),
    saveSettingsToFirestore(settings),
    saveTablesToFirestore(tables),
    saveRawMaterialsToFirestore(materials),
  ]);

  return {
    billsCount: bills.length,
    menuCount: menu.length,
    combosCount: combos.length,
  };
}

