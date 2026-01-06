import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";

type ReceiptData = {
  applicationNo: string;
  name: string;
  txnId: string;
  amount: string;
  date: string;
};

export async function generatePaymentReceiptPdf(
  data: ReceiptData
): Promise<Buffer> {
  const templatePath = path.join(
    process.cwd(),
    "server",
    "pdf",
    "payment-receipt.html"
  );

  let html = fs.readFileSync(templatePath, "utf8");

  Object.entries(data).forEach(([key, value]) => {
    html = html.replaceAll(`{{${key}}}`, value);
  });

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });

  const pdf = await page.pdf({
    format: "A4",
    printBackground: true,
  });

  await browser.close();
  return Buffer.from(pdf);
}
