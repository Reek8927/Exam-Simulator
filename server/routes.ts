import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import {
  students,
  testAttempts,
  
} from "@shared/schema";
import bcrypt from "bcryptjs";
import { sendRegistrationMail } from "./mail";
import crypto from "crypto";
import { exams, insertApplicationSchema, questions } from "@shared/schema";
import { name } from "drizzle-orm";
import { upload } from "./upload";
import { applications } from "@shared/schema";
import { eq,and } from "drizzle-orm";
import { db } from "./db";
import multer from "multer";
import path from "path";
import fs from "fs";
import { generateApplicationPdf } from "./pdf/generatePdf";
import { generatePaymentReceiptPdf } from "./pdf/generatePaymentReceiptPdf";
import { admins } from "@shared/schema";
import { parse } from "csv-parse/sync";
import { generateAdmitCardPdf } from "./pdf/generateAdmitCardPdf";
import { inArray } from "drizzle-orm";
import { generateResultPdf } from "./pdf/resultPdf";








/* ===========================
   SESSION TYPE FIX
=========================== */

declare module "express-session" {
  interface SessionData {
    studentId?: number;
    adminId?: number;
  }
}

function generateRollNumber(examId: number) {
  return `JEE2026${examId}${Math.floor(1000 + Math.random() * 9000)}`;
}





export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  await storage.seedExams();

  type  CsvQuestionRow = {
  examId: string;
  subject: string;
  type: "MCQ" | "NUMERIC";
  text: string;

  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;

  correctOption?: string;
  correctNumericAnswer?: string;

  marks?: string;
  negativeMarks?: string;
};





  /* ===========================
     AUTH – REGISTER
  =========================== */
/* =========================
   PUBLIC – NOTICES
========================= */

app.get("/api/notices/public", async (_req, res) => {
  const notices = await storage.getPublicNotices();
  res.json(notices);
});

app.post("/api/auth/register", async (req, res) => {
  try {
    const {
      name,
      email,
      mobile,
      fatherName,
      motherName,
      dob,
      gender,
      category,
    } = req.body;

    if (!name || !email || !mobile || !dob || !gender || !category) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const applicationNo = `JEE${new Date().getFullYear()}${Math.floor(
      100000 + Math.random() * 900000
    )}`;

    const password = crypto.randomBytes(4).toString("hex");

    const student = await storage.createStudent(
      name,
      email,
      mobile,
      password,
      applicationNo
    );

    // ✅ create blank application
    await storage.createApplication(student.id);

    await storage.updateApplication(student.id, {
      fatherName,
      motherName,
      dob,
      gender,
      category,
      currentStep: 1,
    });

    // ✅ SEND RESPONSE FIRST (IMPORTANT)
    res.json({ success: true });

    // ✅ SEND EMAIL IN BACKGROUND (NON-BLOCKING)
    setImmediate(async () => {
      try {
        await sendRegistrationMail(email, applicationNo, password);
        console.log("📧 Registration email sent");
      } catch (err) {
        console.error("❌ Email failed:", err);
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Registration failed" });
  }
});




  /* ===========================
     AUTH – LOGIN
  =========================== */
  app.post("/api/auth/login", async (req, res) => {
    const { applicationNo, password } = req.body;

    if (!applicationNo || !password) {
      return res.status(400).json({ message: "Missing credentials" });
    }

    const student = await storage.getStudentByApplicationNo(applicationNo);
    if (!student) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, student.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    req.session.studentId = student.id;

    res.json({
      id: student.id,
      name: student.name,
      applicationNo: student.applicationNo,
    });
  });

  /* ===========================
     AUTH – LOGOUT
  =========================== */
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.clearCookie("connect.sid");
      res.json({ success: true });
    });
  });

  /* ===========================
     AUTH – ME
  =========================== */
  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.studentId) {
      return res.status(401).json(null);
    }

    const student = await storage.getStudentById(req.session.studentId);
    if (!student) {
      return res.status(401).json(null);
    }

    res.json({
      id: student.id,
      name: student.name,
      applicationNo: student.applicationNo,
      email: student.email,
    });
  });

  /* =========================
   STUDENT – NOTICES
========================= */

app.get("/api/student/notices", async (req, res) => {
  if (!req.session.studentId) {
    return res.status(401).json({ message: "Login required" });
  }

  const notices = await storage.getStudentNotices();
  res.json(notices);
});

  /* =========================
   ADMIN AUTH
========================= */

/* ===========================
   ADMIN AUTH 🔐

=========================== */

// 🔐 CREATE DEFAULT ADMIN IF NOT EXISTS
const adminUsername = process.env.ADMIN_USERNAME;
const adminPassword = process.env.ADMIN_PASSWORD;

if (adminUsername && adminPassword) {
  const existingAdmin = await db.query.admins.findFirst({
    where: eq(admins.username, adminUsername),
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    await db.insert(admins).values({
      username: adminUsername,
      passwordHash,
      role: "super-admin",
    });

    console.log("✅ Default admin created");
  }
}


// Admin Login
app.post("/api/admin/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Missing credentials" });
  }

  const admin = await storage.getAdminByUsername(username);
  if (!admin) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  req.session.adminId = admin.id;

  res.json({
    success: true,
    username: admin.username,
  });
});

// Admin Logout
app.post("/api/admin/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.json({ success: true });
  });
});

