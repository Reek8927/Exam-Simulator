import {
  pgTable,
  text,
  serial,
  integer,
  timestamp,
  jsonb,
  real,
  date,
  boolean,
  
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";


/* ================= STUDENTS ================= */

export const students = pgTable("students", {
  id: serial("id").primaryKey(),

  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  mobile: text("mobile").notNull(),

  applicationNo: text("application_no").notNull().unique(),
  studentId: text("student_id").notNull().unique(),

  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

/* ================= ADMINS ================= */

export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").default("admin"), // admin | superadmin
  createdAt: timestamp("created_at").defaultNow(),
});

/* ================= NOTICES ================= */

export const notices = pgTable("notices", {
  id: serial("id").primaryKey(),

  title: text("title").notNull(),
  description: text("description").notNull(),

  type: text("type").notNull(),
  // public | student | admin

  priority: text("priority").default("normal"),
  // urgent | important | normal

  isPinned: boolean("is_pinned").default(false),
  isActive: boolean("is_active").default(true),

  visibleFrom: timestamp("visible_from").defaultNow(),
  visibleTill: timestamp("visible_till"),

  createdByAdminId: integer("created_by_admin_id").references(
    () => admins.id
  ),

  createdAt: timestamp("created_at").defaultNow(),
});


/* ================= APPLICATION ================= */

export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),

  studentId: integer("student_id")
    .notNull()
    .unique()
    .references(() => students.id),

  /* 🔒 Registration (Locked) */
  fatherName: text("father_name"),
  motherName: text("mother_name"),
  dob: date("dob"),
  gender: text("gender"),
  category: text("category"),

  /* ✏️ Personal */
  nationality: text("nationality"),
  stateOfEligibility: text("state_of_eligibility"),
  aadhaarNumber: text("aadhaar_number"),
  pwd: boolean("pwd").default(false),
  parentsIncome: text("parents_income"),

  permanentAddress: text("permanent_address"),
  presentAddress: text("present_address"),

  /* 📘 Academic */
  class10Board: text("class10_board"),
  class10Year: integer("class10_year"),
  class10Roll: text("class10_roll"),

  class12Status: text("class12_status"),
  class12Board: text("class12_board"),
  class12School: text("class12_school"),
  class12Year: integer("class12_year"),

  /* 📎 Uploads */
  photoUrl: text("photo_url"),
  signatureUrl: text("signature_url"),
  class10CertUrl: text("class10_cert_url"),
  categoryCertUrl: text("category_cert_url"),

  /* 💳 Payment */
  paymentStatus: text("payment_status").default("pending"),
  paymentTxnId: text("payment_txn_id"),
  paymentAmount: integer("payment_amount"),



  /* 🧠 Flow */
  currentStep: integer("current_step").default(1),
  submitted: boolean("submitted").default(false),
  applicationStatus: varchar("application_status", {
  length: 20,
}).default("pending"),
  documentsVerified: boolean("documents_verified").default(false),
  verificationRemark: text("verification_remark"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),

  examId: integer("exam_id").references(() => exams.id),

rollNumber: text("roll_number").unique(),
admitCardIssued: boolean("admit_card_issued").default(false),

});

/* ================= EXAMS (ADMIN CONTROLLED) ================= */

/* ================= EXAMS ================= */

export const exams = pgTable("exams", {
  id: serial("id").primaryKey(),

  title: text("title").notNull(),              // JEE Main April Shift 1
  description: text("description"),

  examDate: date("exam_date").notNull(),       // 2026-04-10
  startTime: text("start_time").notNull(),     // 09:00
  durationMinutes: integer("duration_minutes").notNull(),

  totalMarks: integer("total_marks").notNull(),

  isActive: boolean("is_active").default(false),   // 🔥 Admin controls visibility
  resultDeclared: boolean("result_declared").default(false),

  createdAt: timestamp("created_at").defaultNow(),

  answerKeyPublished: boolean("answer_key_published")
  .default(false)
  .notNull(),

});

/* ================= QUESTIONS ================= */

export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),

  examId: integer("exam_id")
    .notNull()
    .references(() => exams.id),

  subject: text("subject").notNull(),      // Physics / Chemistry / Maths
  type: text("type").notNull(),             // MCQ | NUMERIC

  text: text("text").notNull(),
  imageUrl: text("image_url"),

  options: jsonb("options").$type<string[]>(),
  correctOption: integer("correct_option"),
  correctNumericAnswer: real("correct_numeric_answer"),

  marks: integer("marks").default(4),
  negativeMarks: real("negative_marks").default(1),
});

