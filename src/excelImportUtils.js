/** Shared helpers for WIS Excel import (text numbers, dates, header rows). */

export function cellStr(v) {
  if (v == null || v === "") return "";
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v).trim();
}

export function cellNum(v) {
  if (v == null || v === "") return 0;
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  const cleaned = String(v).replace(/,/g, "").trim();
  if (cleaned === "") return 0;
  const n = parseFloat(cleaned);
  return Number.isNaN(n) ? 0 : n;
}

export function formatExcelDate(v) {
  if (v == null || v === "") return "";
  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    return v.toISOString().slice(0, 10);
  }
  if (typeof v === "number" && v > 20000 && v < 60000) {
    const d = excelSerialToDate(v);
    if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }
  const s = cellStr(v);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const parsed = new Date(s);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return s;
}

function excelSerialToDate(serial) {
  return new Date(Math.round((serial - 25569) * 86400 * 1000));
}

export function findHeaderRowIndex(raw, keywords, maxScan = 25) {
  for (let i = 0; i < Math.min(raw.length, maxScan); i++) {
    const row = raw[i];
    if (!row) continue;
    const line = row.map((c) => cellStr(c).toUpperCase()).join(" ");
    if (keywords.every((k) => line.includes(k.toUpperCase()))) return i;
  }
  for (let i = 0; i < Math.min(raw.length, maxScan); i++) {
    const row = raw[i];
    if (!row) continue;
    const line = row.map((c) => cellStr(c).toUpperCase()).join(" ");
    if (keywords.some((k) => line.includes(k.toUpperCase()))) return i;
  }
  return -1;
}

export function colIndex(headers, ...names) {
  const upper = headers.map((h) => cellStr(h).toUpperCase());
  for (const name of names) {
    const key = name.toUpperCase();
    const idx = upper.findIndex((h) => h.includes(key));
    if (idx >= 0) return idx;
  }
  return -1;
}

export function pickCol(r, headers, names, fallbackIndex) {
  if (headers && headers.length) {
    const idx = colIndex(headers, ...names);
    if (idx >= 0) return r[idx];
  }
  return r[fallbackIndex];
}

export function rowHasData(r, minFilled = 2) {
  if (!r || !Array.isArray(r)) return false;
  return r.filter((c) => cellStr(c) !== "").length >= minFilled;
}

export function parseRowId(v, fallback) {
  const s = cellStr(v);
  if (!s) return fallback;
  const n = parseInt(s, 10);
  if (!Number.isNaN(n)) return n;
  return fallback;
}

/** Skip WIS title/metadata/header rows that are not real products. */
export function isInvalidProductRow(sku, description = "") {
  const s = cellStr(sku).toUpperCase();
  const d = cellStr(description).toUpperCase();
  if (!s) return true;
  if (s === "SKU CODE" || s === "NO." || s === "NO") return true;
  if (d === "PRODUCT DESCRIPTION" || s === "PRODUCT DESCRIPTION") return true;
  if (d === "CATEGORY" || s === "CATEGORY" || s === "UNIT" || s === "STATUS") return true;
  if (s.includes("WAREHOUSE") || s.includes("TDT WAREHOUSE") || s.includes("LIST OF SKU")) return true;
  if (s.includes("LOCATION") || s.startsWith("AS OF") || d.includes("LOCATION")) return true;
  if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(s)) return true;
  if (/\d{1,2}:\d{2}/.test(s)) return true;
  return false;
}

export function readWorkbookSheet(file, sheetMatchers) {
  return new Promise((resolve, reject) => {
    if (!window.XLSX) {
      reject(new Error("SheetJS not loaded."));
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = window.XLSX.read(new Uint8Array(e.target.result), {
          type: "array",
          cellDates: true,
          cellText: false,
        });
        let ws = null;
        let sheetName = wb.SheetNames[0];
        for (const name of wb.SheetNames) {
          const upper = name.toUpperCase();
          if (sheetMatchers.some((m) => upper.includes(m.toUpperCase()))) {
            ws = wb.Sheets[name];
            sheetName = name;
            break;
          }
        }
        if (!ws) ws = wb.Sheets[sheetName];
        if (!ws) throw new Error("No valid sheet found.");
        const raw = window.XLSX.utils.sheet_to_json(ws, {
          header: 1,
          defval: null,
          raw: false,
          dateNF: "yyyy-mm-dd",
        });
        resolve({ raw, sheetName });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("Could not read the file."));
    reader.readAsArrayBuffer(file);
  });
}