// Admin Me
app.get("/api/admin/me", async (req, res) => {
  if (!req.session.adminId) {
    return res.status(401).json(null);
  }

  res.json({ admin: true });
});

/* =========================
   ADMIN – GET ALL NOTICES
========================= */

app.get("/api/admin/notices", async (req, res) => {
  if (!req.session.adminId) {
    return res.status(401).json({ message: "Admin login required" });
  }

  const notices = await storage.getAllNotices();
  res.json(notices);
});


app.post("/api/admin/notices", async (req, res) => {
  if (!req.session.adminId) {
    return res.status(401).json({ message: "Admin login required" });
  }

  const {
  title,
  description,
  type = "public",   // 🔥 DEFAULT
  priority = "normal",
  isPinned = false,
  isActive = true,
  visibleFrom,
  visibleTill,
} = req.body;


  if (!title || !description ) {
    return res.status(400).json({ message: "Missing fields" });
  }

  const notice = await storage.createNotice({
    title,
    description,
    type,
    priority,
    isPinned,
    isActive,
    visibleFrom: visibleFrom ? new Date(visibleFrom) : null,
    visibleTill: visibleTill ? new Date(visibleTill) : null,
    createdByAdminId: req.session.adminId,
  });

  res.json(notice);
});
app.put("/api/admin/notices/:id", async (req, res) => {
  if (!req.session.adminId) {
    return res.status(401).json({ message: "Admin login required" });
  }

  const noticeId = Number(req.params.id);

  const updated = await storage.updateNotice(noticeId, {
    ...req.body,
    visibleFrom: req.body.visibleFrom
      ? new Date(req.body.visibleFrom)
      : undefined,
    visibleTill: req.body.visibleTill
      ? new Date(req.body.visibleTill)
      : undefined,
  });

  res.json(updated);
});
app.put("/api/admin/notices/:id/toggle", async (req, res) => {
  if (!req.session.adminId) {
    return res.status(401).json({ message: "Admin login required" });
  }

  const noticeId = Number(req.params.id);
  const { isActive } = req.body;

  const updated = await storage.toggleNoticeStatus(noticeId, isActive);
  res.json(updated);
});
app.delete("/api/admin/notices/:id", async (req, res) => {
  if (!req.session.adminId) {
    return res.status(401).json({ message: "Admin login required" });
  }

  await storage.deleteNotice(Number(req.params.id));
  res.json({ success: true });
});



  /* =====================================================
     APPLICATION FORM (AUTOSAVE – JEE STYLE)
  ===================================================== */

  // Create application (once)
  app.post("/api/application/create", async (req, res) => {
    if (!req.session.studentId) {
      return res.status(401).json({ message: "Login required" });
    }

    const application = await storage.createApplication(req.session.studentId);
    res.json(application);
  });

  app.post(
  "/api/upload/:type",
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.session.studentId) {
        return res.status(401).json({ message: "Login required" });
      }

      const { type } = req.params;

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const fieldMap: Record<string, string> = {
        photo: "photoUrl",
        signature: "signatureUrl",
        class10: "class10CertUrl",
        category: "categoryCertUrl",
      };

      if (!fieldMap[type]) {
        return res.status(400).json({ message: "Invalid upload type" });
      }

      const fileUrl = `/uploads/${req.file.filename}`;

      const updated = await storage.updateApplication(
        req.session.studentId,
        {
          [fieldMap[type]]: fileUrl,
        }
      );

      res.json(updated);
    } catch (err) {
      console.error("UPLOAD ERROR:", err);
      res.status(500).json({ message: "Upload failed" });
    }
  }
);


  // Autosave application (partial updates)
app.put("/api/application/save", async (req, res) => {
  try {
    if (!req.session.studentId) {
      return res.status(401).json({ message: "Login required" });
    }

    // 1️⃣ Parse partial data safely
    const parsed = insertApplicationSchema.partial().parse(req.body);

    // 2️⃣ Get existing application
    const existing = await storage.getApplicationByStudent(
      req.session.studentId
    );

    if (!existing) {
      return res.status(404).json({ message: "Application not found" });
    }

    /**
     * =====================================================
     * 🔒 REGISTRATION FIELDS RULE (CRITICAL)
     * =====================================================
     * These fields are allowed ONLY ON FIRST SAVE.
     * Once fatherName exists, they are LOCKED forever.
     */
    if (existing.fatherName) {
      delete parsed.fatherName;
      delete parsed.motherName;
      delete parsed.dob;
      delete parsed.gender;
      delete parsed.category;
    }

    /**
     * ❌ Student must NEVER control these fields
     */
    delete parsed.studentId;
    delete parsed.submitted;
    delete parsed.applicationStatus;
    delete parsed.documentsVerified;
    delete parsed.verificationRemark;
    delete parsed.rollNumber;
    delete parsed.admitCardIssued;
    delete parsed.examId;

    /**
     * =====================================================
     * 🔒 STEP FLOW VALIDATION (ANTI SKIP)
     * =====================================================
     */
    if (parsed.currentStep && parsed.currentStep > 1) {
      const personalComplete =
        existing.nationality &&
        existing.stateOfEligibility &&
        existing.aadhaarNumber &&
        existing.parentsIncome &&
        existing.permanentAddress;

      if (!personalComplete) {
        return res.status(400).json({
          message: "Complete Personal Details before proceeding",
        });
      }
    }

    /**
     * =====================================================
     * 📄 SUBMISSION VALIDATION
     * =====================================================
     */
    if (parsed.submitted === true) {
      // Mandatory documents
      if (
        !existing.photoUrl ||
        !existing.signatureUrl ||
        !existing.class10CertUrl
      ) {
        return res.status(400).json({
          message: "Upload all mandatory documents",
        });
      }

      // 🔥 Category certificate rule
      if (
        existing.category &&
        existing.category !== "GENERAL" &&
        !existing.categoryCertUrl
      ) {
        return res.status(400).json({
          message: "Category certificate is required",
        });
      }
    }

    // 3️⃣ Update application
    const updated = await storage.updateApplication(
      req.session.studentId,
      parsed
    );

    res.json(updated);
  } catch (err) {
    console.error("APPLICATION SAVE ERROR:", err);

    if (err instanceof z.ZodError) {
      return res.status(400).json({
        message: err.errors[0].message,
      });
    }

    res.status(500).json({
      message: "Internal server error",
    });
  }
});



  // Fetch application
