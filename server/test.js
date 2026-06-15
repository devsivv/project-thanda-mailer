const fs = require('fs');
const path = require('path');

async function runTests() {
  console.log("=== RUNNING PHASE 1 MANUAL TESTS ===");
  
  // Create a dummy CSV file with duplicates
  const csvContent = `name,email,company
Alice,alice@example.com,Acme
Bob,bob@example.com,Beta
Charlie,charlie@example.com,CharlieCorp
Alice2,alice@example.com,Acme2
Bob2,BOB@EXAMPLE.COM,Beta2`;
  
  fs.writeFileSync('test_contacts.csv', csvContent);
  console.log("Created test_contacts.csv");

  try {
    const formData = new FormData();
    const fileBlob = new Blob([fs.readFileSync('test_contacts.csv')], { type: 'text/csv' });
    formData.append("file", fileBlob, "test_contacts.csv");
    
    console.log("\nA. & B. Testing CSV upload with duplicates...");
    const uploadRes = await fetch("http://localhost:5000/upload", {
      method: "POST",
      body: formData
    });
    const uploadData = await uploadRes.json();
    console.log("Upload Response:", JSON.stringify(uploadData, null, 2));

    console.log("\nC. Test email with attachment...");
    const testFormData = new FormData();
    testFormData.append("gmail", "fake@gmail.com");
    testFormData.append("appPassword", "fakepassword");
    testFormData.append("subject", "Test Sub");
    testFormData.append("body", "Test Body");
    const testEmailRes = await fetch("http://localhost:5000/send-test-email", {
      method: "POST",
      body: testFormData
    });
    const testEmailData = await testEmailRes.json();
    console.log("Test Email Response:", testEmailData);

    console.log("\nD. & E. Bulk email (testing delay & invalid email)...");
    const bulkFormData = new FormData();
    bulkFormData.append("gmail", "fake@gmail.com");
    bulkFormData.append("appPassword", "fakepassword");
    bulkFormData.append("subject", "Bulk Sub");
    bulkFormData.append("body", "Bulk Body");
    bulkFormData.append("delay", "500");
    bulkFormData.append("campaignId", "test_campaign_123");
    
    // We send to 2 valid-looking emails and 1 invalid
    const recipients = [
      { name: "John", email: "john@example.com", company: "A" },
      { name: "Bad", email: "invalid-email", company: "B" }
    ];
    bulkFormData.append("recipients", JSON.stringify(recipients));

    // Start bulk send asynchronously
    const bulkPromise = fetch("http://localhost:5000/send-emails", {
      method: "POST",
      body: bulkFormData
    });

    // Poll progress
    for (let i = 0; i < 3; i++) {
      await new Promise(r => setTimeout(r, 400));
      const progRes = await fetch("http://localhost:5000/campaign-status/test_campaign_123");
      if (progRes.ok) {
        const progData = await progRes.json();
        console.log(`Progress check ${i+1}:`, progData);
      }
    }

    const bulkRes = await bulkPromise;
    const bulkData = await bulkRes.json();
    console.log("Bulk Send Response:", JSON.stringify(bulkData, null, 2));

  } catch (err) {
    console.error("Test Error:", err);
  } finally {
    fs.unlinkSync('test_contacts.csv');
  }
}

runTests();
