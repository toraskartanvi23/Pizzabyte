const User = require("../models/User");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const emailToken = crypto.randomBytes(32).toString("hex");
    // create unverified user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      emailToken,
      isVerified: false
    });

    // send verification email
    try {
      const sendEmail = require("../utils/sendEmail");
      const verifyLink = `http://localhost:5000/api/auth/verify/${emailToken}`;
      await sendEmail(
        email,
        "Verify your PizzaByte account",
        `<p>Hi ${name || ''},</p>
         <p>Thanks for registering. Click the link below to verify your email and activate your account:</p>
         <a href="${verifyLink}">${verifyLink}</a>
         <p>If you didn't request this, you can ignore this email.</p>`
      );
    } catch (mailErr) {
      console.error('Failed to send verification email:', mailErr && mailErr.message ? mailErr.message : mailErr);
      // We won't fail the registration if email sending fails; still require verification later
    }

    res.status(201).json({ message: "Registered successfully. Check your email for verification." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const user = await User.findOne({ emailToken: req.params.token });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    user.isVerified = true;
    user.emailToken = undefined;
    await user.save();

    res.json({ message: "Email verified successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const jwt = require("jsonwebtoken");

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(401).json({ message: "Invalid credentials" });

    if (!user.isVerified)
      return res.status(401).json({ message: "Email not verified" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      token,
  role: user.role,
  email: user.email
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "User already verified" });
    }

    const crypto = require("crypto");
    const sendEmail = require("../utils/sendEmail");

    const newToken = crypto.randomBytes(32).toString("hex");
    user.emailToken = newToken;
    await user.save();

    const verifyLink = `http://localhost:5000/api/auth/verify/${newToken}`;

    await sendEmail(
      email,
      "Resend Verification - PizzaByte",
      `<p>Click to verify your email:</p>
       <a href="${verifyLink}">${verifyLink}</a>`
    );

    res.json({ message: "Verification email resent successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

