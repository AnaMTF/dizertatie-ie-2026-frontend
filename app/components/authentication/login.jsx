import { useState } from "react";
import { FaFacebook, FaGoogle } from "react-icons/fa";
import isEmail from "validator/lib/isEmail";

function Field({ label, type, name, value, onChange }) {
  return (
    <label className="tw:d-floating-label">
      <input
        type={type}
        name={name}
        placeholder={label}
        className="tw:d-input tw:w-full"
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

  function handleFacebookLogin() {
    // TODO: implement Facebook login
  }

  function handleLogin() {
    // TODO: implement login
  }

  const isValid = isEmail(form.email) && form.password.length >= 8;

  return (
    <div className="tw:flex tw:flex-col tw:p-10 tw:bg-base-100 tw:text-base-content tw:h-full">
      <div className="tw:flex tw:flex-col tw:gap-4 tw:flex-1 tw:justify-end">
        <h2 className="tw:text-2xl tw:font-bold">Welcome back</h2>
        <button
          className="tw:d-btn tw:d-btn-outline"
          onClick={handleGoogleLogin}
        >
          <FaGoogle /> Continue with Google
        </button>
        <button
          className="tw:d-btn tw:d-btn-outline"
          onClick={handleFacebookLogin}
        >
          <FaFacebook /> Continue with Facebook
        </button>
      </div>

      <div className="tw:d-divider">or</div>

      <form className="tw:flex tw:flex-col tw:gap-4 tw:flex-1">
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
          className={[
            "tw:mt-auto",
            !isValid && "tw:d-tooltip tw:d-tooltip-warning",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {!isValid && (
            <div className="tw:d-tooltip-content">
              <strong>Please enter a valid email and password</strong>
            </div>
          )}
          <button
            type="button"
            className="tw:d-btn tw:d-btn-primary tw:w-full"
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
    <div className="tw:bg-primary">
      <img
        src="/doctor-on-left.jpg"
        alt="Doctor"
        className="tw:w-full tw:h-full tw:object-cover tw:object-left"
      />
    </div>
  );
}

export default function Login() {
  return (
    <dialog id="login-modal" className="tw:d-modal">
      <div className="tw:d-modal-box tw:max-w-5xl tw:p-0 tw:overflow-hidden tw:relative">
        <form method="dialog">
          <button className="tw:d-btn tw:d-btn-sm tw:d-btn-circle tw:d-btn-ghost tw:absolute tw:right-2 tw:top-2">
            ✕
          </button>
        </form>
        <div className="tw:grid tw:grid-cols-2 tw:min-h-160">
          <LoginPhoto />
          <LoginForm />
        </div>
      </div>
    </dialog>
  );
}
