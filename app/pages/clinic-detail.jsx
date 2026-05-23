import { useEffect, useState } from "react";
import {
  FaArrowLeft,
  FaGlobe,
  FaMapMarkerAlt,
  FaPhone,
  FaSpinner,
} from "react-icons/fa";
import { Link, useParams } from "react-router";
import ClinicMap from "../components/clinics/clinic-map";
import DoctorListBySpecialization from "../components/clinics/doctor-list-by-specialization";
import { API_BASE } from "../utils/auth";

export default function ClinicDetailPage() {
  const { uuid } = useParams();
  const [clinic, setClinic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchClinic = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `${API_BASE}/clinic/${uuid}/with-doctors`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        if (!response.ok) {
          throw new Error(
            response.status === 404
              ? "Clinic not found"
              : "Failed to fetch clinic",
          );
        }

        const data = await response.json();
        setClinic(data.data || data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchClinic();
  }, [uuid]);

  if (loading) {
    return (
      <main className="bg-base-200 min-h-screen py-8">
        <div className="container mx-auto px-4">
          <Link to="/clinics" className="btn btn-ghost mb-6 gap-2">
            <FaArrowLeft /> Back to Clinics
          </Link>
          <div className="flex items-center justify-center py-12">
            <FaSpinner className="text-primary animate-spin text-4xl" />
          </div>
        </div>
      </main>
    );
  }

  if (error || !clinic) {
    return (
      <main className="bg-base-200 min-h-screen py-8">
        <div className="container mx-auto px-4">
          <Link to="/clinics" className="btn btn-ghost mb-6 gap-2">
            <FaArrowLeft /> Back to Clinics
          </Link>
          <div className="alert alert-error">
            <span>{error || "Clinic not found"}</span>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-base-200 min-h-screen py-8">
      <div className="container mx-auto px-4">
        <Link to="/clinics" className="btn btn-ghost mb-6 gap-2">
          <FaArrowLeft /> Back to Clinics
        </Link>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left Column: Clinic Info & Doctors */}
          <div className="space-y-6 lg:col-span-2">
            {/* Clinic Info Card */}
            <div className="card bg-base-100 shadow-md">
              <div className="card-body">
                <h1 className="card-title text-3xl">{clinic.name}</h1>

                {/* Address */}
                <div className="mt-4 flex items-start gap-3">
                  <FaMapMarkerAlt className="text-primary mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-base-content/60 text-sm">Address</p>
                    <p className="font-medium">{clinic.address}</p>
                  </div>
                </div>

                {/* Phone */}
                {clinic.phone && (
                  <div className="mt-4 flex items-start gap-3">
                    <FaPhone className="text-primary mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-base-content/60 text-sm">Phone</p>
                      <a
                        href={`tel:${clinic.phone}`}
                        className="link font-medium"
                      >
                        {clinic.phone}
                      </a>
                    </div>
                  </div>
                )}

                {/* Website */}
                {clinic.website && (
                  <div className="mt-4 flex items-start gap-3">
                    <FaGlobe className="text-primary mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-base-content/60 text-sm">Website</p>
                      <a
                        href={clinic.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link font-medium break-all"
                      >
                        {clinic.website}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Doctors List */}
            <div className="card bg-base-100 shadow-md">
              <div className="card-body">
                <DoctorListBySpecialization doctors={clinic.doctors || []} />
              </div>
            </div>
          </div>

          {/* Right Column: Map */}
          <div className="lg:col-span-1">
            <div className="card bg-base-100 overflow-hidden shadow-md">
              <div className="card-body p-0">
                <ClinicMap clinic={clinic} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
