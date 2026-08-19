'use strict';
const { z } = require('zod');

/**
 * Zod validation middleware factory.
 * Usage: router.post('/route', validate(myZodSchema), controller)
 *
 * Validates req.body against the provided Zod schema.
 * Returns 400 with structured errors on failure.
 */
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const issues = result.error.issues || result.error.errors || [];
      const errors = issues.map((e) => ({
        field: Array.isArray(e.path) ? e.path.join('.') : String(e.path || ''),
        message: e.message,
      }));
      return res.status(400).json({
        success: false,
        message: 'Validation failed. Please check your input.',
        errors,
      });
    }
    // Replace body with parsed (coerced/transformed) values
    req.body = result.data;
    return next();
  };
}

// ─── Reusable Schemas ─────────────────────────────────────────────────────────

const registerSchema = z.object({
  name: z
    .string({ required_error: 'Name is required.' })
    .min(2, 'Name must be at least 2 characters.')
    .max(100, 'Name must be under 100 characters.')
    .trim(),
  email: z
    .string({ required_error: 'Email is required.' })
    .email('Please provide a valid email address.')
    .toLowerCase()
    .trim(),
  password: z
    .string({ required_error: 'Password is required.' })
    .min(6, 'Password must be at least 6 characters.')
    .max(128, 'Password is too long.'),
  role: z.enum(['student', 'recruiter']).optional().default('student'),
});

const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required.' })
    .email('Please provide a valid email address.')
    .toLowerCase()
    .trim(),
  password: z.string({ required_error: 'Password is required.' }).min(1, 'Password is required.'),
});

const createApplicationSchema = z.object({
  jobId: z
    .string({ required_error: 'jobId is required.' })
    .regex(/^[a-f\d]{24}$/i, 'Invalid job ID format.'),
});

const updateApplicationSchema = z.object({
  status: z
    .enum(['Applied', 'Shortlisted', 'Interview', 'Offer', 'Rejected'], {
      errorMap: () => ({ message: 'Status must be one of: Applied, Shortlisted, Interview, Offer, Rejected.' }),
    })
    .optional(),
  notes: z.string().max(2000, 'Notes must be under 2000 characters.').optional(),
});

const markNotificationReadSchema = z.object({}).passthrough(); // No body required

module.exports = {
  validate,
  registerSchema,
  loginSchema,
  createApplicationSchema,
  updateApplicationSchema,
  markNotificationReadSchema,
};
