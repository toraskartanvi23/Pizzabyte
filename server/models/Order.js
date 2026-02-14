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
  enum: ["Paid", "Order Received", "In Kitchen", "Out for Delivery", "Delivered"],
    default: "Order Received",
  },
  payment: {
    paymentId: { type: String },
    orderId: { type: String }, // razorpay order id
    status: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Order", orderSchema);

