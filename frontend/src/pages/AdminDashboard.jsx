import React, { useEffect, useState, useRef } from "react";
import API from "../api/api";
import { useToast } from "../components/Toast";

const POLL_INTERVAL = 5000;

const AdminDashboard = () => {
  const [inventory, setInventory] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeInventoryActions, setActiveInventoryActions] = useState({});
  const [activeOrderStatus, setActiveOrderStatus] = useState({});
  const pollRef = useRef(null);
  const initialisedRef = useRef(false);

  const fetchAll = async () => {
    try {
  const [invRes, orderRes] = await Promise.all([API.get("/inventory"), API.get("/orders")]);
      // default quantity to 50 when missing
      const invWithDefaults = (invRes.data || []).map((it) => ({ ...it, quantity: typeof it.quantity === 'number' ? it.quantity : 50 }));
      setInventory(invWithDefaults);
      // On first load only: set all server quantities to 50 (but allow changes later)
      if (!initialisedRef.current) {
        initialisedRef.current = true;
        const toNormalize = invWithDefaults.filter((it) => it.quantity !== 50).map((it) => it._id);
        if (toNormalize.length > 0) {
          try {
            // update all to 50 in parallel
            await Promise.all(toNormalize.map((id) => API.put(`/inventory/${id}`, { quantity: 50 })));
            // refresh inventory from server to get canonical data
            const refreshed = await API.get("/inventory");
            setInventory((refreshed.data || []).map((it) => ({ ...it, quantity: typeof it.quantity === 'number' ? it.quantity : 50 })));
          } catch (err) {
            console.error("Failed to normalize inventory quantities to 50:", err);
          }
        }
      }
      setOrders(orderRes.data);
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  useEffect(() => {
    fetchAll();
    pollRef.current = setInterval(fetchAll, POLL_INTERVAL);
    return () => clearInterval(pollRef.current);
  }, []);
  const toast = useToast();

  const changeQuantity = async (id, delta) => {
    try {
  const item = inventory.find((i) => i._id === id);
  if (!item) return;
  const newQty = Math.max(0, (item.quantity || 50) + delta);

  // mark active for UI
  setActiveInventoryActions((s) => ({ ...s, [id]: delta }));

  const res = await API.put(`/inventory/${id}`, { quantity: newQty });
  setInventory((prev) => prev.map((i) => (i._id === id ? { ...res.data, quantity: typeof res.data.quantity === 'number' ? res.data.quantity : newQty } : i)));
  toast.push('Inventory updated');

  // clear active marker after a short delay
  setTimeout(() => setActiveInventoryActions((s) => { const c = { ...s }; delete c[id]; return c; }), 800);
    } catch (err) {
      console.error("Failed to change quantity", err);
  toast.push('Failed to change quantity');
    }
  };

  const deleteItem = async (id) => {
  // use a simple browser confirm fallback if toast provider isn't available
  const ok = window.confirm ? window.confirm("Remove this inventory item?") : true;
  if (!ok) return;
    try {
  // mark active delete for UI
  setActiveInventoryActions((s) => ({ ...s, [id]: 'delete' }));
  await API.delete(`/inventory/${id}`);
  setInventory((prev) => prev.filter((i) => i._id !== id));
  setActiveInventoryActions((s) => { const c = { ...s }; delete c[id]; return c; });
  toast.push('Inventory item removed');
    } catch (err) {
      console.error("Failed to delete item", err);
      toast.push('Failed to delete item');
    }
  };

  const updateStatus = async (id, status) => {
    try {
  // mark status active
  setActiveOrderStatus((s) => ({ ...s, [id]: status }));
  const res = await API.patch(`/orders/${id}/status`, { status });
  setOrders((prev) => prev.map((o) => (o._id === id ? res.data : o)));
  // keep active order status in sync with server response
  setActiveOrderStatus((s) => ({ ...s, [id]: res.data.status }));
  toast.push(`Order ${id} status updated to ${res.data.status}`);
    } catch (err) {
      console.error("Failed to update status", err);
      toast.push('Failed to update order status');
    }
  };

  const STATUS_FLOW = ["Order Received", "In Kitchen", "Out for Delivery", "Delivered"];

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Admin Dashboard</h1>

      <div style={styles.section}>
        <h2>Inventory Management</h2>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Type</th>
              <th style={styles.th}>Quantity</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {inventory.length > 0 ? (
              inventory.map((item) => (
                <tr key={item._id}>
                  <td style={styles.td}>{item.itemName || item.name}</td>
                  <td style={styles.td}>{item.category || item.type}</td>
                  <td style={styles.td}>{item.quantity}</td>
                  <td style={styles.td}>
                    <button
                      onClick={() => changeQuantity(item._id, -1)}
                      style={{
                        ...styles.smallBtn,
                        background: activeInventoryActions[item._id] === -1 ? '#4caf50' : styles.smallBtn.background,
                      }}
                    >-</button>
                    <button
                      onClick={() => changeQuantity(item._id, 1)}
                      style={{
                        ...styles.smallBtn,
                        marginLeft: 6,
                        background: activeInventoryActions[item._id] === 1 ? '#4caf50' : styles.smallBtn.background,
                      }}
                    >+</button>
                    <button
                      onClick={() => deleteItem(item._id)}
                      style={{
                        ...styles.smallBtn,
                        marginLeft: 8,
                        background: activeInventoryActions[item._id] === 'delete' ? '#b00' : '#b00',
                      }}
                    >Delete</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" style={{ textAlign: "center" }}>
                  No items found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={styles.section}>
        <h2>Orders</h2>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Order ID</th>
              <th style={styles.th}>User</th>
              <th style={styles.th}>Items</th>
              <th style={styles.th}>Total</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.length > 0 ? (
              orders.map((order) => (
                <tr key={order._id}>
                  <td style={styles.td}>{order._id}</td>
                  <td style={styles.td}>{order.userEmail || order.userId}</td>
                  <td style={styles.td}>{order.pizzaBase}, {order.sauce}, {order.cheese}</td>
                  <td style={styles.td}>₹{order.totalAmount}</td>
                  <td style={styles.td}><b>{order.status}</b></td>
                  <td style={styles.td}>
                    {STATUS_FLOW.map((s) => (
                      <button
                        key={s}
                        disabled={order.status === s}
                        onClick={() => updateStatus(order._id, s)}
                        style={{
                          ...styles.smallBtn,
                          marginRight: 6,
                          background: activeOrderStatus[order._id] === s || order.status === s ? '#4caf50' : styles.smallBtn.background,
                        }}
                      >{s}</button>
                    ))}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: "center" }}>
                  No orders found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const styles = {
  container: {
  padding: "40px",
  backgroundColor: "#fff8f0",
  minHeight: "100vh",
  backgroundImage: "url('/pizza-bg.jpg')",
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  },
  title: {
    color: "#e63946",
    textAlign: "center",
    marginBottom: "30px",
  },
  section: {
  marginBottom: "40px",
  background: '#fff',
  padding: 18,
  borderRadius: 12,
  boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
  },
  table: {
  width: "100%",
  borderCollapse: "collapse",
  backgroundColor: "white",
  border: "1px solid #eee",
  borderRadius: 8,
  overflow: 'hidden',
  },
  th: {
  backgroundColor: "#e63946",
  color: "white",
  padding: "12px",
  textAlign: 'left',
  },
  td: {
  padding: "12px",
  borderBottom: "1px solid #f3f3f3",
  },
  smallBtn: {
  padding: '8px 10px',
  borderRadius: 8,
  border: 'none',
  background: '#e63946',
  color: '#fff',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 600,
  }
};

export default AdminDashboard;
