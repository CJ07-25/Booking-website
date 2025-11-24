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
        subject: "Notary Appointment Request Received – Florida National Notary Service",
        text: `Hi ${booking.name},

Thank you for submitting a notary appointment request with Florida National Notary Service.

Details:
- Service: ${booking.service}
- Preferred date: ${booking.date}
- Preferred time: ${booking.time}
- Notes: ${booking.notes || "None provided"}

Your request is currently in status: ${booking.status || "pending"}.
We will review your request (including location and document type) and confirm by email or phone.

If this was not you, please ignore this message.

Florida National Notary Service`
      });
    }

    // Email to admin
    if (ADMIN_EMAIL) {
      await mailer.sendMail({
        from: process.env.FROM_EMAIL || process.env.SMTP_USER,
        to: ADMIN_EMAIL,
        subject: "New Notary Booking Request – Florida National Notary Service",
        text: `New notary booking request:

Name: ${booking.name}
Email: ${booking.email}
Phone: ${booking.phone || "N/A"}
Service: ${booking.service}
Date: ${booking.date}
Time: ${booking.time}
Notes: ${booking.notes || "None"}

Login to the admin panel to approve, decline, or update this appointment.`
      });
    }
  } catch (err) {
    console.error("Email error:", err.message);
  }
}
