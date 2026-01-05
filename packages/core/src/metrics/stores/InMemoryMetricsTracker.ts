import type { MetricName } from '../interfaces/BaseMetricsTrackerInterface';
import { CacheMetricKeys } from '../interfaces/CacheMetricsTrackerInterface';
import type { MetricsTracker } from '../interfaces/MetricsTrackerInterface';
import { RequestMetricKeys } from '../interfaces/RequestsMetricsTrackerInterface';

type Metric = MetricName<typeof CacheMetricKeys> | MetricName<typeof RequestMetricKeys>;
type Snapshot = Record<Metric, number>;

export class InMemoryMetricsTracker implements MetricsTracker {
    protected counters: Map<Metric, number> = new Map();

    increment(name: Metric, amount = 1): void {
        this.counters.set(name, (this.counters.get(name) ?? 0) + amount);
    }

    decrement(name: Metric, amount = 1): void {
        this.counters.set(name, (this.counters.get(name) ?? 0) - amount);
    }

    async get(name: Metric): Promise<number> {
        return this.counters.get(name) ?? 0;
    }

    async snapshot(): Promise<Snapshot> {
        const snapshot: Snapshot = {} as Snapshot;
        for (const key of Object.values(CacheMetricKeys) as Metric[]) {
            snapshot[key] = this.counters.get(key) ?? 0;
        }
        for (const key of Object.values(RequestMetricKeys) as Metric[]) {
            snapshot[key] = this.counters.get(key) ?? 0;
        }
        return snapshot;
    }

    recordCacheHit(): void {
        this.increment(CacheMetricKeys.cacheHit as Metric);
    }

    recordCacheMiss(): void {
        this.increment(CacheMetricKeys.cacheMiss as Metric);
    }

    recordRequestsTotal(): void {
        this.increment(RequestMetricKeys.requestsTotal as Metric);
    }

    recordRequestsSucceed(): void {
        this.increment(RequestMetricKeys.requestsSucceed as Metric);
    }

    recordRequestsFailed(): void {
        this.increment(RequestMetricKeys.requestsFailed as Metric);
    }
}
