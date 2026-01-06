import PDFDocument from "pdfkit";
import QRCode from "qrcode";

/* =====================
   TYPES
===================== */

export type ResultPdfInput = {
  attemptId: number;

  name: string;
  applicationNo: string;
  examTitle: string;
  examDate: string;

  score: number;
  percentile: number;

  correct: number;
  wrong: number;
  skipped: number;

  generatedAt: string;
};

/* =====================
   MAIN PDF GENERATOR
===================== */

export async function generateResultPdf(
  data: ResultPdfInput
): Promise<Buffer> {
  return new Promise(async (resolve) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
    });

    const buffers: Buffer[] = [];
    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => resolve(Buffer.concat(buffers)));

    /* =====================
       HEADER
    ===================== */

    doc
      .font("Helvetica-Bold")
      .fontSize(16)
      .text("NATIONAL TESTING AGENCY", { align: "center" });

    doc
      .font("Helvetica")
      .fontSize(12)
      .text("Score Card", { align: "center" });

    doc
      .moveDown(0.3)
      .font("Helvetica-Bold")
      .fontSize(11)
      .text(data.examTitle, { align: "center" });

    drawLine(doc);

    /* =====================
       CANDIDATE DETAILS
    ===================== */

    sectionTitle(doc, "Candidate Details");

    const cdY = doc.y;
    doc.rect(50, cdY, 495, 70).stroke();

    drawKeyValueAt(doc, cdY + 15, "Candidate Name", data.name);
    drawKeyValueAt(doc, cdY + 35, "Application No", data.applicationNo);
    drawKeyValueAt(doc, cdY + 55, "Exam Date", data.examDate);

    doc.y = cdY + 95;

    /* =====================
       RESULT SUMMARY
    ===================== */

    sectionTitle(doc, "Result Summary");

    const rsY = doc.y;
    doc.rect(50, rsY, 495, 95).stroke();

    doc
      .font("Helvetica")
      .fontSize(11)
      .text("Total Marks Obtained", 50, rsY + 18, {
        width: 495,
        align: "center",
      });

    doc
      .font("Helvetica-Bold")
      .fontSize(18)
      .text(String(data.score), 50, rsY + 35, {
        width: 495,
        align: "center",
      });

    doc
      .font("Helvetica")
      .fontSize(11)
      .text("Percentile Score", 50, rsY + 60, {
        width: 495,
        align: "center",
      });

    doc
      .font("Helvetica-Bold")
      .fontSize(14)
      .text(String(data.percentile), 50, rsY + 75, {
        width: 495,
        align: "center",
      });

    doc.y = rsY + 120;

    /* =====================
       MARKS BREAKDOWN
    ===================== */

    sectionTitle(doc, "Marks Breakdown");

    const tableY = doc.y;
    drawTableHeaderAt(doc, tableY);
    drawTableRowAt(doc, tableY + 32, [
      String(data.correct),
      String(data.wrong),
      String(data.skipped),
    ]);

    /* =====================
       QR VERIFICATION (FIXED)
    ===================== */

    const verifyUrl = `https://yourdomain.com/verify-result/${data.attemptId}`;
    const qr = await QRCode.toDataURL(verifyUrl);

    const qrX = 440;
    const qrY = 720; // fixed bottom-right

    doc.image(qr, qrX, qrY, { width: 80 });

    doc
      .font("Helvetica")
      .fontSize(8)
      .text("Scan to verify", qrX, qrY + 85, {
        width: 80,
        align: "center",
      });

    /* =====================
       FOOTER (FIXED)
    ===================== */

    const footerY = 770;

    doc
      .moveTo(50, footerY - 10)
      .lineTo(545, footerY - 10)
      .stroke();

    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor("gray")
      .text(
        "This is a computer generated score card and does not require any signature.",
        50,
        footerY,
        { width: 495, align: "center" }
      )
      .text(`Generated on: ${data.generatedAt}`, {
        width: 495,
        align: "center",
      });

    /* =====================
       WATERMARK (ABSOLUTE)
    ===================== */

    drawWatermark(doc);

    doc.end();
  });
}

/* =====================
   HELPERS
===================== */

function drawWatermark(doc: PDFKit.PDFDocument) {
  doc.save();
  doc
    .rotate(-30, { origin: [300, 420] })
    .fontSize(46)
    .fillColor("gray")
    .opacity(0.06)
    .text("CONFIDENTIAL\nNTA SCORE CARD", 0, 260, {
      width: 595,
      align: "center",
    });
  doc.restore();
}

function drawLine(doc: PDFKit.PDFDocument) {
  doc
    .moveDown(0.7)
    .moveTo(50, doc.y)
    .lineTo(545, doc.y)
    .stroke()
    .moveDown(1);
}

function sectionTitle(doc: PDFKit.PDFDocument, title: string) {
  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .fillColor("black")
    .text(title)
    .moveDown(0.4);
}

function drawKeyValueAt(
  doc: PDFKit.PDFDocument,
  y: number,
  key: string,
  value: string
) {
  doc
    .font("Helvetica")
    .fontSize(10)
    .text(key, 70, y, { width: 140 })
    .text(`: ${value}`, 220, y, { width: 300 });
}

function drawTableHeaderAt(doc: PDFKit.PDFDocument, y: number) {
  const colWidth = 165;
  const headers = ["Correct", "Wrong", "Skipped"];

  headers.forEach((h, i) => {
    doc
      .font("Helvetica-Bold")
      .rect(50 + i * colWidth, y, colWidth, 32)
      .stroke()
      .text(h, 50 + i * colWidth, y + 10, {
        width: colWidth,
        align: "center",
      });
  });
}

function drawTableRowAt(
  doc: PDFKit.PDFDocument,
  y: number,
  values: string[]
) {
  const colWidth = 165;

  values.forEach((v, i) => {
    doc
      .font("Helvetica")
      .rect(50 + i * colWidth, y, colWidth, 32)
      .stroke()
      .text(v, 50 + i * colWidth, y + 10, {
        width: colWidth,
        align: "center",
      });
  });
}
