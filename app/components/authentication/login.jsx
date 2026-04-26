import { useState } from "react";
import { FaExclamationTriangle, FaGoogle, FaSignInAlt } from "react-icons/fa";
import { useNavigate } from "react-router";
import isEmail from "validator/lib/isEmail";
import { API_BASE, setAuth } from "../../utils/auth";

function Field({ label, type, name, value, onChange }) {
  return (
    <label className="floating-label">
      <input
        type={type}
        name={name}
        placeholder={label}
        className="input w-full"
        value={value}
        onChange={onChange}
      />
      <span>{label}</span>
    </label>
  );
}

function LoginForm() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleGoogleLogin() {
    // TODO: implement Google login
  }

  async function handleLogin() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setError(json?.message || `Login failed (HTTP ${res.status})`);
        return;
      }
      if (!json?.data) {
        setError("Login failed: invalid server response");
        return;
      }
      setAuth(json.data);
      document.getElementById("login-modal").close();
      navigate("/profile");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const isValid = isEmail(form.email) && form.password.length >= 8;

  return (
    <div className="bg-base-100 text-base-content flex h-full flex-col p-10">
      <div className="flex flex-1 flex-col justify-end gap-4">
        <h2 className="flex items-center gap-2 text-2xl font-bold">
          <FaSignInAlt /> Welcome back
        </h2>
        <button className="btn btn-outline" onClick={handleGoogleLogin}>
          <FaGoogle /> Continue with Google
        </button>
      </div>

      <div className="divider">or</div>

      <form className="flex flex-1 flex-col gap-4">
        {error && (
          <div className="alert alert-error">
            <FaExclamationTriangle />
            <span>{error}</span>
          </div>
        )}
        <Field
          label="Email"
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
        />
        <Field
          label="Password"
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
        />
        <div
          className={["mt-auto", !isValid && "tooltip tooltip-warning"]
            .filter(Boolean)
            .join(" ")}
        >
          {!isValid && (
            <div className="tooltip-content flex items-center gap-2">
              <FaExclamationTriangle />
              <strong>Please enter a valid email and password</strong>
            </div>
          )}
          <button
            type="button"
            className="btn btn-primary w-full"
            onClick={handleLogin}
            disabled={!isValid || loading}
          >
            {loading ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              "Login"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

function LoginPhoto() {
  return (
    <div className="bg-primary">
      <img
        src="/doctor-on-left.jpg"
        alt="Doctor"
        className="h-full w-full object-cover object-left"
      />
    </div>
  );
}

export default function Login() {
  return (
    <dialog id="login-modal" className="modal">
      <div className="modal-box relative max-w-5xl overflow-hidden p-0">
        <form method="dialog">
          <button className="btn btn-sm btn-circle btn-ghost absolute top-2 right-2">
            ✕
          </button>
        </form>
        <div className="grid min-h-160 grid-cols-2">
          <LoginPhoto />
          <LoginForm />
        </div>
      </div>
    </dialog>
  );
}
