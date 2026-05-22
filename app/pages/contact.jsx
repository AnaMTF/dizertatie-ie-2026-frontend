import { useState } from "react";
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
    <section className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="card bg-base-100 shadow-md">
        <div className="card-body gap-4">
          <h1 className="card-title text-2xl">Contact</h1>
          <p className="text-base-content/80 text-sm">
            Send us your details and message. Our team will get back to you.
          </p>

          {error ? <div className="alert alert-error">{error}</div> : null}
          {successMessage ? (
            <div className="alert alert-success">{successMessage}</div>
          ) : null}

          <form onSubmit={handleSubmit} className="grid gap-3">
            <label className="form-control w-full">
              <span className="label-text">Full name</span>
              <input
                type="text"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                className="input input-bordered w-full"
                required
                maxLength={150}
              />
            </label>

            <label className="form-control w-full">
              <span className="label-text">Email</span>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="input input-bordered w-full"
                required
                maxLength={254}
              />
            </label>

            <label className="form-control w-full">
              <span className="label-text">Phone</span>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="input input-bordered w-full"
                required
                maxLength={30}
              />
            </label>

            <label className="form-control w-full">
              <span className="label-text">Subject</span>
              <input
                type="text"
                name="subject"
                value={form.subject}
                onChange={handleChange}
                className="input input-bordered w-full"
                required
                maxLength={200}
              />
            </label>

            <label className="form-control w-full">
              <span className="label-text">Message</span>
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                className="textarea textarea-bordered h-36 w-full"
                required
                maxLength={2000}
              />
            </label>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="loading loading-spinner loading-sm" />
              ) : null}
              Send message
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
