import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocs, 
  onSnapshot, 
  query, 
  orderBy, 
  writeBatch,
  enableNetwork,
  disableNetwork
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
  getStoredCombos, 
  saveCombos, 
  getStoredSettings, 
  saveSettings,
  getStoredTables,
  saveTables,
  getStoredAddons,
  saveAddons,
  getStoredCoupons,
  saveCoupons
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
    // Sanitize any undefined values before saving to Firestore
    const sanitized = JSON.parse(JSON.stringify(bill));
    await setDoc(docRef, {
      ...sanitized,
      updatedAt: new Date().toISOString(),
      timestamp: new Date(bill.date).getTime() || Date.now(),
    }, { merge: true });
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
    // Process in batches of 200
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
// 2. RESTAURANT SETTINGS & MENU CLOUD SYNC
// ==========================================
const SETTINGS_DOC = 'config/settings';
const MENU_COLLECTION = 'menu_items';
const COMBOS_COLLECTION = 'combos';
const TABLES_COLLECTION = 'tables';

/**
 * Save settings to Cloud
 */
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

/**
 * Real-time listener for Settings
 */
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
        // Upload initial local settings
        const current = getStoredSettings();
        saveSettingsToFirestore(current);
      }
    });
    return unsubscribe;
  } catch (err) {
    return () => {};
  }
}

/**
 * Save Menu Items to Cloud
 */
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

/**
 * Real-time listener for Menu Catalog
 */
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
        // Push local menu to cloud
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

/**
 * Save Combos to Cloud
 */
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

/**
 * Real-time listener for Combos
 */
export function subscribeToCombosFromFirestore(onUpdate: (combos: ComboItem[]) => void): () => void {
  try {
    const docRef = doc(db, 'config', 'combos_catalog');
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data && Array.isArray(data.combos) && data.combos.length > 0) {
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

/**
 * Save Table Statuses to Cloud (for Live Table / KOT multi-screen syncing)
 */
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

/**
 * Real-time listener for Table Statuses
 */
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

/**
 * One-click full synchronization (Uploads all local data: bills, menu, combos, settings, tables)
 */
export async function performFullCloudSync(): Promise<{
  billsCount: number;
  menuCount: number;
  combosCount: number;
}> {
  await initAnonymousAuth();

  const bills = getStoredBills();
  const menu = getStoredMenu();
  const combos = getStoredCombos();
  const settings = getStoredSettings();
  const tables = getStoredTables();

  await Promise.all([
    uploadLocalBillsToCloud(bills),
    saveMenuToFirestore(menu),
    saveCombosToFirestore(combos),
    saveSettingsToFirestore(settings),
    saveTablesToFirestore(tables),
  ]);

  return {
    billsCount: bills.length,
    menuCount: menu.length,
    combosCount: combos.length,
  };
}
