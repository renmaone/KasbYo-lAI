import * as nodemailer from "nodemailer";

export async function sendKasbYolEmail(to: string, subject: string, html: string): Promise<boolean> {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) {
    console.log(`[EMAIL SIMULATION] To: ${to} | Subject: ${subject}`);
    return false;
  }
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: { user, pass },
    });
    await transporter.sendMail({
      from: `"KasbYo\u2018l Platformasi" <${user}>`,
      to,
      subject,
      html,
    });
    return true;
  } catch (err) {
    console.error("Email yuborishda xato:", err);
    return false;
  }
}