app.get("/api/application", async (req, res) => {
  if (!req.session.studentId) {
    return res.status(401).json({ message: "Login required" });
  }

  const student = await storage.getStudentById(req.session.studentId);
  const application = await storage.getApplicationByStudent(req.session.studentId);

  if (!student || !application) {
    return res.json(null);
  }

  // ✅ FLATTENED RESPONSE (IMPORTANT)
  res.json({
    // student fields
    name: student.name,
    email: student.email,
    mobile: student.mobile,
    applicationNo: student.applicationNo,

    // application fields
    ...application,
  });
});





//import { generateApplicationPdf } from "./pdf/generatePdf";

app.get("/api/application/pdf", async (req, res) => {
  if (!req.session.studentId) {
    return res.status(401).end();
  }

  const student = await storage.getStudentById(req.session.studentId);
  const application = await storage.getApplicationByStudent(req.session.studentId);

  if (!student || !application) {
    return res.status(404).end();
  }

  // 🔥 BASE URL (NO localhost hardcode)
  const baseUrl = `${req.protocol}://${req.get("host")}`;

  const pdf = await generateApplicationPdf(
  {
    applicationNo: student.applicationNo,
    name: student.name,

    fatherName: application.fatherName ?? "—",
    motherName: application.motherName ?? "—",
    dob: application.dob ?? "—",
    gender: application.gender ?? "—",
    category: application.category ?? "—",
    nationality: application.nationality ?? "—",
    stateOfEligibility: application.stateOfEligibility ?? "—",
    aadhaarNumber: application.aadhaarNumber ?? "—",

    parentsIncome: application.parentsIncome ?? "—",

    permanentAddress: application.permanentAddress ?? "—",
    presentAddress: application.presentAddress ?? "—",

    class10Board: application.class10Board ?? "—",
    class10Year: application.class10Year
      ? String(application.class10Year)
      : "—",
    class10Roll: application.class10Roll ?? "—",

    class12Status: application.class12Status ?? "—",
    class12Board: application.class12Board ?? "—",
    class12School: application.class12School ?? "—",
    class12Year: application.class12Year
      ? String(application.class12Year)
      : "—",

    photoUrl: application.photoUrl
      ? `${baseUrl}${application.photoUrl}`
      : "",

    signatureUrl: application.signatureUrl
      ? `${baseUrl}${application.signatureUrl}`
      : "",

    today: new Date().toLocaleDateString("en-GB"),
  },
  baseUrl
);


  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    "inline; filename=JEE_Confirmation_Page.pdf"
  );

  res.end(pdf);
});

/* ===========================
   STUDENT – ADMIT CARD PDF
=========================== */








app.post("/api/payment/demo", async (req, res) => {
  if (!req.session.studentId) return res.sendStatus(401);

  const app = await storage.getApplicationByStudent(req.session.studentId);
  if (!app) return res.sendStatus(404);

  await db.update(applications).set({
    paymentStatus: "success",
    paymentTxnId: `TXN-${Date.now()}`,
    paymentAmount: 1000,
    submitted: true,
  }).where(eq(applications.studentId, req.session.studentId));

  res.json({ success: true });
});


