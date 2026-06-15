require("dotenv").config();

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");
const nodemailer = require("nodemailer");
const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);

const app = express();

const BASE_URL = process.env.BASE_URL || "http://localhost:5000";

const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      console.log("CORS check for origin:", origin);
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.error("CORS blocked origin:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    }
  })
);
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend Running");
});

app.get("/health", (req, res) => {
  res.json({ status: "UP", timestamp: new Date().toISOString() });
});

/*
  CSV Upload + Preview Generation
*/
app.post(
  "/upload",
  upload.single("file"),
  (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: "No file uploaded",
        });
      }

      const contacts = [];
      const seenEmails = new Set();
      let duplicatesRemoved = 0;

      const subject =
        req.body.subject ||
        "Quick question for {{name}} at {{company}}";

      const body =
        req.body.body ||
        `Hi {{name}},

I came across {{company}} and was impressed by your work.

I wanted to reach out because...`;

      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on("data", (row) => {
          const email = (row.email || "").trim().toLowerCase();
          if (email && seenEmails.has(email)) {
            duplicatesRemoved++;
          } else {
            if (email) seenEmails.add(email);
            contacts.push(row);
          }
        })
        .on("end", () => {

          const previews = contacts
            .slice(0, 5)
            .map((contact) => {

              const generatedSubject = subject
                .replaceAll(
                  "{{name}}",
                  contact.name || ""
                )
                .replaceAll(
                  "{{company}}",
                  contact.company || ""
                )
                .replaceAll(
                  "{{email}}",
                  contact.email || ""
                );

              const generatedEmail = body
                .replaceAll(
                  "{{name}}",
                  contact.name || ""
                )
                .replaceAll(
                  "{{company}}",
                  contact.company || ""
                )
                .replaceAll(
                  "{{email}}",
                  contact.email || ""
                );

              return {
                name: contact.name,
                email: contact.email,
                company: contact.company,
                subject: generatedSubject,
                generatedEmail,
              };
            });

          res.json({
            contacts: contacts.length,
            duplicatesRemoved,
            previews,
            allContacts: contacts,
          });

          if (req.file?.path && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
          }
        })
        .on("error", (error) => {
          console.error(error);

          res.status(500).json({
            error: "CSV parsing failed",
          });

          if (req.file?.path && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
          }
        });

    } catch (error) {
      console.error(error);

      res.status(500).json({
        error: error.message,
      });

      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    }
  }
);

const activeCampaigns = {};

app.get("/campaign-status/:id", (req, res) => {
  const campaign = activeCampaigns[req.params.id];
  if (!campaign) {
    return res.status(404).json({ error: "Campaign not found" });
  }
  res.json(campaign);
});

app.post("/cancel-campaign/:campaignId", (req, res) => {
  const campaignId = req.params.campaignId;
  if (activeCampaigns[campaignId]) {
    activeCampaigns[campaignId].cancelled = true;
    activeCampaigns[campaignId].completed = true;
    activeCampaigns[campaignId].completedAt = Date.now();
    activeCampaigns[campaignId].currentRecipient = "";
    return res.json({ success: true });
  }
  return res.status(404).json({ error: "Campaign not found" });
});

