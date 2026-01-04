import { describe, expect, it } from 'bun:test';
import axios from 'axios';
import AxiosMockAdapter from 'axios-mock-adapter';
import { RapidApiClient } from '../src';

const params = {
    rapidApiKey: 'test-key',
    rapidApiHost: 'test-host',
    baseUrl: 'https://example.com',
};

const createClientWithMock = () => {
    const axiosInstance = axios.create();
    const mock = new AxiosMockAdapter(axiosInstance);
    const client = new RapidApiClient({ ...params, axiosInstance });
    return { client, axiosInstance, mock };
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

    it('delegates request configuration to Axios', async () => {
        const { client, mock } = createClientWithMock();
        mock.onPost('/weather').reply(200, { ok: true });

        const response = await client.request({
            method: 'post',
            uri: '/weather',
            params: { q: 'Boston' },
            payload: { foo: 'bar' },
        });

        expect(response.status).toBe(200);
        expect(response.config.url).toBe('/weather');
        expect(response.config.params).toEqual({ q: 'Boston' });
        expect(JSON.parse(response.config.data as string)).toEqual({ foo: 'bar' });
        expect(response.config.method).toBe('post');
        expect(response.config.baseURL).toBe(params.baseUrl);
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
        expect(response.config.method).toBe('get');
        expect(response.config.data).toBeUndefined();
    });
});
