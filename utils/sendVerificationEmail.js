const nodemailer = require("nodemailer");

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.error(
    "EMAIL_USER or EMAIL_PASS is missing in environment variables. Email sending will not work."
  );
}

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // Gmail and most providers use TLS on port 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendVerificationEmail(email, name, verificationLink) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error(
      "EMAIL_USER or EMAIL_PASS is missing. Cannot send verification email."
    );
    return;
  }
  const mailOptions = {
    from: process.env.EMAIL_FROM || "no-reply@yourapp.com",
    to: email,
    subject: "Verify your email address - AI Interviewer",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">AI Interviewer</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Email Verification Required</p>
        </div>
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
          <h2 style="color: #333; margin-top: 0;">Hello ${name},</h2>
          <p style="color: #666; line-height: 1.6;">
            Thank you for registering with AI Interviewer! To activate your account, please verify your email address by clicking the button below:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}"
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
              Verify Your Email
            </a>
          </div>
          <p style="color: #666; line-height: 1.6;">
            Or copy and paste this link in your browser:
          </p>
          <div style="background: #e9ecef; padding: 15px; border-radius: 5px; word-break: break-all; margin: 20px 0;">
            <code style="color: #495057;">${verificationLink}</code>
          </div>
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; color: #856404;">
              <strong>Important:</strong> This link will expire in 24 hours for security reasons.
            </p>
          </div>
          <p style="color: #666; line-height: 1.6;">
            If you have any questions or need assistance, feel free to reach out to our support team.
          </p>
          <hr style="border: none; border-top: 1px solid #e9ecef; margin: 30px 0;">
          <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
            Thank you for choosing AI Interviewer!<br>
            This is an automated email. Please do not reply to this message.
          </p>
        </div>
      </div>
    `,
  };
  await transporter.sendMail(mailOptions);
}

module.exports = sendVerificationEmail;
