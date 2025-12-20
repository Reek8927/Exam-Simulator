import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// === TABLE DEFINITIONS ===

export const exams = pgTable("exams", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  duration: integer("duration").notNull(), // in minutes
  totalMarks: integer("total_marks").notNull(),
});

export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  examId: integer("exam_id").notNull(),
  subject: text("subject").notNull(), // 'Physics', 'Chemistry', 'Mathematics'
  section: text("section").default('Section A'), // 'Section A' (MCQ), 'Section B' (Numerical)
  type: text("type").notNull(), // 'MCQ', 'NUMERICAL'
  questionText: text("question_text").notNull(),
  options: jsonb("options").$type<string[]>(), // Array of options for MCQ
  correctAnswer: text("correct_answer").notNull(),
  marks: integer("marks").default(4),
  negativeMarks: integer("negative_marks").default(1),
  order: integer("order").notNull(),
});

export const testAttempts = pgTable("test_attempts", {
  id: serial("id").primaryKey(),
  examId: integer("exam_id").notNull(),
  startTime: timestamp("start_time").defaultNow(),
  endTime: timestamp("end_time"),
  score: integer("score"),
  status: text("status").default('in-progress'), // 'in-progress', 'completed'
});

export const testResponses = pgTable("test_responses", {
  id: serial("id").primaryKey(),
  attemptId: integer("attempt_id").notNull(),
  questionId: integer("question_id").notNull(),
  selectedAnswer: text("selected_answer"),
  status: text("status").default('not_visited'), // 'answered', 'not_answered', 'marked_for_review', 'marked_for_review_answered', 'not_visited'
  timeSpent: integer("time_spent").default(0), // in seconds
});

// === RELATIONS ===
export const questionsRelations = relations(questions, ({ one }) => ({
  exam: one(exams, {
    fields: [questions.examId],
    references: [exams.id],
  }),
}));

export const testAttemptsRelations = relations(testAttempts, ({ one, many }) => ({
  exam: one(exams, {
    fields: [testAttempts.examId],
    references: [exams.id],
  }),
  responses: many(testResponses),
}));

export const testResponsesRelations = relations(testResponses, ({ one }) => ({
  attempt: one(testAttempts, {
    fields: [testResponses.attemptId],
    references: [testAttempts.id],
  }),
  question: one(questions, {
    fields: [testResponses.questionId],
    references: [questions.id],
  }),
}));

// === BASE SCHEMAS ===
export const insertExamSchema = createInsertSchema(exams).omit({ id: true });
export const insertQuestionSchema = createInsertSchema(questions).omit({ id: true });
export const insertTestAttemptSchema = createInsertSchema(testAttempts).omit({ id: true, startTime: true, endTime: true, score: true });
export const insertTestResponseSchema = createInsertSchema(testResponses).omit({ id: true });

// === EXPLICIT API CONTRACT TYPES ===
export type Exam = typeof exams.$inferSelect;
export type Question = typeof questions.$inferSelect;
export type TestAttempt = typeof testAttempts.$inferSelect;
export type TestResponse = typeof testResponses.$inferSelect;

export type CreateTestResponseRequest = z.infer<typeof insertTestResponseSchema>;
export type UpdateTestResponseRequest = Partial<CreateTestResponseRequest>;

export interface ExamWithQuestions extends Exam {
  questions: Question[];
}

export interface TestAttemptWithResponses extends TestAttempt {
  responses: TestResponse[];
}

export interface SubmitTestRequest {
  attemptId: number;
}
