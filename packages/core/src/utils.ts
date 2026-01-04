import type { AxiosInstance } from 'axios';
import type { Logger } from 'pino';

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
