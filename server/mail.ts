import nodemailer from "nodemailer";

export async function sendRegistrationMail(
  toEmail: string,
  applicationNo: string,
  password: string
) {
  const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false, // true only for port 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

  const mailOptions = {
    from: `"JEE CBT Simulator" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: "JEE Registration Successful",
    html: `
      <h2>JEE (Main) Registration Successful</h2>
      <p>Your registration has been completed successfully.</p>

      <p><b>Application Number:</b> ${applicationNo}</p>
      <p><b>Password:</b> ${password}</p>

      <p>Please keep these details safe.</p>
      <br/>
      <p>— JEE CBT Simulator</p>
    `,
  };

  await transporter.sendMail(mailOptions);
}
