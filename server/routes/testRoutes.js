const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");
const { sendLowStockEmail } = require("../utils/sendEmail");
const { sendEmail } = require("../utils/sendEmail");

router.get("/user", protect, (req, res) => {
  res.json({ message: "User route accessed", user: req.user });
});

router.get("/admin", protect, adminOnly, (req, res) => {
  res.json({ message: "Admin route accessed" });
});

// Dev: send a low-stock email to verify SMTP settings
router.post("/send-lowstock", protect, adminOnly, async (req, res) => {
  try {
    const { itemName = 'Test Item', quantity = 19 } = req.body || {};
    await sendLowStockEmail(itemName, quantity);
    res.json({ message: 'Low-stock email triggered' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Dev: try primary low-stock send, fallback to direct sendEmail to ADMIN_EMAIL
router.post('/send-fallback', protect, adminOnly, async (req, res) => {
  try {
    const { itemName = 'Fallback Item', quantity = 5 } = req.body || {};
    try {
      const info = await sendLowStockEmail(itemName, quantity);
      return res.json({ message: 'Primary low-stock send succeeded', info });
    } catch (primaryErr) {
      console.warn('Primary low-stock send failed, attempting direct sendEmail:', primaryErr.message || primaryErr);
      const admin = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
      const html = `<p>Fallback Low Stock Alert</p><p>Item: ${itemName}</p><p>Remaining: ${quantity}</p>`;
      const info = await sendEmail(admin, 'Fallback Low Stock Alert - PizzaByte', html);
      return res.json({ message: 'Fallback sendEmail succeeded', info });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Debug-only: unauthenticated endpoint to trigger low-stock email quickly
if (process.env.NODE_ENV !== 'production') {
  router.post('/send-lowstock-debug', async (req, res) => {
    try {
      const { itemName = 'Debug Item', quantity = 10 } = req.body || {};
      const info = await sendLowStockEmail(itemName, quantity);
      res.json({ message: 'Debug email sent', info });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
}

module.exports = router;
