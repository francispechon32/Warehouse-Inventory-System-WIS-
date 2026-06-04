import { useState } from "react";

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest to Oldest" },
  { value: "oldest", label: "Oldest to Newest" },
  { value: "az", label: "A\u2013Z" },
  { value: "za", label: "Z\u2013A" },
];

export default function useSort(dateField, textField) {
  const [sortBy, setSortBy] = useState("newest");

  function applySort(data) {
    if (!data || data.length < 2) return data;
    return [...data].sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (b[dateField] || "").localeCompare(a[dateField] || "");
        case "oldest":
          return (a[dateField] || "").localeCompare(b[dateField] || "");
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
