import { describe, expect, it } from 'bun:test';
import axios from 'axios';
import { RapidApiClientParamsSchema, RequestParamsSchema } from '../src/schemas';

describe('Schemas', () => {
    it('accepts valid params', () => {
        const result = RapidApiClientParamsSchema.safeParse({
            rapidApiKey: 'key',
            rapidApiHost: 'host',
            baseUrl: 'https://example.com',
            axiosInstance: axios.create(),
        });

        expect(result.success).toBe(true);
    });

    it('allows omitting baseUrl (derived from host)', () => {
        const result = RapidApiClientParamsSchema.safeParse({
            rapidApiKey: 'key',
            rapidApiHost: 'host',
        });

        expect(result.success).toBe(true);
    });

    it('rejects invalid base URL', () => {
        const result = RapidApiClientParamsSchema.safeParse({
            rapidApiKey: 'key',
            rapidApiHost: 'host',
            baseUrl: 'not-a-url',
        });

        expect(result.success).toBe(false);
    });
});

describe('RequestParamsSchema', () => {
    it('defaults to GET', () => {
        const result = RequestParamsSchema.parse({ uri: '/weather' });
        expect(result.method).toBe('get');
    });

    it('accepts custom method and params', () => {
        const result = RequestParamsSchema.parse({
            method: 'post',
            uri: '/forecast',
            params: { lang: 'en' },
            payload: { foo: 'bar' },
        });

        expect(result.method).toBe('post');
        expect(result.params?.lang).toBe('en');
        expect(result.payload).toEqual({ foo: 'bar' });
    });
});
