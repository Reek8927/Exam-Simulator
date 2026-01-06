import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";
import QRCode from "qrcode";

type PdfData = {
  applicationNo: string;
  name: string;

  fatherName: string;
  motherName: string;
  dob: string;
  gender: string;
  category: string;
  nationality: string;
  stateOfEligibility: string;
  aadhaarNumber: string;

  parentsIncome: string;

  permanentAddress: string;
  presentAddress: string;

  class10Board: string;
  class10Year: string;
  class10Roll: string;

  class12Status: string;
  class12Board: string;
  class12School: string;
  class12Year: string;

  photoUrl: string;
  signatureUrl: string;

  today: string;

  qrCode?: string; // 🔥 NEW
};

export async function generateApplicationPdf(
  data: PdfData,
  baseUrl: string
): Promise<Buffer> {

  const templatePath = path.join(
    process.cwd(),
    "server",
    "pdf",
    "template.html"
  );

  let html = fs.readFileSync(templatePath, "utf8");

  /* =========================
     🔳 QR CODE GENERATION
  ========================= */
  const qrPayload = JSON.stringify({
    applicationNo: data.applicationNo,
    name: data.name,
    dob: data.dob,
    generatedOn: data.today,
  });

  const qrCodeBase64 = await QRCode.toDataURL(qrPayload, {
    errorCorrectionLevel: "H",
    margin: 1,
    width: 180,
  });

  const finalData = {
    ...data,
    qrCode: qrCodeBase64,
  };

  /* =========================
     🔁 PLACEHOLDER REPLACE
  ========================= */
  Object.entries(finalData).forEach(([key, value]) => {
    html = html.replaceAll(`{{${key}}}`, value || "—");
  });

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  await page.setContent(html, {
    waitUntil: "networkidle0",
  });

  const pdf = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: {
      top: "20mm",
      bottom: "20mm",
      left: "15mm",
      right: "15mm",
    },
  });

  await browser.close();
  return Buffer.from(pdf);
}
