import { CleanupCallback } from '../types';
declare function cleanup(): Promise<void>;
declare function addCleanup(callback: CleanupCallback): () => void;
declare function removeCleanup(callback: CleanupCallback): void;
declare function autoRegisterCleanup(): void;
export { cleanup, addCleanup, removeCleanup, autoRegisterCleanup };
