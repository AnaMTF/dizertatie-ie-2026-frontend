import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";

// Fix for default marker icons in Leaflet
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  shadowSize: [41, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

L.Marker.prototype.setIcon(DefaultIcon);

export default function ClinicMap({ clinic }) {
  const mapContainer = useRef(null);
  const map = useRef(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Default to Bucharest if no coordinates
    const lat = clinic.latitude ? parseFloat(clinic.latitude) : 44.4268;
    const lng = clinic.longitude ? parseFloat(clinic.longitude) : 26.1025;

    map.current = L.map(mapContainer.current).setView([lat, lng], 15);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map.current);

    L.marker([lat, lng], { icon: DefaultIcon })
      .addTo(map.current)
      .bindPopup(`<b>${clinic.name}</b><br>${clinic.address}`);

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [clinic]);

  return (
    <div
      ref={mapContainer}
      className="border-base-300 h-96 w-full rounded-lg border"
      style={{ minHeight: "400px" }}
    />
  );
}
