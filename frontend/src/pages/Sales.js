import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_BASE || "https://wings-cafe-inventory-747n.onrender.com";

const Sales = () => {
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [saleData, setSaleData] = useState({ productId: "", quantity: "" });
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setError("");
    try {
      const [pRes, tRes] = await Promise.all([
        axios.get(`${API_BASE}/products`),
        axios.get(`${API_BASE}/transactions`)
      ]);

      // Load products
      const products = Array.isArray(pRes.data) ? pRes.data : [];
      setProducts(products);

      // Load ONLY sales transactions (ignore stock additions)
      const txRaw = Array.isArray(tRes.data) ? tRes.data : [];
      const salesOnly = txRaw.filter(tx => tx.type === "sell");
      setSales(salesOnly);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load products or sales.");
    }
  };

  const findProduct = (id) => products.find(p => String(p.id) === String(id));
  const formatMoney = (n) => Number(n || 0).toFixed(2);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...saleData, [name]: value };
    setSaleData(updated);

    if (name === "quantity" || name === "productId") {
      const product = findProduct(updated.productId);
      const qty = parseInt(updated.quantity, 10) || 0;
      setTotal(product ? product.price * qty : 0);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const { productId, quantity } = saleData;
    const qty = parseInt(quantity, 10);

    if (!productId || !qty || qty <= 0) {
      setError("Please select a product and enter a valid quantity.");
      return;
    }

    const product = findProduct(productId);
    if (!product) {
      setError("Product not found.");
      return;
    }

    if (product.quantity < qty) {
      setError(`Not enough stock. Available: ${product.quantity}`);
      return;
    }

    try {
      await axios.post(`${API_BASE}/transactions`, {
        productId: product.id,
        type: "sell",
        quantity: qty,
      });

      setSaleData({ productId: "", quantity: "" });
      setTotal(0);
      await fetchData();
    } catch (err) {
      console.error("Error recording sale:", err);
      setError("Error recording sale.");
    }
  };

  // Sort sales by newest first
  const sortedSales = [...sales].sort((a, b) =>
    new Date(b.createdAt) - new Date(a.createdAt)
  );

  return (
    <div className="container">
      <h1>Sales Management</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
        <label>
          Product:
          <select
            name="productId"
            value={saleData.productId}
            onChange={handleChange}
            required
          >
            <option value="">Select Product</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} (Qty: {p.quantity}, M{formatMoney(p.price)})
              </option>
            ))}
          </select>
        </label>

        <label>
          Quantity:
          <input
            type="number"
            name="quantity"
            min="1"
            value={saleData.quantity}
            onChange={handleChange}
            required
          />
        </label>

        <p>Total: M{formatMoney(total)}</p>
        <button type="submit">Record Sale</button>
      </form>

      <h2>Recent Sales</h2>
      <table border="1" width="100%">
        <thead>
          <tr>
            <th>Product</th>
            <th>Qty</th>
            <th>Total (M)</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {sortedSales.length === 0 ? (
            <tr>
              <td colSpan="4">No sales recorded yet</td>
            </tr>
          ) : (
            sortedSales.map((s, i) => {
              const product = findProduct(s.productId) || s.product || {};
              return (
                <tr key={s.id || i}>
                  <td>{product.name || "Unknown"}</td>
                  <td>{s.quantity}</td>
                  <td>M{formatMoney((product.price || 0) * s.quantity)}</td>
                  <td>{s.createdAt ? new Date(s.createdAt).toLocaleString() : ""}</td>
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
