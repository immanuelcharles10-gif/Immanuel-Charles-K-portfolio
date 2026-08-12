import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  Unsubscribe,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { AttachmentItem, FileEntry } from "@/app/attachments/page";

const COLLECTION = "attachments";

/**
 * Load all vault items from Firestore (one-time fetch, ordered by timestamp desc)
 */
export async function loadVaultItems(): Promise<AttachmentItem[]> {
  try {
    const q = query(
      collection(db, COLLECTION),
      orderBy("timestamp", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as AttachmentItem);
  } catch (err: any) {
    console.warn("loadVaultItems permission/fetch status:", err?.message || err);
    return [];
  }
}

/**
 * Subscribe to real-time vault updates via Firestore onSnapshot.
 * Returns an unsubscribe function — call it on component unmount.
 */
export function subscribeVaultItems(
  callback: (items: AttachmentItem[]) => void
): Unsubscribe {
  const q = query(
    collection(db, COLLECTION),
    orderBy("timestamp", "desc")
  );
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => d.data() as AttachmentItem);
      callback(items);
    },
    (err: any) => {
      console.warn("subscribeVaultItems status:", err?.message || err);
    }
  );
}

/**
 * Save a single vault item to Firestore (upsert by id)
 */
export async function addVaultItem(item: AttachmentItem): Promise<boolean> {
  try {
    // Sanitize item object to strip any undefined fields that cause Firestore setDoc to fail
    const cleanItem = JSON.parse(JSON.stringify(item));
    await setDoc(doc(db, COLLECTION, item.id), cleanItem);
    return true;
  } catch (err) {
    console.error("addVaultItem error:", err);
    return false;
  }
}

/**
 * Delete a single vault item from Firestore by id
 */
export async function deleteVaultItem(id: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, COLLECTION, id));
    return true;
  } catch (err) {
    console.error("deleteVaultItem error:", err);
    return false;
  }
}

/**
 * Helper to convert a file to a base64 Data URL
 */
export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Upload a binary file to Firebase Storage and return its public download URL.
 * Includes a timeout and automatic Data URL fallback so the UI never hangs.
 */
export async function uploadFileToStorage(
  file: File,
  pathPrefix: string
): Promise<string> {
  try {
    const storagePromise = (async () => {
      const storageRef = ref(storage, `attachments/${pathPrefix}/${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      return await getDownloadURL(snapshot.ref);
    })();

    // 6-second timeout to prevent UI hanging if Firebase Storage is disabled or blocked
    const timeoutPromise = new Promise<string>((_, reject) =>
      setTimeout(() => reject(new Error("Firebase Storage upload timeout")), 6000)
    );

    return await Promise.race([storagePromise, timeoutPromise]);
  } catch (err: any) {
    console.warn(`Firebase Storage upload fallback to Data URL for [${file.name}]:`, err?.message || err);
    return await fileToDataUrl(file);
  }
}

/**
 * Legacy compatibility shim — no-op since we now save per-item.
 * Kept so any remaining callers don't crash during migration.
 */
export async function saveVaultItems(_items: AttachmentItem[]): Promise<boolean> {
  console.warn("saveVaultItems() is deprecated. Use addVaultItem() instead.");
  return true;
}
