import { useState } from "react";

/* ── tiny icon helpers ── */
function X({ s = 16 }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
function ChevL({ s = 14 }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}
function ChevR({ s = 14 }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}
function IconEdit({ s = 14 }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}
function IconPlus({ s = 14 }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
function IconSearch({ s = 14 }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
    </svg>
  );
}
function IconCheck({ s = 14 }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function IconClock({ s = 13 }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
function IconUser({ s = 14 }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  );
}
function IconShield({ s = 14 }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

/* ─────────────────────────────────────────────
   USER GUIDE DATA
───────────────────────────────────────────── */
const GUIDE_PAGES = [
  {
    id: "dashboard",
    title: "Dashboard Overview",
    icon: "🏠",
    content: {
      intro: "The Dashboard is your central command center for monitoring warehouse activity in real-time.",
      sections: [
        { heading: "Metric Cards", body: "Four key performance indicators are displayed at the top: Total List of SKU, Total Pending Deliveries, Total Inventory Value, and Transactions Today. Click any card to navigate directly to the relevant module." },
        { heading: "Inventory Movement Chart", body: "A bar chart comparing daily Stock In vs. Stock Out over the last 7 days. Orange bars represent incoming stock; teal bars represent outgoing stock." },
        { heading: "Top Released Items", body: "Displays the top 5 most-released SKUs based on cumulative stock-out transactions. Progress bars show relative release volume." },
        { heading: "Stock Alerts", body: "Lists all SKUs whose current quantity is at or below the defined warning level. Click any row to view the affected SKU in the Product page." },
        { heading: "Recent Activity", body: "A live feed of the latest stock-in and stock-out transactions, sorted by most recent. Green dots = received; red dots = released." },
      ],
    },
  },
  {
    id: "product",
    title: "Product (List of SKU)",
    icon: "📦",
    content: {
      intro: "The Product page maintains the master catalog of all Stock Keeping Units (SKUs) tracked in the warehouse.",
      sections: [
        { heading: "Adding a New SKU", body: "Click the '+ Add Product' button in the top-right corner. Fill in the SKU code, description, unit of measure, warning level, and target max. Click Save to confirm." },
        { heading: "Editing a Product", body: "Click the edit (pencil) icon on any row. Modify the necessary fields and click Save. Changes are reflected immediately across all modules." },
        { heading: "Status Filters", body: "Use the status filter dropdown to view All, In Stock, Low Stock, or Out of Stock items. Low stock items are highlighted for quick identification." },
        { heading: "Warning Level", body: "The warning level is the minimum quantity threshold. When a SKU's stock drops to or below this number, it appears in Stock Alerts on the Dashboard." },
        { heading: "Search & Sort", body: "Use the search bar to find SKUs by code or description. Click column headers to sort ascending or descending." },
      ],
    },
  },
  {
    id: "management",
    title: "Management",
    icon: "🗂️",
    isParent: true,
    subPages: [
      {
        id: "ending-inventory",
        title: "Ending Inventory",
        icon: "📋",
        content: {
          intro: "The Ending Inventory page records monthly closing stock values for each SKU in the warehouse.",
          sections: [
            { heading: "What is Ending Inventory?", body: "Ending inventory is the total quantity and value of goods remaining in the warehouse at the close of a period (typically month-end). It serves as the beginning inventory for the next period." },
            { heading: "Editing Records", body: "Click on any row to update the ending quantity or unit cost for a SKU. The system automatically computes the total value (quantity × unit cost)." },
            { heading: "Total Inventory Value", body: "The aggregate ending inventory value is surfaced on the Dashboard metric card and updates in real-time as records are modified." },
            { heading: "Export", body: "Use the Export button to download the current ending inventory as a CSV or Excel file for reporting and auditing purposes." },
          ],
        },
      },
      {
        id: "backload-inventory",
        title: "Backload Inventory",
        icon: "🚛",
        content: {
          intro: "Backload Inventory tracks goods that are being shipped back to the warehouse or supplier from delivery trucks.",
          sections: [
            { heading: "What is Backload?", body: "Backloaded items are goods returned from delivery routes — either unsold items, damaged goods, or items returned by customers during a route." },
            { heading: "Recording a Backload", body: "Click '+ Add Backload'. Enter the SKU, quantity, reason (e.g. unsold, damaged, customer return), and the date. Save the record to update inventory." },
            { heading: "Impact on Inventory", body: "Backloaded quantities are added back to the available stock for the relevant SKU, and a stock-in transaction is logged in the Stock Sheets." },
            { heading: "Status Tracking", body: "Each backload record carries a status: Received, Pending Inspection, or Disposed. Update the status as items are processed." },
          ],
        },
      },
      {
        id: "advance-customer-po",
        title: "Advance Customer PO",
        icon: "👥",
        content: {
          intro: "Advance Customer PO manages pre-orders placed by customers before stock is physically available for release.",
          sections: [
            { heading: "What is an Advance PO?", body: "An Advance Customer Purchase Order is a commitment from a customer to purchase a specific quantity of a SKU on a future date, often before the goods arrive at the warehouse." },
            { heading: "Creating an Advance PO", body: "Click '+ Add Advance PO'. Enter the customer name, SKU, quantity, expected fulfillment date, and any notes. The system flags the stock as reserved." },
            { heading: "Reserved Stock", body: "SKUs linked to an Advance PO show a 'Reserved' indicator on the Product page. Reserved quantities are deducted from available (free) stock in real-time." },
            { heading: "Fulfillment", body: "When goods arrive and the PO is ready for release, update the status to 'Fulfilled'. This triggers a stock-out transaction automatically in the Stock Sheets." },
          ],
        },
      },
      {
        id: "return",
        title: "Return",
        icon: "↩️",
        content: {
          intro: "The Return module handles all items sent back to the warehouse by customers after delivery.",
          sections: [
            { heading: "Types of Returns", body: "Returns can be categorized as: Damaged, Wrong Item, Customer Refusal, or Defective. Each category affects downstream reporting differently." },
            { heading: "Creating a Return Record", body: "Click '+ Add Return'. Select the SKU, enter the quantity, choose the return reason, and input the originating delivery reference. Save to log the return." },
            { heading: "Inventory Adjustment", body: "Returned items in 'Good Condition' are automatically added back to available stock. Items marked 'Damaged' or 'Defective' are quarantined and require manual disposition." },
            { heading: "Return Reports", body: "View return summaries by date range, SKU, or reason. This data helps identify recurring product quality issues or delivery problems." },
          ],
        },
      },
    ],
  },
  {
    id: "stock-sheets",
    title: "Stock Sheets",
    icon: "📊",
    content: {
      intro: "Stock Sheets provide a complete transaction ledger of all stock movements — both inbound (Stock In) and outbound (Stock Out).",
      sections: [
        { heading: "Stock In", body: "Records all incoming goods: supplier deliveries, backloads, and returns. Each entry captures the date, SKU, quantity, reference number, and remarks." },
        { heading: "Stock Out", body: "Records all outgoing goods: customer deliveries, advance PO fulfillments, and disposals. Entries include the date, SKU, quantity, destination, and reference." },
        { heading: "Adding Transactions", body: "Use the '+ Add Stock In' or '+ Add Stock Out' buttons to log new movements. The SKU's available quantity updates immediately upon saving." },
        { heading: "Filtering & Search", body: "Filter by date range, transaction type, or SKU. Use the search bar for quick lookup by reference number or product description." },
        { heading: "Export", body: "Export stock sheet data to Excel for external reporting, audit submissions, or integration with accounting systems." },
      ],
    },
  },
  {
    id: "purchasing-order",
    title: "Purchasing Order",
    icon: "🛒",
    content: {
      intro: "The Purchasing Order module manages all purchase orders sent to suppliers for replenishing warehouse inventory.",
      sections: [
        { heading: "Creating a Purchase Order", body: "Click '+ New PO'. Select the supplier, add line items (SKU + quantity), set the expected delivery date, and submit. The PO status starts as 'Pending'." },
        { heading: "PO Statuses", body: "Pending — awaiting delivery. Received — goods have arrived and stock has been updated. Cancelled — PO was voided before fulfillment." },
        { heading: "Receiving a PO", body: "When goods arrive, open the PO and click 'Mark as Received'. The system logs a Stock In transaction for each line item and updates product quantities." },
        { heading: "Pending Deliveries", body: "The Dashboard metric card shows the total count of pending POs. Click it to jump directly to the Purchasing Order page filtered by 'Pending' status." },
      ],
    },
  },
];

/* ─────────────────────────────────────────────
   TEAM DATA  — updated names
───────────────────────────────────────────── */
const TEAM = [
  {
    name: "Trixie P. Pechon",
    role: "UI/UX Designer",
    initials: "TP",
    color: "#8b5cf6",
    bg: "#ede9fe",
    contributions: ["Wireframes", "Design System", "User Flows"],
  },
  {
    name: "Francis Pechon",
    role: "Frontend Developer",
    initials: "FP",
    color: "#e87c27",
    bg: "#fff7ed",
    contributions: ["Dashboard UI", "Stock Sheets", "Component Library"],
  },
  {
    name: "Lala Elaine",
    role: "QA",
    initials: "LE",
    color: "#10b981",
    bg: "#d1fae5",
    contributions: ["Test Cases", "Bug Reporting", "UAT Coordination"],
  },
];

const ROLE_BADGE_COLORS = {
  "Frontend Developer": { bg: "#fff7ed", color: "#c2410c", border: "#fed7aa" },
  "UI/UX Designer":    { bg: "#ede9fe", color: "#6d28d9", border: "#ddd6fe" },
  "QA":                { bg: "#d1fae5", color: "#047857", border: "#a7f3d0" },
  "Business Analyst":  { bg: "#ffe4e6", color: "#be123c", border: "#fecdd3" },
  "Project Manager":   { bg: "#f1f5f9", color: "#334155", border: "#cbd5e1" },
};

/* ─────────────────────────────────────────────
   INITIAL SEED USERS
───────────────────────────────────────────── */
const SEED_USERS = [
  { id: 1, name: "Chelsea Lopez",  role: "Admin",  lastActive: "Active now"  },
  { id: 2, name: "Mark Reyes",     role: "Staff",  lastActive: "2 hours ago" },
  { id: 3, name: "Alyssa Santos",  role: "Viewer", lastActive: "Yesterday"   },
];
const ROLES = ["Admin", "Staff", "Viewer"];

/* ─────────────────────────────────────────────
   MODAL SHELL
───────────────────────────────────────────── */
export default function SystemModal({ type, onClose, onAction, products, setProducts }) {
  return (
    <>
      <style>{`
        @keyframes wisModalIn { from { opacity:0; transform:scale(.95) translateY(8px) } to { opacity:1; transform:none } }
        .wis-modal-overlay { position:fixed; inset:0; z-index:9000; background:rgba(15,23,42,.55); backdrop-filter:blur(6px); display:flex; align-items:center; justify-content:center; padding:20px; }
        .wis-modal-box { background:#fff; border-radius:20px; width:100%; display:flex; flex-direction:column; overflow:hidden; box-shadow:0 24px 64px rgba(0,0,0,.22); animation:wisModalIn .28s cubic-bezier(.16,1,.3,1); }
      `}</style>
      <div className="wis-modal-overlay" onClick={onClose}>
        <div className="wis-modal-box"
          style={{
            maxWidth:
              type === "user-guide"      ? 820 :
              type === "contact"         ? 620 :
              type === "faqs"            ? 680 :
              type === "user-management" ? 620 :
              type === "stock-limits"    ? 640 :
              540,
            maxHeight: "92vh",
          }}
          onClick={e => e.stopPropagation()}
        >
          {type === "user-guide"      && <UserGuideModal    onClose={onClose} />}
          {type === "about"           && <AboutModal        onClose={onClose} />}
          {type === "logout"          && <LogoutModal       onClose={onClose} onAction={onAction} />}
          {type === "user-management" && <UserMgmtModal     onClose={onClose} onAction={onAction} />}
          {type === "stock-limits"    && <StockLimitsModal  onClose={onClose} products={products} setProducts={setProducts} onAction={onAction} />}
          {type === "faqs"            && <FAQsModal         onClose={onClose} />}
          {type === "contact"         && <ContactModal      onClose={onClose} onAction={onAction} />}
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────
   USER GUIDE MODAL
───────────────────────────────────────────── */
function UserGuideModal({ onClose }) {
  const [selectedPage, setSelectedPage] = useState(GUIDE_PAGES[0]);
  const [selectedSub,  setSelectedSub]  = useState(null);

  const activePage = selectedSub || selectedPage;
  const mgmtPage   = GUIDE_PAGES.find(p => p.isParent);

  const handleNav = (page) => { setSelectedPage(page); setSelectedSub(null); };

  return (
    <>
      <style>{`
        .wg-sidebar { width:220px; min-width:220px; background:#f8fafc; border-right:1px solid #e9ecef; overflow-y:auto; padding:8px 0 20px; flex-shrink:0; }
        .wg-nav-btn { display:flex; align-items:center; gap:9px; width:100%; padding:9px 16px; border:none; background:none; text-align:left; cursor:pointer; font-size:13px; font-weight:500; color:#6b7280; border-left:3px solid transparent; transition:all .15s; font-family:inherit; }
        .wg-nav-btn:hover { background:#f1f5f9; color:#111827; }
        .wg-nav-btn.active { border-left-color:#e87c27; background:#fff7ed; color:#c2410c; font-weight:600; }
        .wg-content { flex:1; overflow-y:auto; padding:28px 30px; text-align:left; }
        .wg-content::-webkit-scrollbar { width:4px; }
        .wg-content::-webkit-scrollbar-thumb { background:#e5e7eb; border-radius:2px; }
        .wg-section { margin-bottom:22px; padding-bottom:22px; border-bottom:1px solid #f3f4f6; }
        .wg-section:last-child { border-bottom:none; margin-bottom:0; padding-bottom:0; }
      `}</style>

      <div style={{ padding:"20px 24px", borderBottom:"1px solid #e9ecef", display:"flex", alignItems:"center", justifyContent:"space-between", background:"linear-gradient(135deg,#fff7ed 0%,#fff 100%)", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:40, height:40, borderRadius:10, background:"linear-gradient(135deg,#e87c27,#c96b1c)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>📖</div>
          <div>
            <h2 style={{ margin:0, fontSize:17, fontWeight:800, color:"#0f172a", textAlign:"left" }}>User Guide</h2>
            <p style={{ margin:0, fontSize:11, color:"#64748b" }}>WIS Platform — How to use each module</p>
          </div>
        </div>
        <button type="button" onClick={onClose} style={{ width:32, height:32, border:"1px solid #e2e8f0", borderRadius:8, background:"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#64748b" }}><X s={15} /></button>
      </div>

      <div style={{ display:"flex", flex:1, minHeight:0 }}>
        <div className="wg-sidebar">
          <p style={{ fontSize:10, fontWeight:700, color:"#94a3b8", letterSpacing:"0.1em", textTransform:"uppercase", padding:"10px 16px 6px" }}>Modules</p>
          {GUIDE_PAGES.map(page => {
            const isActive = page.isParent ? (selectedPage.id === page.id) : (!selectedSub && selectedPage.id === page.id);
            return (
              <button key={page.id} className={`wg-nav-btn ${isActive ? "active" : ""}`} onClick={() => handleNav(page)}>
                <span>{page.icon}</span>{page.title}
              </button>
            );
          })}
        </div>

        <div className="wg-content">
          {selectedSub && (
            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:16, fontSize:12, color:"#9ca3af" }}>
              <span>Management</span><ChevR s={12} /><span style={{ color:"#e87c27", fontWeight:600 }}>{selectedSub.title}</span>
            </div>
          )}
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
            <span style={{ fontSize:28 }}>{activePage.icon}</span>
            <div>
              <h2 style={{ margin:0, fontSize:20, fontWeight:800, color:"#0f172a", letterSpacing:"-0.3px" }}>{activePage.title}</h2>
              {activePage.isParent && <p style={{ margin:"3px 0 0", fontSize:12, color:"#9ca3af" }}>Click a module below to learn more</p>}
            </div>
          </div>

          {activePage.isParent ? (
            <div>
              <p style={{ fontSize:13.5, color:"#374151", lineHeight:1.7, marginBottom:20 }}>
                The <strong>Management</strong> section contains four modules that handle the various inbound and outbound inventory scenarios beyond standard stock transactions.
              </p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                {mgmtPage.subPages.map(sub => (
                  <button key={sub.id} type="button" onClick={() => setSelectedSub(sub)}
                    style={{ background:"#f8fafc", border:"1.5px solid #e2e8f0", borderRadius:12, padding:"16px 18px", textAlign:"left", cursor:"pointer", transition:"all .15s", fontFamily:"inherit" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor="#e87c27"; e.currentTarget.style.background="#fff7ed"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor="#e2e8f0"; e.currentTarget.style.background="#f8fafc"; }}
                  >
                    <div style={{ fontSize:22, marginBottom:8 }}>{sub.icon}</div>
                    <p style={{ margin:0, fontSize:13, fontWeight:700, color:"#0f172a" }}>{sub.title}</p>
                    <p style={{ margin:"4px 0 0", fontSize:12, color:"#6b7280", lineHeight:1.5 }}>{sub.content.intro.slice(0,70)}…</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <p style={{ fontSize:13.5, color:"#374151", lineHeight:1.75, marginBottom:24, padding:"14px 18px", background:"#f8fafc", borderRadius:10, borderLeft:"3px solid #e87c27", textAlign:"left" }}>
                {activePage.content.intro}
              </p>
              {activePage.content.sections.map((sec, i) => (
                <div key={i} className="wg-section">
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                    <div style={{ width:6, height:6, borderRadius:"50%", background:"#e87c27", flexShrink:0 }} />
                    <h3 style={{ margin:0, fontSize:14, fontWeight:700, color:"#111827" }}>{sec.heading}</h3>
                  </div>
                  <p style={{ margin:0, fontSize:13, color:"#4b5563", lineHeight:1.75, paddingLeft:14 }}>{sec.body}</p>
                </div>
              ))}
            </div>
          )}

          {!activePage.isParent && (
            <div style={{ display:"flex", justifyContent:"space-between", marginTop:28, paddingTop:20, borderTop:"1px solid #f3f4f6" }}>
              {(() => {
                const allFlat = GUIDE_PAGES.flatMap(p => p.isParent ? p.subPages : [p]);
                const idx = allFlat.findIndex(p => p.id === activePage.id);
                const prev = allFlat[idx - 1];
                return prev ? (
                  <button type="button" onClick={() => { const parent = GUIDE_PAGES.find(p => p.isParent && p.subPages?.some(s => s.id === prev.id)); if (parent) setSelectedSub(prev); else { setSelectedPage(prev); setSelectedSub(null); } }}
                    style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 14px", borderRadius:8, border:"1px solid #e2e8f0", background:"#fff", cursor:"pointer", fontSize:12, fontWeight:600, color:"#374151", fontFamily:"inherit" }}>
                    <ChevL s={13} /> {prev.title}
                  </button>
                ) : <span />;
              })()}
              {(() => {
                const allFlat = GUIDE_PAGES.flatMap(p => p.isParent ? p.subPages : [p]);
                const idx = allFlat.findIndex(p => p.id === activePage.id);
                const next = allFlat[idx + 1];
                return next ? (
                  <button type="button" onClick={() => { const parent = GUIDE_PAGES.find(p => p.isParent && p.subPages?.some(s => s.id === next.id)); if (parent) setSelectedSub(next); else { setSelectedPage(next); setSelectedSub(null); } }}
                    style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 14px", borderRadius:8, border:"none", background:"linear-gradient(135deg,#e87c27,#c96b1c)", cursor:"pointer", fontSize:12, fontWeight:700, color:"#fff", fontFamily:"inherit" }}>
                    {next.title} <ChevR s={13} />
                  </button>
                ) : <span />;
              })()}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────
   ABOUT MODAL  — updated team names
───────────────────────────────────────────── */
function AboutModal({ onClose }) {
  const [tab, setTab] = useState("system");

  return (
    <>
      <style>{`
        .about-tab { padding:8px 18px; border:none; background:none; cursor:pointer; font-size:13px; font-weight:600; color:#9ca3af; border-bottom:2px solid transparent; transition:all .15s; font-family:inherit; }
        .about-tab.active { color:#e87c27; border-bottom-color:#e87c27; }
        .about-tab:hover { color:#374151; }
        .team-card { background:#f8fafc; border:1px solid #e9ecef; border-radius:12px; padding:18px; transition:all .15s; }
        .team-card:hover { border-color:#e87c27; background:#fff7ed; }
      `}</style>

      <div style={{ padding:"20px 24px 0", borderBottom:"1px solid #e9ecef", background:"linear-gradient(135deg,#fff7ed 0%,#fff 100%)", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:16 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:52, height:52, borderRadius:"50%", background:"linear-gradient(135deg,#c96b1c,#7c3a0a)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:900, fontSize:17, letterSpacing:"-0.5px", boxShadow:"0 4px 14px rgba(201,107,28,.35)" }}>WIS</div>
            <div>
              <h2 style={{ margin:0, fontSize:17, fontWeight:900, color:"#0f172a" , textAlign:"left" }}>About WIS Platform</h2>
              <p style={{ margin:0, fontSize:11, color:"#64748b" }}>Technical details and software information</p>
            </div>
          </div>
          <button type="button" onClick={onClose} style={{ width:32, height:32, border:"1px solid #e2e8f0", borderRadius:8, background:"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#64748b" }}><X s={15} /></button>
        </div>
        <div style={{ display:"flex", gap:2 }}>
          {[["system","System Info"],["team","Our Team"]].map(([k,l]) => (
            <button key={k} className={`about-tab ${tab===k?"active":""}`} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:"24px" }}>
        {tab === "system" && (
          <div>
            <div style={{ textAlign:"center", marginBottom:24 }}>
              <div style={{ width:80, height:80, borderRadius:"50%", background:"linear-gradient(135deg,#c96b1c,#7c3a0a)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:900, fontSize:22, margin:"0 auto 14px", boxShadow:"0 6px 20px rgba(201,107,28,.3)", letterSpacing:"-0.5px" }}>WIS</div>
              <p style={{ margin:0, fontSize:16, fontWeight:800, color:"#94a3b8", letterSpacing:"0.06em", textTransform:"uppercase" }}>Warehouse Inventory System</p>
              <p style={{ margin:"4px 0 0", fontSize:14, fontWeight:700, color:"#e87c27" }}>Version 2.4.0 (Enterprise Premium)</p>
            </div>
            <div style={{ border:"1px solid #e9ecef", borderRadius:12, overflow:"hidden", marginBottom:20 }}>
              {[
                ["Developer Partner", "TDT Steel Corp. Engineering"],
                ["Technical Platform", "React 19 + Vite + ES Modules"],
                ["Database Status", null],
                ["Build Stamp", "2026-05-21-PRM"],
              ].map(([label, val], i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"13px 18px", borderBottom: i < 3 ? "1px solid #f3f4f6" : "none", background: i%2===0?"#fff":"#fafafa" }}>
                  <span style={{ fontSize:13, color:"#6b7280" }}>{label}</span>
                  {label === "Database Status" ? (
                    <span style={{ fontSize:12, fontWeight:700, color:"#16a34a", display:"flex", alignItems:"center", gap:5 }}>
                      <span style={{ width:7, height:7, borderRadius:"50%", background:"#22c55e", display:"inline-block" }} />
                      SECURE &amp; SYNCED
                    </span>
                  ) : (
                    <span style={{ fontSize:13, fontWeight:700, color:"#111827" }}>{val}</span>
                  )}
                </div>
              ))}
            </div>
            <div style={{ background:"#dcfce7", borderRadius:50, padding:"10px 0", textAlign:"center", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
              <span style={{ width:8, height:8, borderRadius:"50%", background:"#16a34a", display:"inline-block" }} />
              <span style={{ fontSize:12, fontWeight:800, color:"#15803d", letterSpacing:"0.06em", textTransform:"uppercase" }}>All Systems Operational</span>
            </div>
          </div>
        )}

        {tab === "team" && (
          <div>
            <p style={{ margin:"0 0 18px", fontSize:13, color:"#6b7280", lineHeight:1.6 }}>
              The WIS Platform was built and maintained by the following team at TDT Steel Corp. Engineering.
            </p>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {TEAM.map((member, i) => {
                const badge = ROLE_BADGE_COLORS[member.role] || { bg:"#f1f5f9", color:"#334155", border:"#cbd5e1" };
                return (
                  <div key={i} className="team-card">
                    <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                      <div style={{ width:48, height:48, borderRadius:"50%", background:member.bg, border:`2px solid ${member.color}44`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:14, color:member.color, flexShrink:0, letterSpacing:"-0.5px" }}>
                        {member.initials}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
                          <p style={{ margin:0, fontSize:14, fontWeight:700, color:"#111827" }}>{member.name}</p>
                          <span style={{ fontSize:11, fontWeight:700, padding:"2px 10px", borderRadius:20, background:badge.bg, color:badge.color, border:`1px solid ${badge.border}` }}>
                            {member.role}
                          </span>
                        </div>
                        <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginTop:8 }}>
                          {member.contributions.map((c, j) => (
                            <span key={j} style={{ fontSize:11, padding:"2px 10px", borderRadius:20, background:"#f3f4f6", color:"#6b7280", fontWeight:500 }}>{c}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop:18, padding:"12px 16px", background:"#f8fafc", borderRadius:10, border:"1px solid #e9ecef" }}>
              <p style={{ margin:0, fontSize:12, color:"#9ca3af", textAlign:"center", lineHeight:1.6 }}>
                Built with ❤️ for TDT PowerSteel Corp. · Marilao, Bulacan<br/>
                <span style={{ color:"#e87c27", fontWeight:600 }}>WIS v2.4.0</span> · Enterprise Premium · Build 2026-05-21-PRM
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────
   LOGOUT MODAL
───────────────────────────────────────────── */
function LogoutModal({ onClose, onAction }) {
  return (
    <div style={{ padding:"32px 28px", textAlign:"center" }}>
      <div style={{ width:60, height:60, borderRadius:"50%", background:"#fee2e2", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
        <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
        </svg>
      </div>
      <h2 style={{ margin:"0 0 8px", fontSize:18, fontWeight:800, color:"#0f172a" }}>Sign Out?</h2>
      <p style={{ margin:"0 0 24px", fontSize:13, color:"#64748b", lineHeight:1.6 }}>
        You will be returned to the login screen.<br/>Any unsaved changes will be lost.
      </p>
      <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
        <button type="button" onClick={onClose} style={{ padding:"10px 24px", borderRadius:10, border:"1px solid #e2e8f0", background:"#fff", cursor:"pointer", fontSize:13, fontWeight:600, color:"#374151", fontFamily:"inherit" }}>Cancel</button>
        <button type="button" onClick={() => onAction?.("Logged out successfully!", "success")} style={{ padding:"10px 24px", borderRadius:10, border:"none", background:"linear-gradient(135deg,#ef4444,#dc2626)", color:"#fff", cursor:"pointer", fontSize:13, fontWeight:700, fontFamily:"inherit" }}>Sign Out</button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   USER MANAGEMENT MODAL  — full CRUD
───────────────────────────────────────────── */
function UserMgmtModal({ onClose, onAction }) {
  const [users, setUsers]         = useState(SEED_USERS);
  const [editingId, setEditingId] = useState(null);
  const [showAdd, setShowAdd]     = useState(false);

  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("Staff");
  const [editRole, setEditRole] = useState("");

  const openEdit = (u) => { setEditingId(u.id); setEditRole(u.role); setShowAdd(false); };
  const cancelEdit = () => setEditingId(null);

  const saveEdit = () => {
    setUsers(prev => prev.map(u => u.id === editingId ? { ...u, role: editRole } : u));
    setEditingId(null);
    onAction?.("User updated successfully!", "success");
  };

  const saveNew = () => {
    if (!newName.trim()) return;
    const initials = newName.trim().split(" ").map(w => w[0]).slice(0,2).join("").toUpperCase();
    setUsers(prev => [...prev, {
      id: Date.now(),
      name: newName.trim(),
      role: newRole,
      lastActive: "Just now",
      initials,
    }]);
    setNewName(""); setNewRole("Staff"); setShowAdd(false);
    onAction?.("New user added successfully!", "success");
  };

  const roleColor = (role) =>
    role === "Admin"  ? { bg:"#fff7ed", color:"#c2410c", border:"#fed7aa" } :
    role === "Staff"  ? { bg:"#eff6ff", color:"#1d4ed8", border:"#bfdbfe" } :
                        { bg:"#f1f5f9", color:"#475569", border:"#e2e8f0" };

  return (
    <>
      <style>{`
        .um-scroll::-webkit-scrollbar { width:4px; }
        .um-scroll::-webkit-scrollbar-thumb { background:#e5e7eb; border-radius:2px; }
        .um-user-row:hover { background:#fafafa; }
        .um-role-select { padding:5px 8px; border:1.5px solid #e87c27; border-radius:7px; font-size:12px; font-weight:600; color:#111827; background:#fff; outline:none; font-family:inherit; cursor:pointer; }
        .um-btn-ghost { display:flex; align-items:center; gap:6px; padding:6px 12px; border:1px solid #e2e8f0; border-radius:8px; background:#fff; cursor:pointer; font-size:12px; font-weight:600; color:#374151; font-family:inherit; transition:all .15s; }
        .um-btn-ghost:hover { border-color:#e87c27; color:#c2410c; background:#fff7ed; }
        .um-btn-save { display:flex; align-items:center; gap:6px; padding:6px 14px; border:none; border-radius:8px; background:linear-gradient(135deg,#e87c27,#c96b1c); cursor:pointer; font-size:12px; font-weight:700; color:#fff; font-family:inherit; }
        .um-add-field { width:100%; padding:9px 12px; border:1.5px solid #e2e8f0; border-radius:9px; font-size:13px; outline:none; font-family:inherit; box-sizing:border-box; transition:border-color .15s; }
        .um-add-field:focus { border-color:#e87c27; box-shadow:0 0 0 3px rgba(232,124,39,.12); }
      `}</style>

      {/* Header */}
      <div style={{ padding:"20px 24px", borderBottom:"1px solid #e9ecef", display:"flex", alignItems:"flex-start", justifyContent:"space-between", background:"linear-gradient(135deg,#fff7ed 0%,#fff 100%)", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:38, height:38, borderRadius:10, background:"linear-gradient(135deg,#e87c27,#c96b1c)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff" }}>
            <IconUser s={18} />
          </div>
          <div>
<h2 style={{ margin:0, fontSize:17, fontWeight:800, color:"#0f172a", textAlign:"left" }}>User Management</h2>            <p style={{ margin:0, fontSize:11, color:"#64748b" }}>Manage system roles, permissions, access logs</p>
          </div>
        </div>
        <button type="button" onClick={onClose} style={{ width:32, height:32, border:"1px solid #e2e8f0", borderRadius:8, background:"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#64748b" }}><X s={15} /></button>
      </div>

      {/* Table header */}
      <div style={{ display:"grid", gridTemplateColumns:"200px 110px 1fr 100px", padding:"10px 24px", background:"#f8fafc", borderBottom:"1px solid #e9ecef", flexShrink:0 }}>
        {[["Name","left"],["Role","center"],["Last Active","left"],["Action","center"]].map(([h, align]) => (
          <span key={h} style={{ fontSize:11, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.07em", textAlign:align }}>{h}</span>
        ))}
      </div>

      {/* User rows */}
      <div className="um-scroll" style={{ flex:1, overflowY:"auto", minHeight:0 }}>
        {users.map(u => {
          const rc = roleColor(u.role);
          const initials = u.initials || u.name.split(" ").map(w => w[0]).slice(0,2).join("").toUpperCase();
          const isEditing = editingId === u.id;

          return (
            <div key={u.id} style={{ display:"grid", gridTemplateColumns:"200px 110px 1fr 100px", alignItems:"center", padding:"14px 24px", borderBottom:"1px solid #f3f4f6", transition:"background .12s", cursor:"default" }}
              onMouseEnter={e => e.currentTarget.style.background="#fafafa"}
              onMouseLeave={e => e.currentTarget.style.background="transparent"}
            >
              {/* Name */}
              <div style={{ display:"flex", alignItems:"center", gap:10, minWidth:0 }}>
                <div style={{ width:36, height:36, borderRadius:"50%", background:rc.bg, border:`1.5px solid ${rc.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:800, color:rc.color, flexShrink:0 }}>
                  {initials}
                </div>
                <p style={{ margin:0, fontSize:13, fontWeight:700, color:"#111827", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                  {u.name}
                </p>
              </div>

              {/* Role */}
              <div style={{ display:"flex", justifyContent:"center" }}>
                {isEditing ? (
                  <select className="um-role-select" value={editRole} onChange={e => setEditRole(e.target.value)} style={{ width:88 }}>
                    {ROLES.map(r => <option key={r}>{r}</option>)}
                  </select>
                ) : (
                  <span style={{ fontSize:12, fontWeight:700, padding:"4px 14px", borderRadius:20, background:rc.bg, color:rc.color, border:`1px solid ${rc.border}`, whiteSpace:"nowrap" }}>
                    {u.role}
                  </span>
                )}
              </div>

              {/* Last Active */}
              <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:12 }}>
                {u.lastActive === "Active now"
                  ? <span style={{ width:7, height:7, borderRadius:"50%", background:"#22c55e", display:"inline-block", flexShrink:0 }} />
                  : <span style={{ color:"#9ca3af", display:"flex", alignItems:"center" }}><IconClock s={13} /></span>
                }
                <span style={{ color: u.lastActive === "Active now" ? "#16a34a" : "#9ca3af", fontWeight: u.lastActive === "Active now" ? 700 : 400 }}>
                  {u.lastActive}
                </span>
              </div>

              {/* Action */}
              <div style={{ display:"flex", justifyContent:"center" }}>
                {isEditing ? (
                  <div style={{ display:"flex", gap:5 }}>
                    <button type="button" className="um-btn-save" onClick={saveEdit}><IconCheck s={12} /></button>
                    <button type="button" className="um-btn-ghost" onClick={cancelEdit} style={{ padding:"6px 10px" }}><X s={12} /></button>
                  </div>
                ) : (
                  <button type="button" className="um-btn-ghost" onClick={() => openEdit(u)}>
                    <IconEdit s={13} /> Edit
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add new user form */}
      {showAdd && (
        <div style={{ padding:"16px 24px", background:"#f8fafc", borderTop:"1px solid #e9ecef", flexShrink:0 }}>
          <p style={{ margin:"0 0 12px", fontSize:13, fontWeight:700, color:"#0f172a" }}>Add New User</p>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 160px", gap:10, marginBottom:10 }}>
            <div>
              <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:5 }}>Full Name</label>
              <input className="um-add-field" value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Juan Dela Cruz" />
            </div>
            <div>
              <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:5 }}>Assign Role</label>
              <select className="um-add-field" value={newRole} onChange={e => setNewRole(e.target.value)} style={{ cursor:"pointer" }}>
                {ROLES.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
            <button type="button" onClick={() => { setShowAdd(false); setNewName(""); setNewRole("Staff"); }}
              style={{ padding:"8px 16px", borderRadius:8, border:"1px solid #e2e8f0", background:"#fff", cursor:"pointer", fontSize:12, fontWeight:600, color:"#374151", fontFamily:"inherit" }}>
              Cancel
            </button>
            <button type="button" onClick={saveNew} disabled={!newName.trim()}
              style={{ padding:"8px 16px", borderRadius:8, border:"none", background: newName.trim() ? "linear-gradient(135deg,#e87c27,#c96b1c)" : "#e5e7eb", color: newName.trim() ? "#fff" : "#9ca3af", cursor: newName.trim() ? "pointer" : "not-allowed", fontSize:12, fontWeight:700, fontFamily:"inherit" }}>
              Save
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ padding:"14px 24px", borderTop:"1px solid #e9ecef", display:"flex", justifyContent:"space-between", alignItems:"center", background:"#fff", flexShrink:0 }}>
        <span style={{ fontSize:12, color:"#9ca3af" }}>{users.length} user{users.length !== 1 ? "s" : ""} total</span>
        {!showAdd && (
          <button type="button" onClick={() => { setShowAdd(true); setEditingId(null); }}
            style={{ display:"flex", alignItems:"center", gap:7, padding:"9px 16px", borderRadius:9, border:"none", background:"linear-gradient(135deg,#e87c27,#c96b1c)", color:"#fff", cursor:"pointer", fontSize:12, fontWeight:700, fontFamily:"inherit", boxShadow:"0 2px 10px rgba(232,124,39,.3)" }}>
            <IconPlus s={13} /> Add New User
          </button>
        )}
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────
   STOCK LIMITS MODAL  — full editable table
───────────────────────────────────────────── */
function StockLimitsModal({ onClose, products, setProducts, onAction }) {
  const [search, setSearch]   = useState("");
  const [edits, setEdits]     = useState({});   // { sku: { warningLevel, targetMax } }

  const filtered = (products || []).filter(p =>
    (p.description || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.sku || "").toLowerCase().includes(search.toLowerCase())
  );

  const getVal = (p, field) => edits[p.sku]?.[field] !== undefined ? edits[p.sku][field] : (p[field] ?? 0);

  const handleChange = (sku, field, val) => {
    setEdits(prev => ({
      ...prev,
      [sku]: { ...prev[sku], [field]: val },
    }));
  };

  const handleSave = () => {
    if (!setProducts) return;
    setProducts(prev => prev.map(p => {
      if (!edits[p.sku]) return p;
      const wl = edits[p.sku]?.warningLevel !== undefined ? Number(edits[p.sku].warningLevel) : p.warningLevel;
      const tm = edits[p.sku]?.targetMax    !== undefined ? Number(edits[p.sku].targetMax)    : p.targetMax;
      return { ...p, warningLevel: wl, targetMax: Math.max(wl, tm) };
    }));
    onAction?.("Stock limits saved successfully!", "success");
    onClose();
  };

  const changedCount = Object.keys(edits).length;

  const stockStatus = (p) => {
    const stock = p.stock ?? p.qty ?? 0;
    const warn  = Number(getVal(p, "warningLevel"));
    if (stock <= 0)    return { label:"Out", bg:"#fee2e2", color:"#dc2626" };
    if (stock <= warn) return { label:"Low", bg:"#fff7ed", color:"#d97706" };
    return               { label:"OK",  bg:"#dcfce7", color:"#16a34a" };
  };

  return (
    <>
      <style>{`
        .sl-scroll::-webkit-scrollbar { width:4px; }
        .sl-scroll::-webkit-scrollbar-thumb { background:#e5e7eb; border-radius:2px; }
        .sl-input { width:72px; padding:6px 8px; border:1.5px solid #e2e8f0; border-radius:8px; font-size:13px; font-weight:600; text-align:center; outline:none; font-family:inherit; transition:border-color .15s, box-shadow .15s; -moz-appearance:textfield; }
        .sl-input::-webkit-outer-spin-button, .sl-input::-webkit-inner-spin-button { -webkit-appearance:none; }
        .sl-input:focus { border-color:#e87c27; box-shadow:0 0 0 3px rgba(232,124,39,.12); }
        .sl-input.changed { border-color:#e87c27; background:#fff7ed; }
        .sl-row { display:grid; grid-template-columns:1fr 90px 88px 88px; align-items:center; gap:12px; padding:12px 24px; border-bottom:1px solid #f3f4f6; transition:background .12s; }
        .sl-row:last-child { border-bottom:none; }
        .sl-row:hover { background:#fafafa; }
      `}</style>

      {/* Header */}
      <div style={{ padding:"20px 24px", borderBottom:"1px solid #e9ecef", display:"flex", alignItems:"center", justifyContent:"space-between", background:"linear-gradient(135deg,#fff7ed 0%,#fff 100%)", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:38, height:38, borderRadius:10, background:"linear-gradient(135deg,#e87c27,#c96b1c)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff" }}>
            <IconShield s={18} />
          </div>
          <div>
            <h2 style={{ margin:0, fontSize:17, fontWeight:800, color:"#0f172a", textAlign:"left" }}>Stock Limits</h2>
            <p style={{ margin:0, fontSize:11, color:"#64748b" }}>Manage minimum and maximum inventory thresholds for each SKU</p>
          </div>
        </div>
        <button type="button" onClick={onClose} style={{ width:32, height:32, border:"1px solid #e2e8f0", borderRadius:8, background:"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#64748b" }}><X s={15} /></button>
      </div>

      {/* Search bar */}
      <div style={{ padding:"12px 24px", borderBottom:"1px solid #f3f4f6", flexShrink:0 }}>
        <div style={{ position:"relative" }}>
          <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"#9ca3af", display:"flex" }}>
            <IconSearch s={15} />
          </span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search SKU code or description…"
            style={{ width:"100%", padding:"8px 12px 8px 32px", border:"1.5px solid #e2e8f0", borderRadius:9, fontSize:13, outline:"none", fontFamily:"inherit", boxSizing:"border-box", transition:"border-color .15s" }}
            onFocus={e => e.target.style.borderColor="#e87c27"}
            onBlur={e => e.target.style.borderColor="#e2e8f0"}
          />
        </div>
      </div>

      {/* Column headers */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 90px 88px 88px", gap:12, padding:"10px 24px", background:"#f8fafc", borderBottom:"1px solid #e9ecef", flexShrink:0 }}>
        {["SKU / Description", "Stock", "Warning Level", "Target Max"].map((h, i) => (
          <span key={h} style={{ fontSize:11, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.07em", textAlign: i > 1 ? "center" : "left" }}>{h}</span>
        ))}
      </div>

      {/* Rows */}
      <div className="sl-scroll" style={{ flex:1, overflowY:"auto", minHeight:0 }}>
        {filtered.length === 0 && (
          <p style={{ textAlign:"center", padding:"32px 0", fontSize:13, color:"#9ca3af" }}>No SKUs match your search.</p>
        )}
        {filtered.map(p => {
          const st = stockStatus(p);
          const warnChanged = edits[p.sku]?.warningLevel !== undefined;
          const maxChanged  = edits[p.sku]?.targetMax    !== undefined;
          const stock = p.stock ?? p.qty ?? 0;

          return (
            <div key={p.sku} className="sl-row">
              {/* Description */}
              <div style={{ minWidth:0 }}>
                <p style={{ margin:0, fontSize:13, fontWeight:600, color:"#111827", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.description}</p>
                <p style={{ margin:"2px 0 0", fontSize:11, color:"#9ca3af" }}>{p.sku}</p>
              </div>

              {/* Current Stock — read-only */}
              <div style={{ textAlign:"center" }}>
                <p style={{ margin:0, fontSize:14, fontWeight:700, color:"#111827" }}>{stock.toLocaleString()}</p>
                <span style={{ fontSize:10, fontWeight:700, padding:"1px 7px", borderRadius:20, background:st.bg, color:st.color }}>{st.label}</span>
              </div>

              {/* Warning Level — editable */}
              <div style={{ display:"flex", justifyContent:"center" }}>
                <input
                  type="number"
                  min={0}
                  className={`sl-input ${warnChanged ? "changed" : ""}`}
                  value={getVal(p, "warningLevel")}
                  onChange={e => handleChange(p.sku, "warningLevel", e.target.value)}
                />
              </div>

              {/* Target Max — editable */}
              <div style={{ display:"flex", justifyContent:"center" }}>
                <input
                  type="number"
                  min={0}
                  className={`sl-input ${maxChanged ? "changed" : ""}`}
                  value={getVal(p, "targetMax")}
                  onChange={e => handleChange(p.sku, "targetMax", e.target.value)}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ padding:"14px 24px", borderTop:"1px solid #e9ecef", display:"flex", justifyContent:"space-between", alignItems:"center", background:"#f8fafc", flexShrink:0 }}>
        <span style={{ fontSize:12, color:"#9ca3af" }}>
          {filtered.length} SKU{filtered.length !== 1 ? "s" : ""}
          {changedCount > 0 && <span style={{ color:"#e87c27", fontWeight:700 }}> · {changedCount} modified</span>}
        </span>
        <div style={{ display:"flex", gap:10 }}>
          <button type="button" onClick={onClose} style={{ padding:"9px 18px", borderRadius:9, border:"1px solid #e2e8f0", background:"#fff", cursor:"pointer", fontSize:13, fontWeight:600, color:"#374151", fontFamily:"inherit" }}>Cancel</button>
          <button type="button" onClick={handleSave}
            style={{ padding:"9px 18px", borderRadius:9, border:"none", background: changedCount > 0 ? "linear-gradient(135deg,#e87c27,#c96b1c)" : "#e5e7eb", color: changedCount > 0 ? "#fff" : "#9ca3af", cursor: changedCount > 0 ? "pointer" : "default", fontSize:13, fontWeight:700, fontFamily:"inherit", transition:"all .15s", boxShadow: changedCount > 0 ? "0 2px 10px rgba(232,124,39,.25)" : "none" }}>
            Save Changes
          </button>
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────
   FAQs MODAL
───────────────────────────────────────────── */
function FAQsModal({ onClose }) {
  const FAQS = [
    { q:"How are stock alert levels determined?", a:"Stock alerts are triggered when the quantity of a product falls below the threshold set in Settings → Stock Limits. Limits apply per SKU and update as you save changes." },
    { q:"Can I undo a Stock Out transaction?", a:"Yes. Record a corrective Stock In entry on Stock Sheets to balance the ledger, or register a customer Return on the Returns page to restore on-hand quantity." },
    { q:"How do I add new system operator accounts?", a:"Administrators open Settings → User Management, choose Add new user, then enter the full name and role. The account appears in the list right away." },
    { q:"Where do I track pending supplier deliveries?", a:"Open Purchasing Order and filter by Pending status, or use the Home dashboard Pending Deliveries metric to jump there directly." },
    { q:"How do I generate inventory reports?", a:"Use Export on Ending Inventory, Stock Sheets, or Backload Inventory to download Excel files. Purchasing Order also supports export for PO summaries." },
    { q:"How do I reset my password?", a:"On the login screen, use Forgot password and follow the email link. If you are already signed in, contact your administrator or IT support to reset access." },
  ];
  const [open, setOpen] = useState(null);

  return (
    <>
      <div style={{ position:"relative", padding:"28px 24px 20px", textAlign:"center", borderBottom:"1px solid #f0f2f5", flexShrink:0 }}>
        <button type="button" onClick={onClose} style={{ position:"absolute", top:16, right:16, width:32, height:32, border:"1px solid #e2e8f0", borderRadius:8, background:"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#64748b" }}><X s={15} /></button>
        <div style={{ width:52, height:52, borderRadius:14, background:"#fff7ed", border:"1px solid #fcd9b0", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 14px", fontSize:22 }}>?</div>
        <h2 style={{ margin:"0 0 4px", fontSize:20, fontWeight:900, color:"#0f172a" }}>Frequently Asked Questions</h2>
        <p style={{ margin:0, fontSize:13, color:"#94a3b8" }}>Answers to typical issues and questions</p>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"16px 24px 24px" }}>
        {FAQS.map((f, i) => (
          <div key={i} style={{ border: open===i ? "1.5px solid #e87c27" : "1px solid #e9ecef", borderRadius:12, marginBottom:10, overflow:"hidden", transition:"border-color .15s, box-shadow .15s", boxShadow: open===i ? "0 2px 12px rgba(232,124,39,0.10)" : "none" }}>
            <button type="button" onClick={() => setOpen(open===i ? null : i)}
              style={{ display:"flex", alignItems:"center", gap:14, width:"100%", padding:"14px 16px", background:"#fff", border:"none", cursor:"pointer", textAlign:"left", fontFamily:"inherit" }}>
              <div style={{ width:30, height:30, borderRadius:8, background:"#e87c27", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:800, flexShrink:0 }}>{i+1}</div>
              <span style={{ flex:1, fontSize:14, fontWeight:700, color:"#0f172a" }}>{f.q}</span>
              <span style={{ color:"#94a3b8", fontSize:11, flexShrink:0, transform: open===i?"rotate(180deg)":"rotate(0deg)", transition:"transform .2s", display:"inline-block" }}>▼</span>
            </button>
            {open===i && (
              <div style={{ padding:"12px 16px 16px", background:"#fff" }}>
                <div style={{ background:"#f8fafc", borderRadius:8, padding:"14px 18px", textAlign:"center" }}>
                  <p style={{ margin:0, fontSize:13, color:"#475569", lineHeight:1.75 }}>{f.a}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────
   CONTACT SUPPORT MODAL
───────────────────────────────────────────── */
function ContactModal({ onClose, onAction }) {
  const [contactName,    setContactName]    = useState("Chelsea Lopez");
  const [contactEmail,   setContactEmail]   = useState("chelsea.lopez@tdt.com");
  const [contactTopic,   setContactTopic]   = useState("Question");
  const [contactMessage, setContactMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!contactMessage.trim()) { onAction?.("Please type a message before submitting.", "error"); return; }
    onAction?.("Support ticket sent! We'll reply within 24 hours.", "success");
    onClose();
  };

  return (
    <>
      <div style={{ padding:"20px 24px", borderBottom:"1px solid #e9ecef", display:"flex", alignItems:"center", justifyContent:"space-between", background:"linear-gradient(135deg,#fff7ed 0%,#fff 100%)", flexShrink:0 }}>
        <div><h2 style={{ margin:0, fontSize:17, fontWeight:800, color:"#0f172a" , textAlign:"left" }}>Contact Support</h2><p style={{ margin:0, fontSize:11, color:"#64748b" }}>Send a ticket to support engineers</p></div>
        <button type="button" onClick={onClose} style={{ width:32, height:32, border:"1px solid #e2e8f0", borderRadius:8, background:"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#64748b" }}><X s={15} /></button>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"20px 24px" }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:20 }}>
          {[
            { icon:"✉", label:"Support email",  value:"support@tdtpowersteel.com" },
            { icon:"📞", label:"Phone / hotline", value:"+63 (2) 8XXX-XXXX" },
            { icon:"🕐", label:"Hours",           value:"Mon–Fri, 8:00 AM – 5:00 PM" },
            { icon:"⚡", label:"Response time",   value:"Within 1 business day" },
          ].map((c, i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 14px", background:"#f8fafc", borderRadius:10, border:"1px solid #e9ecef" }}>
              <div style={{ width:36, height:36, borderRadius:8, background:"#fff7ed", border:"1px solid #fed7aa", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>{c.icon}</div>
              <div>
                <p style={{ margin:0, fontSize:10, fontWeight:700, color:"#9ca3af", textTransform:"uppercase", letterSpacing:"0.06em" }}>{c.label}</p>
                <p style={{ margin:"2px 0 0", fontSize:12, fontWeight:700, color:"#111827" }}>{c.value}</p>
              </div>
            </div>
          ))}
        </div>
        <form onSubmit={handleSubmit}>
          <p style={{ margin:"0 0 14px", fontSize:13, color:"#475569", lineHeight:1.5 }}>Experiencing technical difficulties? Submit a help ticket and our team will respond shortly.</p>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
            <div>
              <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:5 }}>Your Name</label>
              <input value={contactName} onChange={e => setContactName(e.target.value)} required style={{ width:"100%", padding:"9px 12px", border:"1px solid #e2e8f0", borderRadius:8, fontSize:13, outline:"none", fontFamily:"inherit", boxSizing:"border-box" }} />
            </div>
            <div>
              <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:5 }}>Email Address</label>
              <input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} required style={{ width:"100%", padding:"9px 12px", border:"1px solid #e2e8f0", borderRadius:8, fontSize:13, outline:"none", fontFamily:"inherit", boxSizing:"border-box" }} />
            </div>
          </div>
          <div style={{ marginBottom:12 }}>
            <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:5 }}>Inquiry Category</label>
            <select value={contactTopic} onChange={e => setContactTopic(e.target.value)} style={{ width:"100%", padding:"9px 12px", border:"1px solid #e2e8f0", borderRadius:8, fontSize:13, outline:"none", fontFamily:"inherit", background:"#fff", boxSizing:"border-box" }}>
              <option value="Question">General Question</option>
              <option value="Bug">Technical Bug Report</option>
              <option value="Feature">Feature Request</option>
              <option value="Other">Other Topic</option>
            </select>
          </div>
          <div style={{ marginBottom:16 }}>
            <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:5 }}>Message</label>
            <textarea rows={4} value={contactMessage} onChange={e => setContactMessage(e.target.value)} placeholder="Describe your issue or request..." required style={{ width:"100%", padding:"9px 12px", border:"1px solid #e2e8f0", borderRadius:8, fontSize:13, outline:"none", fontFamily:"inherit", resize:"none", boxSizing:"border-box" }} />
          </div>
          <div style={{ display:"flex", justifyContent:"flex-end", gap:10 }}>
            <button type="button" onClick={onClose} style={{ padding:"9px 18px", borderRadius:9, border:"1px solid #e2e8f0", background:"#fff", cursor:"pointer", fontSize:13, fontWeight:600, color:"#374151", fontFamily:"inherit" }}>Cancel</button>
            <button type="submit" style={{ padding:"9px 18px", borderRadius:9, border:"none", background:"linear-gradient(135deg,#e87c27,#c96b1c)", color:"#fff", cursor:"pointer", fontSize:13, fontWeight:700, fontFamily:"inherit" }}>Submit Support Ticket</button>
          </div>
        </form>
      </div>
    </>
  );
}