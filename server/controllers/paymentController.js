const Razorpay = require('razorpay');
const crypto = require('crypto');
require('dotenv').config();
const Order = require('../models/Order');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create razorpay order
exports.createOrder = async (req, res) => {
  try {
  console.log('createOrder called with body:', req.body);
    const { orderId, amount, currency = 'INR' } = req.body; // amount in smallest currency unit

    const options = {
      amount: amount, // amount in paise
      currency,
      receipt: `receipt_${orderId}`,
    };

  const rOrder = await razorpay.orders.create(options);

    // store razorpay order id on our order
    if (orderId) {
      await Order.findByIdAndUpdate(orderId, { 'payment.orderId': rOrder.id, 'payment.status': 'pending' });
    }

  // return razorpay order and public key id (safe to expose)
  res.json({ success: true, rOrder, key_id: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    console.error('Create order error', err && err.stack ? err.stack : err);
    // surface the raw error message to the client for easier debugging in dev
    res.status(500).json({ success: false, error: err.message || String(err) });
  }
};

// Verify payment signature
exports.verifyPayment = async (req, res) => {
  try {
  console.log('verifyPayment called with body:', req.body);
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    if (generated_signature === razorpay_signature) {
      // mark order paid
      if (orderId) {
        await Order.findByIdAndUpdate(orderId, { 
          'payment.paymentId': razorpay_payment_id,
          'payment.status': 'paid',
          status: 'Paid'
        });
      }
      return res.json({ success: true });
    } else {
      if (orderId) {
        await Order.findByIdAndUpdate(orderId, { 'payment.status': 'failed' });
      }
      return res.status(400).json({ success: false, error: 'Invalid signature' });
    }
  } catch (err) {
    console.error('Verify payment error', err && err.stack ? err.stack : err);
    res.status(500).json({ success: false, error: err.message || String(err) });
  }
};
