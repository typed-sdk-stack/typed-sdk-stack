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

export const isPinoLogger = (value: unknown): value is Logger =>
    value !== null && typeof value === 'object' && typeof (value as Logger).child === 'function';
