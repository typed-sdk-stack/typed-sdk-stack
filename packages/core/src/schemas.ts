import type Keyv from '@keyvhq/core';
import type { AxiosInstance } from 'axios';
import type { Logger } from 'pino';
import { z } from 'zod';
import type { CacheManager } from './cache/CacheManager';
import type { MetricsTracker } from './metrics/interfaces/MetricsTrackerInterface';
import { isAxiosInstance, isCacheManagerInstance, isKeyvCache, isMetricsTracker, isPinoLogger } from './utils';

export const RapidApiClientParamsSchema = z.object({
    rapidApiKey: z.string().min(1, 'RapidAPI key is required.'),
    rapidApiHost: z.string().min(1, 'RapidAPI host is required.'),
    baseUrl: z.url('Base URL must be a valid URL.').optional(),
    axiosInstance: z
        .custom<AxiosInstance>(isAxiosInstance, {
            message: 'A valid Axios instance is required.',
        })
        .optional(),
    pinoInstance: z
        .custom<Logger>(isPinoLogger, {
            message: 'A valid Pino Logger instance is required.',
        })
        .optional(),
    keyvInstance: z
        .custom<Keyv>(isKeyvCache, {
            message: 'A valid Keyv instance is required.',
        })
        .optional(),
    cacheManager: z
        .custom<CacheManager>(isCacheManagerInstance, {
            message: 'A valid CacheManager instance is required.',
        })
        .optional(),
    metricsTracker: z
        .custom<MetricsTracker>(isMetricsTracker, {
            message: 'A valid MetricsTracker instance is required.',
        })
        .optional(),
});

export const RequestParamsSchema = z.object({
    method: z.enum(['get', 'post', 'put', 'patch', 'delete']).default('get'),
    uri: z.string().min(1, 'Request URI is required.'),
    params: z.record(z.string(), z.unknown()).optional(),
    payload: z.unknown().optional(),
    cache: z.boolean().optional(),
    cacheKey: z.string().min(1).optional(),
    ttl: z.number().positive().optional(),
});

export const CacheManagerParamsSchema = z.object({
    keyvInstance: z
        .custom<Keyv>(isKeyvCache, {
            message: 'A valid Keyv instance is required.',
        })
        .optional(),
});

export const RateLimitSchema = z.object({
    id: z.string(),
    date: z.number(),
    remaining: z.number(),
    reset: z.number(),
    limit: z.number(),
});
