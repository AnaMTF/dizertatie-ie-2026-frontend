import { useState } from "react";
import {
  FaGoogle,
  FaLock,
  FaNotesMedical,
  FaUser,
  FaUserPlus,
} from "react-icons/fa";
import isEmail from "validator/lib/isEmail";
import isNumeric from "validator/lib/isNumeric";
import StepActions from "../common/step-actions";

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

function StepEmail({ onNext, values, onChange }) {
  function handleGoogleLogin() {
    // TODO: implement Google login
  }

  const isValid = isEmail(values.email);

  return (
    <>
      <h2 className="flex items-center gap-2 text-2xl font-bold">
        <FaUserPlus /> Create an account
      </h2>
      <button className="btn btn-outline" onClick={handleGoogleLogin}>
        <FaGoogle /> Continue with Google
      </button>

      <div className="divider">or</div>

      <form className="flex flex-1 flex-col gap-4">
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
    <form className="flex h-full flex-col gap-4">
      <h2 className="flex items-center gap-2 text-2xl font-bold">
        <FaLock /> Set your password
      </h2>
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
    <form className="flex h-full flex-col gap-4">
      <h2 className="flex items-center gap-2 text-2xl font-bold">
        <FaUser /> Personal info
      </h2>
      <div className="grid grid-cols-2 gap-4">
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
      <div className="grid grid-cols-2 gap-4">
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
    <form className="flex h-full flex-col gap-4">
      <h2 className="flex items-center gap-2 text-2xl font-bold">
        <FaNotesMedical /> Additional information
      </h2>
      <p className="text-base-content/60 text-sm">
        Tell us anything else you&apos;d like your doctor to know.
      </p>
      <textarea
        className="textarea w-full flex-1"
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
    <div className="bg-base-100 text-base-content flex h-full flex-col gap-4 p-10">
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
    <div className="bg-primary">
      <img
        src="/doctor-on-right.jpg"
        alt="Doctor"
        className="h-full w-full object-cover object-right"
      />
    </div>
  );
}

export default function Register() {
  return (
    <dialog id="register-modal" className="modal">
      <div className="modal-box relative max-w-5xl overflow-hidden p-0">
        <form method="dialog">
          <button className="btn btn-sm btn-circle btn-ghost absolute top-2 right-2">
            ✕
          </button>
        </form>
        <div className="grid min-h-160 grid-cols-2">
          <RegisterForm />
          <RegisterPhoto />
        </div>
      </div>
    </dialog>
  );
}