app.post("/send-test-email", upload.single("attachment"), async (req, res) => {
  console.log("REQ BODY:", req.body);
  console.log("REQ FILE:", req.file);
  try {
    const { gmail, appPassword, subject, body, testRecipient } = req.body;

    const recipient = testRecipient || gmail;
    if (!recipient) {
      return res.status(400).json({ success: false, error: "Recipient email is required" });
    }

    const sender = process.env.SENDER_EMAIL;
    if (!sender) {
      return res.status(500).json({ success: false, error: "SENDER_EMAIL environment variable is not configured" });
    }

    const generatedSubject = subject
      .replaceAll("{{name}}", "Test Name")
      .replaceAll("{{company}}", "Test Company")
      .replaceAll("{{email}}", recipient);

    const generatedBody = body
      .replaceAll("{{name}}", "Test Name")
      .replaceAll("{{company}}", "Test Company")
      .replaceAll("{{email}}", recipient);

    let generatedHtml = generatedBody.replace(/\n/g, "<br>");

    const mailOptions = {
      from: sender,
      to: recipient,
      subject: generatedSubject,
      text: generatedBody,
      html: generatedHtml,
    };

    if (req.file) {
      mailOptions.attachments = [{
        filename: req.file.originalname,
        content: fs.readFileSync(req.file.path).toString("base64"),
      }];
    }

    console.log("RESEND OPTIONS:", mailOptions);
    console.log("ABOUT TO SEND EMAIL VIA RESEND API");
    const { data, error } = await resend.emails.send(mailOptions);

    if (error) {
      console.error("RESEND API ERROR:", error);
      return res.status(400).json({ success: false, error: error.message });
    }

    console.log("EMAIL SENT SUCCESSFULLY VIA RESEND API", data);
    res.json({ success: true, message: "Test email sent successfully", data });
  } catch (error) {
    console.error("TEST EMAIL ERROR:", error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
  }
});

app.post("/send-emails", upload.single("attachment"), async (req, res) => {
  try {
    const {
      subject,
      body,
      campaignId,
    } = req.body;

    const sender = process.env.SENDER_EMAIL;
    if (!sender) {
      return res.status(500).json({ success: false, error: "SENDER_EMAIL environment variable is not configured" });
    }

    const delayMs = parseInt(req.body.delay) || 2000;

    let recipients = req.body.recipients;
    if (typeof recipients === "string") {
      recipients = JSON.parse(recipients);
    }

    if (campaignId) {
      activeCampaigns[campaignId] = {
        total: recipients.length,
        sent: 0,
        failed: 0,
        completed: false,
        completedAt: null,
        cancelled: false,
        currentRecipient: "",
        recentActivity: [],
        results: [],
      };
    }

    // Read attachment once before the loop (avoids re-reading per recipient)
    let attachmentContent = null;
    let attachmentFilename = null;
    if (req.file) {
      attachmentContent = fs.readFileSync(req.file.path).toString("base64");
      attachmentFilename = req.file.originalname;
    }

    let sent = 0;
    const results = [];

    for (const contact of recipients) {
      if (campaignId && activeCampaigns[campaignId] && activeCampaigns[campaignId].cancelled) {
        break;
      }

      if (campaignId && activeCampaigns[campaignId]) {
        activeCampaigns[campaignId].currentRecipient = contact.email;
      }

      const generatedSubject = subject
        .replaceAll("{{name}}", contact.name || "")
        .replaceAll("{{company}}", contact.company || "")
        .replaceAll("{{email}}", contact.email || "");

      const generatedBody = body
        .replaceAll("{{name}}", contact.name || "")
        .replaceAll("{{company}}", contact.company || "")
        .replaceAll("{{email}}", contact.email || "");

      let generatedHtml = generatedBody.replace(/\n/g, "<br>");

      const mailOptions = {
        from: sender,
        to: contact.email,
        subject: generatedSubject,
        text: generatedBody,
        html: generatedHtml,
      };

      if (attachmentContent) {
        mailOptions.attachments = [{
          filename: attachmentFilename,
          content: attachmentContent,
        }];
      }

      try {
        const { data, error } = await resend.emails.send(mailOptions);

        if (error) {
          console.error("Resend error for", contact.email, error);
          const resObj = { email: contact.email, status: "Failed", error: error.message || "Resend API Error" };
          results.push(resObj);
          if (campaignId && activeCampaigns[campaignId]) {
            activeCampaigns[campaignId].failed = (activeCampaigns[campaignId].failed || 0) + 1;
            activeCampaigns[campaignId].results.push(resObj);
            activeCampaigns[campaignId].recentActivity.unshift({ email: contact.email, status: "Failed" });
            if (activeCampaigns[campaignId].recentActivity.length > 1000) {
              activeCampaigns[campaignId].recentActivity.pop();
            }
          }
        } else {
          console.log("Sent via Resend to", contact.email, data);
          sent++;
          const resObj = { email: contact.email, status: "Sent", error: "" };
          results.push(resObj);
          if (campaignId && activeCampaigns[campaignId]) {
            activeCampaigns[campaignId].sent = sent;
            activeCampaigns[campaignId].results.push(resObj);
            activeCampaigns[campaignId].recentActivity.unshift({ email: contact.email, status: "Sent" });
            if (activeCampaigns[campaignId].recentActivity.length > 1000) {
              activeCampaigns[campaignId].recentActivity.pop();
            }
          }
        }
      } catch (err) {
        console.error("Failed to send to", contact.email, err);
        const resObj = { email: contact.email, status: "Failed", error: err.message || "Connection Error" };
        results.push(resObj);
        if (campaignId && activeCampaigns[campaignId]) {
          activeCampaigns[campaignId].failed = (activeCampaigns[campaignId].failed || 0) + 1;
          activeCampaigns[campaignId].results.push(resObj);
          activeCampaigns[campaignId].recentActivity.unshift({ email: contact.email, status: "Failed" });
          if (activeCampaigns[campaignId].recentActivity.length > 1000) {
            activeCampaigns[campaignId].recentActivity.pop();
          }
        }
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs));

      if (campaignId && activeCampaigns[campaignId] && activeCampaigns[campaignId].cancelled) {
        break;
      }
    }

    if (campaignId && activeCampaigns[campaignId]) {
      activeCampaigns[campaignId].completed = true;
      activeCampaigns[campaignId].completedAt = Date.now();
      activeCampaigns[campaignId].currentRecipient = "";

      setTimeout(() => {
        delete activeCampaigns[campaignId];
      }, 3600000); // 1 hour
    }

    res.json({
      success: true,
      sent,
      results,
      cancelled: campaignId ? !!(activeCampaigns[campaignId]?.cancelled) : false,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`BASE_URL: ${BASE_URL}`);
});