export type Metrics = Record<string, string>;

export type MetricName<T extends Metrics> = T[keyof T];

export interface BaseMetricsTracker<T extends Metrics> {
    /**
     * Increment a metric by the provided amount (defaults to 1).
     */
    increment(name: MetricName<T>, amount?: number): void | Promise<void>;

    /**
     * Decrement a metric by the provided amount (defaults to 1).
     */
    decrement(name: MetricName<T>, amount?: number): void | Promise<void>;

    /**
     * Retrieve the current value of a metric.
     */
    get(name: MetricName<T>): number | Promise<number>;

    /**
     * Snapshot all metric counters keyed by their slug.
     */
    snapshot(): Record<MetricName<T>, number> | Promise<Record<MetricName<T>, number>>;
}
