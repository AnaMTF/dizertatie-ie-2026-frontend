import { Link } from "react-router";
import {
  FaSearch,
  FaSignInAlt,
  FaSignOutAlt,
  FaUserPlus,
  FaUserCircle,
  FaCalendarAlt,
  FaRobot,
  FaTachometerAlt,
  FaMedkit,
} from "react-icons/fa";

function LoggedInActions() {
  return (
    <>
      <Link to="/dashboard" className="tw:d-btn tw:d-btn-sm tw:d-btn-ghost">
        <FaTachometerAlt />
        Dashboard
      </Link>
      <Link to="/appointments" className="tw:d-btn tw:d-btn-sm tw:d-btn-ghost">
        <FaCalendarAlt />
        Appointments
      </Link>
      <Link to="/ai-scan" className="tw:d-btn tw:d-btn-sm tw:d-btn-ghost">
        <FaRobot />
        AI Scan
      </Link>
      <Link to="/profile" className="tw:d-btn tw:d-btn-sm tw:d-btn-ghost">
        <FaUserCircle />
        Profile
      </Link>
      <button className="tw:d-btn tw:d-btn-sm tw:d-btn-error">
        <FaSignOutAlt />
        Log Out
      </button>
    </>
  );
}

function LoggedOutActions() {
  return (
    <>
      <Link to="/login" className="tw:d-btn tw:d-btn-sm tw:d-btn-ghost">
        <FaSignInAlt />
        Login
      </Link>
      <Link to="/register" className="tw:d-btn tw:d-btn-sm tw:d-btn-primary">
        <FaUserPlus />
        Register
      </Link>
    </>
  );
}

export function Navbar({ isLoggedIn = true }) {
  return (
    <div className="tw:d-navbar tw:bg-neutral tw:text-neutral-content tw:px-9">
      <div className="tw:d-navbar-start tw:gap-2">
        <Link to="/" className="tw:flex tw:items-center tw:gap-2">
          <FaMedkit className="tw:text-3xl" />
          <div className="tw:text-2xl tw:font-semibold">Dizertatie IE 2026</div>
        </Link>
      </div>
      <div className="tw:d-navbar-center tw:flex tw:gap-2">
        <input
          type="text"
          placeholder="Search..."
          className="tw:d-input tw:d-input-sm tw:w-xl tw:bg-base-200 tw:text-base-content tw:placeholder-base-content/50"
        />
        <button className="tw:d-btn tw:d-btn-sm tw:d-btn-accent">
          <FaSearch />
          Search
        </button>
      </div>
      <div className="tw:d-navbar-end tw:gap-2">
        {isLoggedIn ? <LoggedInActions /> : <LoggedOutActions />}
      </div>
    </div>
  );
}
