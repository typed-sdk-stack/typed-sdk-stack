import type { AxiosInstance } from 'axios';
import { z } from 'zod';

const isAxiosInstance = (value: unknown): value is AxiosInstance => {
    if (!value) {
        return false;
    }

    const valueType = typeof value;
    if (valueType !== 'function' && valueType !== 'object') {
        return false;
    }

    return typeof (value as AxiosInstance).request === 'function';
};

export const RapidApiClientParamsSchema = z.object({
    rapidApiKey: z.string().min(1, 'RapidAPI key is required.'),
    rapidApiHost: z.string().min(1, 'RapidAPI host is required.'),
    baseUrl: z.url('Base URL must be a valid URL.').optional(),
    axiosInstance: z
        .custom<AxiosInstance>(isAxiosInstance, {
            message: 'A valid Axios instance is required.',
        })
        .optional(),
});

export const RequestParamsSchema = z.object({
    method: z.enum(['get', 'post', 'put', 'patch', 'delete']).default('get'),
    uri: z.string().min(1, 'Request URI is required.'),
    params: z.record(z.string(), z.unknown()).optional(),
    payload: z.unknown().optional(),
});
