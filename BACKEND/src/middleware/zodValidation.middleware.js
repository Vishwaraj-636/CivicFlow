/**
 * Middleware factory for validating incoming requests with Zod schemas.
 * Formats errors into the existing API error shape while returning 400 Bad Request.
 * @param {import("zod").ZodSchema} schema
 * @param {"body"|"query"|"params"} [source="body"]
 */
export function validateZod(schema, source = "body") {
   return (req, res, next) => {
      const data = req[source];
      const result = schema.safeParse(data);
      if (!result.success) {
         const issues = result.error?.issues ?? result.error?.errors ?? [];
         const firstError = issues[0]?.message || "Validation failed";
         const formattedErrors = issues.map((err) => ({
            field: err.path.join("."),
            path: err.path.join("."),
            message: err.message,
         }));
         return res.status(400).json({
            message: firstError,
            error: "Validation failed",
            errors: formattedErrors,
         });
      }
      next();
   };
}
