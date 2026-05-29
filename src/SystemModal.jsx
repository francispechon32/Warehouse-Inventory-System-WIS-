import { useState } from "react";
import {
  MODAL_THEME,
  ModalBackdrop,
  ModalFrame,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalSurface,
  ModalCallout,
  ModalSearch,
  ModalBtn,
  ModalFaqItem,
  ModalContactCard,
  ModalGuideTab,
  ModalGuidePanel,
} from "./ModalUI";

const MODAL_META = {
  logout: { title: "Confirm Logout", subtitle: "Securely exit your active session", center: false, width: 440 },
  "user-management": { title: "User Management", subtitle: "Manage system administrators and operators", center: true, width: 780 },
  "stock-limits": { title: "Configure Stock Thresholds", subtitle: "Set minimum stock alert level warnings per category", center: true, width: 900 },
  "user-guide": { title: "WIS Platform User Guide", subtitle: "Step-by-step instructions for utilizing the system", center: true, width: 860 },
  faqs: { title: "Frequently Asked Questions", subtitle: "Answers to typical issues and questions", center: true, width: 680 },
  about: { title: "About WIS Platform", subtitle: "Technical details and software information", center: true, width: 500 },
  contact: { title: "Contact Customer Support", subtitle: "Send a ticket to support engineers", center: true, width: 660 },
};

const FAQ_ITEMS = [
  { q: "How are stock alert levels determined?", a: "Stock alerts are triggered when the quantity of a product falls below the threshold set in Settings → Stock Limits. Limits apply per SKU and update as you save changes." },
  { q: "Can I undo a Stock Out transaction?", a: "Yes. Record a corrective Stock In entry on Stock Sheets to balance the ledger, or register a customer Return on the Returns page to restore on-hand quantity." },
  { q: "How do I add new system operator accounts?", a: "Administrators open Settings → User Management, choose Add new user, then enter the full name and role. The account appears in the list right away." },
  { q: "Where do I track pending supplier deliveries?", a: "Open Purchasing Order and filter by Pending status, or use the Home dashboard Pending Deliveries metric to jump there directly." },
  { q: "How do I generate inventory reports?", a: "Use Export on Ending Inventory, Stock Sheets, or Backload Inventory to download Excel files. Purchasing Order also supports export for PO summaries." },
  { q: "How do I reset my password?", a: "On the login screen, use Forgot password and follow the email link. If you are already signed in, contact your administrator or IT support to reset access." },
];

const GUIDE_TABS = [
  { id: "getting-started", emoji: "🚀", label: "Getting Started" },
  { id: "stock", emoji: "📋", label: "Stock Sheets" },
  { id: "ending", emoji: "📦", label: "Ending Inventory" },
  { id: "po", emoji: "🛒", label: "Purchase Orders" },
];

