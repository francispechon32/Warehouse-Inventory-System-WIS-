import { useState } from "react";

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest to Oldest" },
  { value: "oldest", label: "Oldest to Newest" },
  { value: "az", label: "A–Z" },
  { value: "za", label: "Z–A" },
];

export default function useSort(dateField, textField) {
  const [sortBy, setSortBy] = useState("newest");

  function applySort(data) {
    if (!data || data.length < 2) return data;
    return [...data].sort((a, b) => {
      const va = a[dateField] ?? "";
      const vb = b[dateField] ?? "";

      switch (sortBy) {
        case "newest":
          // both missing → fall back to id (most recently added first)
          if (va === "" && vb === "") return (b.id ?? 0) - (a.id ?? 0);
          if (va === "") return -1;
          if (vb === "") return 1;
          // numeric field (e.g. id) → numeric compare descending
          if (typeof va === "number" && typeof vb === "number") return vb - va;
          // date/string → descending, tiebreak by id
          { const c = String(vb).localeCompare(String(va)); return c !== 0 ? c : (b.id ?? 0) - (a.id ?? 0); }
        case "oldest":
          if (va === "" && vb === "") return (a.id ?? 0) - (b.id ?? 0);
          if (va === "") return 1;
          if (vb === "") return -1;
          if (typeof va === "number" && typeof vb === "number") return va - vb;
          { const c = String(va).localeCompare(String(vb)); return c !== 0 ? c : (a.id ?? 0) - (b.id ?? 0); }
        case "az":
          return String(a[textField] || "").localeCompare(String(b[textField] || ""), undefined, { sensitivity: "base" });
        case "za":
          return String(b[textField] || "").localeCompare(String(a[textField] || ""), undefined, { sensitivity: "base" });
        default:
          return 0;
      }
    });
  }

  return { sortBy, setSortBy, applySort };
}
