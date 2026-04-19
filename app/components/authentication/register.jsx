import { useState } from "react";
import { FaFacebook, FaGoogle } from "react-icons/fa";
import isEmail from "validator/lib/isEmail";
import isNumeric from "validator/lib/isNumeric";

function isAtLeast18(dateStr) {
  if (!dateStr) return false;
  const dob = new Date(dateStr);
  const today = new Date();
  const age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  return (
    age > 18 ||
    (age === 18 && (m > 0 || (m === 0 && today.getDate() >= dob.getDate())))
  );
}

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

function StepActions({
  onNext,
  onBack,
  nextLabel = "Continue",
  disabled = false,
  tooltipMessage,
}) {
  return (
    <div className="tw:flex tw:gap-2 tw:mt-auto">
      {onBack && (
        <button
          type="button"
          className="tw:d-btn tw:d-btn-ghost tw:flex-1"
          onClick={onBack}
        >
          Back
        </button>
      )}
      <div
        className={[
          "tw:flex-1",
          disabled && "tw:d-tooltip tw:d-tooltip-warning",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {disabled && tooltipMessage && (
          <div className="tw:d-tooltip-content">
            <strong>{tooltipMessage}</strong>
          </div>
        )}
        <button
          type="button"
          className="tw:d-btn tw:d-btn-primary tw:w-full"
          onClick={onNext}
          disabled={disabled}
        >
          {nextLabel}
        </button>
      </div>
    </div>
  );
}

function StepEmail({ onNext, values, onChange }) {
  function handleGoogleLogin() {
    // TODO: implement Google login
  }

  function handleFacebookLogin() {
    // TODO: implement Facebook login
  }

  const isValid = isEmail(values.email);

  return (
    <>
      <h2 className="tw:text-2xl tw:font-bold">Create an account</h2>
      <button className="tw:d-btn tw:d-btn-outline" onClick={handleGoogleLogin}>
        <FaGoogle /> Continue with Google
      </button>
      <button
        className="tw:d-btn tw:d-btn-outline"
        onClick={handleFacebookLogin}
      >
        <FaFacebook /> Continue with Facebook
      </button>

      <div className="tw:d-divider">or</div>

      <form className="tw:flex tw:flex-col tw:gap-4 tw:flex-1">
        <Field
          label="Email"
          type="email"
          name="email"
          value={values.email}
          onChange={onChange}
        />
        <StepActions
          onNext={onNext}
          disabled={!isValid}
          tooltipMessage="Please enter a valid email address"
        />
      </form>
    </>
  );
}

function StepPassword({ onNext, onBack, values, onChange }) {
  const isValid =
    values.password.length >= 8 &&
    values.password.length <= 128 &&
    values.password === values.confirmPassword;

  return (
    <form className="tw:flex tw:flex-col tw:gap-4 tw:h-full">
      <h2 className="tw:text-2xl tw:font-bold">Set your password</h2>
      <Field
        label="Password"
        type="password"
        name="password"
        value={values.password}
        onChange={onChange}
      />
      <Field
        label="Confirm Password"
        type="password"
        name="confirmPassword"
        value={values.confirmPassword}
        onChange={onChange}
      />
      <StepActions
        onNext={onNext}
        onBack={onBack}
        disabled={!isValid}
        tooltipMessage="Passwords must match and be at least 8 characters long"
      />
    </form>
  );
}

function StepPersonalInfo({ onNext, onBack, values, onChange }) {
  const isValid =
    values.firstName.length >= 1 &&
    values.firstName.length <= 100 &&
    values.lastName.length >= 1 &&
    values.lastName.length <= 100 &&
    isAtLeast18(values.dateOfBirth) &&
    isNumeric(values.height) &&
    isNumeric(values.weight);

  return (
    <form className="tw:flex tw:flex-col tw:gap-4 tw:h-full">
      <h2 className="tw:text-2xl tw:font-bold">Personal info</h2>
      <div className="tw:grid tw:grid-cols-2 tw:gap-4">
        <Field
          label="First Name"
          type="text"
          name="firstName"
          value={values.firstName}
          onChange={onChange}
        />
        <Field
          label="Last Name"
          type="text"
          name="lastName"
          value={values.lastName}
          onChange={onChange}
        />
      </div>
      <Field
        label="Date of Birth"
        type="date"
        name="dateOfBirth"
        value={values.dateOfBirth}
        onChange={onChange}
      />
      <div className="tw:grid tw:grid-cols-2 tw:gap-4">
        <Field
          label="Height (cm)"
          type="number"
          name="height"
          value={values.height}
          onChange={onChange}
        />
        <Field
          label="Weight (kg)"
          type="number"
          name="weight"
          value={values.weight}
          onChange={onChange}
        />
      </div>
      <StepActions
        onNext={onNext}
        onBack={onBack}
        disabled={!isValid}
        tooltipMessage="Please fill in all fields. You must be at least 18 years old."
      />
    </form>
  );
}

function StepAdditionalInfo({ onBack, values, onChange }) {
  function handleCreateAccount() {
    // TODO: submit registration
  }

  return (
    <form className="tw:flex tw:flex-col tw:gap-4 tw:h-full">
      <h2 className="tw:text-2xl tw:font-bold">Additional information</h2>
      <p className="tw:text-sm tw:text-base-content/60">
        Tell us anything else you&apos;d like your doctor to know.
      </p>
      <textarea
        className="tw:d-textarea tw:w-full tw:flex-1"
        name="additionalInfo"
        placeholder="Type here..."
        value={values.additionalInfo}
        onChange={onChange}
      />
      <StepActions
        onNext={handleCreateAccount}
        onBack={onBack}
        nextLabel="Create Account"
      />
    </form>
  );
}

function RegisterForm() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    height: "",
    weight: "",
    additionalInfo: "",
  });

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function nextStep() {
    setStep((s) => s + 1);
  }

  function prevStep() {
    setStep((s) => s - 1);
  }

  return (
    <div className="tw:flex tw:flex-col tw:p-10 tw:gap-4 tw:bg-base-100 tw:text-base-content tw:h-full">
      {step === 0 && (
        <StepEmail onNext={nextStep} values={form} onChange={handleChange} />
      )}
      {step === 1 && (
        <StepPassword
          onNext={nextStep}
          onBack={prevStep}
          values={form}
          onChange={handleChange}
        />
      )}
      {step === 2 && (
        <StepPersonalInfo
          onNext={nextStep}
          onBack={prevStep}
          values={form}
          onChange={handleChange}
        />
      )}
      {step === 3 && (
        <StepAdditionalInfo
          onBack={prevStep}
          values={form}
          onChange={handleChange}
        />
      )}
    </div>
  );
}

function RegisterPhoto() {
  return (
    <div className="tw:bg-primary">
      <img
        src="/doctor-on-right.jpg"
        alt="Doctor"
        className="tw:w-full tw:h-full tw:object-cover tw:object-right"
      />
    </div>
  );
}

export default function Register() {
  return (
    <dialog id="register-modal" className="tw:d-modal">
      <div className="tw:d-modal-box tw:max-w-5xl tw:p-0 tw:overflow-hidden tw:relative">
        <form method="dialog">
          <button className="tw:d-btn tw:d-btn-sm tw:d-btn-circle tw:d-btn-ghost tw:absolute tw:right-2 tw:top-2">
            ✕
          </button>
        </form>
        <div className="tw:grid tw:grid-cols-2 tw:min-h-160">
          <RegisterForm />
          <RegisterPhoto />
        </div>
      </div>
    </dialog>
  );
}
