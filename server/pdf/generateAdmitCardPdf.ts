import PDFDocument from "pdfkit";
import fs from "fs";
import QRCode from "qrcode";

type AdmitCardData = {
  name: string;
  applicationNo: string;
  rollNumber: string;
  examTitle: string;
  examDate: string;
  startTime: string;
  durationMinutes: number;
  gateClosesAt: string;
  centerName: string;
  photoUrl?: string;
  signatureUrl?: string;
};

export function generateAdmitCardPdf(
  data: AdmitCardData
): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: 40,
      });

      const buffers: Buffer[] = [];
      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => {
        resolve(Buffer.concat(buffers));
      });

      /* =====================
         BORDER
      ===================== */
      doc
        .rect(25, 25, doc.page.width - 50, doc.page.height - 50)
        .lineWidth(2)
        .stroke("#1e40af");

      /* =====================
         HEADER
      ===================== */
      doc
        .fontSize(20)
        .fillColor("#1e40af")
        .text("Candidate Admit Card", { align: "center" });

      doc
        .moveDown(0.5)
        .fontSize(12)
        .fillColor("black")
        .text("Joint Entrance Examination (Main) – 2026", {
          align: "center",
        });

      doc.moveDown(2);

      /* =====================
         DETAILS
      ===================== */
      const leftX = 60;
      let y = 160;
      const gap = 22;

      doc.fontSize(11);

      const row = (label: string, value: string) => {
        doc.text(label, leftX, y);
        doc.text(value, leftX + 180, y);
        y += gap;
      };

      row("Candidate Name", data.name);
      row("Application No", data.applicationNo);
      row("Roll Number", data.rollNumber);
      row("Examination", data.examTitle);
      row("Exam Date", data.examDate);
      row("Start Time", data.startTime);
      row("Duration", `${data.durationMinutes} Minutes`);
      row("Gate Closing Time", data.gateClosesAt);
      row("Examination Centre", data.centerName);

      /* =====================
         PHOTO
      ===================== */
      const photoX = 390;
      const photoY = 150;

      doc.rect(photoX - 5, photoY - 5, 120, 150).stroke("#1e40af");

      if (data.photoUrl && fs.existsSync(data.photoUrl)) {
        doc.image(data.photoUrl, photoX, photoY, {
          width: 110,
          height: 140,
        });
      }

      doc.fontSize(9).text("Photograph", photoX + 20, photoY + 145);

      /* =====================
         SIGNATURE
      ===================== */
      const signY = photoY + 190;
      doc.rect(photoX - 5, signY - 5, 120, 45).stroke("#1e40af");

      if (data.signatureUrl && fs.existsSync(data.signatureUrl)) {
        doc.image(data.signatureUrl, photoX, signY, {
          width: 110,
          height: 35,
        });
      }

      doc.fontSize(9).text("Signature", photoX + 30, signY + 40);

      /* =====================
         QR CODE (SAFE)
      ===================== */
      const qrBuffer = await QRCode.toBuffer(
        `JEE2026|${data.applicationNo}|${data.rollNumber}`,
        { errorCorrectionLevel: "M" }
      );

      doc.image(qrBuffer, leftX, y + 30, { width: 100 });
      doc.fontSize(9).text("Scan for Verification", leftX, y + 135);

      /* =====================
         INSTRUCTIONS
      ===================== */
      doc.moveDown(7);
      doc.fontSize(11).text("IMPORTANT INSTRUCTIONS:", leftX);

      doc.fontSize(10);
      [
        "Carry this admit card along with a valid photo ID.",
        "Reach the examination centre at least 90 minutes before the exam.",
        "Electronic gadgets are strictly prohibited.",
        "Admit card is mandatory for entry into the examination hall.",
      ].forEach(i => doc.text(`• ${i}`, leftX + 10));

      /* =====================
         FOOTER
      ===================== */
      doc
        .moveDown(2)
        .fontSize(9)
        .fillColor("gray")
        .text(
          "This is a computer-generated admit card. No signature required.",
          { align: "center" }
        );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
