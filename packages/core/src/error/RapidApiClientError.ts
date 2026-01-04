export class RapidApiClientError extends Error {
    constructor(message?: string) {
        super(message);
        this.name = 'RapidApiClientError';
    }
}
