import axios from "axios";

export async function sendRegistrationMail(
  toEmail: string,
  applicationNo: string,
  password: string
) {
  try {
    const res = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: "JEE CBT Simulator",
          email: "reekbasu4529@gmail.com", // VERIFIED sender only
        },
        to: [{ email: toEmail }],
        subject: "JEE Registration Successful",
        htmlContent: `
          <h2>Registration Successful</h2>
          <p><b>Application Number:</b> ${applicationNo}</p>
          <p><b>Password:</b> ${password}</p>
        `,
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY!,
          "Content-Type": "application/json",
        },
        timeout: 5000, // 🔥 VERY IMPORTANT
      }
    );

    console.log("Brevo mail sent:", res.status);
  } catch (err: any) {
    console.error("Brevo mail error:", err.message);
    if (err.response) {
      console.error("Brevo response:", err.response.data);
    }
  }
}
