/** Shared product / low-stock helpers (Dashboard ↔ Product page). */

export const LOW_STOCK_THRESHOLD = 50;
export const MIN_STOCK = 1;

/** No zero stock in the system — floor at 1. */
export function normalizeStock(stock) {
  const n = Number(stock) || 0;
  return n < MIN_STOCK ? MIN_STOCK : n;
}

/** Derive status from current stock (ignores manual STATUS column on import). */
export function deriveProductStatus(stock) {
  const n = normalizeStock(stock);
  return n <= LOW_STOCK_THRESHOLD ? "Low Stock" : "Active";
}

export function isLowStock(product) {
  if (!product) return false;
  const n = normalizeStock(product.stock);
  return n >= MIN_STOCK && n <= LOW_STOCK_THRESHOLD;
}

export function syncProductStatus(product) {
  const stock = normalizeStock(product.stock);
  const avgCost = Number(product.avgCost) || 0;
  const totalValue = Number(product.totalValue) || stock * avgCost;
  return {
    ...product,
    stock,
    totalValue,
    status: deriveProductStatus(stock),
  };
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
 */
export function getUniqueStockAlerts(products) {
  const low = getLowStockProducts(products);
  const bySku = new Map();

  low.forEach((p) => {
    const key = (p.sku || "").trim().toUpperCase();
    if (!key) return;
    const existing = bySku.get(key);
    if (!existing || normalizeStock(p.stock) < normalizeStock(existing.stock)) {
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

/** Merge import rows: last row wins per SKU, status from stock (min 1). */
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
