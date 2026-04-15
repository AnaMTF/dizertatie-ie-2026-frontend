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

function LoggedInActions({ notificationCount }) {
  function handleLogOut() {
    // TODO: clear session and redirect to login
  }

  return (
    <>
      <div className="tw:d-indicator">
        {notificationCount > 0 && (
          <span className="tw:d-indicator-item tw:d-indicator-start tw:d-badge tw:d-badge-info tw:d-badge-sm">
            {notificationCount}
          </span>
        )}
        <Link to="/profile" className="tw:d-btn tw:d-btn-sm tw:d-btn-primary">
          <FaUserCircle />
          Profile
        </Link>
      </div>
      <Link to="/dashboard" className="tw:d-btn tw:d-btn-sm tw:d-btn-primary">
        <FaTachometerAlt />
        Dashboard
      </Link>
      <Link
        to="/appointments"
        className="tw:d-btn tw:d-btn-sm tw:d-btn-primary"
      >
        <FaCalendarAlt />
        Appointments
      </Link>
      <Link to="/ai-scan" className="tw:d-btn tw:d-btn-sm tw:d-btn-primary">
        <FaRobot />
        AI Scan
      </Link>
      <div className="tw:w-px tw:h-6 tw:bg-neutral-content/30" />
      <button
        onClick={handleLogOut}
        className="tw:d-btn tw:d-btn-sm tw:d-btn-error"
      >
        <FaSignOutAlt />
        Log Out
      </button>
    </>
  );
}

function LoggedOutActions() {
  function handleLogin() {
    // TODO: open login modal or handle login flow
  }

  function handleRegister() {
    // TODO: open register modal or handle register flow
  }

  return (
    <>
      <button
        onClick={handleLogin}
        className="tw:d-btn tw:d-btn-sm tw:d-btn-ghost"
      >
        <FaSignInAlt />
        Login
      </button>
      <button
        onClick={handleRegister}
        className="tw:d-btn tw:d-btn-sm tw:d-btn-primary"
      >
        <FaUserPlus />
        Register
      </button>
    </>
  );
}

export function Navbar({ isLoggedIn = true, notificationCount = 10 }) {
  function handleSearch() {
    // TODO: implement search logic
  }

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
        <button
          onClick={handleSearch}
          className="tw:d-btn tw:d-btn-sm tw:d-btn-accent"
        >
          <FaSearch />
          Search
        </button>
      </div>
      <div className="tw:d-navbar-end tw:gap-2">
        {isLoggedIn ? (
          <LoggedInActions notificationCount={notificationCount} />
        ) : (
          <LoggedOutActions />
        )}
      </div>
    </div>
  );
}
