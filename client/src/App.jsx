import { useState, useEffect } from "react";
import "./App.css";

import Sidebar             from "./components/Sidebar";
import LandingPage         from "./pages/LandingPage";
import OverviewPage        from "./pages/OverviewPage";
import OutreachBuilderPage from "./pages/OutreachBuilderPage";
import TemplatesPage       from "./pages/TemplatesPage";
import CampaignResultsPage from "./pages/CampaignResultsPage";
import HistoryPage         from "./pages/HistoryPage";
import SettingsPage        from "./pages/SettingsPage";
import TestEmailModal      from "./components/TestEmailModal";
import LoginPage           from "./pages/LoginPage";
import SignupPage          from "./pages/SignupPage";
import { useAuth }         from "./context/useAuth";


const API_URL = import.meta.env.DEV ? "/api" : (import.meta.env.VITE_API_URL || "");

export default function App() {
  // ============================================================
  // AUTH STATE (must be first hooks — hooks cannot be conditional)
  // ============================================================
  const { user, session, loading: authLoading, signOut } = useAuth();
  const [authPage, setAuthPage] = useState("login"); // "login" | "signup"

  // ============================================================
  // STATE
  // ============================================================

  const [fileName, setFileName]       = useState("");
  const [file, setFile]               = useState(null);
  const [previews, setPreviews]       = useState([]);
  const [contacts, setContacts]       = useState([]);
  const [sending, setSending]         = useState(false);
  const [attachment, setAttachment]   = useState(null);
  const [delay, setDelay]             = useState(2000);
  const [sendResults, setSendResults] = useState(null);
  const [progress, setProgress]       = useState(null);
  const [lastCampaignResults, setLastCampaignResults] = useState(() => {
    return JSON.parse(localStorage.getItem("thanda_last_results") || "null");
  });
  const [lastCampaignId, setLastCampaignId] = useState(null);
  const [templateMessage, setTemplateMessage] = useState("");
  const [showTestModal, setShowTestModal] = useState(false);
  const [showTestEmailModal, setShowTestEmailModal] = useState(false);
  const [deleteTemplateIdx, setDeleteTemplateIdx] = useState(null);
  const [showCancelCampaignModal, setShowCancelCampaignModal] = useState(false);
  const [alertModal, setAlertModal] = useState({ open: false, title: "", body: "" });
  const [showLaunchCampaignModal, setShowLaunchCampaignModal] = useState(false);

  const showAlert = (title, body) => {
    setAlertModal({ open: true, title, body });
  };

  const [savedTemplates, setSavedTemplates] = useState(() =>
    JSON.parse(localStorage.getItem("thanda_templates") || "[]")
  );
  const [templateName, setTemplateName] = useState("");

  const [campaignHistory, setCampaignHistory] = useState(() =>
    JSON.parse(localStorage.getItem("thanda_history") || "[]")
  );

  const [subject, setSubject] = useState(
    "Opportunity for {{name}} at {{company}}"
  );
  const [body, setBody] = useState(
    `Hi {{name}},\n\nI came across {{company}} and wanted to reach out.\n\nMy name is Shivam Dubey and I help companies with [YOUR SERVICE].\n\nI thought this might be relevant for your team at {{company}}.\n\nI've attached my resume for reference.\n\nWould you be open to a brief conversation?\n\nBest regards,\nShivam Dubey\n\nEmail: your@email.com\nPhone: +91 XXXXX XXXXX`
  );

  // Navigation state
  const [activePage, setActivePage]   = useState("landing");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ============================================================
  // API HANDLERS
  // ============================================================
  const startPolling = (campaignId) => {
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`${API_URL}/campaign-status/${campaignId}`);
        if (res.ok) {
          const statusData = await res.json();
          console.log("[Frontend] campaign status transitioned:", statusData);
          setProgress({ 
            total: statusData.total, 
            sent: statusData.sent,
            failed: statusData.failed,
            currentRecipient: statusData.currentRecipient,
            recentActivity: statusData.recentActivity
          });
          if (statusData.completed === true) {
            clearInterval(pollInterval);
            localStorage.removeItem("activeCampaignId");
            localStorage.removeItem("campaignInProgress");
            setSending(false);
            setProgress(null);

            // Compile campaign results
            const results = statusData.results || [];
            const acceptedCount = results.filter(r => r.status === "Sent").length;
            const rejectedCount = results.filter(r => r.status === "Failed").length;
            const total = statusData.total || results.length;
            const successRate = total > 0 ? `${Math.round((acceptedCount / total) * 100)}%` : "0%";

            // Log recipient status and counters
            console.log("=== Campaign Polling Complete ===");
            results.forEach(r => {
              console.log(`[Frontend Poll Log] Recipient: ${r.email}, Status: ${r.status}, sent_count: ${acceptedCount}, failed_count: ${rejectedCount}`);
            });

            const mappedResults = results.map(r => ({
              email: r.email,
              status: r.status,
              error: r.error || ""
            }));

            const resultsData = {
              total,
              acceptedCount,
              rejectedCount,
              successRate,
              results: mappedResults
            };
            setLastCampaignResults(resultsData);
            localStorage.setItem("thanda_last_results", JSON.stringify(resultsData));
          }
        } else if (res.status === 404) {
          clearInterval(pollInterval);
          localStorage.removeItem("activeCampaignId");
          localStorage.removeItem("campaignInProgress");
          setSending(false);
          setProgress(null);
        }
      } catch (error) {
        console.error(error);
      }
    }, 500);
    return pollInterval;
  };

  // ============================================================
  // HOOKS
  // ============================================================
  useEffect(() => {
    const savedCampaignId = localStorage.getItem("activeCampaignId");
    const inProgress = localStorage.getItem("campaignInProgress");
    if (savedCampaignId && inProgress === "true") {
      setTimeout(() => {
        setSending(true);
      }, 0);
      startPolling(savedCampaignId);
    }
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
      setFileName(e.target.files[0].name);
    }
  };

  const uploadCsv = async () => {
    if (!file) { showAlert("CSV Required", "Please select a CSV first"); return; }
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("subject", subject);
      formData.append("body", body);
      const response = await fetch(`${API_URL}/upload`, { method: "POST", body: formData });

      if (!response.ok) {
        let errMsg = `Server returned ${response.status}`;
        try {
          const errData = await response.json();
          if (errData && errData.error) errMsg = errData.error;
        } catch {
          const text = await response.text().catch(() => "");
          if (text && !text.startsWith("<!")) errMsg = text.substring(0, 200);
        }
        showAlert("Upload Failed", errMsg);
        return;
      }

      const data = await response.json();
      setPreviews(data.previews || []);
      setContacts(data.allContacts || []);
      showAlert("CSV Loaded", `${data.contacts || 0} contacts loaded successfully. ${data.duplicatesRemoved || 0} duplicates removed.`);
    } catch (error) {
      console.error(error);
      showAlert("Upload Failed", `Network error: ${error.message}`);
    }
  };


  const saveTemplate = () => {
    if (!templateName) { showAlert("Template Name Required", "Please enter a template name"); return; }
    const newTemplates = [...savedTemplates, { name: templateName, subject, body }];
    setSavedTemplates(newTemplates);
    localStorage.setItem("thanda_templates", JSON.stringify(newTemplates));
    setTemplateName("");
    showAlert("Template Saved", "Template saved successfully!");
  };

  const deleteTemplate = (idx) => {
    setDeleteTemplateIdx(idx);
  };

  const confirmDeleteTemplate = (idx) => {
    const newTemplates = savedTemplates.filter((_, i) => i !== idx);
    setSavedTemplates(newTemplates);
    localStorage.setItem("thanda_templates", JSON.stringify(newTemplates));
    setTemplateMessage("✓ Template deleted successfully");
    setTimeout(() => setTemplateMessage(""), 3000);
  };

  const loadTemplate = (idx) => {
    const t = savedTemplates[idx];
    if (t) {
      setSubject(t.subject);
      setBody(t.body);
      setTemplateMessage("✓ Template loaded successfully");
      setTimeout(() => setTemplateMessage(""), 3000);
      setTimeout(() => {
        const el = document.getElementById("email-content-section");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  };

  const sendTestEmail = () => {
    setShowTestEmailModal(true);
  };

  const sendTestEmailToAddress = async (testRecipient) => {
    try {
      setSending(true);
      const formData = new FormData();
      formData.append("subject", subject);
      formData.append("body", body);
      formData.append("testRecipient", testRecipient);
      if (attachment) formData.append("attachment", attachment);

      const response = await fetch(`${API_URL}/send-test-email`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        let errorMsg = `Server returned status ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData && errorData.error) errorMsg = errorData.error;
        } catch {
          try { const text = await response.text(); if (text) errorMsg = text.substring(0, 100); } catch { /* ignore */ }
        }
        setShowTestEmailModal(false);
        showAlert("Test Email Failed", errorMsg);
        return;
      }

      const data = await response.json();
      setShowTestEmailModal(false);
      if (data.success) {
        setShowTestModal(true);
      } else {
        showAlert("Test Email Failed", data.error || "Sending failed");
      }
    } catch (error) {
      console.error(error);
      setShowTestEmailModal(false);
      showAlert("Test Email Failed", `Network error: ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  const sendEmails = () => {
    if (contacts.length === 0) { showAlert("No Recipients Loaded", "Generate preview first"); return; }
    setShowLaunchCampaignModal(true);
  };

  const executeCampaignSend = async () => {
    setShowLaunchCampaignModal(false);
    try {
      setSending(true);
      setSendResults(null);
      setProgress({ total: contacts.length, sent: 0 });
      const campaignId = Date.now().toString();
      setLastCampaignId(campaignId);
      localStorage.setItem("activeCampaignId", campaignId);
      localStorage.setItem("campaignInProgress", "true");

      const formData = new FormData();
      formData.append("recipients", JSON.stringify(contacts));
      formData.append("subject", subject);
      formData.append("body", body);
      formData.append("delay", delay);
      formData.append("campaignId", campaignId);
      if (attachment) formData.append("attachment", attachment);

      startPolling(campaignId);

      const response = await fetch(`${API_URL}/send-emails`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: formData,
      });
      const data = await response.json();
      console.log("[Frontend] response from /send-emails:", data);
      if (data.success) {
        setSendResults(data.results || []);
        const skipped = contacts.length - (data.results || []).length;
        if (data.cancelled) {
          showAlert("Campaign Stopped", `Campaign Cancelled! Sent: ${data.sent}, Failed: ${(data.results || []).filter((r) => r.status === "Failed").length}, Skipped: ${skipped}`);
        } else {
          showAlert("Campaign Completed", `${data.sent} emails sent successfully`);
        }

        // Compile campaign results
        const results = data.results || [];
        const acceptedCount = results.filter(r => r.status === "Sent").length;
        const rejectedCount = results.filter(r => r.status === "Failed").length;
        const total = contacts.length;
        const successRate = total > 0 ? `${Math.round((acceptedCount / total) * 100)}%` : "0%";

        // Log recipient status and counters
        console.log("=== Campaign Execute Complete ===");
        results.forEach(r => {
          console.log(`[Frontend Execute Log] Recipient: ${r.email}, Status: ${r.status}, sent_count: ${acceptedCount}, failed_count: ${rejectedCount}`);
        });

        const mappedResults = results.map(r => ({
          email: r.email,
          status: r.status,
          error: r.error || ""
        }));

        const resultsData = {
          total,
          acceptedCount,
          rejectedCount,
          successRate,
          results: mappedResults
        };
        setLastCampaignResults(resultsData);
        localStorage.setItem("thanda_last_results", JSON.stringify(resultsData));

        const newHistory = [
          {
            date: new Date().toLocaleString(),
            subject: subject || "Untitled Campaign",
            recipientCount: contacts.length,
            sentCount: data.sent,
            failedCount: (data.results || []).filter((r) => r.status === "Failed").length,
            attachmentName: attachment ? attachment.name : "None",
            cancelled: !!data.cancelled,
          },
          ...campaignHistory,
        ].slice(0, 50);
        setCampaignHistory(newHistory);
        localStorage.setItem("thanda_history", JSON.stringify(newHistory));
      } else {
        showAlert("Campaign Failed", data.error || "Sending failed");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const stopCampaign = () => {
    setShowCancelCampaignModal(true);
  };

  const confirmStopCampaign = async () => {
    try {
      await fetch(`${API_URL}/cancel-campaign/${lastCampaignId}`, { method: "POST" });
    } catch (error) {
      console.error(error);
    }
  };



  // ============================================================
  // NAVIGATION
  // ============================================================
  const navigate = (page) => {
    setActivePage(page);
    setSidebarOpen(false);
  };

  // ============================================================
  // DERIVED VALUES
  // ============================================================
  const totalRecipients = campaignHistory.reduce((s, h) => s + (h.recipientCount || 0), 0);
  const totalAccepted   = campaignHistory.reduce((s, h) => s + (h.sentCount || 0), 0);
  const totalRejected   = campaignHistory.reduce((s, h) => s + (h.failedCount || 0), 0);

  // ============================================================
  // RENDER
  // ============================================================

  // 1. Loading — Supabase is resolving the persisted session
  if (authLoading) {
    return (
      <div className="auth-loading" role="status" aria-label="Loading">
        <div className="auth-loading__spinner" />
        <div className="auth-loading__text">Loading Thanda Mail…</div>
      </div>
    );
  }

  // 2. Auth gate — show Login or Signup if not authenticated
  if (!user) {
    if (authPage === "signup") {
      return <SignupPage onSwitchToLogin={() => setAuthPage("login")} />;
    }
    return <LoginPage onSwitchToSignup={() => setAuthPage("signup")} />;
  }

  // 3. Authenticated — render full application
  return (
    <div className="app">
      <Sidebar
        activePage={activePage}
        navigate={navigate}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        userEmail={user?.email}
        onSignOut={signOut}
      />

      <main className="main">
        {activePage === "landing" && (
          <LandingPage navigate={navigate} />
        )}


        {activePage === "overview" && (
          <OverviewPage
            campaignHistory={campaignHistory}
            totalRecipients={totalRecipients}
            totalAccepted={totalAccepted}
            totalRejected={totalRejected}
            navigate={navigate}
          />
        )}

        {activePage === "outreach" && (
          <OutreachBuilderPage
            delay={delay}               setDelay={setDelay}
            fileName={fileName}         handleFileChange={handleFileChange}
            uploadCsv={uploadCsv}
            subject={subject}           setSubject={setSubject}
            body={body}                 setBody={setBody}
            templateName={templateName} setTemplateName={setTemplateName}
            savedTemplates={savedTemplates}
            saveTemplate={saveTemplate}
            loadTemplate={loadTemplate}
            attachment={attachment}     setAttachment={setAttachment}
            contacts={contacts}
            sending={sending}
            lastCampaignId={lastCampaignId}
            sendEmails={sendEmails}
            sendTestEmail={sendTestEmail}
            stopCampaign={stopCampaign}
            progress={progress}
            sendResults={sendResults}
            previews={previews}
            templateMessage={templateMessage}
          />
        )}

        {activePage === "templates" && (
          <TemplatesPage
            savedTemplates={savedTemplates}
            templateName={templateName}
            setTemplateName={setTemplateName}
            saveTemplate={saveTemplate}
            loadTemplate={loadTemplate}
            deleteTemplate={deleteTemplate}
            templateMessage={templateMessage}
            navigate={navigate}
          />
        )}

        {activePage === "campaign-results" && (
          <CampaignResultsPage
            lastCampaignResults={lastCampaignResults}
          />
        )}

        {activePage === "history" && (
          <HistoryPage campaignHistory={campaignHistory} />
        )}

        {activePage === "settings" && (
          <SettingsPage />
        )}

      </main>

      {showTestEmailModal && (
        <TestEmailModal
          onClose={() => setShowTestEmailModal(false)}
          onSend={sendTestEmailToAddress}
        />
      )}

      {showTestModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-title">✓ Test Email Sent</div>
            <div className="modal-body" style={{ textAlign: "left" }}>
              <p style={{ marginBottom: "12px" }}>Check the inbox (and spam folder) of the recipient address you entered.</p>
              <p>If the email arrived, your campaign is ready to launch.</p>
            </div>
            <button className="btn btn--primary" style={{ width: "100%" }} onClick={() => setShowTestModal(false)}>
              Got It
            </button>
          </div>
        </div>
      )}

      {deleteTemplateIdx !== null && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-title">Delete Template</div>
            <div className="modal-body">
              Are you sure you want to delete template "<strong>{savedTemplates[deleteTemplateIdx]?.name}</strong>"?
            </div>
            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button className="btn btn--secondary" style={{ flex: 1 }} onClick={() => setDeleteTemplateIdx(null)}>
                Cancel
              </button>
              <button className="btn btn--primary" style={{ flex: 1, background: "var(--danger)" }} onClick={() => {
                confirmDeleteTemplate(deleteTemplateIdx);
                setDeleteTemplateIdx(null);
              }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showCancelCampaignModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-title">Cancel Sending</div>
            <div className="modal-body">
              Are you sure you want to stop sending this campaign? This action cannot be undone.
            </div>
            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button className="btn btn--secondary" style={{ flex: 1 }} onClick={() => setShowCancelCampaignModal(false)}>
                No, Keep Sending
              </button>
              <button className="btn btn--primary" style={{ flex: 1, background: "var(--danger)" }} onClick={() => {
                confirmStopCampaign();
                setShowCancelCampaignModal(false);
              }}>
                Yes, Stop
              </button>
            </div>
          </div>
        </div>
      )}

      {showLaunchCampaignModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-title">Launch Campaign</div>
            <div className="modal-body">
              Are you sure you want to launch this campaign to <strong>{contacts.length}</strong> recipients?
            </div>
            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button className="btn btn--secondary" style={{ flex: 1 }} onClick={() => setShowLaunchCampaignModal(false)}>
                Cancel
              </button>
              <button className="btn btn--primary" style={{ flex: 1 }} onClick={executeCampaignSend}>
                Launch Campaign
              </button>
            </div>
          </div>
        </div>
      )}

      {alertModal.open && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-title">{alertModal.title}</div>
            <div className="modal-body" style={{ textAlign: "left", whiteSpace: "pre-wrap" }}>
              {alertModal.body}
            </div>
            <button className="btn btn--primary" style={{ width: "100%", marginTop: "20px" }} onClick={() => setAlertModal({ open: false, title: "", body: "" })}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}