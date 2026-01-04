import type { z } from 'zod';
import type { RapidApiClientParamsSchema, RequestParamsSchema } from './schemas';

export type RequestParams = z.infer<typeof RequestParamsSchema>;
export type RapidApiClientParams = z.infer<typeof RapidApiClientParamsSchema>;
