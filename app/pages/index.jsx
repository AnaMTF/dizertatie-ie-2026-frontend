import HeroCarousel from "../components/home/hero-carousel";

export default function Index({ isLoggedIn = true }) {
  return <HeroCarousel isLoggedIn={isLoggedIn} />;
}
