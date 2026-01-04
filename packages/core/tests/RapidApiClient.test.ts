import { describe, expect, test } from 'bun:test';
import { RapidApiClient } from '../src';

describe('RapidApiClient', () => {
    test('is constructible', () => {
        const client = new RapidApiClient();
        expect(client).toBeInstanceOf(RapidApiClient);
    });
});
