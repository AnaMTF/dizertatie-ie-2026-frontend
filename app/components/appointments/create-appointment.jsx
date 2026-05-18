import { useEffect, useMemo, useState } from "react";
import {
  FaCalendarAlt,
  FaClinicMedical,
  FaFileMedical,
  FaNotesMedical,
  FaSpinner,
  FaStethoscope,
  FaTrash,
  FaUserMd,
} from "react-icons/fa";
import { API_BASE, getToken, getUser } from "../../utils/auth";
import StepActions from "../common/step-actions";

const SPECIALTIES = [
  { value: "general", label: "General" },
  { value: "cardiology", label: "Cardiology" },
  { value: "dermatology", label: "Dermatology" },
  { value: "endocrinology", label: "Endocrinology" },
  { value: "gastroenterology", label: "Gastroenterology" },
  { value: "gynecology", label: "Gynecology" },
  { value: "neurology", label: "Neurology" },
  { value: "oncology", label: "Oncology" },
  { value: "ophthalmology", label: "Ophthalmology" },
  { value: "orthopedics", label: "Orthopedics" },
  { value: "otolaryngology", label: "Otolaryngology" },
  { value: "psychiatry", label: "Psychiatry" },
  { value: "pulmonology", label: "Pulmonology" },
  { value: "urology", label: "Urology" },
];

function extractErrorMessage(error) {
  if (Array.isArray(error)) {
    return error[0]?.message || "Request validation failed";
  }

  if (typeof error === "string") {
    return error;
  }

  return "Something went wrong";
}

function getDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateKey(dateKey) {
  if (!dateKey) {
    return null;
  }

  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function createEmptyForm() {
  return {
    specialty: "",
    doctorUuid: "",
    clinicUuid: "",
    date: null,
    time: "",
    note: "",
    documents: [],
  };
}

function buildFormFromDraft(draft) {
  const next = createEmptyForm();
  const favoriteClinicUuid = getUser()?.favoriteClinicUuid || "";

  if (!draft) {
    next.clinicUuid = favoriteClinicUuid;
    return next;
  }

  next.specialty = draft.specialty || "";
  next.doctorUuid = draft.doctorUuid || "";
  next.clinicUuid = draft.clinicUuid || favoriteClinicUuid;
  next.date = draft.date ? parseDateKey(draft.date) : null;

  return next;
}

function getTodayDateKey() {
  return getDateKey(new Date());
}

function DoctorLabel({ doctor }) {
  return `${doctor.firstName} ${doctor.lastName}`;
}

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
        {SPECIALTIES.map((specialty) => (
          <option key={specialty.value} value={specialty.value}>
            {specialty.label}
          </option>
        ))}
      </select>
      <StepActions
        onNext={onNext}
        disabled={!values.specialty}
        tooltipMessage="Select a specialty to continue"
      />
    </form>
  );
}

