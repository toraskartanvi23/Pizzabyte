import React, { useState, useEffect, useRef } from "react";
import API from "../api/api";
import { useToast } from "../components/Toast";
// Import the image from your assets folder
import pizzaBg from "../assets/pizz.jpg"; 

const PizzaBuilder = () => {
  const [userEmail, setUserEmail] = useState(localStorage.getItem("email") || "");
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

  const pizzaBases = ["Thin Crust", "Cheese Burst", "Pan Crust", "Whole Wheat", "Gluten-Free"];
  const sauces = ["Tomato Basil", "Pesto", "White Garlic", "Barbeque", "Alfredo"];
  const cheeses = ["Mozzarella", "Cheddar", "Parmesan", "Vegan Cheese", "Double Cheese"];
  const allVeggies = ["Capsicum", "Onion", "Olives", "Corn", "Jalapeno", "Tomato", "Mushroom"];

  const calculatePrice = (b, s, c, v) => {
    let total = 0;
    if (b) total += 150;
    if (s) total += 40;
    if (c) total += 70;
    total += v.length * 20;
    setPrice(total);
    return total;
  };

  const handleVeggieChange = (veg) => {
    setVeggies((prev) => {
      const updated = prev.includes(veg) ? prev.filter((v) => v !== veg) : [...prev, veg];
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
      const res = await API.post("/orders", {
        userEmail,
        pizzaBase: base,
        sauce,
        cheese,
        veggies,
        totalAmount,
      });
      const orderId = res.data?.order?._id || res.data?.orderId;
      const successText = 'Order created';
      setMessage("✅ Order created. Please proceed to payment.");
      
      localStorage.setItem('builderLastPopup', successText);
      localStorage.setItem('builderLastPopupAt', String(Date.now()));
      lastMsgRef.current = successText;
      showNotification(successText);
      localStorage.setItem('lastOrderId', orderId);
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to place order.");
      toast.push("Failed to place order.");
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (document.getElementById('razorpay-script')) return resolve(true);
      const script = document.createElement('script');
      script.id = 'razorpay-script';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const proceedToPay = async () => {
    const orderId = localStorage.getItem('lastOrderId');
    if (!orderId) { toast.push('No recent order found to pay for'); return; }
    const amount = Math.round(price * 100);
    try {
      const r = await API.post('/payment/orders', { orderId, amount });
      const ok = await loadRazorpayScript();
      if (!ok) { toast.push('Failed to load payment gateway'); return; }

      const rOrder = r.data.rOrder;
      const options = {
        key: r.data.key_id || '',
        amount: rOrder.amount,
        currency: rOrder.currency,
        name: 'PizzaByte',
        description: 'Order Payment',
        order_id: rOrder.id,
        handler: async function (response) {
          try {
            const verifyRes = await API.post('/payment/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId,
            });
            if (verifyRes.data && verifyRes.data.success) {
              toast.push('Payment successful');
              setMessage('🎉 Order placed successfully!');
              const placedText = 'Order placed';
              localStorage.setItem('builderLastPopup', placedText);
              localStorage.setItem('builderLastPopupAt', String(Date.now()));
              lastMsgRef.current = placedText;
              localStorage.removeItem('lastOrderId');
            }
          } catch (e) {
            toast.push('Payment verification error');
          }
        },
        prefill: { email: userEmail },
        theme: { color: '#e63946' },
      };
      const paymentObj = new window.Razorpay(options);
      paymentObj.open();
    } catch (e) {
      toast.push('Unable to start payment');
    }
  };

  useEffect(() => {
    const msg = localStorage.getItem('builderLastPopup');
    const at = Number(localStorage.getItem('builderLastPopupAt') || '0');
    if (msg && at && Date.now() - at < 10000) {
      lastMsgRef.current = msg;
      showNotification(msg);
    }
  }, []);

  const statusMessage = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'order received':
      case 'order placed': return 'Order placed';
      case 'in kitchen': return 'In Kitchen!';
      case 'out for delivery': return 'Out for Delivery!';
      case 'delivered': return 'Delivered!';
      default: return status || '';
    }
  };

  const fetchOrders = async () => {
    if (!userEmail) return;
    try {
      const res = await API.get(`/orders/user/${userEmail}`);
      const newOrders = res.data || [];
      if (Array.isArray(prevOrdersRef.current) && prevOrdersRef.current.length > 0) {
        const prevMap = new Map(prevOrdersRef.current.map(o => [o._id, o.status]));
        for (const o of newOrders) {
          const prevStatus = prevMap.get(o._id);
          if (prevStatus && prevStatus !== o.status) {
            const msg = statusMessage(o.status);
            showNotification(msg);
            lastMsgRef.current = msg;
          }
        }
      }
      prevOrdersRef.current = newOrders.map(o => ({ _id: o._id, status: o.status }));
    } catch (err) {}
  };

  useEffect(() => {
    if (!userEmail) return;
    fetchOrders();
    pollRef.current = setInterval(fetchOrders, 5000);
    return () => clearInterval(pollRef.current);
  }, [userEmail]);

  const showNotification = (text) => {
    const id = Date.now();
    setNotification({ id, text });
    setTimeout(() => {
      setNotification((cur) => (cur && cur.id === id ? null : cur));
    }, 5000);
  };

  return (
    <div style={styles.container} onClick={() => lastMsgRef.current && showNotification(lastMsgRef.current)}>
      <style>{`
        @keyframes popupAnimBuilder {
          0% { transform: translateY(-20px); opacity: 0; }
          10% { transform: translateY(0); opacity: 1; }
          90% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(-20px); opacity: 0; }
        }
      `}</style>
      
      {/* Semi-transparent Content Card for visibility */}
      <div style={styles.contentWrapper}>
        <h1 style={styles.heading}>🍕 Build Your Custom Pizza 🍕</h1>

        {userEmail && (
          <p style={styles.userInfo}><b>Ordering as:</b> {userEmail}</p>
        )}

        <div style={styles.section}>
          <h3 style={styles.subheading}>Choose a Base:</h3>
          <div style={styles.options}>
            {pizzaBases.map((b) => (
              <button key={b} style={base === b ? styles.activeBtn : styles.optionBtn} onClick={() => {setBase(b); calculatePrice(b, sauce, cheese, veggies);}}>{b}</button>
            ))}
          </div>
        </div>

        <div style={styles.section}>
          <h3 style={styles.subheading}>Choose a Sauce:</h3>
          <div style={styles.options}>
            {sauces.map((s) => (
              <button key={s} style={sauce === s ? styles.activeBtn : styles.optionBtn} onClick={() => {setSauce(s); calculatePrice(base, s, cheese, veggies);}}>{s}</button>
            ))}
          </div>
        </div>

        <div style={styles.section}>
          <h3 style={styles.subheading}>Choose Cheese:</h3>
          <div style={styles.options}>
            {cheeses.map((c) => (
              <button key={c} style={cheese === c ? styles.activeBtn : styles.optionBtn} onClick={() => {setCheese(c); calculatePrice(base, sauce, c, veggies);}}>{c}</button>
            ))}
          </div>
        </div>

        <div style={styles.section}>
          <h3 style={styles.subheading}>Choose Veggies:</h3>
          <div style={styles.options}>
            {allVeggies.map((v) => (
              <button key={v} style={veggies.includes(v) ? styles.activeBtn : styles.optionBtn} onClick={() => handleVeggieChange(v)}>{v}</button>
            ))}
          </div>
        </div>

        <div style={styles.summaryContainer}>
          <h2 style={styles.priceLabel}>Total Price: ₹{price}</h2>
          <button onClick={handleSubmit} style={styles.orderBtn}>Place Order</button>
          
          {message && <p style={styles.message}>{message}</p>}
          
          {localStorage.getItem('lastOrderId') && (
            <div style={{ marginTop: 15 }}>
              <button onClick={proceedToPay} style={styles.payBtn}>Proceed to Pay</button>
            </div>
          )}
        </div>
      </div>

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
    padding: "40px 20px",
    backgroundImage: `url(${pizzaBg})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundAttachment: 'fixed',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start'
  },
  contentWrapper: {
    backgroundColor: "rgba(255, 255, 255, 0.92)", // White background with high opacity
    padding: "40px",
    borderRadius: "20px",
    maxWidth: "800px",
    width: "100%",
    boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
    textAlign: "center"
  },
  heading: {
    color: "#2b2d42", // Dark blue-black for maximum contrast
    fontSize: "32px",
    marginBottom: "20px",
    fontWeight: "900",
    textTransform: "uppercase"
  },
  userInfo: {
    color: "#4a4e69",
    marginBottom: "20px",
    fontSize: "16px",
    padding: "5px 15px",
    backgroundColor: "#f1f1f1",
    display: "inline-block",
    borderRadius: "10px"
  },
  section: {
    marginBottom: "30px",
    paddingBottom: "10px",
    borderBottom: "1px solid #ddd"
  },
  subheading: {
    color: "#111", // Solid black
    marginBottom: "15px",
    fontSize: "18px",
    fontWeight: "700"
  },
  options: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: "12px",
  },
  optionBtn: {
    padding: "10px 20px",
    borderRadius: "25px",
    backgroundColor: "#fff",
    color: "#111", // Dark text on white buttons
    border: "2px solid #e63946",
    cursor: "pointer",
    fontWeight: "600",
    transition: "0.2s"
  },
  activeBtn: {
    padding: "10px 20px",
    borderRadius: "25px",
    backgroundColor: "#e63946",
    color: "white",
    border: "2px solid #e63946",
    cursor: "pointer",
    fontWeight: "600",
    boxShadow: "0 4px 8px rgba(230, 57, 70, 0.3)"
  },
  summaryContainer: {
    marginTop: "20px",
    padding: "20px",
    backgroundColor: "#fff",
    borderRadius: "15px"
  },
  priceLabel: {
    color: "#111",
    fontSize: "28px",
    fontWeight: "800",
    marginBottom: "15px"
  },
  orderBtn: {
    padding: "16px 50px",
    border: "none",
    borderRadius: "35px",
    backgroundColor: "#2b2d42", // Dark color for main action button contrast
    color: "white",
    fontSize: "18px",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "0.3s",
    boxShadow: "0 5px 15px rgba(0,0,0,0.2)"
  },
  payBtn: {
    padding: "12px 30px",
    border: "none",
    borderRadius: "30px",
    backgroundColor: "#e63946", // Bright red for payment to stand out
    color: "white",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
    boxShadow: "0 4px 10px rgba(230,57,70,0.3)"
  },
  message: {
    marginTop: "20px",
    fontSize: "18px",
    color: "#2b2d42",
    fontWeight: "600"
  },
  popupOverlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 9999,
  },
  popupBox: {
    background: '#fff',
    padding: '25px 45px',
    borderRadius: 12,
    boxShadow: '0 15px 50px rgba(0,0,0,0.5)',
    fontFamily: 'Times New Roman, Times, serif',
    fontSize: '30px',
    fontWeight: 900,
    color: '#000',
    textAlign: 'center',
  }
};

export default PizzaBuilder;