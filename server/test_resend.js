const http = require("http");

function makeRequest(path, bodyParts) {
  return new Promise((resolve) => {
    const boundary = "----TestBoundary" + Date.now() + Math.random().toString(36).slice(2);
    const body = bodyParts.map(([name, value]) => [
      `--${boundary}`,
      `Content-Disposition: form-data; name="${name}"`,
      ``,
      value,
    ].join("\r\n")).join("\r\n") + `\r\n--${boundary}--\r\n`;

    const options = {
      hostname: "localhost",
      port: 5000,
      path,
      method: "POST",
      headers: {
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
        "Content-Length": Buffer.byteLength(body),
        "Origin": "http://localhost:5173"
      }
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => resolve({ status: res.statusCode, body: data }));
    });
    req.on("error", (e) => resolve({ status: 0, body: e.message }));
    req.write(body);
    req.end();
  });
}

async function run() {
  const subject = "{{name}} — Resend Campaign Test from Thanda Mailer";
  const body = `Hi {{name}},\n\nThis is a live delivery test for Thanda Mailer.\n\nCompany: {{company}}\nEmail: {{email}}\n\nIf you received this, Resend is working correctly.\n\nBest,\nThanda Mailer`;

  console.log("=".repeat(60));
  console.log("TEST 1: /send-test-email");
  console.log("=".repeat(60));
  const t1 = await makeRequest("/send-test-email", [
    ["subject", subject],
    ["body", body],
    ["testRecipient", "shivamdubey9040@gmail.com"],
  ]);
  console.log("HTTP Status:", t1.status);
  try { console.log("Response:", JSON.stringify(JSON.parse(t1.body), null, 2)); }
  catch { console.log("Raw:", t1.body); }

  console.log("\n" + "=".repeat(60));
  console.log("TEST 2: /send-emails (campaign - 1 recipient)");
  console.log("=".repeat(60));
  const recipients = JSON.stringify([
    { name: "Shivam", email: "shivamdubey9040@gmail.com", company: "Demo Corp" }
  ]);
  const t2 = await makeRequest("/send-emails", [
    ["subject", subject],
    ["body", body],
    ["recipients", recipients],
    ["delay", "500"],
    ["campaignId", "test-" + Date.now()],
  ]);
  console.log("HTTP Status:", t2.status);
  try { console.log("Response:", JSON.stringify(JSON.parse(t2.body), null, 2)); }
  catch { console.log("Raw:", t2.body); }
}

run();
