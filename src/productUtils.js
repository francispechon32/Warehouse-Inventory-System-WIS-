/** Shared product / low-stock helpers (Dashboard ↔ Product page). */

export const LOW_STOCK_THRESHOLD = 50;
export const MIN_STOCK = 1;
export const MIN_WARNING_LEVEL = 1;

/** No zero stock in the system — floor at 1. */
export function normalizeStock(stock) {
  const n = Number(stock) || 0;
  return n < MIN_STOCK ? MIN_STOCK : n;
}

export function normalizeWarningLevel(level) {
  const n = Number(level) || LOW_STOCK_THRESHOLD;
  return n < MIN_WARNING_LEVEL ? MIN_WARNING_LEVEL : n;
}

/** Derive status from current stock (ignores manual STATUS column on import). */
export function deriveProductStatus(stock, warningLevel = LOW_STOCK_THRESHOLD) {
  const n = normalizeStock(stock);
  const warn = normalizeWarningLevel(warningLevel);
  return n <= warn ? "Low Stock" : "Active";
}

export function isLowStock(product) {
  if (!product) return false;
  const n = normalizeStock(product.stock);
  const warn = normalizeWarningLevel(product.warningLevel);
  return n >= MIN_STOCK && n <= warn;
}

export function syncProductStatus(product) {
  const stock = normalizeStock(product.stock);
  const warningLevel = normalizeWarningLevel(product.warningLevel);
  const targetMax = Math.max(warningLevel, Number(product.targetMax) || warningLevel * 4);
  const avgCost = Number(product.avgCost) || 0;
  const totalValue = Number(product.totalValue) || stock * avgCost;
  return {
    ...product,
    stock,
    warningLevel,
    targetMax,
    totalValue,
    status: deriveProductStatus(stock, warningLevel),
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
