import { useEffect, useState } from "react";
import { FaCalendarPlus, FaRobot, FaUserEdit } from "react-icons/fa";
import { Link, redirect, useLoaderData } from "react-router";
import { postsBySlug } from "../posts/index.js";
import { API_BASE, getToken, getUser, setAuth } from "../utils/auth";
import { canManageFavorites, getFavoritePosts } from "../utils/blog-favorites";
import { listFollowUpReminders } from "../utils/notifications";

const ALCOHOL_FREQUENCY_OPTIONS = [
  { value: "never", label: "Never" },
  { value: "less_than_monthly", label: "Less than monthly" },
  { value: "monthly", label: "Monthly" },
  { value: "weekly", label: "Weekly" },
  { value: "daily_or_almost_daily", label: "Daily or almost daily" },
];

function alcoholLabel(value) {
  return ALCOHOL_FREQUENCY_OPTIONS.find((o) => o.value === value)?.label ?? "—";
}

export function clientLoader() {
  if (!getToken()) return redirect("/?login=true");
  const user = getUser();
  if (user?.role !== "patient") return redirect("/");
  return { user };
}

function getAuthToken() {
  return getToken();
}

function toAppointmentDateTime(appointment) {
  if (appointment.dateTime) {
    return new Date(appointment.dateTime);
  }

  if (appointment.date && appointment.timeSlot) {
    return new Date(`${appointment.date}T${appointment.timeSlot}:00`);
  }

  return null;
}

function InfoRow({ label, value }) {
  return (
    <div className="border-base-300 flex justify-between border-b py-2 last:border-0">
      <span className="text-base-content/60 text-sm">{label}</span>
      <span className="text-sm font-medium">{value || "—"}</span>
    </div>
  );
}

function buildProfileForm(user) {
  return {
    email: user.email || "",
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    sex: user.sex || "",
    dateOfBirth: user.dateOfBirth || "",
    height: user.height != null ? String(user.height) : "",
    weight: user.weight != null ? String(user.weight) : "",
    favoriteClinicUuid: user.favoriteClinicUuid || "",
  };
}

function buildUpdatePayload(form, user) {
  const nextData = {
    email: form.email.trim(),
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    sex: form.sex,
    dateOfBirth: form.dateOfBirth,
  };

  if (form.favoriteClinicUuid) {
    nextData.favoriteClinicUuid = form.favoriteClinicUuid;
  }

  if (form.height !== "") {
    const height = Number(form.height);
    if (Number.isFinite(height) && height >= 0) {
      nextData.height = height;
    }
  }

  if (form.weight !== "") {
    const weight = Number(form.weight);
    if (Number.isFinite(weight) && weight >= 0) {
      nextData.weight = weight;
    }
  }

  return Object.fromEntries(
    Object.entries(nextData).filter(([key, value]) => {
      if (value === "") {
        return false;
      }

      const currentValue = user[key];
      return String(currentValue ?? "") !== String(value);
    }),
  );
}

function StatusBadge({ status }) {
  const map = {
    pending: { cls: "badge-warning", label: "Pending" },
    processing: { cls: "badge-info", label: "Processing" },
    completed: { cls: "badge-success", label: "Completed" },
    failed: { cls: "badge-error", label: "Failed" },
    scheduled: { cls: "badge-info", label: "Scheduled" },
    confirmed: { cls: "badge-primary", label: "Confirmed" },
    rescheduled: { cls: "badge-warning", label: "Rescheduled" },
    cancelled: { cls: "badge-neutral", label: "Cancelled" },
  };
  const { cls, label } = map[status] || { cls: "badge-neutral", label: status };
  return <span className={`badge badge-sm ${cls}`}>{label}</span>;
}

function toReminderTargetDate(reminder) {
  if (reminder.targetDateTime) {
    const targetDateTime = new Date(reminder.targetDateTime);

    if (!Number.isNaN(targetDateTime.getTime())) {
      return targetDateTime;
    }
  }

  if (reminder.targetDate) {
    const targetDate = new Date(`${reminder.targetDate}T00:00:00`);

    if (!Number.isNaN(targetDate.getTime())) {
      return targetDate;
    }
  }

  const createdAt = new Date(reminder.createdAt);
  return Number.isNaN(createdAt.getTime()) ? null : createdAt;
}

