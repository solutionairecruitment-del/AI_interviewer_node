const nodemailer = require("nodemailer");

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.error(
    "EMAIL_USER or EMAIL_PASS missing. Email sending will not work."
  );
}

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send report email with PDF attachment (from base64 in DB)
 * @param {string} email - recipient
 * @param {string} subject - subject line
 * @param {string} body - email body
 * @param {Object} report - { fileName, fileType, fileData }
 */
async function sendReportEmailWithAttachment(email, subject, body, report) {
  if (!report || !report.fileData) throw new Error("No PDF data found");

  // Strip "data:application/pdf;base64," prefix
  const base64Data = report.fileData.replace(
    /^data:application\/pdf;base64,/,
    ""
  );

  // Convert base64 → Buffer
  const pdfBuffer = Buffer.from(base64Data, "base64");

  const mailOptions = {
    from: process.env.EMAIL_FROM || "no-reply@yourapp.com",
    to: email,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Hello,</h2>
        <p style="color: #666; line-height: 1.6;">
          ${body}
        </p>
        <p style="color: #999; font-size: 12px; text-align: center; margin-top: 40px;">
          This email contains your requested report as an attachment.
        </p>
      </div>
    `,
    attachments: [
      {
        filename: report.fileName || "report.pdf",
        content: pdfBuffer,
        contentType: report.fileType || "application/pdf",
      },
    ],
  };

  const info = await transporter.sendMail(mailOptions);
  console.log("📩 Report email sent:", info.messageId);
}

module.exports = sendReportEmailWithAttachment;
