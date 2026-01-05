import { describe, expect, it } from 'bun:test';
import { Writable } from 'node:stream';
import axios from 'axios';
import AxiosMockAdapter from 'axios-mock-adapter';
import type { Logger } from 'pino';
import pino from 'pino';
import { RapidApiClient } from '../src';
import { createLoggerStub } from './helpers/createLoggerStub';

const params = {
    rapidApiKey: 'test-key',
    rapidApiHost: 'test-host',
    baseUrl: 'https://example.com',
};

const createClientWithMock = (overrides: Partial<typeof params> & { logger?: Logger } = {}) => {
    const axiosInstance = axios.create();
    const mock = new AxiosMockAdapter(axiosInstance);
    const { logger, ...rest } = overrides;
    const client = new RapidApiClient({
        ...params,
        ...rest,
        axiosInstance,
        ...(logger ? { pinoInstance: logger } : {}),
    });
    return { client, axiosInstance, mock };
};

class RateLimitTestClient extends RapidApiClient {
    public parseRateLimit(headers: Record<string, unknown>) {
        return this.extractRateLimit(headers);
    }
}

describe('RapidApiClient', () => {
    describe('core', () => {
        it('is constructible', () => {
            const client = new RapidApiClient(params);
            expect(client).toBeInstanceOf(RapidApiClient);
        });

        it('sets base URL and RapidAPI headers on the provided Axios instance', () => {
            const axiosInstance = axios.create();
            new RapidApiClient({ ...params, axiosInstance });

            expect(axiosInstance.defaults.baseURL).toBe(params.baseUrl);
            expect(axiosInstance.defaults.headers.common['X-RapidAPI-Key']).toBe(params.rapidApiKey);
            expect(axiosInstance.defaults.headers.common['X-RapidAPI-Host']).toBe(params.rapidApiHost);
        });

        it('builds a serializable response DTO', async () => {
            const { client, mock } = createClientWithMock();
            mock.onPost('/weather').reply(() => [
                200,
                { ok: true },
                {
                    'x-rapidapi-request-id': 'req-123',
                    'x-ratelimit-requests-remaining': '298',
                    'x-ratelimit-requests-reset': '1712345678',
                    'x-ratelimit-requests-limit': '300',
                },
            ]);

            const response = await client.request({
                method: 'post',
                uri: '/weather',
                params: { q: 'Boston' },
                payload: { foo: 'bar' },
            });

            expect(response.status).toBe(200);
            expect(response.data).toEqual({ ok: true });
            expect(response.request.uri).toBe('/weather');
            expect(response.request.params).toEqual({ q: 'Boston' });
            expect(response.request.payload).toEqual({ foo: 'bar' });
            expect(response.request.method).toBe('post');
            expect(response.request.baseURL).toBe(params.baseUrl);
            expect(typeof response.headers).toBe('object');
            expect(response.rateLimit).toEqual({
                id: 'req-123',
                date: expect.any(Number),
                remaining: 298,
                reset: 1712345678,
                limit: 300,
            });
        });

        it('infers base URL from host when not provided', () => {
            const axiosInstance = axios.create();
            // eslint-disable-next-line no-new
            new RapidApiClient({
                rapidApiKey: params.rapidApiKey,
                rapidApiHost: params.rapidApiHost,
                axiosInstance,
            });

            expect(axiosInstance.defaults.baseURL).toBe(`https://${params.rapidApiHost}`);
        });

        it('omits payload on GET requests', async () => {
            const { client, mock } = createClientWithMock();
            mock.onGet('/simple').reply(200, { ok: true });

            const response = await client.request({
                method: 'get',
                uri: '/simple',
                params: { q: 'Rome' },
            });

            expect(response.status).toBe(200);
            expect(response.request.method).toBe('get');
            expect(response.request.payload).toBeUndefined();
        });
    });
    describe('logging', () => {
        it('logs request lifecycle events', async () => {
            const { logger, debugSpy, warnSpy } = createLoggerStub();
            const { client, mock } = createClientWithMock({ logger });

            mock.onPost('/weather').reply(200, { ok: true });
            await client.request({
                method: 'post',
                uri: '/weather',
                params: { q: 'Boston' },
                payload: { hello: 'world' },
            });

            expect(debugSpy.mock.calls.length).toBeGreaterThanOrEqual(2);
            expect(warnSpy.mock.calls.length).toBe(0);

            mock.resetHandlers();
            mock.onPost('/weather').reply(500, { ok: false });

            expect(
                client.request({
                    method: 'post',
                    uri: '/weather',
                    params: { q: 'Boston' },
                    payload: { hello: 'world' },
                })
            ).rejects.toThrow();

            expect(warnSpy.mock.calls.length).toBe(1);
        });

        it('redacts rapidApiKey in logs even with custom logger', async () => {
            const logs: string[] = [];
            const stream = new Writable({
                write(chunk, _encoding, callback) {
                    logs.push(chunk.toString());
                    callback();
                },
            });
            const externalLogger = pino({ level: 'debug' }, stream);
            const { client, mock } = createClientWithMock({ logger: externalLogger });

            mock.onGet('/log-redaction').reply(200, { ok: true });
            await client.request({
                method: 'get',
                uri: '/log-redaction',
            });

            const internalLogger = (client as unknown as { logger: Logger }).logger;
            internalLogger.debug({ rapidApiKey: 'super-secret-key' }, 'redaction-test');

            expect(logs.some((line) => line.includes('super-secret-key'))).toBe(false);
            expect(logs.some((line) => line.includes('[REDACTED]'))).toBe(true);
        });
    });
    describe('caching', () => {
        it('returns cached responses for repeated GET requests', async () => {
            const { client, mock } = createClientWithMock();
            mock.onGet('/cache-me').reply(200, { ok: true });

            const firstResponse = await client.request({
                method: 'get',
                uri: '/cache-me',
            });

            expect(firstResponse.fromCache).toBe(false);

            mock.resetHandlers();
            mock.onGet('/cache-me').reply(() => [500, {}]);

            const cachedResponse = await client.request({
                method: 'get',
                uri: '/cache-me',
            });

            expect(cachedResponse.fromCache).toBe(true);
            expect(cachedResponse.data).toEqual(firstResponse.data);
        });

        it('allows custom cacheKey overrides for non-GET requests', async () => {
            const { client, mock } = createClientWithMock();
            mock.onPost('/cache-post').reply(200, { ok: true });

            const firstResponse = await client.request({
                method: 'post',
                uri: '/cache-post',
                payload: { foo: 'bar' },
                cacheKey: 'custom-cache-key',
                ttl: 1000,
            });

            expect(firstResponse.fromCache).toBe(false);

            mock.resetHandlers();
            mock.onPost('/cache-post').reply(() => [500, {}]);

            const cachedResponse = await client.request({
                method: 'post',
                uri: '/cache-post',
                payload: { foo: 'bar' },
                cacheKey: 'custom-cache-key',
            });

            expect(cachedResponse.fromCache).toBe(true);
            expect(cachedResponse.data).toEqual(firstResponse.data);
        });

        it('skips caching when cache is explicitly false', async () => {
            const { client, mock } = createClientWithMock();
            mock.onGet('/no-cache').reply(200, { ok: true });

            const response = await client.request({
                method: 'get',
                uri: '/no-cache',
                cache: false,
            });

            expect(response.fromCache).toBe(false);

            mock.resetHandlers();
            mock.onGet('/no-cache').reply(() => [500, {}]);

            expect(
                client.request({
                    method: 'get',
                    uri: '/no-cache',
                    cache: false,
                })
            ).rejects.toThrow();
        });

        it('enables caching for non-GET requests when cache is true without a custom key', async () => {
            const { client, mock } = createClientWithMock();
            mock.onPost('/force-cache').reply(200, { ok: true });

            const response = await client.request({
                method: 'post',
                uri: '/force-cache',
                payload: { foo: 'bar' },
                cache: true,
            });

            expect(response.fromCache).toBe(false);

            mock.resetHandlers();
            mock.onPost('/force-cache').reply(() => [500, {}]);

            const cachedResponse = await client.request({
                method: 'post',
                uri: '/force-cache',
                payload: { foo: 'bar' },
                cache: true,
            });

            expect(cachedResponse.fromCache).toBe(true);
        });

        it('refetches once a cached entry expires via ttl', async () => {
            const { client, mock } = createClientWithMock();
            mock.onGet('/ttl').replyOnce(200, { value: 1 }).onGet('/ttl').reply(200, { value: 2 });

            const ttlMs = 25;
            const firstResponse = await client.request({
                method: 'get',
                uri: '/ttl',
                cache: true,
                ttl: ttlMs,
            });

            expect(firstResponse.fromCache).toBe(false);
            expect(firstResponse.data).toEqual({ value: 1 });

            await new Promise((resolve) => {
                setTimeout(resolve, ttlMs + 25);
            });

            const afterExpiry = await client.request({
                method: 'get',
                uri: '/ttl',
                cache: true,
                ttl: ttlMs,
            });

            expect(afterExpiry.fromCache).toBe(false);
            expect(afterExpiry.data).toEqual({ value: 2 });
        });
    });
});
describe('rate limits', () => {
    it('parses headers case-insensitively and falls back to defaults', () => {
        const client = new RateLimitTestClient(params);
        const result = client.parseRateLimit({
            'X-RapidAPI-Request-Id': 'Req-XYZ',
            Date: 'Mon, 05 Jan 2026 01:02:03 GMT',
            'X-Ratelimit-Requests-Remaining': '150',
            'x-rapidapi-request-reset': '555',
            'X-Ratelimit-Requests-Limit': '500',
        });

        expect(result.id).toBe('Req-XYZ');
        expect(result.date).toBeGreaterThan(0);
        expect(result.remaining).toBe(150);
        expect(result.reset).toBe(555);
        expect(result.limit).toBe(500);
    });
});

describe('metrics snapshot', () => {
    it('exposes the underlying metrics snapshot', async () => {
        const { client, mock } = createClientWithMock();
        mock.onGet('/metrics').reply(200, { ok: true });

        await client.request({ method: 'get', uri: '/metrics' });
        const snapshot = await client.getMetricsSnapshot();

        expect(snapshot).toHaveProperty('cache_hit');
        expect(snapshot).toHaveProperty('cache_miss');
    });
});
