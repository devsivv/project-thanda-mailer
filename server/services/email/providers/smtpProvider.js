const nodemailer = require("nodemailer");

async function send({ credentials, to, subject, html, attachments }) {
  const { smtp_host, smtp_port, smtp_username, smtp_password, sender_email } = credentials;

  const transporter = nodemailer.createTransport({
    host: smtp_host,
    port: Number(smtp_port),
    secure: Number(smtp_port) === 465,
    auth: {
      user: smtp_username,
      pass: smtp_password,
    },
  });

  const mailOptions = {
    from: sender_email,
    to,
    subject,
    html,
  };

  if (attachments && attachments.length > 0) {
    mailOptions.attachments = attachments.map((att) => ({
      filename: att.filename,
      content: Buffer.from(att.content, "base64"),
    }));
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error("[smtpProvider] sendMail error:", err);
    let errMsg = err.message;
    if (err.code === "EAUTH") {
      errMsg = "SMTP authentication failed";
    } else if (err.code === "ECONNREFUSED") {
      errMsg = "Connection to SMTP server refused";
    }
    throw new Error(errMsg);
  }
}

module.exports = { send };
