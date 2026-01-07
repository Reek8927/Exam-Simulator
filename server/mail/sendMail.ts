import nodemailer from "nodemailer";

export async function sendRegistrationMail(
  toEmail: string,
  applicationNo: string,
  password: string
) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false, // MUST be false for port 587
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.verify(); // 🔥 this catches config issues early

  await transporter.sendMail({
    from: `"JEE CBT Simulator" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: "JEE Registration Successful",
    html: `
      <h2>JEE (Main) Registration Successful</h2>
      <p>Your registration is complete.</p>
      <p><b>Application No:</b> ${applicationNo}</p>
      <p><b>Password:</b> ${password}</p>
      <br/>
      <p>— JEE CBT Simulator</p>
    `,
  });
}