app.get("/api/payment/receipt", async (req, res) => {
  if (!req.session.studentId) return res.status(401).end();

  const student = await storage.getStudentById(req.session.studentId);
  const application = await storage.getApplicationByStudent(req.session.studentId);

  if (!student || !application) return res.status(404).end();

  const pdf = await generatePaymentReceiptPdf({
    applicationNo: student.applicationNo,
    name: student.name,
    txnId: application.paymentTxnId!,
    amount: String(application.paymentAmount),
    date: new Date().toLocaleDateString("en-GB"),
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "inline; filename=Payment_Receipt.pdf");
  res.end(pdf);
});

app.get("/api/exams/:id", async (req, res) => {
  const examId = Number(req.params.id);

  if (!examId) {
    return res.status(400).json({ message: "Invalid exam id" });
  }

  const exam = await storage.getExam(examId);

  if (!exam) {
    return res.status(404).json({ message: "Exam not found" });
  }

  res.json(exam);
});


/* ===========================
   ADMIN – MANAGE STUDENTS
=========================== */


app.get("/api/admin/students", async (req, res) => {
  if (!req.session.adminId) return res.sendStatus(401);

  const rows = await db
    .select({
      studentId: students.id,
      name: students.name,
      applicationNo: students.applicationNo,
      category: applications.category,
      applicationStatus: applications.applicationStatus,
      documentsVerified: applications.documentsVerified,
    })
    .from(students)
    .leftJoin(applications, eq(applications.studentId, students.id))
    .orderBy(students.id);

  res.json(rows);
});


/* ===========================
   ADMIN – VIEW STUDENT APPLICATION
=========================== */

app.get("/api/admin/students/:id", async (req, res) => {
  if (!req.session.adminId) return res.sendStatus(401);

  const studentId = Number(req.params.id);

  const data = await db.query.students.findFirst({
    where: eq(students.id, studentId),
    with: {
      application: true,
    },
  });

  if (!data) return res.sendStatus(404);

  res.json({
    ...data,
    ...data.application,
  });
});

app.post("/api/admin/students/:id/verify", async (req, res) => {
  if (!req.session.adminId) return res.sendStatus(401);

  const studentId = Number(req.params.id);
  const { status, remark } = req.body;

  await db
    .update(applications)
    .set({
      applicationStatus: status,
      documentsVerified: status === "approved",
      verificationRemark: remark,
    })
    .where(eq(applications.studentId, studentId));

  res.json({ success: true });
});








  /* ===========================
   ADMIN – EXAMS
=========================== */

// Get all exams
app.get("/api/admin/exams", async (req, res) => {
  if (!req.session.adminId) {
    return res.status(401).json({ message: "Admin login required" });
  }

  const exams = await storage.getAllExams();
  res.json(exams);
});

// Create exam
app.post("/api/admin/exams", async (req, res) => {
  const {
    title,
    description,
    examDate,
    startTime,
    durationMinutes,
    totalMarks,
  } = req.body;

  if (
    !title ||
    !examDate ||
    !startTime ||
    !durationMinutes ||
    !totalMarks
  ) {
    return res.status(400).json({ message: "Missing fields" });
  }

  const exam = await db.insert(exams).values({
    title,
    description,
    examDate,
    startTime,
    durationMinutes,
    totalMarks,
  }).returning();

  res.json(exam[0]);
});

// Activate / Deactivate exam
app.put("/api/admin/exams/:id/status", async (req, res) => {
  if (!req.session.adminId) {
    return res.status(401).json({ message: "Admin login required" });
  }

  const examId = Number(req.params.id);
  const { isActive } = req.body;

  const updated = await storage.updateExam(examId, { isActive });
  res.json(updated);
});

// ================= ADMIN – UPDATE EXAM =================
app.put("/api/admin/exams/:id", async (req, res) => {
  
  if (!req.session.adminId) {
    return res.status(401).json({ message: "Admin login required" });
  }

  const examId = Number(req.params.id);
  const {
    title,
    description,
    examDate,
    startTime,
    durationMinutes,
    totalMarks,
    isActive,
    resultDeclared,
  } = req.body;

  if (!title || !examDate || !startTime || !durationMinutes || !totalMarks) {
    return res.status(400).json({ message: "Missing fields" });
  }

  const updated = await db
    .update(exams)
    .set({
      title,
      description,
      examDate,
      startTime,
      durationMinutes,
      totalMarks,
      isActive,
      resultDeclared,
    })
    .where(eq(exams.id, examId))
    .returning();

  res.json(updated[0]);
});
app.get("/api/admin/exams/:id", async (req, res) => {
  const exam = await storage.getExam(Number(req.params.id));
  if (!exam) return res.status(404).json({ message: "Exam not found" });
  res.json(exam);
});

// Toggle exam active / inactive
app.put("/api/admin/exams/:id/toggle", async (req, res) => {
  const examId = Number(req.params.id);

  const exam = await db.query.exams.findFirst({
    where: eq(exams.id, examId),
  });

  if (!exam) {
    return res.status(404).json({ message: "Exam not found" });
  }

  const [updated] = await db
    .update(exams)
    .set({ isActive: !exam.isActive })
    .where(eq(exams.id, examId))
    .returning();

  res.json(updated);
});

/* ===========================
   ADMIN – ASSIGN STUDENT TO EXAM
=========================== */

app.get("/api/admin/assign-exam/students", async (req, res) => {
  if (!req.session.adminId) return res.sendStatus(401);

  const rows = await db
    .select({
      studentId: students.id,
      name: students.name,
      applicationNo: students.applicationNo,
      examId: applications.examId,
    })
    .from(students)
    .leftJoin(applications, eq(applications.studentId, students.id))
    .where(eq(applications.applicationStatus, "approved"));

  res.json(rows);
});

app.get("/api/admin/assign-exam/exams", async (req, res) => {
  if (!req.session.adminId) return res.sendStatus(401);

  const examsList = await db
    .select()
    .from(exams)
    .where(eq(exams.isActive, true));

  res.json(examsList);
});
app.post("/api/admin/assign-exam", async (req, res) => {
  if (!req.session.adminId) return res.sendStatus(401);

  const { studentId, examId } = req.body;

  if (!studentId || !examId) {
    return res.status(400).json({ message: "Missing data" });
  }

  await db
    .update(applications)
    .set({ examId })
    .where(eq(applications.studentId, studentId));

  res.json({ success: true });
});

app.post("/api/admin/assign-exam/bulk", async (req, res) => {
  if (!req.session.adminId) return res.sendStatus(401);

  const { studentIds, examId } = req.body;

  if (!Array.isArray(studentIds) || !examId) {
    return res.status(400).json({ message: "Invalid payload" });
  }

  await db
    .update(applications)
    .set({ examId })
    .where(inArray(applications.studentId, studentIds));

  res.json({
    success: true,
    assigned: studentIds.length,
  });
});




app.get("/api/admin/admit-cards", async (req, res) => {
  if (!req.session.adminId) return res.sendStatus(401);

  const rows = await db
    .select({
      studentId: students.id,
      name: students.name,
      applicationNo: students.applicationNo,
      rollNumber: applications.rollNumber,
      admitCardIssued: applications.admitCardIssued,
    })
    .from(students)
    .leftJoin(applications, eq(applications.studentId, students.id));

  res.json(rows);
});

app.get("/api/admin/admit-cards/:studentId", async (req, res) => {
  if (!req.session.adminId) return res.sendStatus(401);

  const studentId = Number(req.params.studentId);

  const student = await storage.getStudentById(studentId);
  const application = await storage.getApplicationByStudent(studentId);

  if (!student || !application || !application.examId) {
    return res.status(404).json({ message: "Data not found" });
  }

  const exam = await storage.getExam(application.examId);

  const baseUrl = `${req.protocol}://${req.get("host")}`;

  const photoPath = application.photoUrl
  ? path.join(process.cwd(), application.photoUrl)
  : "";

const signaturePath = application.signatureUrl
  ? path.join(process.cwd(), application.signatureUrl)
  : "";


 const pdf = await generateAdmitCardPdf({
  name: student.name,
  applicationNo: student.applicationNo,
  rollNumber: application.rollNumber!,

  examTitle: exam!.title,
  examDate: String(exam!.examDate),
  startTime: exam!.startTime,
  durationMinutes: exam!.durationMinutes,

  gateClosesAt: "08:30 AM",
  centerName: "Kolkata – Center 01",

  photoUrl: photoPath,
  signatureUrl: signaturePath,
});

  

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
  "Content-Disposition",
  "inline; filename=Admit_Card.pdf"
);
  res.end(pdf);
});




