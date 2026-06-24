import { useEffect, useState } from "react";
import {
  FaExclamationTriangle,
  FaNotesMedical,
  FaUserPlus,
  FaVenusMars,
} from "react-icons/fa";
import { useNavigate } from "react-router";
import isEmail from "validator/lib/isEmail";
import isNumeric from "validator/lib/isNumeric";
import { API_BASE, setAuth } from "../../utils/auth";
import StepActions from "../common/step-actions";

const SEX_OPTIONS = ["Man", "Woman"];
const ALCOHOL_FREQUENCY_OPTIONS = [
  { value: "never", label: "Never" },
  { value: "less_than_monthly", label: "Less than monthly" },
  { value: "monthly", label: "Monthly" },
  { value: "weekly", label: "Weekly" },
  { value: "daily_or_almost_daily", label: "Daily or almost daily" },
];

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

function validatePassword(password) {
  const hasMinLength = password.length >= 8;
  const hasMaxLength = password.length <= 128;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(password);

  return {
    hasMinLength,
    hasMaxLength,
    hasUppercase,
    hasLowercase,
    hasDigit,
    hasSpecialChar,
    isValid:
      hasMinLength &&
      hasMaxLength &&
      hasUppercase &&
      hasLowercase &&
      hasDigit &&
      hasSpecialChar,
  };
}

function getPasswordStrength(password) {
  if (!password) return 0;

  const validation = validatePassword(password);
  const metRequirements = [
    validation.hasMinLength,
    validation.hasUppercase,
    validation.hasLowercase,
    validation.hasDigit,
    validation.hasSpecialChar,
  ].filter(Boolean).length;

  return Math.ceil((metRequirements / 5) * 100);
}

function getStrengthColor(strength) {
  if (strength < 40) return "progress-error";
  if (strength < 70) return "progress-warning";
  return "progress-success";
}

function getStrengthLabel(strength) {
  if (strength < 40) return "Weak";
  if (strength < 70) return "Fair";
  return "Strong";
}

