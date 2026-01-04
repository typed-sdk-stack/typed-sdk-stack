import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { type Logger, pino } from 'pino';
import { RapidApiClientError } from '../error/RapidApiClientError';
import { RapidApiClientParamsSchema, RequestParamsSchema } from '../schemas';
import type { RapidApiClientParams, RequestParams } from '../types';

export class RapidApiClient {
    protected httpClient: AxiosInstance;
    protected logger: Logger;

    constructor(params: RapidApiClientParams) {
        const httpClientParams = RapidApiClientParamsSchema.parse(params);
        this.httpClient = this.createHttpClient(httpClientParams);
        this.logger = this.createPinoLogger(httpClientParams);
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

    async request<Response = unknown>(requestParams: RequestParams): Promise<AxiosResponse<Response>> {
        const { method, uri, params, payload } = RequestParamsSchema.parse(requestParams);

        const config: AxiosRequestConfig = {
            method,
            url: uri,
            params,
            data: payload,
        };

        const logContext = {
            method: config.method,
            url: config.url,
            params: config.params,
        };

        this.logger.debug({ ...logContext }, 'rapidapi.request.start');

        const startedAt = Date.now();

        try {
            const response = await this.httpClient.request<Response>(config);

            this.logger.debug(
                {
                    ...logContext,
                    status: response.status,
                    durationMs: Date.now() - startedAt,
                },
                'rapidapi.request.success'
            );

            return response;
        } catch (error) {
            this.logger.warn(
                {
                    ...logContext,
                    durationMs: Date.now() - startedAt,
                    error: error instanceof Error ? error.message : String(error),
                },
                'rapidapi.request.failure'
            );

            throw this.normalizeError(error, config);
        }
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
