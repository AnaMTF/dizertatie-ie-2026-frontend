import { useState } from "react";
import { DayPicker } from "react-day-picker";
import {
  FaCalendarAlt,
  FaClinicMedical,
  FaFileMedical,
  FaNotesMedical,
  FaStethoscope,
  FaUserMd,
} from "react-icons/fa";
import StepActions from "../common/step-actions";

const SPECIALTIES = [
  "General",
  "Cardiology",
  "Dermatology",
  "Endocrinology",
  "Gastroenterology",
  "Gynecology",
  "Neurology",
  "Oncology",
  "Ophthalmology",
  "Orthopedics",
  "Otolaryngology",
  "Psychiatry",
  "Pulmonology",
  "Urology",
];

// Placeholder data — replace with real API data later
const DOCTORS = ["Dr. Ionescu", "Dr. Popescu", "Dr. Dumitrescu", "Dr. Marin"];
const CLINICS = ["Central Clinic", "North Medical", "City Hospital"];

// Placeholder available dates — replace with real API data later
const AVAILABLE_DATES = [
  new Date(2026, 3, 21),
  new Date(2026, 3, 22),
  new Date(2026, 3, 24),
  new Date(2026, 3, 28),
];

const TIME_SLOTS = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"];

function StepSpecialty({ onNext, values, onChange }) {
  return (
    <form className="flex h-full flex-col gap-4">
      <h2 className="flex items-center gap-2 text-2xl font-bold">
        <FaStethoscope /> Choose specialty
      </h2>
      <p className="text-base-content/60 text-sm">
        Select the type of appointment you need.
      </p>
      <select
        className="select w-full"
        name="specialty"
        value={values.specialty}
        onChange={onChange}
      >
        <option value="">-- Select a specialty --</option>
        {SPECIALTIES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <StepActions onNext={onNext} />
    </form>
  );
}

function TimeSlotsModal({ date, onClose, onConfirm }) {
  const [selected, setSelected] = useState(null);

  return (
    <div className="bg-base-100 flex flex-col gap-4 rounded-xl p-4 shadow-xl">
      <h3 className="font-bold">
        Available times for{" "}
        {date.toLocaleDateString("en-GB", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })}
      </h3>
      <div className="grid grid-cols-3 gap-2">
        {TIME_SLOTS.map((slot) => (
          <button
            key={slot}
            type="button"
            className={`btn btn-sm ${selected === slot ? "btn-primary" : "btn-outline"}`}
            onClick={() => setSelected(slot)}
          >
            {slot}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          className="btn btn-ghost flex-1"
          onClick={onClose}
        >
          Cancel
        </button>
        <button
          type="button"
          className="btn btn-primary flex-1"
          onClick={() => onConfirm(selected)}
        >
          Confirm
        </button>
      </div>
    </div>
  );
}

function StepDateTime({ onNext, onBack, values, onChange }) {
  const [showSlots, setShowSlots] = useState(false);
  const [pendingDate, setPendingDate] = useState(null);

  const isAvailable = (date) =>
    AVAILABLE_DATES.some(
      (d) =>
        d.getFullYear() === date.getFullYear() &&
        d.getMonth() === date.getMonth() &&
        d.getDate() === date.getDate(),
    );

  function handleDayClick(day) {
    if (!isAvailable(day)) return;
    setPendingDate(day);
    setShowSlots(true);
  }

  function handleConfirmSlot(slot) {
    onChange({ target: { name: "date", value: pendingDate } });
    onChange({ target: { name: "time", value: slot } });
    setShowSlots(false);
    setPendingDate(null);
  }

  return (
    <form className="flex h-full flex-col gap-4">
      <h2 className="flex items-center gap-2 text-2xl font-bold">
        <FaCalendarAlt /> Book a date
      </h2>

      <div className="flex gap-4">
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm font-semibold">
            <FaUserMd /> Physician
          </label>
          <select
            className="select select-sm"
            name="doctor"
            value={values.doctor}
            onChange={onChange}
          >
            <option value="">Any physician</option>
            {DOCTORS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm font-semibold">
            <FaClinicMedical /> Clinic
          </label>
          <select
            className="select select-sm"
            name="clinic"
            value={values.clinic}
            onChange={onChange}
          >
            <option value="">Any clinic</option>
            {CLINICS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {showSlots && pendingDate ? (
        <TimeSlotsModal
          date={pendingDate}
          onClose={() => setShowSlots(false)}
          onConfirm={handleConfirmSlot}
        />
      ) : (
        <>
          <DayPicker
            className="react-day-picker"
            modifiers={{ available: AVAILABLE_DATES }}
            modifiersClassNames={{ available: "day-available" }}
            onDayClick={handleDayClick}
            selected={values.date || undefined}
          />
          {values.date && values.time && (
            <p className="badge badge-success">
              Booked: {values.date.toLocaleDateString("en-GB")} at {values.time}
            </p>
          )}
        </>
      )}

      <StepActions onNext={onNext} onBack={onBack} />
    </form>
  );
}

function StepNotes({ onBack, values, onChange }) {
  function handleSubmit() {
    // TODO: submit appointment
  }

  return (
    <form className="flex h-full flex-col gap-4">
      <h2 className="flex items-center gap-2 text-2xl font-bold">
        <FaNotesMedical /> Notes &amp; documents
      </h2>
      <p className="text-base-content/60 text-sm">
        Describe your symptoms or add any relevant information for the doctor.
      </p>
      <textarea
        className="textarea w-full flex-1"
        name="note"
        placeholder="Describe your symptoms..."
        value={values.note}
        onChange={onChange}
      />
      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 text-sm font-semibold">
          <FaFileMedical /> Attach documents
        </label>
        <input
          type="file"
          className="file-input w-full"
          name="documents"
          multiple
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={onChange}
        />
        <p className="text-base-content/40 text-xs">
          Accepted formats: PDF, JPG, PNG
        </p>
      </div>
      <StepActions
        onNext={handleSubmit}
        onBack={onBack}
        nextLabel="Book Appointment"
      />
    </form>
  );
}

function CreateAppointmentForm() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    specialty: "",
    doctor: "",
    clinic: "",
    date: null,
    time: "",
    note: "",
    documents: null,
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
      <div className="flex flex-1 flex-col">
        {step === 0 && (
          <StepSpecialty
            onNext={nextStep}
            values={form}
            onChange={handleChange}
          />
        )}
        {step === 1 && (
          <StepDateTime
            onNext={nextStep}
            onBack={prevStep}
            values={form}
            onChange={handleChange}
          />
        )}
        {step === 2 && (
          <StepNotes onBack={prevStep} values={form} onChange={handleChange} />
        )}
      </div>
    </div>
  );
}

function CreateAppointmentPhoto() {
  return (
    <div className="bg-primary">
      <img
        src="doctor-header.jpg"
        alt="Book appointment"
        className="h-full w-full object-cover"
      />
    </div>
  );
}

export default function CreateAppointment() {
  return (
    <dialog id="create-appointment-modal" className="modal">
      <div className="modal-box relative max-w-5xl overflow-hidden p-0">
        <form method="dialog">
          <button className="btn btn-sm btn-circle btn-ghost absolute top-2 right-2 z-10">
            ✕
          </button>
        </form>
        <div className="grid min-h-160 grid-cols-2">
          <CreateAppointmentForm />
          <CreateAppointmentPhoto />
        </div>
      </div>
    </dialog>
  );
}
