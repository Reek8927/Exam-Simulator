import nodemailer from "nodemailer";

export async function sendRegistrationMail(
  toEmail: string,
  applicationNo: string,
  password: string
) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,          // smtp-relay.brevo.com
    port: Number(process.env.SMTP_PORT),  // 587
    secure: false,                        // MUST be false
    auth: {
      user: process.env.SMTP_USER,        // 9f78a0001@smtp-brevo.com
      pass: process.env.SMTP_PASS,        // Brevo SMTP password
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  await transporter.sendMail({
    from: '"Exam Simulator" <reekbasu4529@gmail.com>', // VERIFIED sender
    to: toEmail,
    subject: "JEE Registration Successful",
    html: `
      <h2>JEE (Main) Registration Successful</h2>
      <p>Your registration has been completed successfully.</p>

      <p><b>Application Number:</b> ${applicationNo}</p>
      <p><b>Password:</b> ${password}</p>

      <p>Please keep these details safe.</p>
      <br/>
      <p>— Exam Simulator</p>
    `,
  });

  console.log("✅ Registration email sent to:", toEmail);
}
