const http = require("http");

// Use built-in FormData from Node 18+, or build it manually
// We'll construct the multipart body manually for portability

const recipients = JSON.stringify([
  { name: "Shivam", email: "shivamdubey9040@gmail.com", company: "Demo" }
]);

const boundary = "----TestBoundary" + Date.now();

const body = [
  `--${boundary}`,
  `Content-Disposition: form-data; name="recipients"`,
  ``,
  recipients,
  `--${boundary}`,
  `Content-Disposition: form-data; name="subject"`,
  ``,
  `Campaign Test - {{name}} at {{company}}`,
  `--${boundary}`,
  `Content-Disposition: form-data; name="body"`,
  ``,
  `Hi {{name}},\n\nThis is a campaign test via Resend API.\n\nCompany: {{company}}\nEmail: {{email}}\n\nBest,\nThanda Mailer`,
  `--${boundary}`,
  `Content-Disposition: form-data; name="delay"`,
  ``,
  `1000`,
  `--${boundary}`,
  `Content-Disposition: form-data; name="campaignId"`,
  ``,
  `test-${Date.now()}`,
  `--${boundary}--`,
  ``
].join("\r\n");

const options = {
  hostname: "localhost",
  port: 5000,
  path: "/send-emails",
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
  res.on("end", () => {
    console.log("HTTP Status:", res.statusCode);
    try {
      const parsed = JSON.parse(data);
      console.log("Response:", JSON.stringify(parsed, null, 2));
    } catch {
      console.log("Raw response:", data);
    }
  });
});

req.on("error", (e) => {
  console.error("Request error:", e.message);
});

req.write(body);
req.end();