function getReminderCountdown(reminder) {
  const targetDate = toReminderTargetDate(reminder);

  if (!targetDate) {
    return "Date unavailable";
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDay = new Date(
    targetDate.getFullYear(),
    targetDate.getMonth(),
    targetDate.getDate(),
  );
  const diffDays = Math.round(
    (targetDay.getTime() - today.getTime()) / (24 * 60 * 60 * 1000),
  );

  if (diffDays === 0) {
    return "Today";
  }

  if (diffDays === 1) {
    return "Tomorrow";
  }

  if (diffDays > 1) {
    return `In ${diffDays} days`;
  }

  if (diffDays === -1) {
    return "1 day overdue";
  }

  return `${Math.abs(diffDays)} days overdue`;
}

function formatReminderDate(reminder) {
  const targetDate = toReminderTargetDate(reminder);

  if (!targetDate) {
    return "Date unavailable";
  }

  if (reminder.targetDateTime) {
    return targetDate.toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return targetDate.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatAppointmentDate(appointment) {
  const targetDate = toAppointmentDateTime(appointment);

  if (!targetDate || Number.isNaN(targetDate.getTime())) {
    return "Date unavailable";
  }

  return targetDate.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getAppointmentCountdown(appointment) {
  const targetDate = toAppointmentDateTime(appointment);

  if (!targetDate || Number.isNaN(targetDate.getTime())) {
    return "Date unavailable";
  }

  return getReminderCountdown({ targetDateTime: targetDate.toISOString() });
}

function formatDoctorDisplayName(appointment) {
  const firstName = appointment.doctor?.firstName || "";
  const lastName = appointment.doctor?.lastName || "";
  const fullName = `${firstName} ${lastName}`.trim();

  if (fullName) {
    return `Dr. ${fullName}`;
  }

  return appointment.specialty || "Assigned doctor";
}

function UpcomingAppointmentsWidget() {
  const [appointments, setAppointments] = useState([]);
  const [totalAppointments, setTotalAppointments] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const response = await fetch(`${API_BASE}/appointment`, {
          headers: { Authorization: `Bearer ${getAuthToken()}` },
        });

        const json = await response.json().catch(() => null);

        if (!isMounted) {
          return;
        }

        if (!response.ok) {
          setAppointments([]);
          setTotalAppointments(0);
          return;
        }

        const now = new Date();
        const allAppointments = json?.data ?? [];
        const upcomingConfirmedAppointments = allAppointments
          .filter((appointment) => appointment.status === "confirmed")
          .map((appointment) => ({
            appointment,
            dateTime: toAppointmentDateTime(appointment),
          }))
          .filter(
            ({ dateTime }) =>
              dateTime && !Number.isNaN(dateTime.getTime()) && dateTime > now,
          )
          .sort((first, second) => first.dateTime - second.dateTime)
          .map(({ appointment }) => appointment);

        setTotalAppointments(upcomingConfirmedAppointments.length);
        setAppointments(upcomingConfirmedAppointments.slice(0, 4));
      } catch {
        if (!isMounted) {
          return;
        }

        setAppointments([]);
        setTotalAppointments(0);
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="card bg-base-200 w-full shadow">
      <div className="card-body p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-base-content/40 text-xs font-semibold tracking-widest uppercase">
            Upcoming appointments
          </h2>
          {totalAppointments > 0 && (
            <span className="badge badge-neutral badge-sm">
              {totalAppointments}
            </span>
          )}
        </div>

        {appointments.length === 0 ? (
          <p className="text-base-content/40 text-sm">
            No upcoming appointments right now.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {appointments.map((appointment) => (
              <Link
                key={appointment.uuid}
                to="/appointments"
                className="bg-base-100 hover:bg-base-300 rounded-box flex flex-col gap-2 p-3 transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {formatDoctorDisplayName(appointment)}
                    </p>
                    <p className="text-base-content/60 line-clamp-2 text-xs">
                      {appointment.clinic?.name || "Clinic appointment"}
                    </p>
                  </div>
                  <span className="badge badge-primary badge-sm">
                    Appointment
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-base-content/60">
                    {appointment.specialty ||
                      formatAppointmentDate(appointment)}
                  </span>
                  <span className="text-primary font-semibold">
                    {getAppointmentCountdown(appointment)}
                  </span>
                </div>

                {appointment.specialty ? (
                  <p className="text-base-content/50 text-xs">
                    {formatAppointmentDate(appointment)}
                  </p>
                ) : null}
              </Link>
            ))}
          </div>
        )}

        <Link
          to="/notifications"
          className="btn btn-ghost btn-sm mt-2 justify-start"
        >
          View all upcoming appointments →
        </Link>
      </div>
    </div>
  );
}

function RecentScans() {
  const [scans, setScans] = useState([]);
  const [totalScans, setTotalScans] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_BASE}/scan`, {
          headers: { Authorization: `Bearer ${getAuthToken()}` },
        });
        const json = await res.json();
        if (res.ok) {
          const allScans = json.data ?? [];
          setTotalScans(allScans.length);
          setScans(allScans.slice(0, 3));
        }
      } catch {
        // silently fail — profile should still render
      }
    }
    load();
  }, []);

  return (
    <div className="card bg-base-200 w-full shadow">
      <div className="card-body p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-base-content/40 text-xs font-semibold tracking-widest uppercase">
            Recent scans
          </h2>
          {totalScans > 0 && (
            <span className="badge badge-neutral badge-sm">{totalScans}</span>
          )}
        </div>

        {scans.length === 0 ? (
          <p className="text-base-content/40 text-sm">No scans yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {scans.map((scan) => (
              <div
                key={scan.uuid}
                className="flex items-center justify-between gap-2"
              >
                <span className="text-base-content/70 text-xs">
                  {new Date(scan.createdAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
                <StatusBadge status={scan.status} />
              </div>
            ))}
          </div>
        )}

        <Link to="/ai-scan" className="btn btn-ghost btn-sm mt-2 justify-start">
          View all scans →
        </Link>
      </div>
    </div>
  );
}

function FollowUpRemindersWidget() {
  const [reminders, setReminders] = useState([]);
  const [totalReminders, setTotalReminders] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const data = await listFollowUpReminders();

        if (!isMounted) {
          return;
        }

        setTotalReminders(data.length);
        setReminders(data.slice(0, 4));
      } catch {
        if (!isMounted) {
          return;
        }

        setTotalReminders(0);
        setReminders([]);
        // silently fail — profile should still render
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="card bg-base-200 w-full shadow">
      <div className="card-body p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-base-content/40 text-xs font-semibold tracking-widest uppercase">
            Follow-up reminders
          </h2>
          {totalReminders > 0 && (
            <span className="badge badge-neutral badge-sm">
              {totalReminders}
            </span>
          )}
        </div>

        {reminders.length === 0 ? (
          <p className="text-base-content/40 text-sm">
            No follow-up reminders yet.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {reminders.map((reminder) => (
              <Link
                key={reminder.uuid}
                to={reminder.url}
                className="bg-base-100 hover:bg-base-300 rounded-box flex flex-col gap-2 p-3 transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      Follow-up recommended
                    </p>
                    <p className="text-base-content/60 line-clamp-2 text-xs">
                      {reminder.recommendation ||
                        "A follow-up consultation was recommended after your completed visit."}
                    </p>
                  </div>
                  <span className="badge badge-warning badge-sm">
                    Follow-up
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-base-content/60">
                    {reminder.doctorName || reminder.specialty || "Doctor"}
                  </span>
                  <span className="text-warning font-semibold">
                    {getReminderCountdown(reminder)}
                  </span>
                </div>

                <p className="text-base-content/50 text-xs">
                  {formatReminderDate(reminder)}
                  {reminder.clinicName ? ` · ${reminder.clinicName}` : ""}
                </p>
              </Link>
            ))}
          </div>
        )}

        <Link
          to="/appointments"
          className="btn btn-ghost btn-sm mt-2 justify-start"
        >
          View follow-up options →
        </Link>
      </div>
    </div>
  );
}

function FavoritePostsWidget() {
  const [items, setItems] = useState([]);
  const [totalFavorites, setTotalFavorites] = useState(0);
  const [error, setError] = useState(null);
  const canFavorite = canManageFavorites();

  useEffect(() => {
    if (!canFavorite) {
      setItems([]);
      setTotalFavorites(0);
      setError(null);
      return;
    }

    let isMounted = true;

    getFavoritePosts({ page: 1, limit: 5 }).then((result) => {
      if (!isMounted) {
        return;
      }

      if (result.error) {
        setError(result.error);
        setTotalFavorites(0);
        return;
      }

      setTotalFavorites(result.pagination?.totalItems ?? result.data.length);

      setItems(
        result.data
          .map((item) => {
            const post = postsBySlug[item.postSlug];

            if (!post) {
              return null;
            }

            return {
              slug: item.postSlug,
              title: post.meta.title,
            };
          })
          .filter(Boolean),
      );
    });

    return () => {
      isMounted = false;
    };
  }, [canFavorite]);

  return (
    <div className="card bg-base-200 w-full shadow">
      <div className="card-body p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-base-content/40 text-xs font-semibold tracking-widest uppercase">
            Favorite articles
          </h2>
          {totalFavorites > 0 && (
            <span className="badge badge-neutral badge-sm">
              {totalFavorites}
            </span>
          )}
        </div>

        {error ? (
          <p className="text-error text-sm">{error}</p>
        ) : items.length === 0 ? (
          <p className="text-base-content/40 text-sm">No favorites yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {items.map((item) => (
              <Link
                key={item.slug}
                to={`/blog/${item.slug}`}
                className="link link-hover text-sm"
              >
                {item.title}
              </Link>
            ))}
          </div>
        )}

        <Link
          to="/blog?favorites=1"
          className="btn btn-ghost btn-sm mt-2 justify-start"
        >
          View all favorites →
        </Link>
      </div>
    </div>
  );
}

export default function Profile() {
  const { user } = useLoaderData();
  const [profileUser, setProfileUser] = useState(user);
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [personalForm, setPersonalForm] = useState(() =>
    buildProfileForm(user),
  );
  const [clinics, setClinics] = useState([]);
  const [clinicsLoading, setClinicsLoading] = useState(true);
  const [personalSaveError, setPersonalSaveError] = useState(null);
  const [personalSaveSuccess, setPersonalSaveSuccess] = useState(null);
  const [isSavingPersonal, setIsSavingPersonal] = useState(false);

  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesForm, setNotesForm] = useState(user.additionalMedicalInfo || "");
  const [notesSaveError, setNotesSaveError] = useState(null);
  const [notesSaveSuccess, setNotesSaveSuccess] = useState(null);
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  const [isEditingLifestyle, setIsEditingLifestyle] = useState(false);
  const [lifestyleForm, setLifestyleForm] = useState({
    smoker: user.smoker === true ? "yes" : user.smoker === false ? "no" : "",
    alcoholConsumptionFrequency: user.alcoholConsumptionFrequency || "",
  });
  const [lifestyleSaveError, setLifestyleSaveError] = useState(null);
  const [lifestyleSaveSuccess, setLifestyleSaveSuccess] = useState(null);
  const [isSavingLifestyle, setIsSavingLifestyle] = useState(false);

  useEffect(() => {
    setProfileUser(user);
    setPersonalForm(buildProfileForm(user));
    setNotesForm(user.additionalMedicalInfo || "");
    setLifestyleForm({
      smoker: user.smoker === true ? "yes" : user.smoker === false ? "no" : "",
      alcoholConsumptionFrequency: user.alcoholConsumptionFrequency || "",
    });
  }, [user]);

  useEffect(() => {
    async function loadClinics() {
      try {
        setClinicsLoading(true);
        const response = await fetch(`${API_BASE}/clinic`);
        const json = await response.json().catch(() => null);

        if (!response.ok) {
          return;
        }

        setClinics(json?.data ?? []);
      } finally {
        setClinicsLoading(false);
      }
    }

    loadClinics();
  }, []);

  const fullName = `${profileUser.firstName} ${profileUser.lastName}`;

  function handleFormChange(event) {
    const { name, value } = event.target;
    setPersonalForm((previous) => ({ ...previous, [name]: value }));
  }

  const favoriteClinicName =
    clinics.find((clinic) => clinic.uuid === profileUser.favoriteClinicUuid)
      ?.name || null;

  function handleStartEditing() {
    setPersonalSaveError(null);
    setPersonalSaveSuccess(null);
    setPersonalForm(buildProfileForm(profileUser));
    setIsEditingPersonal(true);
  }

  function handleCancelEditing() {
    setPersonalForm(buildProfileForm(profileUser));
    setPersonalSaveError(null);
    setPersonalSaveSuccess(null);
    setIsEditingPersonal(false);
  }

  function handleStartEditingNotes() {
    setNotesSaveError(null);
    setNotesSaveSuccess(null);
    setNotesForm(profileUser.additionalMedicalInfo || "");
    setIsEditingNotes(true);
  }

  function handleCancelEditingNotes() {
    setNotesForm(profileUser.additionalMedicalInfo || "");
    setNotesSaveError(null);
    setNotesSaveSuccess(null);
    setIsEditingNotes(false);
  }

  async function patchProfile(payload) {
    const token = getAuthToken();
    if (!token) {
      return { error: "You are no longer logged in. Please sign in again." };
    }

    try {
      const response = await fetch(`${API_BASE}/patient/${profileUser.uuid}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const json = await response.json().catch(() => null);

      if (!response.ok) {
        return {
          error:
            json?.error ||
            `Failed to update profile (HTTP ${response.status}).`,
        };
      }

      if (!json?.data) {
        return { error: "Failed to update profile: invalid server response." };
      }

      setProfileUser(json.data);
      setPersonalForm(buildProfileForm(json.data));
      setNotesForm(json.data.additionalMedicalInfo || "");
      setLifestyleForm({
        smoker:
          json.data.smoker === true
            ? "yes"
            : json.data.smoker === false
              ? "no"
              : "",
        alcoholConsumptionFrequency:
          json.data.alcoholConsumptionFrequency || "",
      });
      setAuth({ user: json.data, token });

      return { error: null };
    } catch {
      return { error: "Network error. Please try again." };
    }
  }

  async function handleSaveProfile() {
    const payload = buildUpdatePayload(personalForm, profileUser);
    if (Object.keys(payload).length === 0) {
      setPersonalSaveError(null);
      setPersonalSaveSuccess("No changes to save.");
      return;
    }

    setIsSavingPersonal(true);
    setPersonalSaveError(null);
    setPersonalSaveSuccess(null);

    const { error } = await patchProfile(payload);

    if (error) {
      setPersonalSaveError(error);
    } else {
      setPersonalSaveSuccess("Personal information updated successfully.");
      setIsEditingPersonal(false);
    }

    setIsSavingPersonal(false);
  }

  async function handleSaveNotes() {
    const payload = {
      additionalMedicalInfo: notesForm.trim(),
    };

    if (
      String(profileUser.additionalMedicalInfo ?? "") ===
      String(payload.additionalMedicalInfo)
    ) {
      setNotesSaveError(null);
      setNotesSaveSuccess("No changes to save.");
      return;
    }

    setIsSavingNotes(true);
    setNotesSaveError(null);
    setNotesSaveSuccess(null);

    const { error } = await patchProfile(payload);

    if (error) {
      setNotesSaveError(error);
    } else {
      setNotesSaveSuccess("Notes updated successfully.");
      setIsEditingNotes(false);
    }

    setIsSavingNotes(false);
  }

  return (
    <div className="px-9 pt-6">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 pb-10">
        <div className="flex flex-col gap-3">
          <div>
            <h1 className="text-2xl font-bold">Profile</h1>
            <p className="text-base-content/50 text-sm">
              Keep your personal details and medical notes up to date
            </p>
          </div>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-6 lg:col-span-2">
            <div className="card bg-base-200 shadow">
              <div className="card-body gap-0 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-base-content/40 text-xs font-semibold tracking-widest uppercase">
                    Personal
                  </h2>
                  {!isEditingPersonal && (
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={handleStartEditing}
                    >
                      <FaUserEdit />
                      Edit
                    </button>
                  )}
                </div>

                {personalSaveError && (
                  <div className="alert alert-error mb-3">
                    <span>{personalSaveError}</span>
                  </div>
                )}

                {personalSaveSuccess && (
                  <div className="alert alert-success mb-3">
                    <span>{personalSaveSuccess}</span>
                  </div>
                )}

                {isEditingPersonal ? (
                  <div className="flex flex-col gap-3">
                    <label className="floating-label">
                      <input
                        type="email"
                        name="email"
                        className="input w-full"
                        placeholder="Email"
                        value={personalForm.email}
                        onChange={handleFormChange}
                      />
                      <span>Email</span>
                    </label>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="floating-label">
                        <input
                          type="text"
                          name="firstName"
                          className="input w-full"
                          placeholder="First name"
                          value={personalForm.firstName}
                          onChange={handleFormChange}
                        />
                        <span>First name</span>
                      </label>

                      <label className="floating-label">
                        <input
                          type="text"
                          name="lastName"
                          className="input w-full"
                          placeholder="Last name"
                          value={personalForm.lastName}
                          onChange={handleFormChange}
                        />
                        <span>Last name</span>
                      </label>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="floating-label">
                        <select
                          name="sex"
                          className="select w-full"
                          value={personalForm.sex}
                          onChange={handleFormChange}
                        >
                          <option value="">Select sex</option>
                          <option value="Man">Man</option>
                          <option value="Woman">Woman</option>
                        </select>
                        <span>Sex</span>
                      </label>

                      <label className="floating-label">
                        <input
                          type="date"
                          name="dateOfBirth"
                          className="input w-full"
                          placeholder="Date of birth"
                          value={personalForm.dateOfBirth}
                          onChange={handleFormChange}
                        />
                        <span>Date of birth</span>
                      </label>
                    </div>

                    <label className="floating-label">
                      <select
                        name="favoriteClinicUuid"
                        className="select w-full"
                        value={personalForm.favoriteClinicUuid}
                        onChange={handleFormChange}
                        disabled={clinicsLoading}
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

                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="floating-label">
                        <input
                          type="number"
                          min="0"
                          name="height"
                          className="input w-full"
                          placeholder="Height (cm)"
                          value={personalForm.height}
                          onChange={handleFormChange}
                        />
                        <span>Height (cm)</span>
                      </label>

                      <label className="floating-label">
                        <input
                          type="number"
                          min="0"
                          name="weight"
                          className="input w-full"
                          placeholder="Weight (kg)"
                          value={personalForm.weight}
                          onChange={handleFormChange}
                        />
                        <span>Weight (kg)</span>
                      </label>
                    </div>

                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleSaveProfile}
                        disabled={isSavingPersonal}
                      >
                        {isSavingPersonal ? (
                          <span className="loading loading-spinner loading-sm" />
                        ) : (
                          "Save changes"
                        )}
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={handleCancelEditing}
                        disabled={isSavingPersonal}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <InfoRow label="Name" value={fullName} />
                    <InfoRow label="Email" value={profileUser.email} />
                    <InfoRow label="Sex" value={profileUser.sex} />
                    <InfoRow
                      label="Date of Birth"
                      value={profileUser.dateOfBirth}
                    />
                    <InfoRow
                      label="Height"
                      value={
                        profileUser.height ? `${profileUser.height} cm` : null
                      }
                    />
                    <InfoRow
                      label="Weight"
                      value={
                        profileUser.weight ? `${profileUser.weight} kg` : null
                      }
                    />
                    <InfoRow
                      label="Favorite clinic"
                      value={
                        favoriteClinicName || profileUser.favoriteClinicUuid
                      }
                    />
                  </>
                )}
              </div>
            </div>

            <div className="card bg-base-200 shadow">
              <div className="card-body p-4">
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-base-content/40 text-xs font-semibold tracking-widest uppercase">
                    Notes for doctor
                  </h2>
                  {!isEditingNotes && (
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={handleStartEditingNotes}
                    >
                      <FaUserEdit />
                      Edit notes
                    </button>
                  )}
                </div>

                {notesSaveError && (
                  <div className="alert alert-error mb-3">
                    <span>{notesSaveError}</span>
                  </div>
                )}

                {notesSaveSuccess && (
                  <div className="alert alert-success mb-3">
                    <span>{notesSaveSuccess}</span>
                  </div>
                )}

                {isEditingNotes ? (
                  <div className="flex flex-col gap-3">
                    <label className="floating-label">
                      <textarea
                        name="additionalMedicalInfo"
                        className="textarea min-h-28 w-full"
                        placeholder="Notes for doctor"
                        value={notesForm}
                        onChange={(event) => setNotesForm(event.target.value)}
                      />
                      <span>Notes for doctor</span>
                    </label>

                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleSaveNotes}
                        disabled={isSavingNotes}
                      >
                        {isSavingNotes ? (
                          <span className="loading loading-spinner loading-sm" />
                        ) : (
                          "Save notes"
                        )}
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={handleCancelEditingNotes}
                        disabled={isSavingNotes}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-base-content/70 text-sm">
                    {profileUser.additionalMedicalInfo ||
                      "No additional information provided."}
                  </p>
                )}
              </div>
            </div>

            <div className="card bg-base-200 shadow">
              <div className="card-body p-4">
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-base-content/40 text-xs font-semibold tracking-widest uppercase">
                    Lifestyle
                  </h2>
                  {!isEditingLifestyle && (
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => {
                        setLifestyleSaveError(null);
                        setLifestyleSaveSuccess(null);
                        setIsEditingLifestyle(true);
                      }}
                    >
                      <FaUserEdit />
                      Edit
                    </button>
                  )}
                </div>

                {lifestyleSaveError && (
                  <div className="alert alert-error mb-3">
                    <span>{lifestyleSaveError}</span>
                  </div>
                )}

                {lifestyleSaveSuccess && (
                  <div className="alert alert-success mb-3">
                    <span>{lifestyleSaveSuccess}</span>
                  </div>
                )}

                {isEditingLifestyle ? (
                  <div className="flex flex-col gap-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="floating-label">
                        <select
                          name="smoker"
                          className="select w-full"
                          value={lifestyleForm.smoker}
                          onChange={(e) =>
                            setLifestyleForm((prev) => ({
                              ...prev,
                              smoker: e.target.value,
                            }))
                          }
                        >
                          <option value="">Select</option>
                          <option value="yes">Yes</option>
                          <option value="no">No</option>
                        </select>
                        <span>Are you a smoker?</span>
                      </label>

                      <label className="floating-label">
                        <select
                          name="alcoholConsumptionFrequency"
                          className="select w-full"
                          value={lifestyleForm.alcoholConsumptionFrequency}
                          onChange={(e) =>
                            setLifestyleForm((prev) => ({
                              ...prev,
                              alcoholConsumptionFrequency: e.target.value,
                            }))
                          }
                        >
                          <option value="">Select</option>
                          {ALCOHOL_FREQUENCY_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <span>Alcohol consumption frequency</span>
                      </label>
                    </div>

                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        className="btn btn-primary"
                        disabled={isSavingLifestyle}
                        onClick={async () => {
                          setIsSavingLifestyle(true);
                          setLifestyleSaveError(null);
                          setLifestyleSaveSuccess(null);
                          const payload = {
                            smoker: lifestyleForm.smoker === "yes",
                            alcoholConsumptionFrequency:
                              lifestyleForm.alcoholConsumptionFrequency ||
                              undefined,
                          };
                          const { error } = await patchProfile(payload);
                          if (error) {
                            setLifestyleSaveError(error);
                          } else {
                            setLifestyleSaveSuccess(
                              "Lifestyle information updated.",
                            );
                            setIsEditingLifestyle(false);
                          }
                          setIsSavingLifestyle(false);
                        }}
                      >
                        {isSavingLifestyle ? (
                          <span className="loading loading-spinner loading-sm" />
                        ) : (
                          "Save changes"
                        )}
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        disabled={isSavingLifestyle}
                        onClick={() => {
                          setLifestyleForm({
                            smoker:
                              profileUser.smoker === true
                                ? "yes"
                                : profileUser.smoker === false
                                  ? "no"
                                  : "",
                            alcoholConsumptionFrequency:
                              profileUser.alcoholConsumptionFrequency || "",
                          });
                          setLifestyleSaveError(null);
                          setLifestyleSaveSuccess(null);
                          setIsEditingLifestyle(false);
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <InfoRow
                      label="Smoker"
                      value={
                        profileUser.smoker === true
                          ? "Yes"
                          : profileUser.smoker === false
                            ? "No"
                            : null
                      }
                    />
                    <InfoRow
                      label="Alcohol consumption"
                      value={alcoholLabel(
                        profileUser.alcoholConsumptionFrequency,
                      )}
                    />
                  </>
                )}
              </div>
            </div>

            <div className="card bg-base-200 w-full shadow">
              <div className="card-body p-4">
                <h2 className="text-base-content/40 mb-1 text-xs font-semibold tracking-widest uppercase">
                  Quick actions
                </h2>
                <p className="text-base-content/60 mb-3 text-sm">
                  Jump to the tools you use most often.
                </p>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <Link
                    to="/appointments?create=true"
                    className="btn btn-primary w-full"
                  >
                    <FaCalendarPlus />
                    Create Appointment
                  </Link>
                  <Link to="/ai-scan" className="btn btn-secondary w-full">
                    <FaRobot />
                    AI Scan
                  </Link>
                  <button
                    type="button"
                    className="btn btn-outline w-full"
                    onClick={handleStartEditing}
                    disabled={isEditingPersonal}
                  >
                    <FaUserEdit />
                    {isEditingPersonal ? "Editing profile" : "Edit Profile"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex w-full flex-col gap-4">
            <RecentScans />

            <UpcomingAppointmentsWidget />

            <FollowUpRemindersWidget />

            <FavoritePostsWidget />
          </div>
        </div>
      </div>
    </div>
  );
}
