import { mock } from 'bun:test';
import type { Logger } from 'pino';

type LoggerStub = {
    logger: Logger;
    debugSpy: ReturnType<typeof mock>;
    warnSpy: ReturnType<typeof mock>;
};

export const createLoggerStub = (): LoggerStub => {
    const debugSpy = mock(() => {});
    const warnSpy = mock(() => {});

    const logger = {
        level: 'debug',
        debug: () => {
            debugSpy();
        },
        info: mock(() => {}),
        warn: () => {
            warnSpy();
        },
        error: mock(() => {}),
        fatal: mock(() => {}),
        trace: mock(() => {}),
        child: () => logger,
    } as unknown as Logger;

    return { logger, debugSpy, warnSpy };
};
