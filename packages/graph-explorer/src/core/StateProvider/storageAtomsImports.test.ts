import { expect, it, vi } from "vite-plus/test";

vi.mock(import("./localDb"), () => {
  throw new Error("storageAtoms must not import localDb");
});

// `localDb` reads the storage atoms, so importing it from `storageAtoms` would
// form an import cycle.
it("does not import localDb", async () => {
  await expect(import("./storageAtoms")).resolves.toBeDefined();
});
