import type { AxiosHeaders } from 'axios';
import type { z } from 'zod';
import type { RapidApiClientParamsSchema, RequestParamsSchema } from './schemas';

export type RequestParams = z.infer<typeof RequestParamsSchema>;
export type RapidApiClientParams = z.infer<typeof RapidApiClientParamsSchema>;

export type RapidApiResponse<Response = unknown> = {
    status: number;
    data: Response;
    headers: Record<string, unknown>;
    durationMs: number;
    request: RapidApiRequestMetadata;
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
};
