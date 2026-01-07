import nodemailer from "nodemailer";

console.log("BREVO KEY EXISTS:", !!process.env.BREVO_API_KEY);


export async function sendRegistrationMail(
  toEmail: string,
  applicationNo: string,
  password: string
) {
  console.log("Sending email to:", toEmail);

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": process.env.BREVO_API_KEY!,
    },
    body: JSON.stringify({
      sender: {
        name: "JEE CBT Simulator",
        email: "reekbasu4529@gmail.com", // MUST match verified sender
      },
      to: [{ email: toEmail }],
      subject: "JEE Registration Successful",
      htmlContent: `
        <h2>Registration Successful</h2>
        <p>Application No: ${applicationNo}</p>
        <p>Password: ${password}</p>
      `,
    }),
  });

  const text = await response.text();
  console.log("BREVO STATUS:", response.status);
  console.log("BREVO RESPONSE:", text);

  if (!response.ok) {
    throw new Error("Brevo email failed");
  }
}