/* ================= ATTEMPTS ================= */

export const testAttempts = pgTable("exam_attempts", {
  id: serial("id").primaryKey(),

  examId: integer("exam_id").notNull(),
  studentId: integer("student_id").notNull(),

  startTime: timestamp("start_time").defaultNow(),
  endTime: timestamp("end_time"),


  status: text("status").default("in_progress"),
// in_progress | completed

   /* 🔥 RESULT FIELDS */
  correctCount: integer("correct_count").default(0),
  wrongCount: integer("wrong_count").default(0),
  skippedCount: integer("skipped_count").default(0),

  totalMarksObtained: real("total_marks_obtained").default(0),
  percentile: real("percentile"),

  resultCalculated: boolean("result_calculated").default(false),
  resultPublished: boolean("result_published").default(false),
});

/* ================= RESPONSES ================= */

export const testResponses = pgTable("responses", {
  id: serial("id").primaryKey(),

  attemptId: integer("attempt_id")
    .notNull()
    .references(() => testAttempts.id),

  questionId: integer("question_id")
    .notNull()
    .references(() => questions.id),

  selectedAnswer: text("selected_answer"),
  status: text("status").default("not_visited"),
  timeSpent: integer("time_spent").default(0),
});

/* ================= RELATIONS ================= */

/* ADMIN ↔ NOTICES */
export const adminRelations = relations(admins, ({ many }) => ({
  notices: many(notices),
}));


/* STUDENT ↔ APPLICATION */
export const studentRelations = relations(students, ({ one }) => ({
  application: one(applications, {
    fields: [students.id],
    references: [applications.studentId],
  }),
}));

export const applicationRelations = relations(applications, ({ one }) => ({
  student: one(students, {
    fields: [applications.studentId],
    references: [students.id],
  }),
  exam: one(exams, {
    fields: [applications.examId],
    references: [exams.id],
  }),
}));

/* EXAM ↔ QUESTIONS */
export const examRelations = relations(exams, ({ many }) => ({
  questions: many(questions),
  attempts: many(testAttempts),
}));

export const questionRelations = relations(questions, ({ one, many }) => ({
  exam: one(exams, {
    fields: [questions.examId],
    references: [exams.id],
  }),
  responses: many(testResponses),
}));

/* ATTEMPTS ↔ EXAM / STUDENT / RESPONSES */
export const attemptRelations = relations(testAttempts, ({ one, many }) => ({
  exam: one(exams, {
    fields: [testAttempts.examId],
    references: [exams.id],
  }),
  student: one(students, {
    fields: [testAttempts.studentId],
    references: [students.id],
  }),
  responses: many(testResponses),
}));

/* RESPONSES ↔ ATTEMPT / QUESTION */
export const responseRelations = relations(testResponses, ({ one }) => ({
  attempt: one(testAttempts, {
    fields: [testResponses.attemptId],
    references: [testAttempts.id],
  }),
  question: one(questions, {
    fields: [testResponses.questionId],
    references: [questions.id],
  }),
}));


/* ================= ZOD ================= */

export const insertStudentSchema = createInsertSchema(students).omit({
  id: true,
  createdAt: true,
});

export const insertApplicationSchema = createInsertSchema(applications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertExamSchema = createInsertSchema(exams).omit({
  id: true,
  createdAt: true,
});

export const insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
});

export const insertTestAttemptSchema =
  createInsertSchema(testAttempts).omit({
    id: true,
    startTime: true,
    endTime: true,
    
    percentile: true,
  });

  export const insertNoticeSchema = createInsertSchema(notices).omit({
  id: true,
  createdAt: true,
});


/* ================= TYPES ================= */
export type Notice = typeof notices.$inferSelect;

export type Student = typeof students.$inferSelect;
export type Application = typeof applications.$inferSelect;
export type Admin = typeof admins.$inferSelect;
export type Exam = typeof exams.$inferSelect;
export type Question = typeof questions.$inferSelect;
export type TestAttempt = typeof testAttempts.$inferSelect;
export type TestResponse = typeof testResponses.$inferSelect;

export type CreateTestResponseRequest =
  z.infer<typeof insertTestResponseSchema>;
export const insertTestResponseSchema = createInsertSchema(testResponses).omit({
  id: true,
});
// Implementation for varchar column type
function varchar(name: string, options: { length: number }) {
  // drizzle-orm does not export a direct varchar type, but text can be used with validation
  // For schema definition, just return text with a note about length
  // If you want to enforce length at the DB level, you may need to extend drizzle-orm types
  return text(name); // You may add custom validation in Zod schema if needed
}
