import Keyv from '@keyvhq/core';
import axios, { AxiosHeaders, type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { type Logger, pino } from 'pino';
import { CacheManager } from '../cache/CacheManager';
import { RapidApiClientError } from '../error/RapidApiClientError';
import { RapidApiClientParamsSchema, RequestParamsSchema } from '../schemas';
import type {
    RapidApiClientParams,
    RapidApiRequestMetadata,
    RapidApiResponse,
    RapidApiResponseBuilderInput,
    RequestParams,
} from '../types';

export class RapidApiClient {
    protected httpClient: AxiosInstance;
    protected logger: Logger;
    protected cacheManager: CacheManager;
    protected rapidApiHost: string;
    protected rapidApiKey: string;

    constructor(params: RapidApiClientParams) {
        const httpClientParams = RapidApiClientParamsSchema.parse(params);
        this.httpClient = this.createHttpClient(httpClientParams);
        this.logger = this.createPinoLogger(httpClientParams);
        this.cacheManager = this.createCacheManager(httpClientParams);

        const { rapidApiHost, rapidApiKey } = httpClientParams;
        this.rapidApiHost = rapidApiHost;
        this.rapidApiKey = rapidApiKey;
    }

    protected createCacheManager({
        cacheManager,
        keyvInstance,
        rapidApiHost,
        rapidApiKey,
    }: RapidApiClientParams): CacheManager {
        if (cacheManager) {
            return cacheManager;
        }

        const store =
            keyvInstance ??
            new Keyv({
                namespace: `${rapidApiHost}:${rapidApiKey}`,
                ttl: 0,
            });

        return new CacheManager({ keyvInstance: store });
    }

    protected createPinoLogger({ pinoInstance }: RapidApiClientParams): Logger {
        return (
            pinoInstance ??
            pino({
                level: 'silent',
            })
        );
    }

    protected createHttpClient({
        axiosInstance,
        baseUrl,
        rapidApiHost,
        rapidApiKey,
    }: RapidApiClientParams): AxiosInstance {
        const instance = axiosInstance ?? axios.create();
        instance.defaults.baseURL = baseUrl ?? `https://${rapidApiHost}`;
        instance.defaults.headers.common['X-RapidAPI-Host'] = rapidApiHost;
        instance.defaults.headers.common['X-RapidAPI-Key'] = rapidApiKey;
        instance.defaults.headers.common['Content-Type'] = 'application/json';

        return instance;
    }

    async request<Response = unknown>(requestParams: RequestParams): Promise<RapidApiResponse<Response>> {
        const parsedRequest = RequestParamsSchema.parse(requestParams);
        const { method, uri, params, payload } = parsedRequest;

        const config: AxiosRequestConfig = {
            method,
            url: uri,
            params,
            data: payload,
            baseURL: this.httpClient.defaults.baseURL,
        };

        const requestMetadata: RapidApiRequestMetadata = {
            ...parsedRequest,
            baseURL: config.baseURL,
        };

        this.logger.debug({ ...requestMetadata }, 'rapidapi.request.start');

        const shouldCacheRequest = this.shouldCache(parsedRequest);
        const cacheKey =
            parsedRequest.cacheKey ??
            this.cacheManager.createCacheKey(config, {
                rapidApiHost: this.rapidApiHost,
                rapidApiKey: this.rapidApiKey,
            });

        if (cacheKey && shouldCacheRequest) {
            const cachedResponse = await this.cacheManager.get<RapidApiResponse<Response>>(cacheKey);
            if (cachedResponse) {
                this.logger.debug({ ...requestMetadata, cacheKey }, 'rapidapi.cache.hit');
                return { ...cachedResponse, fromCache: true };
            }

            this.logger.debug({ ...requestMetadata, cacheKey }, 'rapidapi.cache.miss');
        } else {
            this.logger.debug({ ...requestMetadata }, 'rapidapi.cache.skip');
        }

        const startedAt = Date.now();

        try {
            const response = await this.httpClient.request<Response>(config);
            const durationMs = Date.now() - startedAt;
            const dto = this.buildResponseDto<Response>({
                response,
                durationMs,
                request: requestMetadata,
                fromCache: false,
            });

            this.logger.debug(
                {
                    ...requestMetadata,
                    status: response.status,
                    durationMs,
                },
                'rapidapi.request.success'
            );

            if (cacheKey && shouldCacheRequest) {
                await this.cacheManager.set(cacheKey, dto, parsedRequest.ttl);

                this.logger.debug(
                    {
                        ...requestMetadata,
                        cacheKey,
                        ttl: parsedRequest.ttl,
                    },
                    'rapidapi.cache.store'
                );
            }

            return dto;
        } catch (error) {
            this.logger.warn(
                {
                    ...requestMetadata,
                    durationMs: Date.now() - startedAt,
                    error: error instanceof Error ? error.message : String(error),
                },
                'rapidapi.request.failure'
            );

            throw this.normalizeError(error, config);
        }
    }

    protected buildResponseDto<Response>({
        response,
        durationMs,
        request,
        fromCache,
    }: RapidApiResponseBuilderInput<Response>): RapidApiResponse<Response> {
        const headers =
            response.headers instanceof AxiosHeaders
                ? response.headers.toJSON()
                : (response.headers as Record<string, unknown>);

        return {
            status: response.status,
            data: response.data,
            headers,
            durationMs,
            request,
            fromCache: fromCache ?? false,
        };
    }

    protected shouldCache(request: RequestParams): boolean {
        if (typeof request.cache === 'boolean') {
            return request.cache;
        }

        if (typeof request.cacheKey === 'string') {
            return true;
        }

        return request.method === 'get';
    }

    protected normalizeError(error: unknown, config: AxiosRequestConfig): RapidApiClientError {
        if (axios.isAxiosError(error)) {
            const message = error.response
                ? `RapidAPI request failed with status ${error.response.status}`
                : error.message;

            return new RapidApiClientError(message, {
                status: error.response?.status,
                method: config.method,
                url: config.url,
                data: error.response?.data,
                cause: error,
            });
        }

        return new RapidApiClientError('Unexpected RapidAPI client error', {
            method: config.method,
            url: config.url,
            cause: error,
        });
    }
}
