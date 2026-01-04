export type RapidApiClientErrorOptions = {
    status?: number;
    method?: string;
    url?: string;
    data?: unknown;
    cause?: unknown;
};

export class RapidApiClientError extends Error {
    public readonly status?: number;

    public readonly method?: string;

    public readonly url?: string;

    public readonly data?: unknown;

    constructor(message?: string, options: RapidApiClientErrorOptions = {}) {
        super(message, { cause: options.cause });
        this.name = 'RapidApiClientError';
        this.status = options.status;
        this.method = options.method;
        this.url = options.url;
        this.data = options.data;
    }
}
