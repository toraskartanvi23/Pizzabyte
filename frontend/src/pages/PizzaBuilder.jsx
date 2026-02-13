import React, { useState, useEffect, useRef } from "react";
import API from "../api/api";
import { useToast } from "../components/Toast";

const PizzaBuilder = () => {
  const [userEmail, setUserEmail] = useState(localStorage.getItem("email") || ""); // populate from localStorage when logged in
  const [base, setBase] = useState("");
  const [sauce, setSauce] = useState("");
  const [cheese, setCheese] = useState("");
  const [veggies, setVeggies] = useState([]);
  const [message, setMessage] = useState("");
  const [price, setPrice] = useState(0);
  const [notification, setNotification] = useState(null);
  const lastMsgRef = useRef(null);
  const pollRef = useRef(null);
  const prevOrdersRef = useRef([]);

  const pizzaBases = [
    "Thin Crust",
    "Cheese Burst",
    "Pan Crust",
    "Whole Wheat",
    "Gluten-Free",
  ];
  const sauces = [
    "Tomato Basil",
    "Pesto",
    "White Garlic",
    "Barbeque",
    "Alfredo",
  ];
  const cheeses = [
    "Mozzarella",
    "Cheddar",
    "Parmesan",
    "Vegan Cheese",
    "Double Cheese",
  ];
  const allVeggies = [
    "Capsicum",
    "Onion",
    "Olives",
    "Corn",
    "Jalapeno",
    "Tomato",
    "Mushroom",
  ];

  // 🔹 PRICE CALCULATION
  const calculatePrice = (b, s, c, v) => {
    let total = 0;

    if (b) total += 150;        // base price
    if (s) total += 40;         // sauce price
    if (c) total += 70;         // cheese price
    total += v.length * 20;     // veggies price

    setPrice(total);
    return total;
  };

  const handleVeggieChange = (veg) => {
    setVeggies((prev) => {
      const updated = prev.includes(veg)
        ? prev.filter((v) => v !== veg)
        : [...prev, veg];

      calculatePrice(base, sauce, cheese, updated);
      return updated;
    });
  };

  const toast = useToast();
  const handleSubmit = async () => {
    if (!userEmail || !base || !sauce || !cheese) {
      toast.push("Please complete all selections!");
      return;
    }

    try {
      const totalAmount = calculatePrice(base, sauce, cheese, veggies);

      await API.post("/orders", {
        userEmail,
        pizzaBase: base,
        sauce,
        cheese,
        veggies,
        totalAmount,
      });

      const successText = 'Order placed';
      setMessage("🎉 Order placed successfully!");
      // persist last popup and timestamp so a quick refresh still shows it,
      // but avoid showing stale popups on every load
      try {
        localStorage.setItem('builderLastPopup', successText);
        localStorage.setItem('builderLastPopupAt', String(Date.now()));
        lastMsgRef.current = successText;
      } catch (e) {}
      showNotification(successText);
    } catch (err) {
      console.error(err);
  setMessage("❌ Failed to place order.");
  toast.push("Failed to place order.");
    }
  };

  useEffect(() => {
    // on mount show persisted popup only if it was created very recently
    try {
      const msg = localStorage.getItem('builderLastPopup');
      const at = Number(localStorage.getItem('builderLastPopupAt') || '0');
      if (msg && at && Date.now() - at < 10000) {
        lastMsgRef.current = msg;
        showNotification(msg);
      }
    } catch (e) {}
  }, []);

  // map status to friendly text
  const statusMessage = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'order received':
      case 'order placed':
        return 'Order placed';
      case 'in kitchen':
        return 'In Kitchen!';
      case 'out for delivery':
        return 'Out for Delivery!';
      case 'delivered':
        return 'Delivered!';
      default:
        return status || '';
    }
  };

  const fetchOrders = async () => {
    if (!userEmail) return;
    try {
      const res = await API.get(`/orders/user/${userEmail}`);
      const newOrders = res.data || [];

      // detect status changes compared to prev
      if (Array.isArray(prevOrdersRef.current) && prevOrdersRef.current.length > 0) {
        const prevMap = new Map(prevOrdersRef.current.map(o => [o._id, o.status]));
        for (const o of newOrders) {
          const prevStatus = prevMap.get(o._id);
          if (prevStatus && prevStatus !== o.status) {
            const msg = statusMessage(o.status);
            if (msg) {
              showNotification(msg);
              lastMsgRef.current = msg;
            }
          }
        }
      }

      prevOrdersRef.current = newOrders.map(o => ({ _id: o._id, status: o.status }));
    } catch (err) {
      console.error('Failed to fetch orders for builder', err);
    }
  };

  useEffect(() => {
    if (!userEmail) return;
    // initial seed
    (async () => {
      try {
        const res = await API.get(`/orders/user/${userEmail}`);
        const initialOrders = res.data || [];
        prevOrdersRef.current = initialOrders.map(o => ({ _id: o._id, status: o.status }));
      } catch (e) {}
    })();

    pollRef.current = setInterval(fetchOrders, 5000);
    return () => clearInterval(pollRef.current);
  }, [userEmail]);

  const showNotification = (text) => {
    const id = Date.now();
    setNotification({ id, text });
    // auto-hide after 5s
    setTimeout(() => {
      setNotification((cur) => (cur && cur.id === id ? null : cur));
    }, 5000);
  };

  return (
    <div style={styles.container} onClick={() => {
      if (lastMsgRef.current) showNotification(lastMsgRef.current);
    }}>
      <style>{`
        @keyframes popupAnimBuilder {
          0% { transform: translateY(-20px); opacity: 0; }
          10% { transform: translateY(0); opacity: 1; }
          90% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(-20px); opacity: 0; }
        }
      `}</style>
      <h1 style={styles.heading}>🍕 Build Your Custom Pizza 🍕</h1>

      {userEmail && (
        <p style={{ marginBottom: 12 }}><b>Ordering as:</b> {userEmail}</p>
      )}

      {/* BASE */}
      <div style={styles.section}>
        <h3 style={styles.subheading}>Choose a Base:</h3>
        <div style={styles.options}>
          {pizzaBases.map((b) => (
            <button
              key={b}
              style={base === b ? styles.activeBtn : styles.optionBtn}
              onClick={() => {
                setBase(b);
                calculatePrice(b, sauce, cheese, veggies);
              }}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* SAUCE */}
      <div style={styles.section}>
        <h3 style={styles.subheading}>Choose a Sauce:</h3>
        <div style={styles.options}>
          {sauces.map((s) => (
            <button
              key={s}
              style={sauce === s ? styles.activeBtn : styles.optionBtn}
              onClick={() => {
                setSauce(s);
                calculatePrice(base, s, cheese, veggies);
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* CHEESE */}
      <div style={styles.section}>
        <h3 style={styles.subheading}>Choose Cheese:</h3>
        <div style={styles.options}>
          {cheeses.map((c) => (
            <button
              key={c}
              style={cheese === c ? styles.activeBtn : styles.optionBtn}
              onClick={() => {
                setCheese(c);
                calculatePrice(base, sauce, c, veggies);
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* VEGGIES */}
      <div style={styles.section}>
        <h3 style={styles.subheading}>Choose Veggies:</h3>
        <div style={styles.options}>
          {allVeggies.map((v) => (
            <button
              key={v}
              style={veggies.includes(v) ? styles.activeBtn : styles.optionBtn}
              onClick={() => handleVeggieChange(v)}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* PRICE SUMMARY */}
      <h2 style={{ color: "#e63946" }}>Total Price: ₹{price}</h2>

      <button onClick={handleSubmit} style={styles.orderBtn}>
        Place Order
      </button>

      {message && <p style={styles.message}>{message}</p>}

      {notification && (
        <div style={styles.popupOverlay}>
          <div style={{ ...styles.popupBox, animation: 'popupAnimBuilder 5s forwards' }}>{notification.text}</div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    padding: "30px",
    backgroundColor: "#fff8f0",
    textAlign: "center",
  },
  heading: {
    color: "#e63946",
    fontSize: "36px",
    marginBottom: "20px",
  },
  section: {
    marginBottom: "25px",
  },
  subheading: {
    color: "#e63946",
    marginBottom: "10px",
  },
  options: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: "10px",
  },
  optionBtn: {
    padding: "10px 18px",
    borderRadius: "25px",
    backgroundColor: "#fff",
    border: "2px solid #e63946",
    cursor: "pointer",
  },
  activeBtn: {
    padding: "10px 18px",
    borderRadius: "25px",
    backgroundColor: "#e63946",
    color: "white",
    border: "none",
    cursor: "pointer",
  },
  orderBtn: {
    marginTop: "30px",
    padding: "14px 40px",
    border: "none",
    borderRadius: "30px",
    backgroundColor: "#e63946",
    color: "white",
    fontSize: "18px",
    cursor: "pointer",
  },
  message: {
    marginTop: "20px",
    fontSize: "18px",
    color: "#333",
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
    zIndex: 9999,
  },
  popupBox: {
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

export default PizzaBuilder;
