import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Seed database on startup
  await storage.seedExams();

  // Exams
  app.get(api.exams.list.path, async (_req, res) => {
    const exams = await storage.getExams();
    res.json(exams);
  });

  app.get(api.exams.get.path, async (req, res) => {
    const exam = await storage.getExam(Number(req.params.id));
    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }
    res.json(exam);
  });

  // Attempts
  app.post(api.attempts.create.path, async (req, res) => {
    try {
      const input = api.attempts.create.input.parse(req.body);
      // For now, ignoring userId/auth, just creating an attempt for the exam
      const attempt = await storage.createAttempt(input.examId);
      res.status(201).json(attempt);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.get(api.attempts.get.path, async (req, res) => {
    const attempt = await storage.getAttempt(Number(req.params.id));
    if (!attempt) {
      return res.status(404).json({ message: "Attempt not found" });
    }
    res.json(attempt);
  });

  app.post(api.attempts.submit.path, async (req, res) => {
    const attempt = await storage.submitAttempt(Number(req.params.id));
    res.json(attempt);
  });

  // Responses
  app.post(api.responses.upsert.path, async (req, res) => {
    try {
      const input = api.responses.upsert.input.parse(req.body);
      const response = await storage.upsertResponse(input);
      res.json(response);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  return httpServer;
}