app.post("/api/admin/release-admit-cards", async (req, res) => {
  try {
    if (!req.session.adminId) {
      return res.status(401).json({ message: "Admin login required" });
    }

    // 1️⃣ Find active exam
    const activeExam = await db.query.exams.findFirst({
      where: eq(exams.isActive, true),
    });

    if (!activeExam) {
      return res.status(400).json({
        message: "No active exam found. Please activate an exam first.",
      });
    }

    // 2️⃣ Get submitted applications
 const approvedApplications = await db
  .select()
  .from(applications)
  .where(eq(applications.applicationStatus, "approved"));

let releasedFor = 0;

for (const app of approvedApplications) {
  if (!app.admitCardIssued) {
    await db.update(applications).set({
      examId: activeExam.id,
      rollNumber: generateRollNumber(activeExam.id),
      admitCardIssued: true,
    }).where(eq(applications.id, app.id));

    releasedFor++;
  }
}

    res.json({
      success: true,
      releasedFor,
      exam: activeExam.title,
    });
  } catch (error) {
    console.error("❌ RELEASE ADMIT CARD ERROR:", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
});





/* ===========================
   QUESTIONS (ADMIN)
=========================== */





// ➕ Create Question
app.post("/api/admin/questions", async (req, res) => {
  if (!req.session.adminId) {
    return res.status(401).json({ message: "Admin login required" });
  }

  const {
    examId,
    subject,
    type,
    text,
    imageUrl,
    options,
    correctOption,
    correctNumericAnswer,
    marks,
    negativeMarks,
  } = req.body;

  if (!examId || !subject || !type || !text) {
    return res.status(400).json({ message: "Missing fields" });
  }

  if (type === "MCQ") {
    if (!Array.isArray(options) || options.length !== 4 || correctOption === undefined) {
      return res.status(400).json({ message: "MCQ must have 4 options and correctOption" });
    }
  }

  if (type === "NUMERIC" && correctNumericAnswer === undefined) {
    return res.status(400).json({ message: "Numeric requires correctNumericAnswer" });
  }

  const [question] = await db.insert(questions).values({
    examId,
    subject,
    type,
    text,
    imageUrl: imageUrl || null,
    options: type === "MCQ" ? options : null,
    correctOption: type === "MCQ" ? correctOption : null,
    correctNumericAnswer: type === "NUMERIC" ? correctNumericAnswer : null,
    marks: marks ?? 4,
    negativeMarks: negativeMarks ?? 1,
  }).returning();

  res.json(question);
});
// 🔍 Get single question (for edit page)
app.get("/api/admin/questions/:id", async (req, res) => {
  if (!req.session.adminId) {
    return res.status(401).json({ message: "Admin login required" });
  }

  const questionId = Number(req.params.id);

  const question = await db.query.questions.findFirst({
    where: eq(questions.id, questionId),
  });

  if (!question) {
    return res.status(404).json({ message: "Question not found" });
  }

  res.json(question);
});

// ✏️ Update Question
app.put("/api/admin/questions/:id", async (req, res) => {
  if (!req.session.adminId) {
    return res.status(401).json({ message: "Admin login required" });
  }

  const questionId = Number(req.params.id);

  const {
    subject,
    type,
    text,
    options,
    correctOption,
    correctNumericAnswer,
    marks,
    negativeMarks,
    imageUrl,
  } = req.body;

  if (!subject || !type || !text) {
    return res.status(400).json({ message: "Missing fields" });
  }

  // 🔴 MCQ validation
  if (type === "MCQ") {
    if (
      !Array.isArray(options) ||
      options.length !== 4 ||
      correctOption === undefined
    ) {
      return res.status(400).json({
        message: "MCQ requires 4 options and correctOption",
      });
    }
  }

  // 🔴 Numeric validation
  if (type === "NUMERIC" && correctNumericAnswer === undefined) {
    return res.status(400).json({
      message: "Numeric question requires correctNumericAnswer",
    });
  }

  const [updated] = await db
    .update(questions)
    .set({
      subject,
      type,
      text,
      imageUrl: imageUrl ?? null,
      options: type === "MCQ" ? options : null,
      correctOption: type === "MCQ" ? correctOption : null,
      correctNumericAnswer:
        type === "NUMERIC" ? correctNumericAnswer : null,
      marks: marks ?? 4,
      negativeMarks: negativeMarks ?? 1,
    })
    .where(eq(questions.id, questionId))
    .returning();

  res.json(updated);
});



/* ===========================
   ADMIN – QUESTION IMAGE UPLOAD
=========================== */

const questionImageUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      const dir = path.join(process.cwd(), "uploads/questions");
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (_req, file, cb) => {
      const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, unique + path.extname(file.originalname));
    },
  }),
});

