/**
 * Simple TTL-based in-memory cache for backend query results.
 *
 * Used to eliminate duplicate graph analysis and reduce SQLite full-table scans.
 */

interface CacheEntry<T> {
  value: T
  expiresAt: number
}

export class GraphCache {
  private store = new Map<string, CacheEntry<string>>()

  /**
   * Set a cached entry. `ttlMs` defaults to 30 seconds.
   */
  set(key: string, value: string, ttlMs = 30_000): void {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    })
  }

  /**
   * Get a cached entry, or undefined if expired / missing.
   */
  get<T = string>(key: string): T | undefined {
    const entry = this.store.get(key)
    if (!entry) return undefined
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return undefined
    }
    return JSON.parse(entry.value) as T
  }

  /**
   * Delete a specific key.
   */
  delete(key: string): void {
    this.store.delete(key)
  }

  /**
   * Invalidate all entries matching a prefix (e.g. 'coverage:').
   */
  invalidatePrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key)
      }
    }
  }

  /**
   * Clear the entire cache.
   */
  clear(): void {
    this.store.clear()
  }

  /**
   * Size of the cache (number of entries).
   */
  get size(): number {
    return this.store.size
  }
}

export const graphCache = new GraphCache()
