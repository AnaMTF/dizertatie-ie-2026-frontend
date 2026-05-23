import { FaMapMarkerAlt, FaPhone } from "react-icons/fa";
import { Link } from "react-router";

export default function ClinicCard({ clinic }) {
  const fallbackImagePath = "/clinic-images/clinic-fallback-image.webp";
  const cardImagePath = clinic.imagePath || fallbackImagePath;

  return (
    <div className="card bg-base-100 shadow-md transition-shadow hover:shadow-lg">
      <figure>
        <img
          src={cardImagePath}
          alt={`${clinic.name} clinic`}
          className="h-48 w-full object-cover"
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = fallbackImagePath;
          }}
        />
      </figure>
      <div className="card-body">
        <h2 className="card-title text-lg">{clinic.name}</h2>

        <div className="text-base-content/70 flex items-start gap-2 text-sm">
          <FaMapMarkerAlt className="mt-0.5 shrink-0" />
          <span>{clinic.address}</span>
        </div>

        {clinic.phone && (
          <div className="text-base-content/70 flex items-start gap-2 text-sm">
            <FaPhone className="mt-0.5 shrink-0" />
            <span>{clinic.phone}</span>
          </div>
        )}

        <div className="card-actions mt-4 justify-end">
          <Link
            to={`/clinics/${clinic.uuid}`}
            className="btn btn-primary btn-sm"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}
