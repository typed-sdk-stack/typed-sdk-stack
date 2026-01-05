import type { BaseMetricsTracker } from './BaseMetricsTrackerInterface';
import { CacheMetrics, type CacheMetricsTracker } from './CacheMetricsTrackerInterface';
import { RequestsMetrics, type RequestsMetricsTracker } from './RequestsMetricsTrackerInterface';

export const AllMetrics = {
    ...CacheMetrics,
    ...RequestsMetrics,
} as const;

export interface MetricsTracker
    extends BaseMetricsTracker<typeof AllMetrics>,
        CacheMetricsTracker,
        RequestsMetricsTracker {}
