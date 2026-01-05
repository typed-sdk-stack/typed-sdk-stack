import Keyv from '@keyvhq/core';
import axios, { AxiosHeaders, type AxiosInstance, type AxiosRequestConfig } from 'axios';
import objectHash from 'object-hash';
import { type Logger, pino } from 'pino';
import { CacheManager } from '../cache/CacheManager';
import { RapidApiClientError } from '../error/RapidApiClientError';
import { CacheMetrics as CacheMetricKeys } from '../metrics/interfaces/CacheMetricsTrackerInterface';
import type { MetricsTracker } from '../metrics/interfaces/MetricsTrackerInterface';
import { InMemoryMetricsTracker } from '../metrics/stores/InMemoryMetricsTracker';
import { RapidApiClientParamsSchema, RequestParamsSchema } from '../schemas';
import type {
    CacheMetrics,
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
    protected metricsTracker: MetricsTracker;
    protected rapidApiHost: string;
    protected rapidApiKey: string;

    constructor(params: RapidApiClientParams) {
        const httpClientParams = RapidApiClientParamsSchema.parse(params);
        this.httpClient = this.createHttpClient(httpClientParams);
        this.logger = this.createPinoLogger(httpClientParams);
        this.cacheManager = this.createCacheManager(httpClientParams);
        this.metricsTracker = this.createMetricsTracker(httpClientParams);

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
                namespace: `${rapidApiHost}:${objectHash(rapidApiKey)}`,
                ttl: 0,
            });

        return new CacheManager({ keyvInstance: store });
    }

    protected createMetricsTracker({ metricsTracker }: RapidApiClientParams): MetricsTracker {
        return metricsTracker ?? new InMemoryMetricsTracker();
    }

    protected createPinoLogger({ pinoInstance }: RapidApiClientParams): Logger {
        const logger =
            pinoInstance ??
            pino({
                level: 'silent',
                redact: {
                    paths: ['rapidApiKey', '*.rapidApiKey'],
                    censor: '[REDACTED]',
                },
            });

        return logger.child(
            {},
            {
                redact: {
                    paths: ['rapidApiKey', '*.rapidApiKey'],
                    censor: '[REDACTED]',
                },
            }
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
                await this.metricsTracker.recordCacheHit();
                this.logger.debug({ ...requestMetadata, cacheKey }, 'rapidapi.cache.hit');
                const cacheMetrics = await this.getCacheMetrics();
                return { ...cachedResponse, fromCache: true, cacheMetrics };
            }

            await this.metricsTracker.recordCacheMiss();
            this.logger.debug({ ...requestMetadata, cacheKey }, 'rapidapi.cache.miss');
        } else {
            this.logger.debug({ ...requestMetadata }, 'rapidapi.cache.skip');
        }

        const startedAt = Date.now();

        try {
            const response = await this.httpClient.request<Response>(config);
            const durationMs = Date.now() - startedAt;
            const cacheMetrics = await this.getCacheMetrics();
            const dto = this.buildResponseDto<Response>({
                response,
                durationMs,
                request: requestMetadata,
                fromCache: false,
                cacheMetrics,
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
        cacheMetrics,
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
            cacheMetrics,
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

    protected async getCacheMetrics(): Promise<CacheMetrics> {
        const snapshot = await this.metricsTracker.snapshot();
        return {
            hits: snapshot[CacheMetricKeys.cacheHit] ?? 0,
            misses: snapshot[CacheMetricKeys.cacheMiss] ?? 0,
        };
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
