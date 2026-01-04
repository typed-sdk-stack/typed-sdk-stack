import { describe, expect, test } from 'bun:test';
import { RapidApiClientError } from '../src';

describe('RapidApiClientError', () => {
    test('extends Error', () => {
        const error = new RapidApiClientError('boom');
        expect(error).toBeInstanceOf(Error);
        expect(error.name).toBe('RapidApiClientError');
        expect(error.message).toBe('boom');
    });
});
