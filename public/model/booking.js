const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    date: { type: String, required: true },   // store ISO date string
    time: { type: String, required: true },   // "HH:MM"
    service: { type: String, required: true },
    notes: { type: String },
    status: {
      type: String,
      enum: ["pending", "approved", "declined"],
      default: "pending"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);
