import { DayPicker } from "react-day-picker";
import { FaCalendarPlus, FaRobot, FaUserEdit } from "react-icons/fa";
import { Link } from "react-router";

// Placeholder — replace with real user data from loader
const mockUser = {
  firstName: "Anamaria",
  lastName: "Titeche",
  email: "anamaria@example.com",
  dateOfBirth: "1995-06-14",
  height: 165,
  weight: 58,
  additionalInfo: "No known allergies.",
};

function InfoRow({ label, value }) {
  return (
    <div className="border-base-300 flex justify-between border-b py-2 last:border-0">
      <span className="text-base-content/60 text-sm">{label}</span>
      <span className="text-sm font-medium">{value || "—"}</span>
    </div>
  );
}

export default function Profile() {
  const user = mockUser;
  const fullName = `${user.firstName} ${user.lastName}`;

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
              <h2 className="text-base-content/40 mb-2 text-xs font-semibold tracking-widest uppercase">
                Personal
              </h2>
              <InfoRow label="Name" value={fullName} />
              <InfoRow label="Date of Birth" value={user.dateOfBirth} />
              <InfoRow
                label="Height"
                value={user.height ? `${user.height} cm` : null}
              />
              <InfoRow
                label="Weight"
                value={user.weight ? `${user.weight} kg` : null}
              />
            </div>
          </div>

          <div className="card bg-base-200 shadow">
            <div className="card-body p-4">
              <h2 className="text-base-content/40 mb-2 text-xs font-semibold tracking-widest uppercase">
                Notes for doctor
              </h2>
              <p className="text-base-content/70 text-sm">
                {user.additionalInfo || "No additional information provided."}
              </p>
            </div>
          </div>
        </div>

        <div className="flex w-full flex-col gap-4">
          <DayPicker className="react-day-picker bg-base-200 rounded-box flex w-full justify-center p-4 shadow" />

          <div className="card bg-base-200 w-full shadow">
            <div className="card-body p-4">
              <h2 className="text-base-content/40 mb-1 text-xs font-semibold tracking-widest uppercase">
                Quick actions
              </h2>
              <p className="text-base-content/60 mb-3 text-sm">
                Jump to the tools you use most often.
              </p>

              <div className="flex flex-col gap-2">
                <Link
                  to="/appointments"
                  className="btn btn-primary justify-start"
                >
                  <FaCalendarPlus />
                  Create Appointment
                </Link>
                <Link to="/ai-scan" className="btn btn-secondary justify-start">
                  <FaRobot />
                  AI Scan
                </Link>
                <button className="btn btn-outline justify-start">
                  <FaUserEdit />
                  Edit Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
