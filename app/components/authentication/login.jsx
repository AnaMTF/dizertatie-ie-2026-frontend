import { useState } from "react";
import { FaExclamationTriangle, FaGoogle, FaSignInAlt } from "react-icons/fa";
import isEmail from "validator/lib/isEmail";

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

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleGoogleLogin() {
    // TODO: implement Google login
  }

  function handleLogin() {
    // TODO: implement login
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
            disabled={!isValid}
          >
            Login
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
