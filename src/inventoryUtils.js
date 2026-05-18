/** Shared ending-inventory and PO priority helpers (Dashboard ↔ Ending Inventory). */

/** Pending POs with ETA on or before this many days from today count as high priority. */
export const PO_HIGH_PRIORITY_ETA_DAYS = 7;

export function normalizeEndingRow(row, idFallback) {
  const qtyAsPerWis = Number(row.qtyAsPerWis) || 0;
  const avgUnitCost = Number(row.avgUnitCost) || 0;
  const totalUnitCost = Number(row.totalUnitCost) || qtyAsPerWis * avgUnitCost;
  return {
    ...row,
    id: row.id ?? row.no ?? idFallback,
    qtyAsPerWis,
    avgUnitCost,
    totalUnitCost,
  };
}

export function buildInitialEndingInventory(seedRows) {
  return seedRows.map((r, i) => normalizeEndingRow({ ...r }, r.no ?? i + 1));
}

export function sumEndingInventoryValue(rows) {
  return (rows || []).reduce((sum, r) => sum + (Number(r.totalUnitCost) || 0), 0);
}

export function formatCompactPHP(n) {
  const v = Number(n) || 0;
  if (v >= 1_000_000) return `₱${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `₱${(v / 1_000).toFixed(1)}K`;
  return `₱${v.toLocaleString("en-PH", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

/**
 * High priority = status Pending and ETA is today, overdue, or within PO_HIGH_PRIORITY_ETA_DAYS.
 */
export function getHighPriorityPendingOrders(orders, etaDays = PO_HIGH_PRIORITY_ETA_DAYS) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return (orders || []).filter((o) => {
    if (o.status !== "Pending") return false;
    const eta = new Date(`${o.eta}T12:00:00`);
    if (Number.isNaN(eta.getTime())) return false;
    const daysUntilEta = (eta - today) / (1000 * 60 * 60 * 24);
    return daysUntilEta <= etaDays;
  });
}
