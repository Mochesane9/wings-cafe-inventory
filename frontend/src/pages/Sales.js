import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = "https://wings-cafe-inventory-747n.onrender.com";

const Sales = () => {
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [saleData, setSaleData] = useState({ productId: "", quantity: 0 });
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");

  // Load products
  useEffect(() => {
    axios
      .get(`${API_BASE}/products`)
      .then((res) => setProducts(res.data))
      .catch(() => setError("Failed to load products."));
  }, []);

  // Load sales
  useEffect(() => {
    axios
      .get(`${API_BASE}/transactions`)
      .then((res) => setSales(res.data))
      .catch(() => setError("Failed to load sales."));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedData = { ...saleData, [name]: value };
    setSaleData(updatedData);

    const product = products.find((p) => p.id === updatedData.productId);
    setTotal(product ? product.price * (parseInt(updatedData.quantity) || 0) : 0);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!saleData.productId || saleData.quantity <= 0) {
      setError("Please select a product and enter a valid quantity.");
      return;
    }

    axios
      .post(`${API_BASE}/transactions`, {
        productId: saleData.productId,
        type: "sell",
        quantity: saleData.quantity,
      })
      .then((res) => {
        // If backend doesn’t send date, add it manually
        const newSale = {
          ...res.data,
          createdAt: res.data.createdAt || new Date().toISOString(),
        };

        setSales([newSale, ...sales]); // Add new sale to top
        setSaleData({ productId: "", quantity: 0 });
        setTotal(0);
        setError("");

        // Refresh products after sale
        axios.get(`${API_BASE}/products`).then((res) => setProducts(res.data));
      })
      .catch((err) =>
        setError(err.response?.data?.error || "Error recording sale.")
      );
  };

  const findProduct = (id) => products.find((p) => p.id === id);

  const formatMoney = (value) => Number(value).toFixed(2);

  const sortedSales = [...sales].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  return (
    <div className="container">
      <h1>Sales Management</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={handleSubmit} className="sales-form">
        <label>Product:</label>
        <select
          name="productId"
          value={saleData.productId}
          onChange={handleChange}
          required
        >
          <option value="">Select Product</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} (Qty: {p.quantity}, M{p.price})
            </option>
          ))}
        </select>

        <label>Quantity:</label>
        <input
          name="quantity"
          type="number"
          placeholder="Quantity to Sell"
          value={saleData.quantity}
          onChange={handleChange}
          min="1"
          required
        />

        <p>Total: M {formatMoney(total)}</p>
        <button type="submit">Record Sale</button>
      </form>

      <h2>Recent Sales</h2>
      <table className="sales-table">
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
                  <td>{new Date(s.createdAt).toLocaleString()}</td>
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
