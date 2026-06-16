require("dotenv").config();


const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");

const express    = require("express");
const cors       = require("cors");
const multer     = require("multer");
const csv        = require("csv-parser");
const fs         = require("fs");
const nodemailer = require("nodemailer");
const { Resend } = require("resend");
const { createClient } = require("@supabase/supabase-js");
const { sendEmail }    = require("./services/email/sendEmail");

// Supabase admin client — service role, bypasses RLS
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const app = express();

const BASE_URL = process.env.BASE_URL || "http://localhost:5000";

const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

const vercelPreviewRegex = /^https:\/\/project-thanda-mailer-.*\.vercel\.app$/;

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:5176",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://127.0.0.1:5175",
  "http://127.0.0.1:5176",
  process.env.FRONTEND_URL
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    console.log("CORS check for origin:", origin);
    if (!origin || allowedOrigins.includes(origin) || vercelPreviewRegex.test(origin)) {
      callback(null, true);
    } else {
      console.error("CORS blocked origin:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
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
    console.log("UPLOAD ROUTE HIT");
    console.log("REQ.FILE:", req.file);
    console.log("REQ.BODY keys:", Object.keys(req.body || {}));
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

app.post("/send-test-email", requireAuth, upload.single("attachment"), async (req, res) => {
  console.log("REQ BODY:", req.body);
  console.log("REQ FILE:", req.file);
  try {
    const { gmail, subject, body, testRecipient } = req.body;

    const recipient = testRecipient || gmail;
    if (!recipient) {
      return res.status(400).json({ success: false, error: "Recipient email is required" });
    }

    // Load user's sender profile
    const { data: profile, error: dbError } = await supabaseAdmin
      .from("sender_profiles")
      .select("*")
      .eq("user_id", req.userId)
      .single();

    if (dbError && dbError.code !== "PGRST116") {
      throw dbError;
    }
    if (!profile) {
      return res.status(400).json({ success: false, error: "Please configure your sender profile in Settings first." });
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

    const attachments = [];
    if (req.file) {
      attachments.push({
        filename: req.file.originalname,
        content: fs.readFileSync(req.file.path).toString("base64"),
      });
    }

    console.log(`ABOUT TO SEND EMAIL VIA ${profile.provider.toUpperCase()} PROVIDER SERVICE`);
    const result = await sendEmail({
      provider: profile.provider,
      credentials: {
        sender_email: profile.sender_email,
        smtp_host: profile.smtp_host,
        smtp_port: profile.smtp_port,
        smtp_username: profile.smtp_username,
        smtp_password: profile.smtp_password,
        resend_api_key: profile.resend_api_key,
      },
      to: recipient,
      subject: generatedSubject,
      html: generatedHtml,
      attachments,
    });

    console.log("EMAIL SENT SUCCESSFULLY VIA PROVIDER SERVICE", result);
    res.json({ success: true, message: "Test email sent successfully", data: result });
  } catch (error) {
    console.error("TEST EMAIL ERROR:", error);
    res.status(400).json({ success: false, error: error.message });
  } finally {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
  }
});

app.post("/send-emails", requireAuth, upload.single("attachment"), async (req, res) => {
  try {
    const {
      subject,
      body,
      campaignId,
    } = req.body;

    // Load user's sender profile
    const { data: profile, error: dbError } = await supabaseAdmin
      .from("sender_profiles")
      .select("*")
      .eq("user_id", req.userId)
      .single();

    if (dbError && dbError.code !== "PGRST116") {
      throw dbError;
    }
    if (!profile) {
      return res.status(400).json({ success: false, error: "Please configure your sender profile in Settings first." });
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
      console.log("[Backend] status before send:", activeCampaigns[campaignId]);
    }

    // Read attachment once before the loop (avoids re-reading per recipient)
    let attachmentContent = null;
    let attachmentFilename = null;
    if (req.file) {
      attachmentContent = fs.readFileSync(req.file.path).toString("base64");
      attachmentFilename = req.file.originalname;
    }

    const attachments = [];
    if (attachmentContent) {
      attachments.push({
        filename: attachmentFilename,
        content: attachmentContent,
      });
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

      try {
        const result = await sendEmail({
          provider: profile.provider,
          credentials: {
            sender_email: profile.sender_email,
            smtp_host: profile.smtp_host,
            smtp_port: profile.smtp_port,
            smtp_username: profile.smtp_username,
            smtp_password: profile.smtp_password,
            resend_api_key: profile.resend_api_key,
          },
          to: contact.email,
          subject: generatedSubject,
          html: generatedHtml,
          attachments,
        });

        console.log(`Sent via ${profile.provider} to`, contact.email, result);
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
        console.log(`[Backend Send Log] recipient email: ${contact.email}, recipient status written: Sent, sent_count: ${sent}, failed_count: ${campaignId && activeCampaigns[campaignId] ? activeCampaigns[campaignId].failed || 0 : 0}`);
      } catch (err) {
        console.error(`Failed to send via ${profile.provider} to`, contact.email, err);
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
        console.log(`[Backend Send Log] recipient email: ${contact.email}, recipient status written: Failed, sent_count: ${sent}, failed_count: ${campaignId && activeCampaigns[campaignId] ? activeCampaigns[campaignId].failed || 0 : 0}`);
      }

      if (campaignId && activeCampaigns[campaignId]) {
        console.log("[Backend] status after send:", activeCampaigns[campaignId]);
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

    console.log("[Backend] status before response:", activeCampaigns[campaignId]);

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

// ── Auth middleware: verifies Supabase JWT, attaches req.userId ──
async function requireAuth(req, res, next) {
  if (req.method === "OPTIONS") return next();
  const authHeader = req.headers["authorization"] || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: "Missing auth token" });
  }
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
  req.userId = user.id;
  req.userEmail = user.email;
  next();
}

// ── POST /sync-user: Upserts user into public.users bypassing RLS ──
app.post("/sync-user", requireAuth, async (req, res) => {
  try {
    const { email } = req.body;
    const targetEmail = email || req.userEmail;

    if (!targetEmail) {
      return res.status(400).json({ error: "Email is required" });
    }

    const { data, error } = await supabaseAdmin
      .from("users")
      .upsert(
        { id: req.userId, email: targetEmail },
        { onConflict: "id" }
      )
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, user: data });
  } catch (err) {
    console.error("POST /sync-user error:", err.message);
    res.status(500).json({ error: err.message });
  }
});


// ── GET /sender-profile ──
app.get("/sender-profile", requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("sender_profiles")
      .select("*")
      .eq("user_id", req.userId)
      .single();

    if (error && error.code !== "PGRST116") { // PGRST116 = no rows
      throw error;
    }
    res.json({ profile: data || null });
  } catch (err) {
    console.error("GET /sender-profile error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /sender-profile ──
app.post("/sender-profile", requireAuth, async (req, res) => {
  try {
    const {
      provider,
      sender_email,
      smtp_host,
      smtp_port,
      smtp_username,
      smtp_password,
      resend_api_key,
    } = req.body;

    // Validate required fields
    if (!provider || !sender_email) {
      return res.status(400).json({ error: "provider and sender_email are required" });
    }
    if (provider === "smtp") {
      if (!smtp_host || !smtp_port || !smtp_username || !smtp_password) {
        return res.status(400).json({ error: "SMTP host, port, username, and password are required" });
      }
    }
    if (provider === "resend" && !resend_api_key) {
      return res.status(400).json({ error: "Resend API key is required" });
    }

    const payload = {
      user_id:       req.userId,
      provider,
      sender_email,
      smtp_host:     smtp_host     || null,
      smtp_port:     smtp_port     ? Number(smtp_port) : null,
      smtp_username: smtp_username || null,
      smtp_password: smtp_password || null,
      resend_api_key: resend_api_key || null,
    };

    // Check if profile exists
    const { data: existing, error: findError } = await supabaseAdmin
      .from("sender_profiles")
      .select("id")
      .eq("user_id", req.userId)
      .single();

    if (findError && findError.code !== "PGRST116") {
      throw findError;
    }

    let result;
    if (existing) {
      const { data, error } = await supabaseAdmin
        .from("sender_profiles")
        .update(payload)
        .eq("user_id", req.userId)
        .select()
        .single();
      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabaseAdmin
        .from("sender_profiles")
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      result = data;
    }

    res.json({ success: true, profile: result });
  } catch (err) {
    console.error("POST /sender-profile error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /test-connection ──
app.post("/test-connection", requireAuth, async (req, res) => {
  try {
    const {
      provider,
      sender_email,
      smtp_host,
      smtp_port,
      smtp_username,
      smtp_password,
      resend_api_key,
    } = req.body;

    if (provider === "smtp") {
      // ─ SMTP verify ─
      const transporter = nodemailer.createTransport({
        host: smtp_host,
        port: Number(smtp_port),
        secure: Number(smtp_port) === 465,
        auth: { user: smtp_username, pass: smtp_password },
        family: 4,
          connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000,
      });
      await transporter.verify();
      return res.json({ success: true, message: "SMTP connection verified successfully" });
    }

    if (provider === "resend") {
      // ─ Resend verify: send a real test email ─
      const testClient = new Resend(resend_api_key);
      const { error } = await testClient.emails.send({
        from: sender_email,
        to:   sender_email,
        subject: "Thanda Mail — Connection Test",
        text: "Your Resend API key is working correctly. You can now use Thanda Mail to send campaigns.",
      });
      if (error) throw new Error(error.message);
      return res.json({ success: true, message: "Resend connection verified — test email sent to " + sender_email });
    }

    return res.status(400).json({ error: "Unknown provider. Use \"smtp\" or \"resend\"." });
  } catch (err) {
    console.error("POST /test-connection error:", err.message);
    res.json({ success: false, error: err.message });
  }
});

// ── Multer / busboy error handler (catches file-size limit etc.) ──
app.use((err, req, res, next) => {
  console.error("UNHANDLED EXPRESS ERROR:", err.message, err.code);
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ success: false, error: "File too large. Maximum size is 10MB." });
  }
  res.status(500).json({ success: false, error: err.message, stack: err.stack });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`BASE_URL: ${BASE_URL}`);
});
