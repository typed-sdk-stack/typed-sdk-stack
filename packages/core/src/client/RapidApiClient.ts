import axios, { AxiosHeaders, type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { type Logger, pino } from 'pino';
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

        const startedAt = Date.now();

        try {
            const response = await this.httpClient.request<Response>(config);
            const durationMs = Date.now() - startedAt;
            const dto = this.buildResponseDto<Response>({
                response,
                durationMs,
                request: requestMetadata,
            });

            this.logger.debug(
                {
                    ...requestMetadata,
                    status: response.status,
                    durationMs,
                },
                'rapidapi.request.success'
            );

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
