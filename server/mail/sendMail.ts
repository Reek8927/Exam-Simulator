import nodemailer from "nodemailer";

export async function sendRegistrationMail(
  toEmail: string,
  applicationNo: string,
  password: string
) {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": process.env.BREVO_API_KEY!,
    },
    body: JSON.stringify({
      sender: {
        name: "JEE CBT Simulator",
        email: "noreply@jee-simulator.com", // can be anything verified
      },
      to: [{ email: toEmail }],
      subject: "JEE Registration Successful",
      htmlContent: `
        <h2>Registration Successful</h2>
        <p><b>Application Number:</b> ${applicationNo}</p>
        <p><b>Password:</b> ${password}</p>
        <p>Please keep these credentials safe.</p>
      `,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    console.error("Brevo email error:", error);
    throw new Error("Email send failed");
  }
}


