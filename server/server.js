const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

// Routes
const authRoutes = require("./routes/authRoutes");
const testRoutes = require("./routes/testRoutes");
const adminRoutes = require("./routes/adminRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");
const orderRoutes = require("./routes/orderRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

// Initialize app
const app = express();

// ================== CORS Configuration ==================
// Replace this with your actual Vercel frontend URL
const FRONTEND_URL = process.env.FRONTEND_URL || "https://pizzabyte-gamma.vercel.app/";

app.use(
  cors({
    origin: FRONTEND_URL,  // allow requests only from your frontend
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,      // allow cookies/sessions if used
  })
);

// ================== Middlewares ==================
app.use(express.json());

// ================== Routes ==================
app.use("/api/auth", authRoutes);
app.use("/api/test", testRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payment", paymentRoutes);

// Root route
app.get("/", (req, res) => {
  res.send("PizzaByte Server Running Successfully");
});

// ================== MongoDB Connection ==================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.error("MongoDB Connection Error:", err);
  });

// ================== Start Server ==================
const PORT = process.env.PORT || 1000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
