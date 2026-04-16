// validate(schema, source?) — generic factory, returns middleware that:
//   - Parses the given request source (body by default, or query) with the schema
//   - On success: replaces the source with parsed data (strips unknown fields), calls next()
//   - On failure: returns 400 with Zod error details
//
// Usage:
//   router.post('/', validate(createEmployeeSchema), controller.create)
//   router.get('/', validate(scheduleQuerySchema, 'query'), controller.get)

import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

type ValidateSource = 'body' | 'query';

export function validate(
  schema: z.ZodTypeAny,
  source: ValidateSource = 'body',
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const input = source === 'body' ? req.body : req.query;
    const result = schema.safeParse(input);

    if (!result.success) {
      res.status(400).json({
        error: 'Validation error',
        details: z.flattenError(result.error),
      });
      return;
    }

    if (source === 'body') {
      req.body = result.data;
    }
    next();
  };
}
