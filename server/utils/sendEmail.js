const nodemailer = require("nodemailer");
require("dotenv").config();

// Primary transporter using EMAIL_USER
const transporterPrimary = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Fallback transporter using ADMIN_EMAIL credentials if provided
const transporterFallback = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || "gmail",
  auth: {
    user: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
    pass: process.env.ADMIN_PASS || process.env.EMAIL_PASS,
  },
});

const sendLowStockEmail = async (itemName, quantity) => {
  const admin = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
  const mailOptions = {
    from: `"PizzaByte" <${process.env.EMAIL_USER}>`,
    to: admin,
    subject: "⚠️ PizzaByte – Low Stock Alert",
    html: `
      <h2>Low Stock Alert 🚨</h2>
      <p><b>Item:</b> ${itemName}</p>
      <p><b>Remaining:</b> ${quantity}</p>
      <p>Please restock soon.</p>
    `,
  };

  try {
    // try primary transporter first
    const info = await transporterPrimary.sendMail(mailOptions);
    console.log(`📧 Low-stock email sent for ${itemName} via primary transporter to ${mailOptions.to} (messageId: ${info.messageId})`);
    return info;
  } catch (err) {
    console.warn('Primary transporter failed, trying fallback transporter:', err && err.message ? err.message : err);
    try {
      const info = await transporterFallback.sendMail(mailOptions);
      console.log(`📧 Low-stock email sent for ${itemName} via fallback transporter to ${mailOptions.to} (messageId: ${info.messageId})`);
      return info;
    } catch (err2) {
      console.error('Fallback transporter also failed:', err2 && err2.message ? err2.message : err2);
      throw err2;
    }
  }
};

// Generic sendEmail(to, subject, html) that other parts of the app use
const sendEmail = async (to, subject, html) => {
  const mailOptions = {
    from: `"PizzaByte" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  };

  try {
    const info = await transporterPrimary.sendMail(mailOptions);
    console.log(`📧 Email sent via primary transporter to ${to} (messageId: ${info.messageId})`);
    return info;
  } catch (err) {
    console.warn('Primary transporter failed for generic sendEmail, trying fallback:', err && err.message ? err.message : err);
    try {
      const info = await transporterFallback.sendMail(mailOptions);
      console.log(`📧 Email sent via fallback transporter to ${to} (messageId: ${info.messageId})`);
      return info;
    } catch (err2) {
      console.error('Fallback transporter also failed for generic sendEmail:', err2 && err2.message ? err2.message : err2);
      throw err2;
    }
  }
};

// Export the generic sendEmail as the module export for backward compatibility
module.exports = sendEmail;
// Also attach named helpers so destructuring imports still work
module.exports.sendLowStockEmail = sendLowStockEmail;
module.exports.sendEmail = sendEmail;
module.exports.default = sendEmail;

