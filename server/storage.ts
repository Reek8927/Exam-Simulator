import { db } from "./db";
import {
  exams, questions, testAttempts, testResponses,
  type Exam, type Question, type TestAttempt, type TestResponse,
  type CreateTestResponseRequest,
  type ExamWithQuestions, type TestAttemptWithResponses
} from "@shared/schema";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  getExams(): Promise<Exam[]>;
  getExam(id: number): Promise<ExamWithQuestions | undefined>;
  createAttempt(examId: number): Promise<TestAttempt>;
  getAttempt(id: number): Promise<TestAttemptWithResponses | undefined>;
  submitAttempt(id: number): Promise<TestAttempt>;
  upsertResponse(response: CreateTestResponseRequest): Promise<TestResponse>;
  seedExams(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getExams(): Promise<Exam[]> {
    return await db.select().from(exams);
  }

  async getExam(id: number): Promise<ExamWithQuestions | undefined> {
    const exam = await db.query.exams.findFirst({
      where: eq(exams.id, id),
    });
    
    if (!exam) return undefined;

    const examQuestions = await db.select().from(questions).where(eq(questions.examId, id)).orderBy(questions.order);
    
    return { ...exam, questions: examQuestions };
  }

  async createAttempt(examId: number): Promise<TestAttempt> {
    const [attempt] = await db.insert(testAttempts).values({
      examId,
      status: 'in-progress',
    }).returning();
    return attempt;
  }

  async getAttempt(id: number): Promise<TestAttemptWithResponses | undefined> {
    const attempt = await db.query.testAttempts.findFirst({
      where: eq(testAttempts.id, id),
      with: {
        responses: true,
      }
    });
    return attempt;
  }

  async submitAttempt(id: number): Promise<TestAttempt> {
    // Calculate score logic could go here, but for now just mark completed
    const [updated] = await db.update(testAttempts)
      .set({ status: 'completed', endTime: new Date() })
      .where(eq(testAttempts.id, id))
      .returning();
    return updated;
  }

  async upsertResponse(response: CreateTestResponseRequest): Promise<TestResponse> {
    // Check if response exists
    const existing = await db.query.testResponses.findFirst({
      where: and(
        eq(testResponses.attemptId, response.attemptId),
        eq(testResponses.questionId, response.questionId)
      )
    });

    if (existing) {
      const [updated] = await db.update(testResponses)
        .set(response)
        .where(eq(testResponses.id, existing.id))
        .returning();
      return updated;
    } else {
      const [inserted] = await db.insert(testResponses)
        .values(response)
        .returning();
      return inserted;
    }
  }

  async seedExams(): Promise<void> {
    const existingExams = await this.getExams();
    if (existingExams.length > 0) return;

    // Create a mock exam
    const [exam] = await db.insert(exams).values({
      title: "JEE Main Mock Test 1",
      description: "Full syllabus mock test for JEE Main practice.",
      duration: 180, // 3 hours
      totalMarks: 300,
    }).returning();

    const questionsData = [
      // Physics
      {
        examId: exam.id,
        subject: "Physics",
        section: "Section A",
        type: "MCQ",
        questionText: "A particle is moving in a circle of radius R with constant speed v. The change in velocity in moving from A to B (1/4th of circle) is:",
        options: ["v√2", "v/√2", "v", "2v"],
        correctAnswer: "v√2",
        order: 1,
      },
      {
        examId: exam.id,
        subject: "Physics",
        section: "Section A",
        type: "MCQ",
        questionText: "Which of the following quantities has the same dimensions as that of energy?",
        options: ["Power", "Force", "Momentum", "Work"],
        correctAnswer: "Work",
        order: 2,
      },
      // Chemistry
      {
        examId: exam.id,
        subject: "Chemistry",
        section: "Section A",
        type: "MCQ",
        questionText: "The oxidation state of Cr in K2Cr2O7 is:",
        options: ["+6", "+3", "+7", "+5"],
        correctAnswer: "+6",
        order: 3,
      },
      {
        examId: exam.id,
        subject: "Chemistry",
        section: "Section B",
        type: "NUMERICAL",
        questionText: "How many moles of water are produced when 2 moles of Hydrogen react with 1 mole of Oxygen?",
        options: [],
        correctAnswer: "2",
        order: 4,
      },
      // Mathematics
      {
        examId: exam.id,
        subject: "Mathematics",
        section: "Section A",
        type: "MCQ",
        questionText: "The derivative of sin(x) with respect to x is:",
        options: ["cos(x)", "-cos(x)", "sin(x)", "-sin(x)"],
        correctAnswer: "cos(x)",
        order: 5,
      },
    ];

    await db.insert(questions).values(questionsData);
    console.log("Database seeded with mock exam and questions.");
  }
}

export const storage = new DatabaseStorage();
