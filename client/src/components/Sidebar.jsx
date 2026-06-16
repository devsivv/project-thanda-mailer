const NAV_ITEMS = [
  { id: "overview",  label: "Overview",        icon: "⊞" },
  { id: "outreach",  label: "Outreach Builder", icon: "✉" },
  { id: "templates", label: "Templates",        icon: "≡" },
  { id: "campaign-results", label: "Campaign Results", icon: "◎" },
  { id: "history",   label: "History",          icon: "◷" },
];


export default function Sidebar({ activePage, navigate, sidebarOpen, setSidebarOpen }) {
  return (
    <>
      <aside className={`sidebar${sidebarOpen ? " sidebar--open" : ""}`}>
        <div className="sidebar__logo">
          <div className="sidebar__logo-title">Thanda Mail</div>
          <div className="sidebar__logo-sub">Cold outreach. Delivered reliably.</div>
        </div>

        <nav className="sidebar__nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`sidebar__item${activePage === item.id ? " sidebar__item--active" : ""}`}
              onClick={() => navigate(item.id)}
            >
              <span className="sidebar__icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar__footer">Thanda Mail · v2.0</div>
      </aside>

      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <button
        className="hamburger"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open menu"
      >
        ☰
      </button>
    </>
  );
}
