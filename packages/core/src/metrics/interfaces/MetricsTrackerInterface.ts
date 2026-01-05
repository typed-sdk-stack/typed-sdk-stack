import type { BaseMetricsTracker } from './BaseMetricsTrackerInterface';
import { CacheMetricKeys, type CacheMetricsTracker } from './CacheMetricsTrackerInterface';
import { RequestMetricKeys, type RequestsMetricsTracker } from './RequestsMetricsTrackerInterface';

export const AllMetrics = {
    ...CacheMetricKeys,
    ...RequestMetricKeys,
} as const;

export interface MetricsTracker
    extends BaseMetricsTracker<typeof AllMetrics>,
        CacheMetricsTracker,
        RequestsMetricsTracker {}
