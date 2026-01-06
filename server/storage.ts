import { db } from "./db";
import {
  exams,
  questions,
  testAttempts,
  testResponses,
  students,
  applications,
  admins,
  notices,
  type Exam,
  type TestAttempt,
  type TestResponse,
  type CreateTestResponseRequest,
} from "@shared/schema";

import { eq, and, sql, inArray } from "drizzle-orm";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export class DatabaseStorage {

  /* =========================
     STUDENTS
  ========================= */

  async createStudent(
    name: string,
    email: string,
    mobile: string,
    password: string,
    applicationNo: string
  ) {
    const passwordHash = await bcrypt.hash(password, 10);

    const [student] = await db
      .insert(students)
      .values({
        name,
        email,
        mobile,
        applicationNo,
        studentId: crypto.randomUUID(),
        passwordHash,
      })
      .returning();

    return student;
  }

  async getStudentByApplicationNo(applicationNo: string) {
    return db.query.students.findFirst({
      where: eq(students.applicationNo, applicationNo),
    });
  }

  async getStudentById(id: number) {
    return db.query.students.findFirst({
      where: eq(students.id, id),
    });
  }

  /* =========================
     ADMINS
  ========================= */

  async getAdminByUsername(username: string) {
    return db.query.admins.findFirst({
      where: eq(admins.username, username),
    });
  }

  /* =========================
     APPLICATION
  ========================= */

  async createApplication(studentId: number) {
    const existing = await db.query.applications.findFirst({
      where: eq(applications.studentId, studentId),
    });

    if (existing) return existing;

    const [app] = await db
      .insert(applications)
      .values({
        studentId,
        currentStep: 1,
        submitted: false,
        paymentStatus: "pending",
        applicationStatus: "pending",
        documentsVerified: false,
        admitCardIssued: false,
        examId: null,
        rollNumber: null,
      })
      .returning();

    return app;
  }

  async updateApplication(
    studentId: number,
    data: Partial<typeof applications.$inferInsert>
  ) {
    delete (data as any).admitCardIssued;
    delete (data as any).rollNumber;
    delete (data as any).examId;
    delete (data as any).applicationStatus;
    delete (data as any).documentsVerified;

    const [updated] = await db
      .update(applications)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(applications.studentId, studentId))
      .returning();

    return updated;
  }

  async getApplicationByStudent(studentId: number) {
    return db.query.applications.findFirst({
      where: eq(applications.studentId, studentId),
    });
  }

  /* =========================
     ADMIN CONTROLS
  ========================= */

  async adminVerifyApplication(
    studentId: number,
    status: "approved" | "rejected",
    remark?: string
  ) {
    const [updated] = await db
      .update(applications)
      .set({
        applicationStatus: status,
        documentsVerified: status === "approved",
        verificationRemark: remark ?? null,
        updatedAt: new Date(),
      })
      .where(eq(applications.studentId, studentId))
      .returning();

    return updated;
  }

  async adminAssignExam(studentId: number, examId: number) {
    const [updated] = await db
      .update(applications)
      .set({ examId, updatedAt: new Date() })
      .where(eq(applications.studentId, studentId))
      .returning();

    return updated;
  }

  async adminReleaseAdmitCard(studentId: number, examId: number) {
    const rollNumber = `JEE2026${examId}${Math.floor(
      1000 + Math.random() * 9000
    )}`;

    const [updated] = await db
      .update(applications)
      .set({
        rollNumber,
        admitCardIssued: true,
        updatedAt: new Date(),
      })
      .where(eq(applications.studentId, studentId))
      .returning();

    return updated;
  }

  /* =========================
     EXAMS
  ========================= */

  async getAllExams() {
    return db.select().from(exams).orderBy(exams.createdAt);
  }

  async getExam(examId: number) {
    return db.query.exams.findFirst({
      where: eq(exams.id, examId),
      with: { questions: true },
    });
  }

  async updateExam(
    examId: number,
    data: Partial<typeof exams.$inferInsert>
  ) {
    const [updated] = await db
      .update(exams)
      .set(data)
      .where(eq(exams.id, examId))
      .returning();

    return updated;
  }

  /* =========================
     ATTEMPTS
  ========================= */

 async createAttempt(examId: number, studentId: number): Promise<TestAttempt> {
  // 🔒 REUSE existing in-progress attempt
  const existing = await db.query.testAttempts.findFirst({
    where: and(
      eq(testAttempts.examId, examId),
      eq(testAttempts.studentId, studentId),
      eq(testAttempts.status, "in-progress")
    ),
  });

  if (existing) return existing;

  const [attempt] = await db
    .insert(testAttempts)
    .values({
      examId,
      studentId,
      startTime: new Date(),
      status: "in-progress",
    })
    .returning();

  return attempt;
}



  async getAttempt(id: number, studentId?: number) {
    return db.query.testAttempts.findFirst({
      where: and(
        eq(testAttempts.id, id),
        studentId ? eq(testAttempts.studentId, studentId) : undefined
      ),
      with: { responses: true },
    });
  }

  /* =========================
     🔥 RESULT CALCULATION
  ========================= */

  async calculateResult(attemptId: number) {
    const attempt = await db.query.testAttempts.findFirst({
      where: eq(testAttempts.id, attemptId),
      with: {
        responses: {
          with: { question: true },
        },
      },
    });

    if (!attempt || attempt.resultCalculated) return attempt;

    let correct = 0;
    let wrong = 0;
    let skipped = 0;
    let totalMarks = 0;

    for (const r of attempt.responses) {
      const q = r.question;

      if (!r.selectedAnswer) {
        skipped++;
        continue;
      }

      let isCorrect = false;

      if (q.type === "MCQ") {
        isCorrect = Number(r.selectedAnswer) === q.correctOption;
      } else {
        isCorrect =
          Number(r.selectedAnswer) === q.correctNumericAnswer;
      }

      if (isCorrect) {
        correct++;
        totalMarks += q.marks ?? 4;

      } else {
        wrong++;
        totalMarks -= q.negativeMarks ?? 0;
      }
    }

    const [updated] = await db
      .update(testAttempts)
      .set({
        correctCount: correct,
        wrongCount: wrong,
        skippedCount: skipped,
        totalMarksObtained: totalMarks,
        resultCalculated: true,
      })
      .where(eq(testAttempts.id, attemptId))
      .returning();

    return updated;
  }

  async submitAttempt(id: number): Promise<TestAttempt> {
    const [attempt] = await db
      .update(testAttempts)
      .set({
        status: "completed",
        endTime: sql`NOW()`,
      })
      .where(eq(testAttempts.id, id))
      .returning();

    await this.calculateResult(id);
    return attempt;
  }

  /* =========================
     RESULT PUBLISH (ADMIN)
  ========================= */

  async publishResult(examId: number) {
  // 1️⃣ Get completed attempts
  const attempts = await db.query.testAttempts.findMany({
    where: and(
      eq(testAttempts.examId, examId),
      eq(testAttempts.status, "completed")
    ),
    columns: {
      id: true,
      totalMarksObtained: true,
    },
  });

  if (attempts.length === 0) return;

  // 2️⃣ Calculate percentile
  const total = attempts.length;

  for (const attempt of attempts) {
    const belowOrEqual = attempts.filter(
      a => (a.totalMarksObtained ?? 0) <= (attempt.totalMarksObtained ?? 0)
    ).length;

    const percentile = Number(
      ((belowOrEqual / total) * 100).toFixed(2)
    );

    await db
      .update(testAttempts)
      .set({ percentile })
      .where(eq(testAttempts.id, attempt.id));
  }

  // 3️⃣ Publish result
  await db
    .update(testAttempts)
    .set({ resultPublished: true })
    .where(eq(testAttempts.examId, examId));

  await db
    .update(exams)
    .set({ resultDeclared: true })
    .where(eq(exams.id, examId));
}

  /* =========================
     RESPONSES
  ========================= */

  async upsertResponse(
    response: CreateTestResponseRequest
  ): Promise<TestResponse> {
    const existing = await db.query.testResponses.findFirst({
      where: and(
        eq(testResponses.attemptId, response.attemptId),
        eq(testResponses.questionId, response.questionId)
      ),
    });

    if (existing) {
      const [updated] = await db
        .update(testResponses)
        .set(response)
        .where(eq(testResponses.id, existing.id))
        .returning();
      return updated;
    }

    const [inserted] = await db
      .insert(testResponses)
      .values(response)
      .returning();

    return inserted;
  }

  async getAnswerKey(attemptId: number, studentId: number) {
  const attempt = await db.query.testAttempts.findFirst({
    where: and(
      eq(testAttempts.id, attemptId),
      eq(testAttempts.studentId, studentId)
    ),
    with: {
      responses: {
        with: { question: true },
      },
      exam: true,
    },
  });

  if (!attempt) return null;

  // 🔒 HARD LOCK
  if (!attempt.exam.answerKeyPublished) {
    throw new Error("ANSWER_KEY_NOT_PUBLISHED");
  }

  return attempt.responses.map(r => {
    const q = r.question;

    let status: "correct" | "wrong" | "skipped" = "skipped";

    if (r.selectedAnswer !== null) {
      const isCorrect =
        q.type === "MCQ"
          ? Number(r.selectedAnswer) === q.correctOption
          : Number(r.selectedAnswer) === q.correctNumericAnswer;

      status = isCorrect ? "correct" : "wrong";
    }

    return {
      questionId: q.id,
      subject: q.subject,
      text: q.text,
      imageUrl: q.imageUrl,
      type: q.type,
      options: q.options,
      correctAnswer:
        q.type === "MCQ" ? q.correctOption : q.correctNumericAnswer,
      studentAnswer: r.selectedAnswer,
      marks: q.marks ?? 4,
      negativeMarks: q.negativeMarks ?? 1,
      status,
    };
  });
}

    /* =========================
     NOTICES
  ========================= */

  async getPublicNotices() {
    return db
      .select()
      .from(notices)
      .where(
        and(
          eq(notices.isActive, true),
          eq(notices.type, "public"),
          sql`(visible_from IS NULL OR visible_from <= NOW())`,
          sql`(visible_till IS NULL OR visible_till >= NOW())`
        )
      )
      .orderBy(
        sql`${notices.isPinned} DESC`,
        sql`
          CASE ${notices.priority}
            WHEN 'urgent' THEN 1
            WHEN 'important' THEN 2
            ELSE 3
          END
        `,
        sql`${notices.createdAt} DESC`
      );
  }

  async getStudentNotices() {
    return db
      .select()
      .from(notices)
      .where(
        and(
          eq(notices.isActive, true),
          inArray(notices.type, ["public", "student"]),
          sql`(visible_from IS NULL OR visible_from <= NOW())`,
          sql`(visible_till IS NULL OR visible_till >= NOW())`
        )
      )
      .orderBy(
        sql`${notices.isPinned} DESC`,
        sql`
          CASE ${notices.priority}
            WHEN 'urgent' THEN 1
            WHEN 'important' THEN 2
            ELSE 3
          END
        `,
        sql`${notices.createdAt} DESC`
      );
  }

  async getAllNotices() {
    return db
      .select()
      .from(notices)
      .orderBy(sql`${notices.createdAt} DESC`);
  }

  async createNotice(data: {
  title: string;
  description: string;
  type?: "public" | "student" | "admin";
  priority?: "urgent" | "important" | "normal";
  isPinned?: boolean;
  isActive?: boolean;
  visibleFrom?: Date | null;
  visibleTill?: Date | null;
  createdByAdminId: number;
}) {
  const [notice] = await db
    .insert(notices)
    .values({
      title: data.title,
      description: data.description,
      type: data.type ?? "public",          // 🔥 DEFAULT
      priority: data.priority ?? "normal",  // 🔥 DEFAULT
      isPinned: data.isPinned ?? false,
      isActive: data.isActive ?? true,
      visibleFrom: data.visibleFrom ?? null,
      visibleTill: data.visibleTill ?? null,
      createdByAdminId: data.createdByAdminId,
    })
    .returning();

  return notice;
}


  async updateNotice(
    id: number,
    data: Partial<{
      title: string;
      description: string;
      type: string;
      priority: string;
      isPinned: boolean;
      isActive: boolean;
      visibleFrom: Date | null;
      visibleTill: Date | null;
    }>
  ) {
    const [updated] = await db
      .update(notices)
      .set(data)
      .where(eq(notices.id, id))
      .returning();

    return updated;
  }

  async toggleNoticeStatus(id: number, isActive: boolean) {
    const [updated] = await db
      .update(notices)
      .set({ isActive })
      .where(eq(notices.id, id))
      .returning();

    return updated;
  }

  async deleteNotice(id: number) {
    await db.delete(notices).where(eq(notices.id, id));
  }


  async seedExams() {
    return;
  }
}

export const storage = new DatabaseStorage();
