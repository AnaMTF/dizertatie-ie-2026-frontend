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
    <div className="mx-auto flex max-w-lg flex-col gap-6 py-10">
      <div className="flex flex-col items-center gap-3">
        <div className="text-center">
          <h1 className="text-2xl font-bold">{fullName}</h1>
          <p className="text-base-content/50 text-sm">{user.email}</p>
        </div>
      </div>

      <div className="card bg-base-200 shadow">
        <div className="card-body gap-0 p-4">
          <h2 className="text-base-content/40 mb-2 text-xs font-semibold tracking-widest uppercase">
            Personal
          </h2>
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

      <button className="btn btn-outline btn-sm self-center">
        Edit Profile
      </button>
    </div>
  );
}
