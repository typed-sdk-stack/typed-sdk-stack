import Keyv from '@keyvhq/core';
import type { AxiosRequestConfig } from 'axios';
import objectHash from 'object-hash';
import type { CacheManagerParams } from '../types';

const MAX_CACHE_KEY_PAYLOAD_LENGTH = 2048;

export class CacheManager {
    protected store: Keyv;

    constructor({ keyvInstance }: CacheManagerParams) {
        this.store = keyvInstance ?? new Keyv({ ttl: 0 });
    }

    get cache(): Keyv {
        return this.store;
    }

    createCacheKey(config: AxiosRequestConfig, metadata: Record<string, unknown> = {}): string {
        const serializableConfig = {
            method: config.method,
            url: config.url,
            baseURL: config.baseURL,
            params: config.params,
            payload: this.serializePayloadForCache(config.data),
            metadata,
        };

        return objectHash(serializableConfig);
    }

    async get<Response>(cacheKey: string): Promise<Response | undefined> {
        return (await this.store.get(cacheKey)) as Response | undefined;
    }

    async set<Response>(cacheKey: string, value: Response, ttl?: number): Promise<void> {
        await this.store.set(cacheKey, value, ttl);
    }

    protected serializePayloadForCache(data: unknown): string | undefined {
        if (data === undefined || data === null) {
            return undefined;
        }

        const rawPayload =
            typeof data === 'string'
                ? data
                : (() => {
                      try {
                          return JSON.stringify(data);
                      } catch {
                          return String(data);
                      }
                  })();

        if (rawPayload.length <= MAX_CACHE_KEY_PAYLOAD_LENGTH) {
            return rawPayload;
        }

        return objectHash(rawPayload);
    }
}
