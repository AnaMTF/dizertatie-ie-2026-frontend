import { useState } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import DoctorCard from "../doctors/doctor-card";

const SPECIALIZATION_LABELS = {
  general: "General Practice",
  cardiology: "Cardiology",
  dermatology: "Dermatology",
  endocrinology: "Endocrinology",
  gastroenterology: "Gastroenterology",
  gynecology: "Gynecology",
  neurology: "Neurology",
  oncology: "Oncology",
  ophthalmology: "Ophthalmology",
  orthopedics: "Orthopedics",
  otolaryngology: "Otolaryngology",
  psychiatry: "Psychiatry",
  pulmonology: "Pulmonology",
  urology: "Urology",
};

export default function DoctorListBySpecialization({ doctors = [] }) {
  const [expanded, setExpanded] = useState({});

  // Group doctors by specialization
  const groupedDoctors = doctors.reduce((acc, doctor) => {
    const spec = doctor.specialization || "general";
    if (!acc[spec]) {
      acc[spec] = [];
    }
    acc[spec].push(doctor);
    return acc;
  }, {});

  // Sort specializations
  const sortedSpecializations = Object.keys(groupedDoctors).sort((a, b) =>
    SPECIALIZATION_LABELS[a].localeCompare(SPECIALIZATION_LABELS[b]),
  );

  const toggleExpanded = (specialization) => {
    setExpanded((prev) => ({
      ...prev,
      [specialization]: !prev[specialization],
    }));
  };

  return (
    <div className="space-y-2">
      <h3 className="mb-4 text-lg font-semibold">Doctors by Specialization</h3>

      {sortedSpecializations.length === 0 ? (
        <p className="text-base-content/60">No doctors available</p>
      ) : (
        sortedSpecializations.map((specialization) => (
          <div
            key={specialization}
            className="border-base-300 rounded-lg border"
          >
            <button
              onClick={() => toggleExpanded(specialization)}
              className="hover:bg-base-200/50 flex w-full items-center justify-between p-4 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="font-medium">
                  {SPECIALIZATION_LABELS[specialization]}
                </span>
                <span className="badge badge-neutral">
                  {groupedDoctors[specialization].length}
                </span>
              </div>
              {expanded[specialization] ? (
                <FaChevronUp className="text-base-content/60" />
              ) : (
                <FaChevronDown className="text-base-content/60" />
              )}
            </button>

            {expanded[specialization] && (
              <div className="border-base-300 border-t p-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {groupedDoctors[specialization].map((doctor) => (
                    <DoctorCard key={doctor.uuid} doctor={doctor} />
                  ))}
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
