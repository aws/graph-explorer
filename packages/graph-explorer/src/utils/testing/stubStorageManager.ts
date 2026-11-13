import { onTestFinished } from "vite-plus/test";

/**
 * Replaces `navigator.storage` for the current test, restoring the original
 * afterwards. Pass `undefined` to simulate an insecure origin.
 */
export function stubStorageManager(
  storage: Pick<StorageManager, "persist" | "persisted"> | undefined,
) {
  const original = Object.getOwnPropertyDescriptor(navigator, "storage");
  Object.defineProperty(navigator, "storage", {
    value: storage,
    configurable: true,
  });
  onTestFinished(() => {
    if (original) {
      Object.defineProperty(navigator, "storage", original);
    } else {
      Reflect.deleteProperty(navigator, "storage");
    }
  });
}
