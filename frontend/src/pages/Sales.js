import React, { useEffect, useState } from "react";
import axios from "axios";

// <-- Set your backend API base here (change if needed) -->
const API_BASE = process.env.REACT_APP_API_BASE || "https://wings-cafe-inventory-747n.onrender.com";

const Sales = () => {
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [saleData, setSaleData] = useState({ productId: "", quantity: "" });
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  // Fetch products and transactions
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

      // Normalize transactions/sales response:
      const txRaw = Array.isArray(tRes.data) ? tRes.data : [];
      // Keep only entries that look like real transactions (have productId or type)
      const txFiltered = txRaw.filter(item => item.type === "sell" || item.productId !== undefined || item.transactionId !== undefined);

      // If server returns transactions that embed product details (e.g. { productId, quantity, product: {name,price}})
      // we keep them as-is. Otherwise we ignore items that look like plain product objects.
      setSales(txFiltered);
    } catch (err) {
      console.error("fetchAll error:", err);
      setError("Failed to load products or sales. Check backend and CORS.");
      setProducts([]);
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  // Helpers to compute totals & formatting
  const findProduct = (productId) => products.find(p => String(p.id) === String(productId));
  const formatMoney = (n) => Number(n || 0).toFixed(2);

  // Handlers
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

    const { productId, quantity } = saleData;
    const qty = parseInt(quantity, 10);

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
      setError("Product not found. Please refresh the page.");
      return;
    }

    if (product.quantity < qty) {
      setError(`Not enough stock. Available: ${product.quantity}`);
      return;
    }

    try {
      // Post transaction to backend
      // Backend expected payload example: { productId, type: 'sell', quantity }
      await axios.post(`${API_BASE}/transactions`, {
        productId: product.id,
        type: "sell",
        quantity: qty
      });

      // Refresh both products and sales (source of truth: backend)
      await fetchAll();

      // Reset form
      setSaleData({ productId: "", quantity: "" });
      setTotal(0);
      setError("");
    } catch (err) {
      console.error("record sale error:", err);
      setError(err.response?.data?.error || err.message || "Error recording sale.");
    }
  };

  // sort sales by createdAt if available, newest first
  const sortedSales = [...sales].sort((a, b) => {
    if (a.createdAt && b.createdAt) return new Date(b.createdAt) - new Date(a.createdAt);
    return 0;
  });

  return (
    <div className="container">
      <h1>Sales Management</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {loading && <p>Loading...</p>}

      <form onSubmit={handleSubmit} className="sales-form" style={{ maxWidth: 800, background: "#fff", padding: 20, borderRadius: 6 }}>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontWeight: "600", marginBottom: 6 }}>Product:</label>
          <select name="productId" value={saleData.productId} onChange={handleProductChange} required style={{ width: "100%", padding: 10 }}>
            <option value="">Select Product</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} (Qty: {p.quantity}, M {formatMoney(p.price)})
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontWeight: "600", marginBottom: 6 }}>Quantity:</label>
          <input
            name="quantity"
            type="number"
            min="1"
            value={saleData.quantity}
            onChange={handleQtyChange}
            placeholder="Quantity to sell"
            style={{ width: 200, padding: 8 }}
            required
          />
        </div>

        <p><strong>Total:</strong> M {formatMoney(total)}</p>
        <button type="submit" style={{ background: "#c62828", color: "#fff", padding: "8px 16px", border: "none", borderRadius: 6 }}>Record Sale</button>
      </form>

      <h2 style={{ marginTop: 28 }}>Recent Sales</h2>
      <table className="sales-table" style={{ width: "100%", borderCollapse: "collapse", marginTop: 8 }}>
        <thead style={{ background: "#c62828", color: "#fff" }}>
          <tr>
            <th style={{ padding: 12, textAlign: "left" }}>Product</th>
            <th style={{ padding: 12 }}>Quantity</th>
            <th style={{ padding: 12 }}>Total (M)</th>
            <th style={{ padding: 12 }}>When</th>
          </tr>
        </thead>
        <tbody>
          {sortedSales.length === 0 ? (
            <tr><td colSpan="4" style={{ padding: 16 }}>No recent sales</td></tr>
          ) : (
            sortedSales.map((s, idx) => {
              // s might be: { productId, quantity, createdAt, ... }
              // or { id, productId, quantity, product: { name, price }, createdAt }
              const product = findProduct(s.productId) || s.product || {};
              const name = product.name || s.productName || "Unknown";
              const price = product.price || s.price || 0;
              const qty = s.quantity || 0;
              const when = s.createdAt ? new Date(s.createdAt).toLocaleString() : "";
              return (
                <tr key={s.id || idx} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: 12 }}>{name}</td>
                  <td style={{ padding: 12, textAlign: "center" }}>{qty}</td>
                  <td style={{ padding: 12, textAlign: "center" }}>M {formatMoney(price * qty)}</td>
                  <td style={{ padding: 12, textAlign: "center" }}>{when}</td>
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
