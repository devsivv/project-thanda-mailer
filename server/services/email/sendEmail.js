const smtpProvider = require("./providers/smtpProvider");
const resendProvider = require("./providers/resendProvider");

async function sendEmail({ provider, credentials, to, subject, html, attachments }) {
  if (provider === "smtp") {
    return await smtpProvider.send({ credentials, to, subject, html, attachments });
  } else if (provider === "resend") {
    return await resendProvider.send({ credentials, to, subject, html, attachments });
  } else {
    throw new Error(`Unsupported email provider: ${provider}`);
  }
}

module.exports = { sendEmail };
