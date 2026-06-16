const http = require("http");
const fs = require("fs");
const path = require("path");

// Write a temp CSV
const csvPath = path.join(__dirname, "_test_upload.csv");
fs.writeFileSync(csvPath, "name,email,company\nShivam,shivamdubey9040@gmail.com,Demo\n");

const fileContent = fs.readFileSync(csvPath);
const boundary = "----TestBoundary" + Date.now();

const header = [
  `--${boundary}`,
  `Content-Disposition: form-data; name="file"; filename="test.csv"`,
  `Content-Type: text/csv`,
  ``,
  ``
].join("\r\n");

const footer = `\r\n--${boundary}--\r\n`;

const bodyBuf = Buffer.concat([
  Buffer.from(header, "utf8"),
  fileContent,
  Buffer.from(footer, "utf8")
]);

const options = {
  hostname: "localhost",
  port: 5000,
  path: "/upload",
  method: "POST",
  headers: {
    "Content-Type": `multipart/form-data; boundary=${boundary}`,
    "Content-Length": bodyBuf.length,
    "Origin": "http://localhost:5173"
  }
};

console.log("Sending test CSV upload to /upload ...");
const req = http.request(options, (res) => {
  let data = "";
  res.on("data", chunk => data += chunk);
  res.on("end", () => {
    console.log("HTTP Status:", res.statusCode);
    console.log("Content-Type:", res.headers["content-type"]);
    console.log("Response body:", data.substring(0, 500));
    fs.unlinkSync(csvPath);
  });
});

req.on("error", (e) => {
  console.error("Request error:", e.message);
  fs.unlinkSync(csvPath);
});

req.write(bodyBuf);
req.end();
