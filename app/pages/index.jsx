import { useEffect } from "react";
import { useNavigate, useOutletContext, useSearchParams } from "react-router";
import HeroCarousel from "../components/home/hero-carousel";

export default function Index() {
  const { user } = useOutletContext() ?? {};
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get("login") === "true") {
      document.getElementById("login-modal")?.showModal();
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (user?.role === "doctor") {
      navigate("/doctor/appointments", { replace: true });
    }
  }, [navigate, user?.role]);

  return <HeroCarousel isLoggedIn={Boolean(user)} />;
}
