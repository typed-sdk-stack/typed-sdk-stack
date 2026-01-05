import type Keyv from '@keyvhq/core';
import type { AxiosInstance } from 'axios';
import type { Logger } from 'pino';
import type { CacheManager } from './cache/CacheManager';
import type { MetricsTracker } from './metrics/interfaces/MetricsTrackerInterface';

export const isAxiosInstance = (value: unknown): value is AxiosInstance => {
    if (!value) {
        return false;
    }

    const valueType = typeof value;
    if (valueType !== 'function' && valueType !== 'object') {
        return false;
    }

    return typeof (value as AxiosInstance).request === 'function';
};

export const isPinoLogger = (value: unknown): value is Logger => {
    if (!value || typeof value !== 'object') {
        return false;
    }

    const candidate = value as Logger;

    return (
        typeof candidate.child === 'function' &&
        typeof candidate.debug === 'function' &&
        typeof candidate.info === 'function' &&
        typeof candidate.warn === 'function' &&
        typeof candidate.error === 'function'
    );
};

export const isKeyvCache = (value: unknown): value is Keyv => {
    if (!value || typeof value !== 'object') {
        return false;
    }

    const candidate = value as Keyv;

    return (
        typeof candidate.set === 'function' &&
        typeof candidate.get === 'function' &&
        typeof candidate.delete === 'function' &&
        typeof candidate.clear === 'function'
    );
};

export const isCacheManagerInstance = (value: unknown): value is CacheManager =>
    value !== null &&
    typeof value === 'object' &&
    typeof (value as CacheManager).createCacheKey === 'function' &&
    'cache' in (value as CacheManager);

export const isMetricsTracker = (value: unknown): value is MetricsTracker => {
    if (!value || typeof value !== 'object') {
        return false;
    }

    const candidate = value as MetricsTracker;

    return (
        typeof candidate.increment === 'function' &&
        typeof candidate.decrement === 'function' &&
        typeof candidate.get === 'function' &&
        typeof candidate.snapshot === 'function' &&
        typeof candidate.recordCacheHit === 'function' &&
        typeof candidate.recordCacheMiss === 'function' &&
        typeof candidate.recordRequestsTotal === 'function' &&
        typeof candidate.recordRequestsSucceed === 'function' &&
        typeof candidate.recordRequestsFailed === 'function'
    );
};
