import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = "https://wings-cafe-inventory-747n.onrender.com";

const Sales = () => {
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [saleData, setSaleData] = useState({ productId: "", quantity: "" });
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Helper: robustly parse a date from a sale/transaction object
  const getSaleDate = (s) => {
    // try common fields/keys
    const candidate =
      s?.createdAt ?? s?.created_at ?? s?.date ?? s?.timestamp ?? s?.time ?? null;

    if (!candidate) return new Date(); // fallback to now

    // numeric values (timestamp)
    if (typeof candidate === "number") {
      const d = new Date(candidate);
      return isNaN(d.getTime()) ? new Date() : d;
    }

    // numeric string
    if (typeof candidate === "string" && /^\d+$/.test(candidate)) {
      const d = new Date(Number(candidate));
      return isNaN(d.getTime()) ? new Date() : d;
    }

    // ISO or other date string
    if (typeof candidate === "string") {
      const parsed = Date.parse(candidate);
      if (!isNaN(parsed)) return new Date(parsed);
    }

    // last resort
    return new Date();
  };

  // Format money helper
  const formatMoney = (n) => Number(n || 0).toFixed(2);

  // Load products + sales
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError("");
      try {
        const [pRes, tRes] = await Promise.all([
          axios.get(`${API_BASE}/products`),
          axios.get(`${API_BASE}/transactions`)
        ]);

        const fetchedProducts = Array.isArray(pRes.data) ? pRes.data : [];
        setProducts(fetchedProducts);

        const txRaw = Array.isArray(tRes.data) ? tRes.data : [];
        // Only keep transactions that are sales (type === 'sell')
        const salesOnly = txRaw.filter(tx => tx.type === "sell" || String(tx.type).toLowerCase() === "sell");
        setSales(salesOnly);
      } catch (err) {
        console.error("fetchAll error", err);
        setError("Failed to load products or sales. Check backend/CORS.");
        setProducts([]);
        setSales([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  const findProduct = (id) => products.find(p => String(p.id) === String(id));

  // UI handlers
  const handleProductChange = (e) => {
    const productId = e.target.value;
    setSaleData(prev => ({ ...prev, productId }));
    const prod = findProduct(productId);
    const qty = parseInt(saleData.quantity, 10) || 0;
    setTotal(prod ? prod.price * qty : 0);
    setError("");
  };

  const handleQtyChange = (e) => {
    const quantity = e.target.value;
    setSaleData(prev => ({ ...prev, quantity }));
    const prod = findProduct(saleData.productId);
    setTotal(prod ? prod.price * (parseInt(quantity, 10) || 0) : 0);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const productId = saleData.productId;
    const qty = parseInt(saleData.quantity, 10);

    if (!productId) {
      setError("Please select a product.");
      return;
    }
    if (!qty || qty <= 0) {
      setError("Please enter a valid quantity.");
      return;
    }

    const product = findProduct(productId);
    if (!product) {
      setError("Product not found. Refresh the page.");
      return;
    }

    if (product.quantity < qty) {
      setError(`Not enough stock. Available: ${product.quantity}`);
      return;
    }

    try {
      const payload = {
        productId: product.id,
        type: "sell",
        quantity: qty
      };

      const res = await axios.post(`${API_BASE}/transactions`, payload);

      // Build new sale item with valid createdAt (use server value or fallback now)
      const createdAt = res?.data?.createdAt || res?.data?.created_at || new Date().toISOString();
      const newSale = {
        ...res.data,
        productId: res.data.productId ?? payload.productId,
        quantity: res.data.quantity ?? payload.quantity,
        createdAt
      };

      // Add the new sale on top of current sales
      setSales(prev => [newSale, ...prev]);

      // Reset form
      setSaleData({ productId: "", quantity: "" });
      setTotal(0);
      setError("");

      // Refresh products list to update stock counts
      const prodRes = await axios.get(`${API_BASE}/products`);
      setProducts(Array.isArray(prodRes.data) ? prodRes.data : []);
    } catch (err) {
      console.error("record sale error", err);
      setError(err.response?.data?.error || "Error recording sale.");
    }
  };

  // Sort sales newest-first using robust parsing
  const sortedSales = [...sales].sort((a, b) => getSaleDate(b).getTime() - getSaleDate(a).getTime());

  return (
    <div className="container" style={{ padding: 20 }}>
      <h1>Sales Management</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {loading && <p>Loading...</p>}

      <form onSubmit={handleSubmit} style={{ background: "#fff", padding: 20, borderRadius: 8, boxShadow: "0 4px 10px rgba(0,0,0,0.06)", maxWidth: 900 }}>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Product:</label>
          <select name="productId" value={saleData.productId} onChange={handleProductChange} style={{ width: 320, padding: 8 }}>
            <option value="">Select Product</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} (Qty: {p.quantity}, M{formatMoney(p.price)})
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Quantity:</label>
          <input
            name="quantity"
            type="number"
            min="1"
            value={saleData.quantity}
            onChange={handleQtyChange}
            placeholder="Quantity to sell"
            style={{ width: 160, padding: 8 }}
            required
          />
        </div>

        <p><strong>Total:</strong> M {formatMoney(total)}</p>
        <button type="submit" style={{ background: "#c62828", color: "#fff", padding: "8px 14px", border: "none", borderRadius: 6 }}>Record Sale</button>
      </form>

      <h2 style={{ marginTop: 28 }}>Recent Sales</h2>
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 8 }}>
        <thead style={{ background: "#c62828", color: "#fff" }}>
          <tr>
            <th style={{ padding: 12, textAlign: "left" }}>Product</th>
            <th style={{ padding: 12, textAlign: "center" }}>Qty</th>
            <th style={{ padding: 12, textAlign: "center" }}>Total (M)</th>
            <th style={{ padding: 12, textAlign: "center" }}>Date</th>
          </tr>
        </thead>
        <tbody>
          {sortedSales.length === 0 ? (
            <tr><td colSpan="4" style={{ padding: 16 }}>No sales recorded yet</td></tr>
          ) : (
            sortedSales.map((s, i) => {
              const product = findProduct(s.productId) || s.product || {};
              const price = product.price ?? s.price ?? 0;
              const qty = s.quantity ?? 0;
              const displayDate = getSaleDate(s);
              return (
                <tr key={s.id ?? i} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: 12 }}>{product.name ?? "Unknown"}</td>
                  <td style={{ padding: 12, textAlign: "center" }}>{qty}</td>
                  <td style={{ padding: 12, textAlign: "center" }}>M {formatMoney(price * qty)}</td>
                  <td style={{ padding: 12, textAlign: "center" }}>{displayDate.toLocaleString()}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Sales;