function IconLogOut({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

export default function SystemModal({
  type,
  onClose,
  onAction,
  products = [],
  setProducts,
}) {
  const [users, setUsers] = useState([
    { id: 1, name: "Francis Pechon", email: "francis@wis.com", role: "Administrator", status: "Active" },
    { id: 2, name: "Chelsea Lopez", email: "chelsea.lopez@tdt.com", role: "Warehouse Manager", status: "Active" },
    { id: 3, name: "Jane Smith", email: "jane@wis.com", role: "Staff", status: "Active" },
    { id: 4, name: "Alex Jones", email: "alex.jones@wis.com", role: "Staff", status: "Inactive" },
  ]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [newUserRole, setNewUserRole] = useState("Staff");
  const [localThresholdRows, setLocalThresholdRows] = useState(() =>
    (products || []).map((p) => ({
      id: p.id,
      sku: p.sku,
      desc: p.description,
      current: Number(p.stock) || 0,
      warningLevel: Number(p.warningLevel) || 50,
      targetMax: Number(p.targetMax) || (Number(p.warningLevel) || 50) * 4,
    }))
  );
  const [guideTab, setGuideTab] = useState("getting-started");
  const [localFaqs, setLocalFaqs] = useState({});
  const [contactName, setContactName] = useState("Chelsea Lopez");
  const [contactEmail, setContactEmail] = useState("chelsea.lopez@tdt.com");
  const [contactTopic, setContactTopic] = useState("Question");
  const [contactMessage, setContactMessage] = useState("");
  const [stockSearch, setStockSearch] = useState("");

  const meta = MODAL_META[type] || MODAL_META.contact;
  const theme = MODAL_THEME[type] || MODAL_THEME.contact;

  const handleSaveLimits = () => {
    const byId = new Map(localThresholdRows.map((r) => [r.id, r]));
    setProducts((prev) =>
      prev.map((p) => {
        const row = byId.get(p.id);
        if (!row) return p;
        return {
          ...p,
          warningLevel: Math.max(1, Number(row.warningLevel) || 1),
          targetMax: Math.max(1, Number(row.targetMax) || 1),
        };
      })
    );
    onAction("Stock limits saved successfully!", "success");
    onClose();
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    if (!contactMessage.trim()) {
      onAction("Please type a message before submitting.", "error");
      return;
    }
    onAction("Support ticket sent! We'll reply within 24 hours.", "success");
    onClose();
  };

  const filteredUsers = users.filter(
    (u) => !userSearch || u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const stockRows = localThresholdRows;

  return (
    <ModalBackdrop onClose={onClose}>
      <ModalFrame maxWidth={meta.width}>
        <ModalHeader
          theme={theme}
          title={meta.title}
          subtitle={meta.subtitle}
          center={meta.center}
          hideIcon={["user-management", "stock-limits", "user-guide", "about"].includes(type)}
          onClose={onClose}
        />
        <ModalBody>
          {type === "logout" && (
            <ModalSurface style={{ textAlign: "center", padding: "28px 24px" }}>
              <div style={{
                width: 64, height: 64, borderRadius: "50%", background: "#fee2e2",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#dc2626", margin: "0 auto 18px",
              }}>
                <IconLogOut size={28} />
              </div>
              <p style={{ margin: "0 0 24px", fontSize: 14, color: "#475569", lineHeight: 1.55 }}>
                Are you sure you want to log out? Any unsaved edits might be discarded. You will be redirected to the login screen.
              </p>
              <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
                <ModalBtn variant="secondary" onClick={onClose}>Cancel</ModalBtn>
                <ModalBtn variant="danger" onClick={() => { onAction("Logged out successfully!", "success"); onClose(); }}>Yes, Log Out</ModalBtn>
              </div>
            </ModalSurface>
          )}

          {type === "user-management" && (
            <ModalSurface>
              <div className="wis-modal-toolbar">
                <ModalSearch placeholder="Search users..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} />
                <ModalBtn variant="primary" onClick={() => setShowAddUser((v) => !v)}>
                  {showAddUser ? "Cancel" : "+ Add new user"}
                </ModalBtn>
              </div>
              {showAddUser && (
                <div style={{ background: "#f8fafc", border: "1px solid #e8ecf1", borderRadius: 12, padding: 16, marginBottom: 16 }}>
                  <p style={{ margin: "0 0 12px", fontWeight: 700, color: "#0f172a" }}>New user</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                    <div>
                      <label className="wis-modal-form-label">Full name</label>
                      <input className="wis-modal-form-input" placeholder="e.g. Maria Santos" value={newUserName} onChange={(e) => setNewUserName(e.target.value)} />
                    </div>
                    <div>
                      <label className="wis-modal-form-label">Assign role</label>
                      <select className="wis-modal-form-input" value={newUserRole} onChange={(e) => setNewUserRole(e.target.value)}>
                        <option value="Administrator">Administrator</option>
                        <option value="Warehouse Manager">Warehouse Manager</option>
                        <option value="Staff">Staff</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                    <ModalBtn variant="secondary" onClick={() => { setShowAddUser(false); setNewUserName(""); }}>Cancel</ModalBtn>
                    <ModalBtn variant="primary" onClick={() => {
                      if (!newUserName.trim()) { onAction("Please enter a full name", "error"); return; }
                      const autoEmail = `${newUserName.trim().toLowerCase().replace(/\s+/g, ".")}@wis.com`;
                      setUsers((prev) => [...prev, { id: Date.now(), name: newUserName.trim(), email: autoEmail, role: newUserRole, status: "Active" }]);
                      onAction(`User ${newUserName.trim()} added successfully!`, "success");
                      setNewUserName(""); setNewUserRole("Staff"); setShowAddUser(false);
                    }}>Save</ModalBtn>
                  </div>
                </div>
              )}
              <div className="wis-modal-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th><th>Role</th><th>Last active</th><th>Status</th><th style={{ textAlign: "right" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u, i) => {
                      const avatarColors = [["#E6F1FB", "#0C447C"], ["#EAF3DE", "#3B6D11"], ["#FAEEDA", "#854F0B"], ["#FAECE7", "#993C1D"]];
                      const [avatarBg, avatarFg] = avatarColors[i % avatarColors.length];
                      const initials = u.name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
                      const lastActive = u.id <= 2 ? "Active now" : u.id === 3 ? "2 hours ago" : "Yesterday";
                      const isNow = lastActive === "Active now";
                      return (
                        <tr key={u.id}>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={{ width: 36, height: 36, borderRadius: "50%", background: avatarBg, color: avatarFg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800 }}>{initials}</div>
                              <div>
                                <p style={{ margin: 0, fontWeight: 700, color: "#0f172a" }}>{u.name}</p>
                                <p style={{ margin: "2px 0 0", fontSize: 11, color: "#94a3b8" }}>{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td>
                            <select value={u.role} onChange={(e) => setUsers((prev) => prev.map((x) => x.id === u.id ? { ...x, role: e.target.value } : x))} style={{ border: "none", background: "none", fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                              <option value="Administrator">Administrator</option>
                              <option value="Warehouse Manager">Warehouse Manager</option>
                              <option value="Staff">Staff</option>
                            </select>
                          </td>
                          <td>
                            <span style={{ fontSize: 12, color: isNow ? "#16a34a" : "#94a3b8", display: "flex", alignItems: "center", gap: 6 }}>
                              {isNow && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#16a34a" }} />}
                              {lastActive}
                            </span>
                          </td>
                          <td>
                            <span onClick={() => setUsers((prev) => prev.map((x) => x.id === u.id ? { ...x, status: x.status === "Active" ? "Inactive" : "Active" } : x))} style={{
                              fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 20, cursor: "pointer",
                              background: u.status === "Active" ? "#dcfce7" : "#fee2e2",
                              color: u.status === "Active" ? "#16a34a" : "#dc2626",
                            }}>{u.status}</span>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <ModalBtn variant="secondary" disabled={u.id === 1} onClick={() => setUsers((prev) => prev.filter((x) => x.id !== u.id))} style={{ padding: "6px 12px", fontSize: 12 }}>Remove</ModalBtn>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </ModalSurface>
          )}

          {type === "stock-limits" && (
            <ModalSurface>
              <ModalCallout accent={theme.accent}>
                Manage minimum and maximum inventory thresholds for each SKU. Warning level triggers a low-stock alert; target max is the reorder ceiling.
              </ModalCallout>
              <ModalSearch placeholder="Search SKU or description..." id="stock-search-input" value={stockSearch} onChange={(e) => setStockSearch(e.target.value)} />
              <div className="wis-modal-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>SKU code</th><th>Item description</th><th style={{ textAlign: "center" }}>Current stock</th>
                      <th style={{ textAlign: "center" }}>Warning level</th><th style={{ textAlign: "center" }}>Target max</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockRows.filter((row) => {
                      const q = stockSearch.trim().toLowerCase();
                      if (!q) return true;
                      return row.sku.toLowerCase().includes(q) || row.desc.toLowerCase().includes(q);
                    }).map((row) => {
                      const isLow = row.current <= row.warningLevel;
                      return (
                        <tr key={row.sku}>
                          <td style={{ fontFamily: "monospace", fontSize: 12, color: "#64748b" }}>{row.sku}</td>
                          <td style={{ fontWeight: 600, color: "#0f172a" }}>{row.desc}</td>
                          <td style={{ textAlign: "center" }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 800, color: isLow ? "#dc2626" : "#16a34a" }}>
                              <span style={{ width: 8, height: 8, borderRadius: "50%", background: isLow ? "#dc2626" : "#16a34a" }} />
                              {row.current}
                            </span>
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <input type="number" className="wis-modal-form-input" style={{ width: 72, textAlign: "center", padding: "8px" }} value={row.warningLevel} min={1}
                              onChange={(e) => {
                                const v = Math.max(1, parseInt(e.target.value, 10) || 1);
                                setLocalThresholdRows((prev) =>
                                  prev.map((x) => (x.id === row.id ? { ...x, warningLevel: v } : x))
                                );
                              }} />
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <input
                              type="number"
                              className="wis-modal-form-input"
                              style={{ width: 72, textAlign: "center", padding: "8px" }}
                              value={row.targetMax}
                              min={1}
                              onChange={(e) => {
                                const v = Math.max(1, parseInt(e.target.value, 10) || 1);
                                setLocalThresholdRows((prev) =>
                                  prev.map((x) => (x.id === row.id ? { ...x, targetMax: v } : x))
                                );
                              }}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </ModalSurface>
          )}

          {type === "user-guide" && (
            <div className="wis-modal-guide-layout">
              <div className="wis-modal-guide-sidebar">
                {GUIDE_TABS.map((t) => (
                  <ModalGuideTab key={t.id} active={guideTab === t.id} emoji={t.emoji} label={t.label} onClick={() => setGuideTab(t.id)} />
                ))}
              </div>
              {guideTab === "getting-started" && (
                <ModalGuidePanel title="System Introduction">
                  <p>The Warehouse Inventory System (WIS) gives you instant tracking over steel products, stock-in pipelines, and stock-out deliveries.</p>
                  <h5 style={{ margin: "16px 0 10px", fontSize: 13, fontWeight: 800, color: "#334155", textAlign: "left" }}>Workflow Steps</h5>
                  <ol style={{ margin: 0, paddingLeft: 20, textAlign: "left" }}>
                    <li style={{ marginBottom: 10 }}>
                      <strong>Access the System</strong>
                      <p style={{ margin: "4px 0 0", fontSize: 12, color: "#475569", lineHeight: 1.6 }}>Log in using your authorized account credentials to securely access the Warehouse Inventory System (WIS).</p>
                    </li>
                    <li style={{ marginBottom: 10 }}>
                      <strong>Review Dashboard Overview</strong>
                      <p style={{ margin: "4px 0 0", fontSize: 12, color: "#475569", lineHeight: 1.6 }}>Upon logging in, check the dashboard for important warehouse updates and inventory summaries.</p>
                    </li>
                    <li style={{ marginBottom: 10 }}>
                      <strong>Verify Incoming Deliveries</strong>
                      <p style={{ margin: "4px 0 0", fontSize: 12, color: "#475569", lineHeight: 1.6 }}>Before recording inventory, confirm the details of incoming deliveries. This step ensures that accurate deliveries are entered into the system.</p>
                    </li>
                    <li style={{ marginBottom: 10 }}>
                      <strong>Create or Update PO</strong>
                      <p style={{ margin: "4px 0 0", fontSize: 12, color: "#475569", lineHeight: 1.6 }}>Proper purchase order management helps maintain organized supplier records and inventory planning.</p>
                    </li>
                    <li style={{ marginBottom: 10 }}>
                      <strong>Record Stock In/Out Transaction</strong>
                      <p style={{ margin: "4px 0 0", fontSize: 12, color: "#475569", lineHeight: 1.6 }}>Add newly delivered items into the inventory system and all outgoing inventory. Ensures accurate monitoring of all incoming and released quantities inventory.</p>
                    </li>
                    <li style={{ marginBottom: 10 }}>
                      <strong>Monitor Inventory Level</strong>
                      <p style={{ margin: "4px 0 0", fontSize: 12, color: "#475569", lineHeight: 1.6 }}>Regularly review inventory quantities to prevent overstocking, identify low stock items, and monitor fast-moving products. Consistent monitoring improves inventory control.</p>
                    </li>
                    <li style={{ marginBottom: 0 }}>
                      <strong>Conduct Ending Inventory</strong>
                      <p style={{ margin: "4px 0 0", fontSize: 12, color: "#475569", lineHeight: 1.6 }}>Every end of the month, users must finalize the inventory. Helps ensure that all inventory records are accurate and updated every month.</p>
                    </li>
                  </ol>
                </ModalGuidePanel>
              )}
              {guideTab === "stock" && (
                <ModalGuidePanel title="How to Use Stock Sheets">
                  <p>Stock Sheets record all permanent inventory movements — Stock In (replenishing) and Stock Out (releasing) — keeping your warehouse data accurate and up to date.</p>
                  <ol style={{ margin: "12px 0 0", paddingLeft: 20, textAlign: "left" }}>
                    <li style={{ marginBottom: 10 }}>
                      <strong>Open Stock Sheets</strong>
                      <p style={{ margin: "4px 0 0", fontSize: 12, color: "#475569", lineHeight: 1.6 }}>Go to the sidebar menu and click the Stock Sheets button to open the inventory records page.</p>
                    </li>
                    <li style={{ marginBottom: 10 }}>
                      <strong>Search Bar</strong>
                      <p style={{ margin: "4px 0 0", fontSize: 12, color: "#475569", lineHeight: 1.6 }}>Use the search bar or filter options to quickly find specific items by item code, item name, category, or warehouse location.</p>
                    </li>
                    <li style={{ marginBottom: 10 }}>
                      <strong>View Item Details</strong>
                      <p style={{ margin: "4px 0 0", fontSize: 12, color: "#475569", lineHeight: 1.6 }}>Select an item to view important information such as the item description, category, warehouse location, stock quantity, and stock movement records.</p>
                    </li>
                    <li style={{ marginBottom: 10 }}>
                      <strong>Update Information</strong>
                      <p style={{ margin: "4px 0 0", fontSize: 12, color: "#475569", lineHeight: 1.6 }}>Edit or update inventory details such as stock quantity, item description, storage location, and unit information when needed.</p>
                    </li>
                    <li style={{ marginBottom: 10 }}>
                      <strong>Record Stock-In</strong>
                      <p style={{ margin: "4px 0 0", fontSize: 12, color: "#475569", lineHeight: 1.6 }}>Enter all newly delivered items into the system by adding the received quantity and updating the available stock balance.</p>
                    </li>
                    <li style={{ marginBottom: 10 }}>
                      <strong>Record Stock-Out</strong>
                      <p style={{ margin: "4px 0 0", fontSize: 12, color: "#475569", lineHeight: 1.6 }}>Record all released or outgoing items by entering the released quantity and updating the remaining stock balance.</p>
                    </li>
                    <li style={{ marginBottom: 10 }}>
                      <strong>Save Changes</strong>
                      <p style={{ margin: "4px 0 0", fontSize: 12, color: "#475569", lineHeight: 1.6 }}>After updating inventory records, click the Save button to apply all changes and keep the inventory data updated.</p>
                    </li>
                    <li style={{ marginBottom: 0 }}>
                      <strong>Export</strong>
                      <p style={{ margin: "4px 0 0", fontSize: 12, color: "#475569", lineHeight: 1.6 }}>Use the export function to save copies of stock sheet records for monitoring and reporting purposes.</p>
                    </li>
                  </ol>
                </ModalGuidePanel>
              )}
              {guideTab === "ending" && (
                <ModalGuidePanel title="How to Use Ending Inventory">
                  <p>Ending Inventory is conducted every end of the month to reconcile system records with actual physical counts, ensuring all stock data remains accurate and updated.</p>
                  <ol style={{ margin: "12px 0 0", paddingLeft: 20, textAlign: "left" }}>
                    <li style={{ marginBottom: 10 }}>
                      <strong>Open Ending Inventory</strong>
                      <p style={{ margin: "4px 0 0", fontSize: 12, color: "#475569", lineHeight: 1.6 }}>Navigate to the Ending Inventory page from the sidebar to begin the month-end inventory process.</p>
                    </li>
                    <li style={{ marginBottom: 10 }}>
                      <strong>Import WIS Data</strong>
                      <p style={{ margin: "4px 0 0", fontSize: 12, color: "#475569", lineHeight: 1.6 }}>Import the latest WIS Excel file to automatically populate system quantities, average unit costs, and total values for each SKU.</p>
                    </li>
                    <li style={{ marginBottom: 10 }}>
                      <strong>Perform Physical Count</strong>
                      <p style={{ margin: "4px 0 0", fontSize: 12, color: "#475569", lineHeight: 1.6 }}>Physically count all items in the warehouse and enter the actual counted quantities in the Qty as per Counting column for each product.</p>
                    </li>
                    <li style={{ marginBottom: 10 }}>
                      <strong>Review Variances</strong>
                      <p style={{ margin: "4px 0 0", fontSize: 12, color: "#475569", lineHeight: 1.6 }}>The system automatically computes the variance between WIS quantity and physical count. Investigate and resolve any discrepancies before finalizing.</p>
                    </li>
                    <li style={{ marginBottom: 10 }}>
                      <strong>Add Remarks</strong>
                      <p style={{ margin: "4px 0 0", fontSize: 12, color: "#475569", lineHeight: 1.6 }}>Use the Remarks column to note any damaged items, missing stock, or other relevant observations per SKU.</p>
                    </li>
                    <li style={{ marginBottom: 10 }}>
                      <strong>Finalize Inventory</strong>
                      <p style={{ margin: "4px 0 0", fontSize: 12, color: "#475569", lineHeight: 1.6 }}>Once all counts are verified and variances are resolved, click Start Ending Inventory to lock in the final inventory for the month.</p>
                    </li>
                    <li style={{ marginBottom: 0 }}>
                      <strong>Export Report</strong>
                      <p style={{ margin: "4px 0 0", fontSize: 12, color: "#475569", lineHeight: 1.6 }}>Export the completed ending inventory as an Excel file for record-keeping, auditing, and management reporting.</p>
                    </li>
                  </ol>
                </ModalGuidePanel>
              )}
              {guideTab === "po" && (
                <ModalGuidePanel title="How to Use Purchase Orders">
                  <p>Purchase Orders help track all supplier procurements from creation to delivery, keeping supplier records organized and inventory planning on schedule.</p>
                  <ol style={{ margin: "12px 0 0", paddingLeft: 20, textAlign: "left" }}>
                    <li style={{ marginBottom: 10 }}>
                      <strong>Open Purchase Orders</strong>
                      <p style={{ margin: "4px 0 0", fontSize: 12, color: "#475569", lineHeight: 1.6 }}>Go to the sidebar and click Purchase Orders to access all supplier procurement records.</p>
                    </li>
                    <li style={{ marginBottom: 10 }}>
                      <strong>Create a New PO</strong>
                      <p style={{ margin: "4px 0 0", fontSize: 12, color: "#475569", lineHeight: 1.6 }}>Click the Add PO button and fill in the required details including supplier name, product description, quantity, unit cost, and expected delivery date (ETA).</p>
                    </li>
                    <li style={{ marginBottom: 10 }}>
                      <strong>Track PO Status</strong>
                      <p style={{ margin: "4px 0 0", fontSize: 12, color: "#475569", lineHeight: 1.6 }}>Monitor each PO's status — Pending or Delivered — to stay updated on outstanding and completed supplier orders.</p>
                    </li>
                    <li style={{ marginBottom: 10 }}>
                      <strong>Filter and Search</strong>
                      <p style={{ margin: "4px 0 0", fontSize: 12, color: "#475569", lineHeight: 1.6 }}>Use the search bar and status filters to quickly locate specific purchase orders by supplier, product, or delivery status.</p>
                    </li>
                    <li style={{ marginBottom: 10 }}>
                      <strong>Update PO Details</strong>
                      <p style={{ margin: "4px 0 0", fontSize: 12, color: "#475569", lineHeight: 1.6 }}>Edit existing POs to update quantities, costs, ETA, or status as new information becomes available from suppliers.</p>
                    </li>
                    <li style={{ marginBottom: 10 }}>
                      <strong>Mark as Delivered</strong>
                      <p style={{ margin: "4px 0 0", fontSize: 12, color: "#475569", lineHeight: 1.6 }}>Once goods arrive, update the PO status to Delivered. This confirms receipt and supports accurate inventory and backload records.</p>
                    </li>
                    <li style={{ marginBottom: 0 }}>
                      <strong>Export PO Records</strong>
                      <p style={{ margin: "4px 0 0", fontSize: 12, color: "#475569", lineHeight: 1.6 }}>Use the Export button to download PO records as an Excel file for procurement tracking, auditing, and management review.</p>
                    </li>
                  </ol>
                </ModalGuidePanel>
              )}
            </div>
          )}

          {type === "faqs" && (
            <div>
              {FAQ_ITEMS.map((faq, i) => (
                <ModalFaqItem
                  key={faq.q}
                  index={i}
                  question={faq.q}
                  answer={faq.a}
                  open={!!localFaqs[i]}
                  onToggle={() => setLocalFaqs((prev) => ({ ...prev, [i]: !prev[i] }))}
                  accent={theme.accent}
                />
              ))}
            </div>
          )}

          {type === "about" && (
            <ModalSurface>
              <div className="wis-modal-about-hero">
                <div className="wis-modal-about-logo">WIS</div>
                <h3 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 800 }}>Warehouse Inventory System</h3>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: theme.accent }}>Version 2.4.0 (Enterprise Premium)</p>
              </div>
              <div className="wis-modal-about-spec">
                {[
                  ["Developer Partner", "TDT Steel Corp. Engineering"],
                  ["Technical Platform", "React 19 + Vite + ES Modules"],
                  ["Database Status", "● SECURE & SYNCED"],
                  ["Build Stamp", "2026-05-21-PRM"],
                ].map(([k, v]) => (
                  <div key={k} className="wis-modal-about-spec__row">
                    <span style={{ color: "#64748b" }}>{k}</span>
                    <span style={{ fontWeight: 700, color: k.includes("Status") ? "#16a34a" : "#0f172a" }}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{ textAlign: "center" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#dcfce7", color: "#15803d", padding: "8px 16px", borderRadius: 24, fontSize: 12, fontWeight: 800 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#16a34a" }} />
                  ALL SYSTEMS OPERATIONAL
                </span>
              </div>
            </ModalSurface>
          )}

          {type === "contact" && (
            <form onSubmit={handleContactSubmit}>
              <div className="wis-modal-contact-grid">
                <ModalContactCard icon="✉" label="Support email" value="support@tdtpowersteel.com" />
                <ModalContactCard icon="📞" label="Phone / hotline" value="+63 (2) 8XXX-XXXX" />
                <ModalContactCard icon="🕐" label="Hours" value="Mon–Fri, 8:00 AM – 5:00 PM" />
                <ModalContactCard icon="⚡" label="Response time" value="Within 1 business day" />
              </div>
              <ModalSurface>
                <p style={{ margin: "0 0 16px", fontSize: 13, color: "#475569", lineHeight: 1.5 }}>
                  Experiencing technical difficulties? Submit a help ticket and our team will respond shortly.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                  <div>
                    <label className="wis-modal-form-label">Your Name</label>
                    <input className="wis-modal-form-input" value={contactName} onChange={(e) => setContactName(e.target.value)} required />
                  </div>
                  <div>
                    <label className="wis-modal-form-label">Email Address</label>
                    <input type="email" className="wis-modal-form-input" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} required />
                  </div>
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label className="wis-modal-form-label">Inquiry Category</label>
                  <select className="wis-modal-form-input" value={contactTopic} onChange={(e) => setContactTopic(e.target.value)}>
                    <option value="Question">General Question</option>
                    <option value="Bug">Technical Bug Report</option>
                    <option value="Feature">Feature Request</option>
                    <option value="Other">Other Topic</option>
                  </select>
                </div>
                <div style={{ marginBottom: 18 }}>
                  <label className="wis-modal-form-label">Message</label>
                  <textarea className="wis-modal-form-input" rows={4} style={{ resize: "none" }} placeholder="Describe your issue or request..." value={contactMessage} onChange={(e) => setContactMessage(e.target.value)} required />
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                  <ModalBtn variant="secondary" onClick={onClose}>Cancel</ModalBtn>
                  <button type="submit" className="wis-modal-btn wis-modal-btn--primary">Submit Support Ticket</button>
                </div>
              </ModalSurface>
            </form>
          )}
        </ModalBody>
        {type === "stock-limits" && (
          <ModalFooter>
            <ModalBtn variant="secondary" onClick={onClose}>Cancel</ModalBtn>
            <ModalBtn variant="primary" onClick={handleSaveLimits}>Save changes</ModalBtn>
          </ModalFooter>
        )}
      </ModalFrame>
    </ModalBackdrop>
  );
}