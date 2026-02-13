import React from "react";
import { Link } from "react-router-dom";


const Home = () => {
  // Previously this page auto-redirected when a stored token existed.
  // That made the builder open immediately for returning users.
  // Change: only redirect automatically if the URL includes ?autoredirect=1
  // (so the homepage remains visible by default).
  React.useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const doAuto = params.get('autoredirect');
      const token = localStorage.getItem('token');
      if (token && doAuto === '1') {
        const role = localStorage.getItem('role');
        if (role === 'admin') window.location.href = '/admin/dashboard';
        else window.location.href = '/builder';
      }
    } catch (e) {
      // ignore
    }
  }, []);
  return (
    <div style={heroStyle}>
      <div style={overlay}></div>

      {/* Auth buttons in their own place (top-right) */}
      <div style={authFloating}>
        <Link to="/login"><button style={navBtn}>Login</button></Link>
        <Link to="/register"><button style={navBtn}>Register</button></Link>
      </div>

      {/* Hero Text */}
      <div style={content}>
        <h1 style={title}>PIZZABYTE</h1>
        <p style={subtitle}>Customize your pizza and order instantly</p>
      </div>

      {/* Order Button */}
      <Link to="/builder">
        <button style={orderBtn}>Order Now</button>
      </Link>
    </div>
  );
};

/* ===== STYLES ===== */

const heroStyle = {
  minHeight: "100vh",
  backgroundImage: "url(/pizza-bg.jpg)",
  backgroundSize: "cover",
  backgroundPosition: "center",
  position: "relative",
};

const overlay = {
  position: "absolute",
  inset: 0,
  backgroundColor: "rgba(0,0,0,0.45)",
};

const topNav = {
  position: "absolute",
  top: "30px",
  left: "40px",
  right: "40px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  zIndex: 2,
};

const menuLinks = { display: "flex", gap: "30px" };

const menuItem = {
  color: "white",
  textDecoration: "none",
  fontWeight: "600",
};

const authButtons = { display: "flex", gap: "15px" };

const navBtn = {
  padding: "12px 26px",
  borderRadius: "25px",
  border: "none",
  backgroundColor: "#fff",
  color: "#e63946",
  fontWeight: "600",
  cursor: "pointer",
};

const authFloating = {
  position: 'absolute',
  top: 28,
  right: 40,
  display: 'flex',
  gap: 12,
  zIndex: 3,
};

const content = {
  position: "absolute",
  left: "60px",
  top: "35%",
  color: "white",
  zIndex: 2,
};

const title = { fontSize: "110px", fontWeight: "900", margin: 0 };

const subtitle = { fontSize: "22px", marginTop: "10px" };

const orderBtn = {
  position: "absolute",
  right: "60px",
  bottom: "60px",
  padding: "18px 40px",
  fontSize: "20px",
  backgroundColor: "#fff",
  color: "#e63946",
  border: "none",
  borderRadius: "35px",
  fontWeight: "700",
  cursor: "pointer",
  zIndex: 2,
};

export default Home;


