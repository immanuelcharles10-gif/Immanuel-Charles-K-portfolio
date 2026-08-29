"use server";

import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { AttachmentItem } from "@/app/attachments/page";

const COLLECTION = "attachments";

/**
 * Load all vault items from Firestore (server-side, ordered by timestamp desc)
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
 * Save a single vault item to Firestore (upsert by id)
 */
export async function addVaultItem(item: AttachmentItem): Promise<boolean> {
  try {
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
 * Upload a binary file to Firebase Storage and return its public download URL.
 */
export async function uploadFileToStorage(
  formData: FormData,
  pathPrefix: string
): Promise<string> {
  try {
    const file = formData.get("file") as File;
    if (!file) throw new Error("No file provided");
    
    // Convert File to ArrayBuffer for firebase upload on server
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    
    const storageRef = ref(storage, `attachments/${pathPrefix}/${file.name}`);
    const snapshot = await uploadBytes(storageRef, buffer, {
      contentType: file.type || "application/octet-stream"
    });
    return await getDownloadURL(snapshot.ref);
  } catch (err: any) {
    console.warn(`Firebase Storage upload error:`, err?.message || err);
    throw err;
  }
}