function StepDateTime({
  onNext,
  onBack,
  values,
  onChange,
  doctors,
  clinics,
  availabilityByDate,
  onDayAvailability,
}) {
  const [loadingDay, setLoadingDay] = useState(false);
  const [dateError, setDateError] = useState("");

  const filteredDoctors = useMemo(
    () =>
      doctors.filter((doctor) => {
        if (values.specialty && doctor.specialization !== values.specialty) {
          return false;
        }

        if (values.clinicUuid && doctor.clinicUuid !== values.clinicUuid) {
          return false;
        }

        return true;
      }),
    [doctors, values.specialty, values.clinicUuid],
  );

  const displayedClinics = useMemo(() => {
    if (!values.specialty) {
      return clinics;
    }

    const clinicUuidSet = new Set(
      doctors
        .filter((doctor) => doctor.specialization === values.specialty)
        .map((doctor) => doctor.clinicUuid),
    );

    return clinics.filter((clinic) => clinicUuidSet.has(clinic.uuid));
  }, [clinics, doctors, values.specialty]);

  const preferredClinicUuid = displayedClinics.some(
    (clinic) => clinic.uuid === values.clinicUuid,
  )
    ? values.clinicUuid
    : displayedClinics[0]?.uuid || "";

  useEffect(() => {
    if (!values.specialty) {
      return;
    }

    if (!displayedClinics.length) {
      if (values.clinicUuid) {
        onChange({ target: { name: "clinicUuid", value: "" } });
        onChange({ target: { name: "doctorUuid", value: "" } });
        onChange({ target: { name: "date", value: null } });
        onChange({ target: { name: "time", value: "" } });
      }

      return;
    }

    if (preferredClinicUuid === values.clinicUuid) {
      return;
    }

    onChange({ target: { name: "clinicUuid", value: preferredClinicUuid } });
    onChange({ target: { name: "doctorUuid", value: "" } });
    onChange({ target: { name: "date", value: null } });
    onChange({ target: { name: "time", value: "" } });
  }, [
    displayedClinics,
    onChange,
    preferredClinicUuid,
    values.clinicUuid,
    values.specialty,
  ]);

  function handleDoctorChange(event) {
    const doctorUuid = event.target.value;
    const doctor = doctors.find((item) => item.uuid === doctorUuid) || null;

    onChange({
      target: {
        name: "doctorUuid",
        value: doctorUuid,
      },
    });

    onChange({
      target: {
        name: "clinicUuid",
        value: doctor ? doctor.clinicUuid : values.clinicUuid,
      },
    });

    onChange({
      target: {
        name: "date",
        value: null,
      },
    });

    onChange({
      target: {
        name: "time",
        value: "",
      },
    });
  }

  function handleClinicChange(event) {
    const clinicUuid = event.target.value;

    onChange({
      target: {
        name: "clinicUuid",
        value: clinicUuid,
      },
    });

    if (
      values.doctorUuid &&
      doctors.some(
        (doctor) =>
          doctor.uuid === values.doctorUuid && doctor.clinicUuid !== clinicUuid,
      )
    ) {
      onChange({
        target: {
          name: "doctorUuid",
          value: "",
        },
      });
    }

    onChange({
      target: {
        name: "date",
        value: null,
      },
    });

    onChange({
      target: {
        name: "time",
        value: "",
      },
    });
  }

  async function handleDateChange(event) {
    const dateKey = event.target.value;

    onChange({
      target: {
        name: "date",
        value: dateKey ? parseDateKey(dateKey) : null,
      },
    });
    onChange({
      target: {
        name: "time",
        value: "",
      },
    });

    if (!dateKey || !values.doctorUuid) {
      setDateError("");
      return;
    }

    setLoadingDay(true);
    setDateError("");

    try {
      await onDayAvailability(dateKey);
    } catch (error) {
      setDateError(error.message || "Could not load slots for selected date.");
    } finally {
      setLoadingDay(false);
    }
  }

  const selectedDateKey = values.date ? getDateKey(values.date) : null;
  const selectedDateAvailability = selectedDateKey
    ? availabilityByDate[selectedDateKey]
    : null;

  return (
    <form className="flex h-full flex-col gap-4">
      <h2 className="flex items-center gap-2 text-2xl font-bold">
        <FaCalendarAlt /> Book a date
      </h2>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm font-semibold">
            <FaUserMd /> Physician
          </label>
          <select
            className="select select-sm w-full"
            name="doctorUuid"
            value={values.doctorUuid}
            onChange={handleDoctorChange}
          >
            <option value="">Select physician</option>
            {filteredDoctors.map((doctor) => (
              <option key={doctor.uuid} value={doctor.uuid}>
                {DoctorLabel({ doctor })}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm font-semibold">
            <FaClinicMedical /> Clinic
          </label>
          <select
            className="select select-sm w-full"
            name="clinicUuid"
            value={preferredClinicUuid}
            onChange={handleClinicChange}
          >
            <option value="">Any clinic</option>
            {displayedClinics.map((clinic) => (
              <option key={clinic.uuid} value={clinic.uuid}>
                {clinic.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 text-sm font-semibold">
          <FaCalendarAlt /> Date
        </label>
        <input
          type="date"
          className="input input-bordered w-full"
          value={selectedDateKey || ""}
          min={getTodayDateKey()}
          onChange={handleDateChange}
          disabled={!values.doctorUuid}
        />
        {!values.doctorUuid && (
          <p className="text-base-content/60 text-sm">
            Select a physician first to enable date selection.
          </p>
        )}
      </div>

      {loadingDay && (
        <p className="text-base-content/60 flex items-center gap-2 text-sm">
          <FaSpinner className="animate-spin" /> Loading availability...
        </p>
      )}

      {dateError && (
        <div className="alert alert-error">
          <span>{dateError}</span>
        </div>
      )}

      {selectedDateKey && selectedDateAvailability && (
        <div className="bg-base-200 rounded-box flex flex-col gap-3 p-4">
          <h3 className="font-semibold">Available time slots</h3>
          {selectedDateAvailability.availableSlots?.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {selectedDateAvailability.availableSlots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  className={`btn btn-sm ${values.time === slot ? "btn-primary" : "btn-outline"}`}
                  onClick={() =>
                    onChange({ target: { name: "time", value: slot } })
                  }
                >
                  {slot}
                </button>
              ))}
            </div>
          ) : (
            <div className="alert alert-warning">
              <span>No available slots for this date.</span>
            </div>
          )}
        </div>
      )}

      {selectedDateAvailability && values.time && (
        <p className="badge badge-success">
          Booked: {values.date.toLocaleDateString("en-GB")} at {values.time}
        </p>
      )}

      <StepActions
        onNext={onNext}
        onBack={onBack}
        disabled={!values.doctorUuid || !values.date || !values.time}
        tooltipMessage="Choose physician, date and time before continuing"
      />
    </form>
  );
}

function StepNotes({
  onBack,
  values,
  onChange,
  onSubmit,
  submitting,
  submitError,
  submitSuccess,
}) {
  function handleFileChange(event) {
    const files = Array.from(event.target.files || []);

    if (!files.length) {
      return;
    }

    onChange({
      target: {
        name: "documents",
        value: [...values.documents, ...files],
      },
    });

    event.target.value = "";
  }

  function removeDocument(index) {
    onChange({
      target: {
        name: "documents",
        value: values.documents.filter((_, current) => current !== index),
      },
    });
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
          onChange={handleFileChange}
        />
        {values.documents.length > 0 && (
          <div className="bg-base-200 rounded-box flex flex-col gap-2 p-3">
            {values.documents.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between gap-3"
              >
                <p className="truncate text-sm">{file.name}</p>
                <button
                  type="button"
                  className="btn btn-xs btn-ghost"
                  onClick={() => removeDocument(index)}
                >
                  <FaTrash />
                </button>
              </div>
            ))}
          </div>
        )}
        <p className="text-base-content/40 text-xs">
          Accepted formats: PDF, JPG, PNG
        </p>
      </div>
      {submitError && (
        <div className="alert alert-error">
          <span>{submitError}</span>
        </div>
      )}
      {submitSuccess && (
        <div className="alert alert-success">
          <span>{submitSuccess}</span>
        </div>
      )}
      <StepActions
        onNext={onSubmit}
        onBack={onBack}
        nextLabel={submitting ? "Booking..." : "Book Appointment"}
        disabled={submitting}
      />
    </form>
  );
}

function CreateAppointmentForm({ onCreated, initialDraft }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(() => buildFormFromDraft(initialDraft));
  const [doctors, setDoctors] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [loadingInitialData, setLoadingInitialData] = useState(true);
  const [initialDataError, setInitialDataError] = useState("");
  const [availabilityByDate, setAvailabilityByDate] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setLoadingInitialData(true);
        setInitialDataError("");

        const [doctorsRes, clinicsRes] = await Promise.all([
          fetch(`${API_BASE}/doctor`),
          fetch(`${API_BASE}/clinic`),
        ]);

        const [doctorsJson, clinicsJson] = await Promise.all([
          doctorsRes.json().catch(() => null),
          clinicsRes.json().catch(() => null),
        ]);

        if (!doctorsRes.ok) {
          throw new Error(extractErrorMessage(doctorsJson?.error));
        }

        if (!clinicsRes.ok) {
          throw new Error(extractErrorMessage(clinicsJson?.error));
        }

        if (!isMounted) {
          return;
        }

        setDoctors(doctorsJson?.data ?? []);
        setClinics(clinicsJson?.data ?? []);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setInitialDataError(error.message || "Failed to load appointment data");
      } finally {
        if (isMounted) {
          setLoadingInitialData(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!initialDraft?.seed) {
      return;
    }

    setStep(1);
    setForm(buildFormFromDraft(initialDraft));
    setAvailabilityByDate({});
    setSubmitError("");
    setSubmitSuccess("");
  }, [initialDraft?.seed]);

  async function loadDayAvailability(dateKey) {
    if (!form.doctorUuid) {
      return;
    }

    const params = new URLSearchParams({
      doctorUuid: form.doctorUuid,
      date: dateKey,
    });

    if (form.clinicUuid) {
      params.set("clinicUuid", form.clinicUuid);
    }

    const response = await fetch(
      `${API_BASE}/appointment/availability?${params}`,
      {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      },
    );

    const json = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(extractErrorMessage(json?.error));
    }

    setAvailabilityByDate((prev) => ({
      ...prev,
      [dateKey]: json.data,
    }));

    return json.data;
  }

  useEffect(() => {
    setSubmitError("");
    setSubmitSuccess("");
  }, [form.specialty, form.doctorUuid, form.clinicUuid, form.date, form.time]);

  useEffect(() => {
    if (!form.doctorUuid || !form.date) {
      return;
    }

    const dateKey = getDateKey(form.date);

    if (availabilityByDate[dateKey]) {
      return;
    }

    loadDayAvailability(dateKey).catch(() => {
      // StepDateTime handles day-level errors on explicit date changes.
    });
  }, [form.doctorUuid, form.date, availabilityByDate]);

  function handleChange(event) {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  }

  function nextStep() {
    setStep((current) => current + 1);
  }

  function prevStep() {
    setStep((current) => current - 1);
  }

  async function handleSubmit() {
    try {
      if (!form.date || !form.time || !form.doctorUuid || !form.clinicUuid) {
        setSubmitError("Complete all required fields before booking.");
        return;
      }

      setSubmitting(true);
      setSubmitError("");
      setSubmitSuccess("");

      const dateKey = getDateKey(form.date);

      const appointmentResponse = await fetch(`${API_BASE}/appointment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          date: dateKey,
          timeSlot: form.time,
          doctorUuid: form.doctorUuid,
          clinicUuid: form.clinicUuid,
          notes: form.note || undefined,
        }),
      });

      const appointmentJson = await appointmentResponse
        .json()
        .catch(() => null);

      if (!appointmentResponse.ok) {
        throw new Error(extractErrorMessage(appointmentJson?.error));
      }

      const appointmentUuid = appointmentJson?.data?.uuid;

      if (appointmentUuid && form.documents.length > 0) {
        const metadata = form.documents.map((file) => ({
          fileName: file.name,
        }));
        const documentsForm = new FormData();

        form.documents.forEach((file) => {
          documentsForm.append("documents", file);
        });

        documentsForm.append("metadata", JSON.stringify(metadata));

        const docsResponse = await fetch(
          `${API_BASE}/appointment/${appointmentUuid}/documents`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${getToken()}`,
            },
            body: documentsForm,
          },
        );

        const docsJson = await docsResponse.json().catch(() => null);

        if (!docsResponse.ok) {
          throw new Error(extractErrorMessage(docsJson?.error));
        }
      }

      setSubmitSuccess("Appointment booked successfully.");
      setStep(0);
      setForm(createEmptyForm());
      setAvailabilityByDate({});

      document.getElementById("create-appointment-modal")?.close();
      onCreated?.();
    } catch (error) {
      setSubmitError(error.message || "Failed to create appointment");
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingInitialData) {
    return (
      <div className="flex h-full items-center justify-center">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (initialDataError) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="alert alert-error">
          <span>{initialDataError}</span>
        </div>
      </div>
    );
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
            doctors={doctors}
            clinics={clinics}
            availabilityByDate={availabilityByDate}
            onDayAvailability={loadDayAvailability}
          />
        )}
        {step === 2 && (
          <StepNotes
            onBack={prevStep}
            values={form}
            onChange={handleChange}
            onSubmit={handleSubmit}
            submitting={submitting}
            submitError={submitError}
            submitSuccess={submitSuccess}
          />
        )}
      </div>
    </div>
  );
}

function CreateAppointmentPhoto() {
  return (
    <div className="bg-base-200 hidden items-center justify-center p-6 md:flex">
      <div className="text-base-content/60 flex max-w-xs flex-col items-center gap-3 text-center">
        <FaCalendarAlt className="text-primary text-4xl" />
        <p className="text-sm">
          Pick a specialty, choose an available doctor slot, and attach any
          relevant documents.
        </p>
      </div>
    </div>
  );
}

export default function CreateAppointment({ onCreated, initialDraft = null }) {
  return (
    <dialog id="create-appointment-modal" className="modal">
      <div className="modal-box relative max-w-5xl overflow-hidden p-0">
        <form method="dialog">
          <button className="btn btn-sm btn-circle btn-ghost absolute top-2 right-2 z-10">
            ✕
          </button>
        </form>
        <div className="grid min-h-160 grid-cols-1 md:grid-cols-2">
          <CreateAppointmentForm
            onCreated={onCreated}
            initialDraft={initialDraft}
          />
          <CreateAppointmentPhoto />
        </div>
      </div>
    </dialog>
  );
}
