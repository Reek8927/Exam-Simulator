import "dotenv/config";

import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import session from "express-session";
import path from "path";

import { registerRoutes } from "./routes";
import { serveStatic } from "./static";

/* =========================
   APP & SERVER
========================= */
const app = express();
const httpServer = createServer(app);

/* =========================
   SESSION TYPE AUGMENTATION
========================= */
declare module "express-session" {
  interface SessionData {
    studentId?: number;
    adminId?: number;
  }
}

/* =========================
   STATIC UPLOADS
========================= */
app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "uploads"))
);

/* =========================
   SESSION CONFIG
========================= */
app.use(
  session({
    secret: process.env.SESSION_SECRET || "jee-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // set true only if HTTPS behind proxy
      httpOnly: true,
    },
  })
);

/* =========================
   BODY PARSERS
========================= */
app.use(
  express.json({
    verify: (req, _res, buf) => {
      (req as any).rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: false }));

/* =========================
   LOGGER
========================= */
function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const reqPath = req.path;
  let capturedJsonResponse: any;

  const originalJson = res.json;
  res.json = function (body, ...args) {
    capturedJsonResponse = body;
    return originalJson.apply(res, [body, ...args]);
  };

  res.on("finish", () => {
    if (reqPath.startsWith("/api")) {
      const duration = Date.now() - start;
      let line = `${req.method} ${reqPath} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        line += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      log(line);
    }
  });

  next();
});

/* =========================
   BOOTSTRAP
========================= */
(async () => {
  try {
    await registerRoutes(httpServer, app);

    /* =========================
       ERROR HANDLER (NO THROW!)
    ========================= */
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error("API ERROR:", err);

      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
    });

    /* =========================
       PROD / DEV SWITCH
    ========================= */
    if (process.env.NODE_ENV === "production") {
      serveStatic(app);
    } else {
      const { setupVite } = await import("./vite");
      await setupVite(httpServer, app);
    }

    /* =========================
       START SERVER
    ========================= */
    const PORT = process.env.PORT
      ? Number(process.env.PORT)
      : 3000;

    httpServer.listen(PORT, "0.0.0.0", () => {
      console.log(`✅ Server running on port ${PORT}`);
    });

  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
})();

