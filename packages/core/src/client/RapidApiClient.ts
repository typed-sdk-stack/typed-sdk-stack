import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { RapidApiClientParamsSchema, RequestParamsSchema } from '../schemas';
import type { RapidApiClientParams, RequestParams } from '../types';

export class RapidApiClient {
    protected httpClient: AxiosInstance;

    constructor(params: RapidApiClientParams) {
        const httpClientParams = RapidApiClientParamsSchema.parse(params);
        this.httpClient = this.createHttpClient(httpClientParams);
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

    request<Response = unknown>(requestParams: RequestParams): Promise<AxiosResponse<Response>> {
        const { method, uri, params } = RequestParamsSchema.parse(requestParams);

        const config: AxiosRequestConfig = {
            method,
            url: uri,
            params,
        };

        return this.httpClient.request<Response>(config);
    }
}