function PasswordRequirementsChecklist({ password, confirmPassword }) {
  const passwordValidation = validatePassword(password);
  const strength = getPasswordStrength(password);
  const strengthColor = password ? getStrengthColor(strength) : "";
  const strengthLabel = getStrengthLabel(strength);
  const passwordsMatch =
    password === confirmPassword && confirmPassword.length > 0;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-base-content/70 text-sm">Strength</span>
        {password && (
          <span className="text-sm font-semibold">{strengthLabel}</span>
        )}
      </div>
      <progress
        className={`progress w-full ${strengthColor}`}
        value={strength}
        max="100"
      />
      <ul className="text-base-content/60 space-y-1 text-xs">
        <li className={passwordValidation.hasMinLength ? "text-success" : ""}>
          {passwordValidation.hasMinLength ? "✓" : "○"} At least 8 characters
        </li>
        <li className={passwordValidation.hasUppercase ? "text-success" : ""}>
          {passwordValidation.hasUppercase ? "✓" : "○"} At least one uppercase
          letter
        </li>
        <li className={passwordValidation.hasLowercase ? "text-success" : ""}>
          {passwordValidation.hasLowercase ? "✓" : "○"} At least one lowercase
          letter
        </li>
        <li className={passwordValidation.hasDigit ? "text-success" : ""}>
          {passwordValidation.hasDigit ? "✓" : "○"} At least one number
        </li>
        <li className={passwordValidation.hasSpecialChar ? "text-success" : ""}>
          {passwordValidation.hasSpecialChar ? "✓" : "○"} At least one special
          character
        </li>
        {confirmPassword && (
          <li className={passwordsMatch ? "text-success" : "text-error"}>
            {passwordsMatch ? "✓" : "✕"} Passwords match
          </li>
        )}
      </ul>
    </div>
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

function SelectField({ label, name, value, onChange, options }) {
  return (
    <label className="floating-label">
      <select
        name={name}
        className="select w-full"
        value={value}
        onChange={onChange}
      >
        <option value="" disabled>
          Select {label.toLowerCase()}
        </option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <span>{label}</span>
    </label>
  );
}

function StepEmailAndPassword({ onNext, values, onChange }) {
  const emailValid = isEmail(values.email);
  const passwordValidation = validatePassword(values.password);
  const passwordsMatch =
    values.password === values.confirmPassword && values.password.length > 0;

  const isValid = emailValid && passwordValidation.isValid && passwordsMatch;

  return (
    <form className="flex h-full flex-col gap-4">
      <h2 className="mb-2 flex items-center gap-2 text-2xl font-bold">
        <FaUserPlus /> Create an account
      </h2>
      <Field
        label="Email"
        type="email"
        name="email"
        value={values.email}
        onChange={onChange}
      />
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
      <PasswordRequirementsChecklist
        password={values.password}
        confirmPassword={values.confirmPassword}
      />
      <StepActions
        onNext={onNext}
        disabled={!isValid}
        tooltipMessage={
          !emailValid
            ? "Please enter a valid email address"
            : !passwordValidation.isValid
              ? "Please meet all password requirements"
              : "Passwords must match"
        }
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
    SEX_OPTIONS.includes(values.sex) &&
    isAtLeast18(values.dateOfBirth) &&
    isNumeric(values.height) &&
    isNumeric(values.weight);

  return (
    <form className="flex h-full flex-col gap-4">
      <h2 className="mb-2 flex items-center gap-2 text-2xl font-bold">
        <FaVenusMars /> Personal info
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
      <SelectField
        label="Sex"
        name="sex"
        value={values.sex}
        onChange={onChange}
        options={SEX_OPTIONS}
      />
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
        tooltipMessage="Please complete all personal details and confirm you are at least 18 years old."
      />
    </form>
  );
}

function StepClinic({
  onNext,
  onBack,
  values,
  onChange,
  clinics,
  loading,
  error,
}) {
  const isValid = Boolean(values.favoriteClinicUuid);

  return (
    <form className="flex h-full flex-col gap-4">
      <h2 className="mb-2 flex items-center gap-2 text-2xl font-bold">
        <FaNotesMedical /> Favorite clinic
      </h2>
      <p className="text-base-content/60 text-sm">
        Select the clinic you want preselected for appointments.
      </p>

      {error && (
        <div className="alert alert-error">
          <FaExclamationTriangle />
          <span>{error}</span>
        </div>
      )}

      <label className="floating-label">
        <select
          name="favoriteClinicUuid"
          className="select w-full"
          value={values.favoriteClinicUuid}
          onChange={onChange}
          disabled={loading || clinics.length === 0}
        >
          <option value="">Select favorite clinic</option>
          {clinics.map((clinic) => (
            <option key={clinic.uuid} value={clinic.uuid}>
              {clinic.name}
            </option>
          ))}
        </select>
        <span>Favorite clinic</span>
      </label>

      {loading && (
        <div className="text-base-content/60 flex items-center gap-2 text-sm">
          <span className="loading loading-spinner loading-sm" />
          Loading clinics...
        </div>
      )}

      <StepActions
        onNext={onNext}
        onBack={onBack}
        disabled={!isValid || loading || clinics.length === 0}
        tooltipMessage="Please choose a favorite clinic to continue"
      />
    </form>
  );
}

function StepAdditionalInfo({
  onBack,
  values,
  onChange,
  onSubmit,
  error,
  loading,
}) {
  const smokerProvided = values.smoker !== "";
  const alcoholFrequencyProvided = values.alcoholConsumptionFrequency !== "";
  const smokerValid = !smokerProvided || ["yes", "no"].includes(values.smoker);
  const alcoholFrequencyValid =
    !alcoholFrequencyProvided ||
    ALCOHOL_FREQUENCY_OPTIONS.some(
      (option) => option.value === values.alcoholConsumptionFrequency,
    );
  const isValid = smokerValid && alcoholFrequencyValid;
  const isSubmitDisabled = loading || !isValid;

  return (
    <form className="flex h-full flex-col gap-4">
      <h2 className="mb-2 flex items-center gap-2 text-2xl font-bold">
        <FaNotesMedical /> Additional information
      </h2>
      <p className="text-base-content/60 text-sm">
        Tell us anything else you&apos;d like your doctor to know.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="floating-label">
          <select
            name="smoker"
            className="select w-full"
            value={values.smoker}
            onChange={onChange}
          >
            <option value="" disabled>
              Select smoker status
            </option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
          <span>Are you a smoker?</span>
        </label>

        <label className="floating-label">
          <select
            name="alcoholConsumptionFrequency"
            className="select w-full"
            value={values.alcoholConsumptionFrequency}
            onChange={onChange}
          >
            <option value="" disabled>
              Select alcohol frequency
            </option>
            {ALCOHOL_FREQUENCY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <span>Alcohol consumption frequency</span>
        </label>
      </div>
      <textarea
        className="textarea w-full flex-1"
        name="additionalInfo"
        placeholder="Type here..."
        value={values.additionalInfo}
        onChange={onChange}
      />
      {error && (
        <div className="alert alert-error">
          <FaExclamationTriangle />
          <span>{error}</span>
        </div>
      )}
      <StepActions
        onNext={onSubmit}
        onBack={onBack}
        nextLabel={loading ? "Creating..." : "Create Account"}
        disabled={isSubmitDisabled}
        tooltipMessage={
          !isValid
            ? "Please choose valid options if you fill smoking or alcohol information"
            : undefined
        }
      />
    </form>
  );
}

function RegisterForm() {
  const [step, setStep] = useState(0);
  const [clinics, setClinics] = useState([]);
  const [clinicsLoading, setClinicsLoading] = useState(true);
  const [clinicsError, setClinicsError] = useState("");
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    sex: "",
    dateOfBirth: "",
    height: "",
    weight: "",
    favoriteClinicUuid: "",
    smoker: "",
    alcoholConsumptionFrequency: "",
    additionalInfo: "",
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  useEffect(() => {
    async function loadClinics() {
      try {
        setClinicsLoading(true);
        setClinicsError("");

        const response = await fetch(`${API_BASE}/clinic`);
        const json = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            json?.error || `Failed to load clinics (HTTP ${response.status})`,
          );
        }

        setClinics(json?.data ?? []);
      } catch (error) {
        setClinicsError(error.message || "Unable to load clinics.");
      } finally {
        setClinicsLoading(false);
      }
    }

    loadClinics();
  }, []);

  function nextStep() {
    setStep((s) => s + 1);
  }

  function prevStep() {
    setStep((s) => s - 1);
  }

  async function handleCreateAccount() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          firstName: form.firstName,
          lastName: form.lastName,
          sex: form.sex,
          dateOfBirth: form.dateOfBirth,
          height: parseFloat(form.height),
          weight: parseFloat(form.weight),
          favoriteClinicUuid: form.favoriteClinicUuid,
          smoker: form.smoker === "yes",
          alcoholConsumptionFrequency: form.alcoholConsumptionFrequency,
          additionalMedicalInfo: form.additionalInfo,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setError(json?.message || `Registration failed (HTTP ${res.status})`);
        return;
      }
      if (!json?.data) {
        setError("Registration failed: invalid server response");
        return;
      }
      setAuth(json.data);
      document.getElementById("register-modal").close();
      navigate("/profile");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-base-100 text-base-content flex h-full flex-col gap-4 p-10">
      {step === 0 && (
        <StepEmailAndPassword
          onNext={nextStep}
          values={form}
          onChange={handleChange}
        />
      )}
      {step === 1 && (
        <StepPersonalInfo
          onNext={nextStep}
          onBack={prevStep}
          values={form}
          onChange={handleChange}
        />
      )}
      {step === 2 && (
        <StepClinic
          onNext={nextStep}
          onBack={prevStep}
          values={form}
          onChange={handleChange}
          clinics={clinics}
          loading={clinicsLoading}
          error={clinicsError}
        />
      )}
      {step === 3 && (
        <StepAdditionalInfo
          onBack={prevStep}
          values={form}
          onChange={handleChange}
          onSubmit={handleCreateAccount}
          error={error}
          loading={loading}
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
