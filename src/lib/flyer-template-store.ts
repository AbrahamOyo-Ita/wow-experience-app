export type PublishedFlyerTemplate = {
  id: string;
  name: string;
  fileName: string;
  mimeType: string;
  published: boolean;
  updatedAt: string;
  blob: Blob;
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

export async function getPublishedFlyerTemplate() {
  if (typeof indexedDB === "undefined") return null;
  const item = await transact<PublishedFlyerTemplate | undefined>("readonly", (store) =>
    store.get(ACTIVE_ID),
  );
  return item?.published ? item : null;
}

export async function savePublishedFlyerTemplate(input: {
  name: string;
  file: File;
}) {
  const item: PublishedFlyerTemplate = {
    id: ACTIVE_ID,
    name: input.name.trim() || "Main attending flyer",
    fileName: input.file.name,
    mimeType: input.file.type || "image/png",
    published: true,
    updatedAt: new Date().toISOString(),
    blob: input.file,
  };
  await transact("readwrite", (store) => store.put(item));
  window.dispatchEvent(new Event(FLYER_TEMPLATE_UPDATED_EVENT));
  return item;
}

export async function unpublishFlyerTemplate() {
  const existing = await transact<PublishedFlyerTemplate | undefined>("readonly", (store) =>
    store.get(ACTIVE_ID),
  );
  if (!existing) return null;
  const next = {
    ...existing,
    published: false,
    updatedAt: new Date().toISOString(),
  };
  await transact("readwrite", (store) => store.put(next));
  window.dispatchEvent(new Event(FLYER_TEMPLATE_UPDATED_EVENT));
  return next;
}
