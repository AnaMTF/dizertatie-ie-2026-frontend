import { Link } from "react-router";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer border-base-300 bg-neutral text-neutral-content items-center justify-between gap-4 border-t p-6">
      <p className="text-sm">Medvision © {currentYear}</p>
      <nav>
        <Link to="/contact" className="link link-hover text-sm">
          Contact
        </Link>
      </nav>
    </footer>
  );
}
