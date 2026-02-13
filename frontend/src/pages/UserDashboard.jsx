import { useEffect, useState, useRef } from "react";
import API from "../api/api";
import { useToast } from "../components/Toast";

const POLL_INTERVAL = 5000; // 5s

const UserDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [notification, setNotification] = useState(null); // { id, text }
  const userEmail = localStorage.getItem("email"); // use the email stored at login
  const pollRef = useRef(null);
  const prevOrdersRef = useRef(null);
  const lastStatusRef = useRef(null);

  const statusMessage = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'order received':
      case 'order placed':
        return 'Order placed';
      case 'in kitchen':
        return 'In Kitchen';
      case 'out for delivery':
        return 'Out for Delivery';
      case 'delivered':
        return 'Delivered successfully';
      default:
        return status || '';
    }
  };

  const showNotification = (text) => {
    // show overlay popup with Times New Roman font
    const id = Date.now();
    setNotification({ id, text });
    // hide after 3.5 seconds
    setTimeout(() => {
      setNotification((cur) => (cur && cur.id === id ? null : cur));
    }, 5000);
  };

  const fetchOrders = async () => {
    if (!userEmail) return;
    try {
      const res = await API.get(`/orders/user/${userEmail}`);
      const newOrders = res.data || [];

      // compare with previous to detect status changes
      if (Array.isArray(prevOrdersRef.current) && prevOrdersRef.current.length > 0) {
        const prevMap = new Map(prevOrdersRef.current.map(o => [o._id, o.status]));
        for (const o of newOrders) {
          const prevStatus = prevMap.get(o._id);
          if (prevStatus && prevStatus !== o.status) {
            const msg = statusMessage(o.status);
            showNotification(msg);
            lastStatusRef.current = msg;
          }
        }
      }

      prevOrdersRef.current = newOrders.map(o => ({ _id: o._id, status: o.status }));
      setOrders(newOrders);
    } catch (err) {
      console.error("Failed to fetch orders", err);
    }
  };

  const toast = useToast();
  useEffect(() => {
    if (!userEmail) {
      toast.push("Login required");
      return;
    }

    // initial load: fetch and show current status once
    (async () => {
      try {
        const res = await API.get(`/orders/user/${userEmail}`);
        const initialOrders = res.data || [];
        prevOrdersRef.current = initialOrders.map(o => ({ _id: o._id, status: o.status }));
        setOrders(initialOrders);
        if (initialOrders.length > 0) {
          // show the first order's status on load
          const msg = statusMessage(initialOrders[0].status);
          // store last status for click-to-show
          lastStatusRef.current = msg;
          showNotification(msg);
        }
      } catch (err) {
        console.error("Failed to fetch orders", err);
      }
    })();

    pollRef.current = setInterval(fetchOrders, POLL_INTERVAL);
    return () => clearInterval(pollRef.current);
  }, [userEmail]);

  return (
    <div style={styles.container} onClick={() => {
      // re-show last known status when user clicks anywhere on the dashboard
      if (lastStatusRef.current) showNotification(lastStatusRef.current);
    }}>
      {/* keyframes injected to support the popup animation */}
      <style>{`
        @keyframes popupAnim {
          0% { transform: translateY(-20px); opacity: 0; }
          10% { transform: translateY(0); opacity: 1; }
          90% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(-20px); opacity: 0; }
        }
      `}</style>
      <h1 style={styles.heading}>My Orders 🍕</h1>

      {orders.length === 0 && <p>No orders yet</p>}

      {orders.map((order) => (
        <div key={order._id} style={styles.card}>
          <p><b>Base:</b> {order.pizzaBase}</p>
          <p><b>Sauce:</b> {order.sauce}</p>
          <p><b>Cheese:</b> {order.cheese}</p>
          <p><b>Veggies:</b> {(order.veggies || []).join(", ")}</p>
          <p><b>Total:</b> ₹{order.totalAmount}</p>
          <p style={styles.status}>Status: {order.status}</p>
        </div>
      ))}

      {notification && (
        <div style={styles.popupOverlay}>
          <div style={{ ...styles.popupBox, animation: 'popupAnim 5s forwards' }}>{notification.text}</div>
        </div>
      )}
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
  heading: {
    color: "#e63946",
    marginBottom: "30px",
  },
  card: {
    background: "#fff",
    padding: "20px",
    borderRadius: "12px",
    marginBottom: "20px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
  },
  status: {
    marginTop: "10px",
    fontWeight: "700",
    color: "#e63946",
  },
  popupOverlay: {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'rgba(0,0,0,0.35)',
  pointerEvents: 'auto',
  zIndex: 9999,
  },
  popupBox: {
    pointerEvents: 'auto',
  background: '#fff',
  padding: '22px 36px',
  borderRadius: 10,
  boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
  fontFamily: 'Times New Roman, Times, serif',
  fontSize: '28px',
  lineHeight: '1.15',
  fontWeight: 700,
  color: '#111',
  textAlign: 'center',
  }
};

export default UserDashboard;
