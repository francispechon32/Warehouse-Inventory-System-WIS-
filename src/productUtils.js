/** Shared product / low-stock helpers (Dashboard ↔ Product page). */

/** Stock from 0 through this value (inclusive) = Low Stock — avoid zero stock. */
export const LOW_STOCK_THRESHOLD = 50;

/** Derive status from current stock (ignores manual STATUS column on import). */
export function deriveProductStatus(stock) {
  const n = Number(stock) || 0;
  return n <= LOW_STOCK_THRESHOLD ? "Low Stock" : "Active";
}

export function isLowStock(product) {
  if (!product) return false;
  return deriveProductStatus(product.stock) === "Low Stock";
}

export function syncProductStatus(product) {
  return { ...product, status: deriveProductStatus(product.stock) };
}

export function syncProductsStatus(products) {
  return (products || []).map(syncProductStatus);
}

/** All products that should trigger a low-stock alert. */
export function getLowStockProducts(products) {
  return (products || []).filter(isLowStock);
}

/**
 * One alert per SKU (keeps the row with the lowest stock if duplicated).
 * Prevents dashboard showing fewer items than the table when SKUs repeat.
 */
export function getUniqueStockAlerts(products) {
  const low = getLowStockProducts(products);
  const bySku = new Map();

  low.forEach((p) => {
    const key = (p.sku || "").trim().toUpperCase();
    if (!key) return;
    const existing = bySku.get(key);
    if (!existing || (Number(p.stock) || 0) < (Number(existing.stock) || 0)) {
      bySku.set(key, p);
    }
  });

  return Array.from(bySku.values());
}

export function countDuplicateSkus(products) {
  const seen = new Map();
  (products || []).forEach((p) => {
    const key = (p.sku || "").trim().toUpperCase();
    if (!key) return;
    seen.set(key, (seen.get(key) || 0) + 1);
  });
  return [...seen.values()].filter((n) => n > 1).length;
}

/** Merge import rows: last row wins per SKU, status from stock. */
export function dedupeProductsBySku(rows) {
  const bySku = new Map();
  rows.forEach((row) => {
    const key = (row.sku || "").trim().toUpperCase();
    if (!key) return;
    bySku.set(key, row);
  });
  return syncProductsStatus(
    Array.from(bySku.values()).map((p, i) => ({ ...p, id: i + 1 }))
  );
}
