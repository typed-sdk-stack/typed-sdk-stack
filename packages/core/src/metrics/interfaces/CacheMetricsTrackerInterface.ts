export const CacheMetrics = {
    cacheHit: 'cache_hit',
    cacheMiss: 'cache_miss',
} as const;

export interface CacheMetricsTracker {
    recordCacheHit(): void | Promise<void>;
    recordCacheMiss(): void | Promise<void>;
}
