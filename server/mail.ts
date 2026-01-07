import nodemailer from "nodemailer";

export async function sendRegistrationMail(
  toEmail: string,
  applicationNo: string,
  password: string
) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,   // smtp-relay.brevo.com
    port: Number(process.env.SMTP_PORT), // 587
    secure: false, // MUST be false for 587
    auth: {
      user: process.env.SMTP_USER, // 9f78a0001@smtp-brevo.com
      pass: process.env.SMTP_PASS, // Brevo SMTP key
    },
  });

  await transporter.verify(); // 🔥 ADD THIS (important)

  await transporter.sendMail({
    from: `"JEE CBT Simulator" <reekbasu4529@gmail.com>`,
    to: toEmail,
    subject: "JEE Registration Successful",
    html: `
      <h2>Registration Successful</h2>
      <p><b>Application No:</b> ${applicationNo}</p>
      <p><b>Password:</b> ${password}</p>
    `,
  });
}
