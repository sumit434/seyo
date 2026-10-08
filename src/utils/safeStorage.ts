/**
 * Safe Browser Storage Utility
 * Provides a resilient wrapper around localStorage and sessionStorage.
 * In iPhone Safari Private Browsing mode or embedded WebViews (Instagram, TikTok, WhatsApp, QR scanners),
 * direct access to localStorage / sessionStorage can throw SecurityError or QuotaExceededError.
 * This fallback in-memory cache guarantees that the app never crashes.
 */

class MemoryStorageFallback implements Storage {
  private store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  key(index: number): string | null {
    const keys = Array.from(this.store.keys());
    return keys[index] || null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
}

function getSafeStorage(type: 'sessionStorage' | 'localStorage'): Storage {
  try {
    if (typeof window !== 'undefined' && window[type]) {
      const storage = window[type];
      const testKey = `__seyo_test_${Math.random()}__`;
      storage.setItem(testKey, '1');
      storage.removeItem(testKey);
      return storage;
    }
  } catch {
    // Storage access denied or throwing (e.g. Safari private browsing, disabled third-party cookies)
  }
  return new MemoryStorageFallback();
}

export const safeSessionStorage: Storage = getSafeStorage('sessionStorage');
export const safeLocalStorage: Storage = getSafeStorage('localStorage');
