export const RequestMetricKeys = {
    requestsTotal: 'requests_total',
    requestsSucceed: 'requests_succeed',
    requestsFailed: 'requests_failed',
} as const;

export interface RequestsMetricsTracker {
    recordRequestsTotal(): void | Promise<void>;
    recordRequestsSucceed(): void | Promise<void>;
    recordRequestsFailed(): void | Promise<void>;
}
