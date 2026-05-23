import { useEffect, useState } from "react";
import { FaSpinner } from "react-icons/fa";
import ClinicCard from "../components/clinics/clinic-card";
import { API_BASE } from "../utils/auth";

export default function ClinicsPage() {
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchClinics = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${API_BASE}/clinic`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch clinics");
        }

        const data = await response.json();
        setClinics(data.data || data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchClinics();
  }, []);

  return (
    <main className="bg-base-200 min-h-screen py-8">
      <div className="container mx-auto px-4">
        <h1 className="mb-2 text-4xl font-bold">Our Clinics</h1>
        <p className="text-base-content/70 mb-8">
          Discover our network of medical clinics and our expert doctors
        </p>

        {error && (
          <div className="alert alert-error mb-6">
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <FaSpinner className="text-primary animate-spin text-4xl" />
          </div>
        ) : clinics.length === 0 ? (
          <div className="alert alert-info">
            <span>No clinics available at the moment</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {clinics.map((clinic) => (
              <ClinicCard key={clinic.uuid} clinic={clinic} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
