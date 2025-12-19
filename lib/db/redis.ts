
import { get, set, del, clear } from 'idb-keyval';

/**
 * Redis-like wrapper for IndexedDB.
 * Provides standard Redis command interface for the client.
 */
export class RedisClient {
  private readonly prefix: string;

  constructor(prefix: string = 'iot_redis:') {
    this.prefix = prefix;
  }

  /**
   * Get the value of key.
   * Uses generic T for return type inference.
   */
  async get<T = unknown>(key: string): Promise<T | undefined> {
    const val = await get(this.prefix + key);
    return val as T | undefined;
  }

  /**
   * Set key to hold the string value.
   */
  async set<T>(key: string, value: T): Promise<void> {
    await set(this.prefix + key, value);
  }

  /**
   * Removes the specified keys.
   */
  async del(key: string): Promise<void> {
    await del(this.prefix + key);
  }

  /**
   * Delete all the keys of the database.
   */
  async flushall(): Promise<void> {
    await clear();
  }
}

export const redis = new RedisClient();
