import { describe, expect, it } from 'bun:test';
import axios from 'axios';
import AxiosMockAdapter from 'axios-mock-adapter';
import type { Logger } from 'pino';
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
    return { client, axiosInstance, mock, logger };
};

describe('RapidApiClient', () => {
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
        mock.onPost('/weather').reply(200, { ok: true });

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
        expect(response.headers).toBeTruthy();
        expect(typeof response.headers).toBe('object');
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

    it('logs request lifecycle events', async () => {
        const { logger, debugSpy, warnSpy } = createLoggerStub();

        const { client, mock: axiosMock } = createClientWithMock({ logger });
        axiosMock.onPost('/weather').reply(200, { ok: true });
        await client.request({
            method: 'post',
            uri: '/weather',
            params: { q: 'Boston' },
            payload: { hello: 'world' },
        });

        expect(debugSpy.mock.calls.length).toBeGreaterThanOrEqual(2);
        expect(warnSpy.mock.calls.length).toBe(0);

        axiosMock.reset();
        axiosMock.onPost('/weather').reply(500, { ok: false });

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
});
