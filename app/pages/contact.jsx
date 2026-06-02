import { useState } from "react";
import {
  FaEnvelope,
  FaHeadset,
  FaMapMarkerAlt,
  FaPaperPlane,
  FaPhoneAlt,
} from "react-icons/fa";
import { API_BASE } from "../utils/auth";

const INITIAL_FORM = {
  fullName: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
};

function extractErrorMessage(errorPayload) {
  if (typeof errorPayload === "string" && errorPayload.trim()) {
    return errorPayload;
  }

  if (Array.isArray(errorPayload) && errorPayload.length > 0) {
    return "Please check the form fields and try again.";
  }

  return "Failed to send your message. Please try again.";
}

export default function ContactPage() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch(`${API_BASE}/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(extractErrorMessage(payload.error));
      }

      setForm(INITIAL_FORM);
      setSuccessMessage("Your message was sent successfully.");
    } catch (requestError) {
      setError(requestError.message || "Failed to send your message.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="bg-base-100 text-base-content min-h-screen">
      <section className="bg-base-100 relative min-h-[calc(100vh-4rem)] overflow-hidden px-4 py-12 sm:px-8 lg:px-16">
        <div className="mx-auto flex max-w-6xl flex-col gap-8">
          <div className="text-base-content max-w-2xl">
            <p className="text-primary mb-3 text-sm font-semibold tracking-[0.25em] uppercase">
              Contact
            </p>
            <h1 className="text-4xl font-bold md:text-5xl">
              Get in touch with us
            </h1>
            <p className="text-base-content/80 mt-4 text-base leading-7">
              Have questions about your appointments, scans, or using our
              medical platform? Send us a message and our team will get back to
              you.
            </p>
          </div>

          <div className="bg-base-100 grid overflow-hidden rounded-[2rem] shadow-2xl lg:grid-cols-[1.05fr_0.95fr]">
            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-5 p-8 md:p-10"
            >
              <div>
                <div className="bg-primary text-primary-content mb-3 flex h-12 w-12 items-center justify-center rounded-2xl shadow-md">
                  <FaEnvelope />
                </div>
                <h2 className="text-base-content text-3xl font-bold">
                  Contact Form
                </h2>
                <p className="text-base-content mt-2 text-sm">
                  Fill in your details below and we'll be in touch shortly.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="floating-label w-full">
                  <input
                    type="text"
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    placeholder="Full Name"
                    className="input input-bordered bg-base-200 w-full rounded-2xl"
                    required
                    maxLength={150}
                  />
                  <span>Full Name</span>
                </label>

                <label className="floating-label w-full">
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Email"
                    className="input input-bordered bg-base-200 w-full rounded-2xl"
                    required
                    maxLength={254}
                  />
                  <span>Email</span>
                </label>
              </div>

              <label className="floating-label w-full">
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Phone"
                  className="input input-bordered bg-base-200 w-full rounded-2xl"
                  required
                  maxLength={30}
                />
                <span>Phone</span>
              </label>

              <label className="floating-label w-full">
                <input
                  type="text"
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  placeholder="Subject"
                  className="input input-bordered bg-base-200 w-full rounded-2xl"
                  required
                  maxLength={200}
                />
                <span>Subject</span>
              </label>

              <label className="floating-label w-full">
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Message"
                  className="textarea textarea-bordered bg-base-200 min-h-44 w-full resize-none rounded-2xl"
                  required
                  maxLength={2000}
                />
                <span>Message</span>
              </label>

              {error ? <div className="alert alert-error">{error}</div> : null}
              {successMessage ? (
                <div className="alert alert-success">{successMessage}</div>
              ) : null}

              <button
                type="submit"
                className="btn btn-primary mt-2 rounded-2xl shadow-md"
                disabled={isSubmitting}
              >
                <FaPaperPlane />
                {isSubmitting ? "Sending..." : "Send Message"}
              </button>
            </form>

            <aside className="relative hidden min-h-[560px] flex-col justify-between overflow-hidden bg-[#211a3f] p-10 text-white lg:flex">
              <img
                src="/stethoscope-1.jpg"
                alt="Medical"
                className="absolute inset-0 h-full w-full object-cover opacity-85"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-[#211a3f]/95 via-[#211a3f]/65 to-[#6d5dfc]/35" />

              <div className="relative z-10 max-w-sm">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-2xl backdrop-blur">
                  <FaHeadset />
                </div>
                <h3 className="text-3xl font-bold">We're here to help</h3>
                <p className="mt-4 text-sm leading-6 text-white/75">
                  Our team can assist with account questions, appointment
                  scheduling, notifications, or scan analysis inquiries.
                </p>
              </div>

              <div className="relative z-10 grid gap-4 rounded-3xl bg-white/12 p-5 text-sm backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <FaPhoneAlt className="text-primary" />
                  <span>Available for support</span>
                </div>
                <div className="flex items-center gap-3">
                  <FaEnvelope className="text-primary" />
                  <span>Fast response time</span>
                </div>
                <div className="flex items-center gap-3">
                  <FaMapMarkerAlt className="text-primary" />
                  <span>Online platform</span>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}