app.post(
  "/api/admin/questions/image",
  questionImageUpload.single("image"),
  (req, res) => {
    if (!req.session.adminId) {
      return res.status(401).json({ message: "Admin login required" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    res.json({
      imageUrl: `/uploads/questions/${req.file.filename}`,
    });
  }
);

app.post(
  "/api/admin/questions/bulk",
  upload.single("file"),
  async (req, res) => {
    if (!req.session.adminId) {
      return res.status(401).json({ message: "Admin login required" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "CSV file required" });
    }

    const records = parse(req.file.buffer.toString(), {
      columns: true,
      skip_empty_lines: true,
    }) as CsvQuestionRow[];

    for (const r of records) {
      const options =
        r.type === "MCQ"
          ? [r.optionA, r.optionB, r.optionC, r.optionD].filter(
              (o): o is string => Boolean(o)
            )
          : null;

      await db.insert(questions).values({
        examId: Number(r.examId),
        subject: r.subject,
        type: r.type,
        text: r.text,
        options,
        correctOption:
          r.type === "MCQ" ? Number(r.correctOption) : null,
        correctNumericAnswer:
          r.type === "NUMERIC"
            ? Number(r.correctNumericAnswer)
            : null,
        marks: r.marks ? Number(r.marks) : 4,
        negativeMarks: r.negativeMarks
          ? Number(r.negativeMarks)
          : 1,
      });
    }

    res.json({ success: true, count: records.length });
  }
);



// 🖼️ Update question image only
app.put("/api/admin/questions/:id/image", async (req, res) => {
  if (!req.session.adminId) {
    return res.status(401).json({ message: "Admin login required" });
  }

  const questionId = Number(req.params.id);
  const { imageUrl } = req.body;

  if (!imageUrl) {
    return res.status(400).json({ message: "imageUrl required" });
  }

  const [updated] = await db
    .update(questions)
    .set({ imageUrl })
    .where(eq(questions.id, questionId))
    .returning();

  res.json(updated);
});





// 📄 Get questions by exam
app.get("/api/admin/exams/:examId/questions", async (req, res) => {
  if (!req.session.adminId) {
    return res.status(401).json({ message: "Admin login required" });
  }

  const examId = Number(req.params.examId);

  const data = await db
    .select()
    .from(questions)
    .where(eq(questions.examId, examId));

  res.json(data);
});

// ❌ Delete question
app.delete("/api/admin/questions/:id", async (req, res) => {
  if (!req.session.adminId) {
    return res.status(401).json({ message: "Admin login required" });
  }

  await db
    .delete(questions)
    .where(eq(questions.id, Number(req.params.id)));

  res.json({ success: true });
});

app.get("/api/admit-card", async (req, res) => {
  if (!req.session.studentId) {
    return res.status(401).json({ message: "Login required" });
  }

  const student = await storage.getStudentById(req.session.studentId);
  const application = await storage.getApplicationByStudent(req.session.studentId);

  if (!student || !application) {
    return res.status(404).json({ message: "Data not found" });
  }

  if (!application.admitCardIssued) {
    return res.status(403).json({ message: "Admit card not released" });
  }

  if (!application.examId || !application.rollNumber) {
    return res.status(500).json({
      message: "Admit card data incomplete. Contact admin.",
    });
  }

  const exam = await storage.getExam(application.examId);
  if (!exam) {
    return res.status(404).json({ message: "Exam not found" });
  }

  const photoPath = application.photoUrl
    ? path.join(process.cwd(), application.photoUrl)
    : "";

  const signPath = application.signatureUrl
    ? path.join(process.cwd(), application.signatureUrl)
    : "";

  const pdf = await generateAdmitCardPdf({
    name: student.name,
    applicationNo: student.applicationNo,
    rollNumber: application.rollNumber,
    examTitle: exam.title,
    examDate: String(exam.examDate),
    startTime: exam.startTime,
    durationMinutes: exam.durationMinutes,
    gateClosesAt: "08:30 AM",
    centerName: "Kolkata – Center 01",
    photoUrl: photoPath,
    signatureUrl: signPath,
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "inline; filename=Admit_Card.pdf");
  res.end(pdf);
});

app.get("/api/student/exam-status", async (req, res) => {
  if (!req.session.studentId) {
    return res.status(401).json({ message: "Login required" });
  }
  res.setHeader("Cache-Control", "no-store");

  const application = await storage.getApplicationByStudent(
    req.session.studentId
  );

  if (!application || !application.examId) {
    return res.json({ hasExam: false });
  }

  const exam = await storage.getExam(application.examId);
  if (!exam) {
    return res.json({ hasExam: false });
  }

  const existingAttempt = await db.query.testAttempts.findFirst({
  where: and(
    eq(testAttempts.studentId, req.session.studentId),
    eq(testAttempts.examId, exam.id),
    eq(testAttempts.status, "in-progress")
  ),
});

if (existingAttempt) {
  return res.json({
    hasExam: true,
    examId: exam.id,
    attemptId: existingAttempt.id, // 🔥 ADD THIS
    isLive: true,
    canEnter: true,
  });
}


  // 🔒 Check if already completed
const completedAttempt = await db.query.testAttempts.findFirst({
  where: and(
    eq(testAttempts.studentId, req.session.studentId),
    eq(testAttempts.examId, exam.id),
    eq(testAttempts.status, "completed")
  ),
});

if (completedAttempt) {
  return res.json({
    hasExam: true,
    isCompleted: true,
    attemptId: completedAttempt.id, // 🔥 REQUIRED
    resultDeclared: exam.resultDeclared, // 🔥 ADD THIS
     answerKeyPublished: exam.answerKeyPublished === true,
  });
}


  // ✅ Correct exam start time parsing
  const examStart = new Date(`${exam.examDate}T${exam.startTime}`);
  const now = new Date();

  const diffSeconds = Math.floor(
    (examStart.getTime() - now.getTime()) / 1000
  );

  const secondsToStart = Math.max(0, diffSeconds);

  const canEnter = secondsToStart <= 15 * 60; // ≤ 15 min
  const isLive = secondsToStart <= 0;

  res.json({
    hasExam: true,
    examId: exam.id,        // 🔥 IMPORTANT
    canEnter,
    isLive,
    secondsToStart,
    resultDeclared: exam.resultDeclared, // 🔥 ADD THIS         // frontend countdown (seconds)
     answerKeyPublished: exam.answerKeyPublished === true,
  });
});









  /* ===========================
     ATTEMPTS
  =========================== */

  app.post("/api/attempts", async (req, res) => {
  if (!req.session.studentId) {
    return res.status(401).json({ message: "Login required" });
  }

  const { examId } = req.body;
  if (!examId) {
    return res.status(400).json({ message: "examId required" });
  }

  const attempt = await storage.createAttempt(
    Number(examId),
    req.session.studentId
  );

  res.json(attempt);
});
app.post(api.attempts.create.path, async (req, res) => {
  if (!req.session.studentId) {
    return res.status(401).json({ message: "Login required" });
  }

  const { examId } = req.body;
  if (!examId) {
    return res.status(400).json({ message: "examId required" });
  }

  // 🔒 VERIFY EXAM EXISTS & ACTIVE
  const exam = await storage.getExam(Number(examId));
  if (!exam || !exam.isActive) {
    return res.status(403).json({ message: "Exam not available" });
  }

  // 🔒 VERIFY STUDENT ASSIGNED TO THIS EXAM
  const application = await storage.getApplicationByStudent(
    req.session.studentId
  );

  if (!application || application.examId !== exam.id) {
    return res.status(403).json({ message: "Exam not assigned" });
  }

  // 🔒 REUSE EXISTING ATTEMPT (YOU ALREADY DID THIS PART CORRECTLY)
  const attempt = await storage.createAttempt(
    exam.id,
    req.session.studentId
  );

  res.status(201).json(attempt);
});


  app.get("/api/student/active-attempt", async (req, res) => {
  if (!req.session.studentId) {
    return res.status(401).json({ message: "Login required" });
  }

  const attempt = await db.query.testAttempts.findFirst({
    where: and(
      eq(testAttempts.studentId, req.session.studentId),
      eq(testAttempts.status, "in-progress")
    ),
    orderBy: (t, { desc }) => [desc(t.id)],
  });

  if (!attempt) {
    return res.json(null);
  }

  res.json(attempt);
});


  app.get(api.attempts.get.path, async (req, res) => {
  if (!req.session.studentId) {
    return res.status(401).json({ message: "Login required" });
  }

  const attempt = await storage.getAttempt(
    Number(req.params.id),
    req.session.studentId
  );

  if (!attempt) {
    return res.status(403).json({ message: "Access denied" });
  }

  if (attempt.status === "completed") {
  return res.json(attempt); // allow frontend redirect
}

  

  res.json(attempt);
});


  app.post(api.attempts.submit.path, async (req, res) => {
    const attempt = await storage.submitAttempt(Number(req.params.id));
    res.json(attempt);
  });

  /* =========================
   STUDENT RESULT
========================= */

app.get("/api/student/result/:attemptId", async (req, res) => {
  if (!req.session.studentId) {
    return res.status(401).json({ message: "Login required" });
  }

  const attemptId = Number(req.params.attemptId);

  const attempt = await storage.getAttempt(
    attemptId,
    req.session.studentId
  );

  if (!attempt) {
    return res.status(404).json({ message: "Result not found" });
  }

  // 🔒 Result must be published
  if (!attempt.resultPublished) {
    return res
      .status(403)
      .json({ message: "Result not declared yet" });
  }

  res.json({
    attemptId: attempt.id,
    examId: attempt.examId,
    score: attempt.totalMarksObtained,
    correct: attempt.correctCount,
    wrong: attempt.wrongCount,
    skipped: attempt.skippedCount,
    status: attempt.status,
  });
});
app.post("/api/admin/exams/:examId/publish-answer-key", async (req, res) => {
  if (!req.session.adminId) return res.sendStatus(401);

  await db
    .update(exams)
    .set({ answerKeyPublished: true })
    .where(eq(exams.id, Number(req.params.examId)));

  res.json({ success: true });
});

app.post("/api/admin/exams/:examId/unpublish-answer-key", async (req, res) => {
  if (!req.session.adminId) return res.sendStatus(401);

  await db
    .update(exams)
    .set({ answerKeyPublished: false })
    .where(eq(exams.id, Number(req.params.examId)));

  res.json({ success: true });
});



app.get("/api/student/answer-key/:attemptId", async (req, res) => {
  if (!req.session.studentId) {
    return res.status(401).json({ message: "Login required" });
  }

  try {
    const attemptId = Number(req.params.attemptId);

    const data = await storage.getAnswerKey(
      attemptId,
      req.session.studentId
    );

    if (!data) {
      return res.status(404).json({ message: "Attempt not found" });
    }

    res.json(data);
  } catch (err: any) {
    if (err.message === "ANSWER_KEY_NOT_PUBLISHED") {
      return res
        .status(403)
        .json({ message: "Answer key not published yet" });
    }

    res.status(500).json({ message: "Server error" });
  }
});


/* =========================
   ADMIN – VIEW RESULTS
========================= */

app.get("/api/admin/exams/:examId/results", async (req, res) => {
  if (!req.session.adminId) {
    return res.status(401).json({ message: "Admin login required" });
  }

  const examId = Number(req.params.examId);

  const attempts = await db.query.testAttempts.findMany({
    where: eq(testAttempts.examId, examId),
    with: {
      student: {
        columns: {
          name: true,
          applicationNo: true,
        },
      },
    },
  });

  res.json(attempts);
});


/* =========================
   ADMIN – PUBLISH RESULT
========================= */

app.post("/api/admin/exams/:examId/publish-result", async (req, res) => {
  if (!req.session.adminId) {
    return res.status(401).json({ message: "Admin login required" });
  }

  const examId = Number(req.params.examId);

  await storage.publishResult(examId);

  res.json({
    success: true,
    message: "Result published successfully",
  });
});


app.post("/api/admin/exams/:examId/unpublish-result", async (req, res) => {
  if (!req.session.adminId) {
    return res.status(401).json({ message: "Admin login required" });
  }

  const examId = Number(req.params.examId);

  // 1️⃣ Remove percentile & unpublish attempts
  await db
    .update(testAttempts)
    .set({
      resultPublished: false,
      percentile: null, // 🔥 IMPORTANT
    })
    .where(eq(testAttempts.examId, examId));

  // 2️⃣ Mark exam as not declared
  await db
    .update(exams)
    .set({ resultDeclared: false })
    .where(eq(exams.id, examId));

  res.json({ success: true });
});



  /* ===========================
     RESPONSES
  =========================== */
  app.post(api.responses.upsert.path, async (req, res) => {
    try {
      const input = api.responses.upsert.input.parse(req.body);
      const response = await storage.upsertResponse(input);
      res.json(response);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      throw err;
    }
  });

  app.get("/api/student/result/:attemptId/pdf", async (req, res) => {
  if (!req.session.studentId) {
    return res.status(401).json({ message: "Login required" });
  }

  const attemptId = Number(req.params.attemptId);

  try {
    // 1️⃣ Fetch attempt (with ownership check)
    const attempt = await storage.getAttempt(
      attemptId,
      req.session.studentId
    );

    if (!attempt || !attempt.resultPublished) {
      return res
        .status(403)
        .json({ message: "Result not published" });
    }

    // 2️⃣ Fetch student & exam
    const student = await storage.getStudentById(
      req.session.studentId
    );

    const exam = await storage.getExam(attempt.examId);

    if (!student || !exam) {
      return res.status(404).json({ message: "Data missing" });
    }

    // 3️⃣ Generate PDF
    const pdf = await generateResultPdf({
      attemptId: attempt.id,

      name: student.name,
      applicationNo: student.applicationNo,
      examTitle: exam.title,
      examDate: String(exam.examDate),

     score: attempt.totalMarksObtained ?? 0,
percentile: attempt.percentile ?? 0,

correct: attempt.correctCount ?? 0,
wrong: attempt.wrongCount ?? 0,
skipped: attempt.skippedCount ?? 0,


      generatedAt: new Date().toLocaleDateString("en-GB"),
    });

    // 4️⃣ Send PDF
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "inline; filename=JEE_Result_Scorecard.pdf"
    );

    res.end(pdf);
  } catch (err) {
    console.error("RESULT PDF ERROR:", err);
    res.status(500).json({ message: "Failed to generate PDF" });
  }
});


  return httpServer;
}
