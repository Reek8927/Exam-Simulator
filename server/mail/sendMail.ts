import nodemailer from "nodemailer";

export async function sendRegistrationMail(
  toEmail: string,
  applicationNo: string,
  password: string
) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER,      // your gmail
      pass: process.env.MAIL_PASS,      // app password
    },
  });

  const mailOptions = {
    from: `"JEE CBT Simulator" <${process.env.MAIL_USER}>`,
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
