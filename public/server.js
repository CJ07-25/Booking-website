require("dotenv").config();
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const Booking = require("./models/Booking");

const app = express();

// ====== CONFIG ======
const PORT = process.env.PORT || 10000;
const MONGODB_URI = process.env.MONGODB_URI;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "changeme";
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";

// Email config (optional)
let mailer = null;
if (
  process.env.SMTP_HOST &&
  process.env.SMTP_PORT &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASS
) {
  mailer = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

// ====== MIDDLEWARE ======
app.use(express.json());
app.use(cors());

// Serve static frontend from /public
app.use(express.static(path.join(__dirname, "public")));

// ====== DB CONNECTION ======
mongoose
  .connect(MONGODB_URI, {
    dbName: process.env.DB_NAME || undefined
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));

// ====== UTIL: SEND EMAILS ======
async function sendBookingEmails(booking) {
  if (!mailer) {
    console.log("📭 Email not configured. Skipping emails.");
    return;
  }

  try {
    // Email to client
    if (booking.email) {
      await mailer.sendMail({
        from: process.env.FROM_EMAIL || process.env.SMTP_USER,
        to: booking.email,
        subject: "Booking Received",
        text: `Hi ${booking.name},\n\nWe received your booking for ${booking.service} on ${booking.date} at ${booking.time}.\nStatus: pending.\n\nThank you!`,
      });
    }

    // Email to admin
    if (ADMIN_EMAIL) {
      await mailer.sendMail({
        from: process.env.FROM_EMAIL || process.env.SMTP_USER,
        to: ADMIN_EMAIL,
        subject: "New Booking",
        text: `New booking from ${booking.name} (${booking.email}) for ${booking.service} on ${booking.date} at ${booking.time}.`
      });
    }
  } catch (err) {
    console.error("Email error:", err.message);
  }
}

// ====== PUBLIC ROUTE: CREATE BOOKING ======
app.post("/api/bookings", async (req, res) => {
  try {
    const { name, email, phone, date, time, service, notes } = req.body;

    if (!name || !email || !date || !time || !service) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const booking = await Booking.create({
      name,
      email,
      phone,
      date,
      time,
      service,
      notes
    });

    // Send emails (fire and forget)
    sendBookingEmails(booking).catch(() => {});

    return res.status(201).json({ message: "Booking created.", booking });
  } catch (err) {
    console.error("Create booking error:", err);
    return res.status(500).json({ message: "Server error." });
  }
});

// ====== ADMIN AUTH ======
function adminAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({ message: "Missing token." });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.role !== "admin") {
      return res.status(403).json({ message: "Forbidden." });
    }
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token." });
  }
}

// Login endpoint for admin panel
app.post("/api/admin/login", (req, res) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ message: "Password required." });
  }
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ message: "Invalid password." });
  }

  const token = jwt.sign({ role: "admin" }, JWT_SECRET, {
    expiresIn: "12h"
  });

  return res.json({ token });
});

// ====== ADMIN ROUTES ======

// Get all bookings
app.get("/api/admin/bookings", adminAuth, async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    console.error("Get bookings error:", err);
    res.status(500).json({ message: "Server error." });
  }
});

// Update booking status
app.patch("/api/admin/bookings/:id/status", adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!["pending", "approved", "declined"].includes(status)) {
      return res.status(400).json({ message: "Invalid status." });
    }

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    res.json(booking);
  } catch (err) {
    console.error("Update status error:", err);
    res.status(500).json({ message: "Server error." });
  }
});

// Delete booking
app.delete("/api/admin/bookings/:id", adminAuth, async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }
    res.json({ message: "Booking deleted." });
  } catch (err) {
    console.error("Delete booking error:", err);
    res.status(500).json({ message: "Server error." });
  }
});

// ====== SPA FALLBACK FOR ADMIN (optional) ======
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

// ====== START ======
app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});
