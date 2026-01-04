import { describe, expect, it } from 'bun:test';
import { RapidApiClient } from '../src';
import { createLoggerStub } from './helpers/createLoggerStub';

const rapidApiKeyEnv = Bun.env.RAPID_API_KEY;
const runIntegration = Bun.env.RUN_RAPID_API_TESTS === 'true';

describe.skipIf(!rapidApiKeyEnv || !runIntegration)('RapidApiClient integration', () => {
    const rapidApiHost = Bun.env.RAPID_API_HOST ?? 'weatherapi-com.p.rapidapi.com';
    const uri = Bun.env.RAPID_API_URI ?? '/current.json';
    const params = Bun.env.RAPID_API_PARAMS ? JSON.parse(Bun.env.RAPID_API_PARAMS) : { q: '53.1,-0.13' };

    const createClient = (overrides?: Partial<ConstructorParameters<typeof RapidApiClient>[0]>) =>
        new RapidApiClient({
            rapidApiKey: String(rapidApiKeyEnv),
            rapidApiHost,
            ...overrides,
        });

    const apiClient = createClient();

    describe('core', () => {
        it('fetches live data and returns the DTO shape', async () => {
            const response = await apiClient.request({
                method: 'get',
                uri,
                params,
            });

            expect(response.status).toBe(200);
            expect(response.fromCache).toBe(false);
            expect(response.request.uri).toBe(uri);
            expect(typeof response.data).toBe('object');
            expect(typeof response.headers).toBe('object');
        });
    });

    describe('caching', () => {
        it('serves cached responses on repeated GET requests', async () => {
            await apiClient.request({
                method: 'get',
                uri,
                params,
            });

            const cachedResponse = await apiClient.request({
                method: 'get',
                uri,
                params,
            });

            expect(cachedResponse.fromCache).toBe(true);
        });

        it('respects cache overrides for GET requests', async () => {
            const uncached = await apiClient.request({
                method: 'get',
                uri,
                params,
                cache: false,
            });

            expect(uncached.fromCache).toBe(false);

            const uniqueCacheKey = `force-cache-${Date.now()}`;
            const forcedCacheFirst = await apiClient.request({
                method: 'get',
                uri,
                params,
                cache: true,
                cacheKey: uniqueCacheKey,
                ttl: 5000,
            });
            expect(forcedCacheFirst.fromCache).toBe(false);

            const forcedCacheSecond = await apiClient.request({
                method: 'get',
                uri,
                params,
                cache: true,
                cacheKey: uniqueCacheKey,
            });

            expect(forcedCacheSecond.fromCache).toBe(true);
        });
    });

    describe('logging', () => {
        it('logs request lifecycle events', async () => {
            const { logger, debugSpy, warnSpy } = createLoggerStub();
            const loggingClient = createClient({ pinoInstance: logger });

            await loggingClient.request({
                method: 'get',
                uri,
                params,
                cache: false,
            });

            expect(debugSpy.mock.calls.length).toBeGreaterThan(0);
            expect(warnSpy.mock.calls.length).toBe(0);
        });
    });
});
