const { Resend } = require("resend");

async function send({ credentials, to, subject, html, attachments }) {
  const { resend_api_key, sender_email } = credentials;

  const resendClient = new Resend(resend_api_key);

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
    const { data, error } = await resendClient.emails.send(mailOptions);
    if (error) {
      throw error;
    }
    return { success: true, id: data.id };
  } catch (err) {
    console.error("[resendProvider] send error:", err);
    let errMsg = err.message;
    if (err.message && err.message.includes("API key is invalid")) {
      errMsg = "Invalid Resend API key";
    }
    throw new Error(errMsg);
  }
}

module.exports = { send };
