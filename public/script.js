document.addEventListener("DOMContentLoaded", () => {
  const bookingForm = document.getElementById("bookingForm");
  const messageEl = document.getElementById("formMessage");
  const yearEl = document.getElementById("year");
  const dateInput = document.getElementById("date");

  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  // Set min date to today
  if (dateInput) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    dateInput.min = `${yyyy}-${mm}-${dd}`;
  }

  if (!bookingForm) return;

  bookingForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const date = document.getElementById("date").value;
    const time = document.getElementById("time").value;
    const service = document.getElementById("service").value;
    const notes = document.getElementById("notes").value.trim();

    if (!name || !email || !date || !time || !service) {
      messageEl.textContent = "Please fill in all required fields for your notary appointment.";
      messageEl.style.color = "#dc2626";
      return;
    }

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, date, time, service, notes })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Error submitting appointment request.");
      }

      bookingForm.reset();
      messageEl.textContent =
        "Your notary appointment request has been submitted. We will confirm by email.";
      messageEl.style.color = "#16a34a";
    } catch (err) {
      console.error(err);
      messageEl.textContent = err.message || "Server error. Please try again.";
      messageEl.style.color = "#dc2626";
    }
  });
});
