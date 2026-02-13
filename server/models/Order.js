const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  userEmail: { type: String, required: true },
  pizzaBase: { type: String, required: true },
  sauce: { type: String, required: true },
  cheese: { type: String, required: true },
  veggies: [{ type: String }],
  totalAmount: { type: Number, required: true },
  status: {
    type: String,
  enum: ["Order Received", "In Kitchen", "Out for Delivery", "Delivered"],
    default: "Order Received",
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Order", orderSchema);

