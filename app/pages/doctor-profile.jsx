import { useEffect, useState } from "react";
import { FaCalendarCheck, FaExclamationCircle, FaSearch } from "react-icons/fa";
import { Link, redirect, useLoaderData } from "react-router";
import { postsBySlug } from "../posts/index.js";
import { API_BASE, getToken, getUser } from "../utils/auth";
import { canManageFavorites, getFavoritePosts } from "../utils/blog-favorites";

export function clientLoader() {
  if (!getToken()) return redirect("/?login=true");
  const user = getUser();
  if (user?.role !== "doctor") return redirect("/");
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

function UpcomingAppointmentsDoctor({ specialization }) {
  const [appointments, setAppointments] = useState([]);
  const [totalUpcomingAppointments, setTotalUpcomingAppointments] = useState(0);
  const [clinicName, setClinicName] = useState({});

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_BASE}/appointment`, {
          headers: { Authorization: `Bearer ${getAuthToken()}` },
        });
        const json = await res.json();
        if (!res.ok) return;

        const upcoming = (json.data ?? [])
          .filter((appointment) => {
            const date = toAppointmentDateTime(appointment);

            if (!date || Number.isNaN(date.getTime())) {
              return false;
            }

            return (
              date.getTime() > Date.now() &&
              appointment.status !== "cancelled" &&
              appointment.status !== "completed"
            );
          })
          .sort(
            (a, b) =>
              toAppointmentDateTime(a).getTime() -
              toAppointmentDateTime(b).getTime(),
          );

        setTotalUpcomingAppointments(upcoming.length);
        setAppointments(upcoming.slice(0, 8));

        // Fetch clinic names for appointments
        const clinicNameMap = {};
        for (const appointment of upcoming) {
          if (
            appointment.clinicUuid &&
            !clinicNameMap[appointment.clinicUuid]
          ) {
            try {
              const clinicRes = await fetch(
                `${API_BASE}/clinic/${appointment.clinicUuid}`,
                {
                  headers: { Authorization: `Bearer ${getAuthToken()}` },
                },
              );
              const clinicJson = await clinicRes.json();
              if (clinicRes.ok && clinicJson.data) {
                clinicNameMap[appointment.clinicUuid] = clinicJson.data.name;
              }
            } catch {
              // ignore clinic fetch errors
            }
          }
        }
        setClinicName(clinicNameMap);
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
            Upcoming appointments
          </h2>
          {totalUpcomingAppointments > 0 && (
            <span className="badge badge-neutral badge-sm">
              {totalUpcomingAppointments}
            </span>
          )}
        </div>

        {appointments.length === 0 ? (
          <p className="text-base-content/40 text-sm">
            No upcoming appointments.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {appointments.map((appointment) => (
              <div
                key={appointment.uuid}
                className="flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <p className="text-base-content/70 truncate text-xs">
                    {appointment.patient
                      ? `${appointment.patient.firstName} ${appointment.patient.lastName}`
                      : "Patient"}
                  </p>
                  <p className="text-base-content/50 truncate text-xs">
                    {appointment.doctor?.specialization ||
                      specialization ||
                      "Specialization unavailable"}
                  </p>
                  {(() => {
                    const appointmentDate = toAppointmentDateTime(appointment);

                    if (
                      !appointmentDate ||
                      Number.isNaN(appointmentDate.getTime())
                    ) {
                      return (
                        <p className="text-base-content/50 text-xs">
                          Date unavailable
                        </p>
                      );
                    }

                    return (
                      <p className="text-base-content/50 text-xs">
                        {appointmentDate.toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}{" "}
                        at{" "}
                        {appointmentDate.toLocaleTimeString("en-GB", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    );
                  })()}
                  {clinicName[appointment.clinicUuid] && (
                    <p className="text-base-content/50 text-xs">
                      {clinicName[appointment.clinicUuid]}
                    </p>
                  )}
                </div>
                <StatusBadge status={appointment.status} />
              </div>
            ))}
          </div>
        )}

        <Link
          to="/doctor/appointments"
          className="btn btn-ghost btn-sm mt-2 justify-start"
        >
          View all appointments →
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

export default function DoctorProfile() {
  const { user } = useLoaderData();
  const [clinicName, setClinicName] = useState(null);

  useEffect(() => {
    async function loadClinic() {
      if (!user.clinicUuid) return;
      try {
        const res = await fetch(`${API_BASE}/clinic/${user.clinicUuid}`, {
          headers: { Authorization: `Bearer ${getAuthToken()}` },
        });
        const json = await res.json();
        if (res.ok && json.data) {
          setClinicName(json.data.name);
        }
      } catch {
        // silently fail
      }
    }
    loadClinic();
  }, [user.clinicUuid]);

  const fullName = `${user.firstName} ${user.lastName}`;

  return (
    <div className="px-9 pt-6">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 pb-10">
        <div className="flex flex-col gap-3">
          <div>
            <h1 className="text-2xl font-bold">Profile</h1>
            <p className="text-base-content/50 text-sm">
              View your professional information
            </p>
          </div>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-6 lg:col-span-2">
            <div className="card bg-base-200 shadow">
              <div className="card-body gap-0 p-4">
                <div className="mb-2">
                  <h2 className="text-base-content/40 text-xs font-semibold tracking-widest uppercase">
                    Professional Information
                  </h2>
                </div>

                <InfoRow label="Name" value={fullName} />
                <InfoRow label="Email" value={user.email} />
                <InfoRow label="Specialization" value={user.specialization} />
                <InfoRow label="Clinic" value={clinicName || "Loading..."} />
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
                    to="/doctor/appointments"
                    className="btn btn-primary w-full"
                  >
                    <FaCalendarCheck />
                    Appointments
                  </Link>
                  <Link
                    to="/doctor/appointments?status=actionRequired"
                    className="btn btn-warning w-full"
                  >
                    <FaExclamationCircle />
                    Action Required
                  </Link>
                  <Link
                    to="/doctor/scan-review-queue"
                    className="btn btn-accent w-full"
                  >
                    <FaSearch />
                    Review Scan Queue
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="flex w-full flex-col gap-4">
            <UpcomingAppointmentsDoctor specialization={user.specialization} />

            <FavoritePostsWidget />
          </div>
        </div>
      </div>
    </div>
  );
}
