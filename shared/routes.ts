import { z } from 'zod';
import { insertExamSchema, insertQuestionSchema, insertTestAttemptSchema, insertTestResponseSchema, exams, questions, testAttempts, testResponses } from './schema';

// ============================================
// SHARED ERROR SCHEMAS
// ============================================
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

// ============================================
// API CONTRACT
// ============================================
export const api = {
  exams: {
    list: {
      method: 'GET' as const,
      path: '/api/exams',
      responses: {
        200: z.array(z.custom<typeof exams.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/exams/:id',
      responses: {
        200: z.custom<typeof exams.$inferSelect & { questions: typeof questions.$inferSelect[] }>(),
        404: errorSchemas.notFound,
      },
    },
  },
  attempts: {
    create: {
      method: 'POST' as const,
      path: '/api/attempts',
      input: insertTestAttemptSchema,
      responses: {
        201: z.custom<typeof testAttempts.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/attempts/:id',
      responses: {
        200: z.custom<typeof testAttempts.$inferSelect & { responses: typeof testResponses.$inferSelect[] }>(),
        404: errorSchemas.notFound,
      },
    },
    submit: {
      method: 'POST' as const,
      path: '/api/attempts/:id/submit',
      responses: {
        200: z.custom<typeof testAttempts.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  responses: {
    upsert: {
      method: 'POST' as const,
      path: '/api/responses',
      input: insertTestResponseSchema,
      responses: {
        200: z.custom<typeof testResponses.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================
export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
