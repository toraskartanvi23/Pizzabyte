import React, { useState } from "react";
import API from "../api/api";
import { Link } from "react-router-dom";
import { useToast } from "../components/Toast";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [registered, setRegistered] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post("/auth/register", formData);
      // After registration the server now sends a verification email.
      if (res.data && res.data.message) {
        setRegistered(true);
        return;
      }
      toast.push(res.data.message || "Registered successfully! Check your email to verify your account.");
    } catch (err) {
      toast.push(err.response?.data?.message || "Registration failed!");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.overlay}></div>
      <form onSubmit={handleSubmit} style={styles.form}>
        <h1 style={styles.title}>Create Account</h1>
        {registered ? (
          <div style={{ textAlign: 'left' }}>
            <p>Please check your email for a verification link. You must verify your email before logging in.</p>
            <p>If you didn't receive the email, use the <a href="/resend-verification">resend verification</a> page.</p>
          </div>
        ) : (
          <>
        <input
          style={styles.input}
          type="text"
          name="name"
          placeholder="Name"
          onChange={handleChange}
        />
        <input
          style={styles.input}
          type="email"
          name="email"
          placeholder="Email"
          onChange={handleChange}
        />
        <input
          style={styles.input}
          type="password"
          name="password"
          placeholder="Password"
          onChange={handleChange}
        />
        <button style={styles.btn} type="submit">
          Register
        </button>
        </>
        )}
        <p style={styles.text}>
          Already have an account?{" "}
          <Link to="/login" style={styles.link}>
            Login
          </Link>
        </p>
      </form>
    </div>
  );
};

const styles = {
  container: {
    height: "100vh",
    width: "100%",
  backgroundImage: `url('pizza-bg2.jpg')`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  form: {
    position: "relative",
    zIndex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    padding: "50px 60px",
    borderRadius: "12px",
    textAlign: "center",
    width: "400px",
    boxShadow: "0 0 20px rgba(0,0,0,0.2)",
  },
  title: {
    fontSize: "32px",
    marginBottom: "25px",
    color: "#e63946",
    fontWeight: "700",
  },
  input: {
    width: "100%",
    padding: "14px",
    margin: "10px 0",
    borderRadius: "8px",
    border: "1px solid #ccc",
    fontSize: "16px",
  },
  btn: {
    backgroundColor: "#e63946",
    color: "#fff",
    border: "none",
    padding: "14px 24px",
    borderRadius: "8px",
    fontSize: "18px",
    cursor: "pointer",
    marginTop: "10px",
    width: "100%",
  },
  text: {
    marginTop: "15px",
    color: "#333",
  },
  link: {
    color: "#e63946",
    textDecoration: "none",
    fontWeight: "600",
  },
};

export default Register;


