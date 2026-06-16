const NAV_ITEMS = [
  { id: "overview",         label: "Overview",         icon: "⊞" },
  { id: "outreach",         label: "Outreach Builder",  icon: "✉" },
  { id: "templates",        label: "Templates",         icon: "≡" },
  { id: "campaign-results", label: "Campaign Results",  icon: "◎" },
  { id: "history",          label: "History",           icon: "◷" },
  { id: "settings",         label: "Settings",          icon: "⚙" },
];


export default function Sidebar({ activePage, navigate, sidebarOpen, setSidebarOpen, userEmail, onSignOut }) {
  return (
    <>
      <aside className={`sidebar${sidebarOpen ? " sidebar--open" : ""}`}>
        <div className="sidebar__logo">
          <div className="sidebar__logo-title">Thanda Mail</div>
          <div className="sidebar__logo-sub">Cold outreach. Delivered reliably.</div>
        </div>

        <nav className="sidebar__nav" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`sidebar__item${activePage === item.id ? " sidebar__item--active" : ""}`}
              onClick={() => navigate(item.id)}
              aria-current={activePage === item.id ? "page" : undefined}
            >
              <span className="sidebar__icon" aria-hidden="true">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar__user">
          {userEmail && (
            <div className="sidebar__user-email" title={userEmail}>
              {userEmail}
            </div>
          )}
          <button
            className="sidebar__signout"
            onClick={onSignOut}
            aria-label="Sign out"
          >
            <span aria-hidden="true">↩</span>
            Sign Out
          </button>
        </div>

        <div className="sidebar__footer">Thanda Mail · v2.0</div>
      </aside>

      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <button
        className="hamburger"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open navigation menu"
      >
        ☰
      </button>
    </>
  );
}
