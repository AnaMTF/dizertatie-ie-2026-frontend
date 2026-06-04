export default function DoctorCard({ doctor }) {
  const initials = (doctor.firstName?.[0] ?? "") + (doctor.lastName?.[0] ?? "");

  return (
    <div className="card bg-base-100 shadow-md transition-shadow hover:shadow-lg">
      <div className="card-body flex flex-row items-center gap-4">
        <div className="avatar avatar-placeholder">
          <div className="bg-primary text-primary-content w-14 rounded-full">
            <span className="text-lg">{initials.toUpperCase()}</span>
          </div>
        </div>

        <div>
          <h2 className="font-semibold">
            Dr. {doctor.firstName} {doctor.lastName}
          </h2>
          <p className="text-base-content/60 text-sm">{doctor.email}</p>
        </div>
      </div>
    </div>
  );
}
