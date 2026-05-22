import { Link } from "react-router";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer bg-base-200 text-base-content items-center justify-between gap-4 p-6">
      <p className="text-sm">Medvision © {currentYear}</p>
      <nav>
        <Link to="/contact" className="link link-hover text-sm">
          Contact
        </Link>
      </nav>
    </footer>
  );
}
