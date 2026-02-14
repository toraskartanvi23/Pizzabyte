import React, { useState } from "react";
import API from "../api/api";
import { useToast } from "../components/Toast";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post("/auth/login", { email, password });

      if (res.data && res.data.token) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("email", res.data.email);
        localStorage.setItem("role", res.data.role);
        toast.push("Login successful!");

        if (res.data.role === "admin") {
          window.location.href = "/admin/dashboard";
        } else {
          window.location.href = "/builder";
        }
      } else {
        toast.push("Invalid credentials or server error.");
      }
    } catch (err) {
      console.error("❌ Login Error:", err.response?.data || err.message);
      const msg = err.response?.data?.message || "Invalid credentials or server error.";
      toast.push(msg);
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h2>Login to PizzaByte</h2>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
        <p>
          Don't have an account? <a href="/register">Register here</a>
        </p>
      </form>
    </div>
  );
};
  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h2>Login to PizzaByte</h2>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
        <p>
          Don't have an account? <a href="/register">Register here</a>
        </p>
      </form>
    </div>
  );



  return (
    <div
      style={{
        height: "100vh",
        width: "100%",
  backgroundImage: "url('/pizza-bg2.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          backgroundColor: "rgba(255,255,255,0.9)",
          padding: "40px",
          borderRadius: "12px",
          textAlign: "center",
          width: "350px",
          boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
        }}
      >
        <h2 style={{ color: "#e63946", marginBottom: "20px" }}>~Welcome Back~</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={inputStyle}
          />
          <button type="submit" style={buttonStyle}>
            Login
          </button>
        </form>
        <p style={{ marginTop: "15px" }}>
          Don’t have an account?{" "}
          <a href="/register" style={{ color: "#e63946", fontWeight: "600" }}>
            Register
          </a>
        </p>
      </div>
    </div>
  );

const inputStyle = {
  width: "100%",
  padding: "12px",
  marginBottom: "15px",
  borderRadius: "8px",
  border: "1px solid #ccc",
  fontSize: "16px",
};

const buttonStyle = {
  width: "100%",
  padding: "12px",
  borderRadius: "8px",
  backgroundColor: "#e63946",
  color: "white",
  border: "none",
  fontSize: "18px",
  fontWeight: "bold",
  cursor: "pointer",
};

export default Login;
