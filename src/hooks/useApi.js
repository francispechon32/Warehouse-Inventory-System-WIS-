import { useState, useCallback, useRef } from "react";
import { USE_MOCK_DATA } from "../api/apiConfig";


export default function useApi(endpoint, seedData = []) {
  
  const mockStore = useRef([...seedData]);
  const nextId    = useRef(Math.max(0, ...seedData.map(r => r.id ?? 0)) + 1);

  const [data,    setData]    = useState([...seedData]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const wrap = useCallback(async (fn) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fn();
      return result;
    } catch (err) {
      const msg = err?.message || "An unexpected error occurred.";
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);


  const getAll = useCallback(() => wrap(async () => {
    if (USE_MOCK_DATA) {
      const rows = [...mockStore.current];
      setData(rows);
      return rows;
    }
    const res = await fetch(endpoint);
    if (!res.ok) throw new Error(`GET ${endpoint} failed: ${res.status}`);
    const rows = await res.json();
    setData(rows);
    return rows;
  }), [endpoint, wrap]);


  const getOne = useCallback((id) => wrap(async () => {
    if (USE_MOCK_DATA) {
      return mockStore.current.find(r => r.id === id) ?? null;
    }
    const res = await fetch(`${endpoint}/${id}`);
    if (!res.ok) throw new Error(`GET ${endpoint}/${id} failed: ${res.status}`);
    return res.json();
  }), [endpoint, wrap]);


  const create = useCallback((item) => wrap(async () => {
    if (USE_MOCK_DATA) {
      const newItem = { ...item, id: nextId.current++ };
      mockStore.current = [...mockStore.current, newItem];
      setData([...mockStore.current]);
      return newItem;
    }
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
    if (!res.ok) throw new Error(`POST ${endpoint} failed: ${res.status}`);
    const newItem = await res.json();
    setData(prev => [...prev, newItem]);
    return newItem;
  }), [endpoint, wrap]);


  const update = useCallback((id, changes) => wrap(async () => {
    if (USE_MOCK_DATA) {
      mockStore.current = mockStore.current.map(r =>
        r.id === id ? { ...r, ...changes, id } : r
      );
      setData([...mockStore.current]);
      return mockStore.current.find(r => r.id === id);
    }
    const res = await fetch(`${endpoint}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(changes),
    });
    if (!res.ok) throw new Error(`PUT ${endpoint}/${id} failed: ${res.status}`);
    const updated = await res.json();
    setData(prev => prev.map(r => r.id === id ? updated : r));
    return updated;
  }), [endpoint, wrap]);

  // ── DELETE ─────────────────────────────────────────────────
  const remove = useCallback((id) => wrap(async () => {
    if (USE_MOCK_DATA) {
      mockStore.current = mockStore.current.filter(r => r.id !== id);
      setData([...mockStore.current]);
      return;
    }
    const res = await fetch(`${endpoint}/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error(`DELETE ${endpoint}/${id} failed: ${res.status}`);
    setData(prev => prev.filter(r => r.id !== id));
  }), [endpoint, wrap]);


  const bulkReplace = useCallback((rows) => wrap(async () => {
    if (USE_MOCK_DATA) {
      mockStore.current = rows.map((r, i) => ({ ...r, id: r.id ?? i + 1 }));
      nextId.current = mockStore.current.length + 1;
      setData([...mockStore.current]);
      return mockStore.current;
    }
    const res = await fetch(`${endpoint}/bulk`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rows),
    });
    if (!res.ok) throw new Error(`PUT ${endpoint}/bulk failed: ${res.status}`);
    const saved = await res.json();
    setData(saved);
    return saved;
  }), [endpoint, wrap]);

  return { data, setData, loading, error, getAll, getOne, create, update, remove, bulkReplace };
}
