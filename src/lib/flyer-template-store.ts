import { getPublishedFlyerAction } from "@/actions/public";
import {
  getAdminFlyerTemplateAction,
  saveFlyerTemplateAction,
  unpublishFlyerTemplateAction,
} from "@/actions/admin";

export type PublishedFlyerTemplate = {
  id: string;
  name: string;
  fileName: string;
  mimeType: string;
  published: boolean;
  updatedAt: string;
  imageUrl?: string;
  blob?: Blob;
};

export const FLYER_TEMPLATE_UPDATED_EVENT = "wow:flyer-template-updated";

const DB_NAME = "wow-flyer-template-db";
const STORE_NAME = "templates";
const ACTIVE_ID = "active-attending-flyer";

function openDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function transact<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>) {
  return new Promise<T>(async (resolve, reject) => {
    try {
      const db = await openDb();
      const tx = db.transaction(STORE_NAME, mode);
      const request = run(tx.objectStore(STORE_NAME));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      tx.oncomplete = () => db.close();
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    } catch (error) {
      reject(error);
    }
  });
}

export async function getPublishedFlyerTemplate(): Promise<PublishedFlyerTemplate | null> {
  try {
    const cloud = await getPublishedFlyerAction();
    if (cloud && cloud.published) {
      return {
        id: cloud.id,
        name: cloud.name,
        fileName: cloud.fileName,
        mimeType: cloud.mimeType,
        imageUrl: cloud.imageUrl,
        published: cloud.published,
        updatedAt: cloud.updatedAt,
      };
    }
  } catch {
    // Offline or fallback to local cache
  }

  if (typeof indexedDB === "undefined") return null;
  try {
    const item = await transact<PublishedFlyerTemplate | undefined>("readonly", (store) =>
      store.get(ACTIVE_ID),
    );
    return item?.published ? item : null;
  } catch {
    return null;
  }
}

export async function getAdminFlyerTemplate(): Promise<PublishedFlyerTemplate | null> {
  try {
    const cloud = await getAdminFlyerTemplateAction();
    if (cloud) {
      return {
        id: cloud.id,
        name: cloud.name,
        fileName: cloud.fileName,
        mimeType: cloud.mimeType,
        imageUrl: cloud.imageUrl,
        published: cloud.published,
        updatedAt: cloud.updatedAt,
      };
    }
  } catch {
    // Fallback to getPublishedFlyerTemplate
  }

  return getPublishedFlyerTemplate();
}

export async function savePublishedFlyerTemplate(input: {
  name: string;
  file: File;
}): Promise<PublishedFlyerTemplate> {
  const formData = new FormData();
  formData.append("name", input.name);
  formData.append("file", input.file);

  const res = await saveFlyerTemplateAction(formData);
  if (res.status !== "success" || !res.data) {
    throw new Error(res.message || "Failed to publish flyer template.");
  }

  const cloudItem: PublishedFlyerTemplate = {
    id: res.data.id,
    name: res.data.name,
    fileName: res.data.fileName,
    mimeType: res.data.mimeType,
    imageUrl: res.data.imageUrl,
    published: res.data.published,
    updatedAt: res.data.updatedAt,
    blob: input.file,
  };

  if (typeof indexedDB !== "undefined") {
    try {
      await transact("readwrite", (store) => store.put(cloudItem));
    } catch {
      // Cache failure is non-fatal
    }
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(FLYER_TEMPLATE_UPDATED_EVENT));
  }
  return cloudItem;
}

export async function unpublishFlyerTemplate(): Promise<PublishedFlyerTemplate | null> {
  const res = await unpublishFlyerTemplateAction();
  if (res.status !== "success") {
    throw new Error(res.message || "Failed to unpublish flyer.");
  }

  if (typeof indexedDB !== "undefined") {
    try {
      const existing = await transact<PublishedFlyerTemplate | undefined>("readonly", (store) =>
        store.get(ACTIVE_ID),
      );
      if (existing) {
        await transact("readwrite", (store) =>
          store.put({ ...existing, published: false, updatedAt: new Date().toISOString() }),
        );
      }
    } catch {
      // Ignore
    }
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(FLYER_TEMPLATE_UPDATED_EVENT));
  }
  return null;
}
