import { describe, expect, it } from 'bun:test';
import { RapidApiClientError } from '../src';

describe('RapidApiClientError', () => {
    it('captures context and cause', () => {
        const original = new Error('axios boom');
        const error = new RapidApiClientError('boom', {
            status: 400,
            method: 'get',
            url: '/foo',
            data: { ok: false },
            cause: original,
        });

        expect(error).toBeInstanceOf(Error);
        expect(error.name).toBe('RapidApiClientError');
        expect(error.message).toBe('boom');
        expect(error.status).toBe(400);
        expect(error.method).toBe('get');
        expect(error.url).toBe('/foo');
        expect(error.data).toEqual({ ok: false });
        expect(error.cause).toBe(original);
    });
});
