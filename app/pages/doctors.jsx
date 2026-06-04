import { useEffect, useState } from "react";
import { FaSpinner } from "react-icons/fa";
import DoctorCard from "../components/doctors/doctor-card";
import { API_BASE } from "../utils/auth";

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${API_BASE}/doctor`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch doctors");
        }

        const data = await response.json();
        setDoctors(data.data || data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  return (
    <main className="bg-base-200 min-h-screen py-8">
      <div className="container mx-auto px-4">
        <h1 className="mb-2 text-4xl font-bold">Our Doctors</h1>
        <p className="text-base-content/70 mb-8">
          Meet the expert medical professionals in our network
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
        ) : doctors.length === 0 ? (
          <div className="alert alert-info">
            <span>No doctors available at the moment</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {doctors.map((doctor) => (
              <DoctorCard key={doctor.uuid} doctor={doctor} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
