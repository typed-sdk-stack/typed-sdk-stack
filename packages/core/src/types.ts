import type { AxiosHeaders } from 'axios';
import type { z } from 'zod';
import type { CacheManagerParamsSchema, RapidApiClientParamsSchema, RequestParamsSchema } from './schemas';

export type RequestParams = z.infer<typeof RequestParamsSchema>;
export type RapidApiClientParams = z.infer<typeof RapidApiClientParamsSchema>;
export type CacheManagerParams = z.infer<typeof CacheManagerParamsSchema>;

export type CacheMetrics = {
    hits: number;
    misses: number;
};

export type RapidApiResponse<Response = unknown> = {
    status: number;
    data: Response;
    headers: Record<string, unknown>;
    durationMs: number;
    request: RapidApiRequestMetadata;
    fromCache: boolean;
    cacheMetrics: CacheMetrics;
};

export type RapidApiRequestMetadata = RequestParams & {
    baseURL?: string;
};

export type RapidApiResponseBuilderInput<Response> = {
    response: {
        status: number;
        data: Response;
        headers: AxiosHeaders | Record<string, unknown>;
    };
    durationMs: number;
    request: RapidApiRequestMetadata;
    fromCache?: boolean;
    cacheMetrics: CacheMetrics;
};
