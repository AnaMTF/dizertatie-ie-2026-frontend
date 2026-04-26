import { useEffect } from "react";
import { useOutletContext, useSearchParams } from "react-router";
import HeroCarousel from "../components/home/hero-carousel";

export default function Index() {
  const { user } = useOutletContext() ?? {};
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get("login") === "true") {
      document.getElementById("login-modal")?.showModal();
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  return <HeroCarousel isLoggedIn={Boolean(user)} />;
}
