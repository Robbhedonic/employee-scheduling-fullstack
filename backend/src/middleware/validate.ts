// validate(schema) — generic factory, returns middleware that:
//   - Parses req.body against the given Zod schema
//   - On success: replaces req.body with parsed data (strips unknown fields), calls next()
//   - On failure: returns 400 with Zod error details
//
// Usage in routes: router.post('/', validate(createEmployeeSchema), controller.create)
