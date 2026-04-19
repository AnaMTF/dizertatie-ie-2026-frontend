import {
  FaCalendarAlt,
  FaMedkit,
  FaRobot,
  FaSearch,
  FaSignInAlt,
  FaSignOutAlt,
  FaUserCircle,
  FaUserPlus,
} from "react-icons/fa";
import { Link } from "react-router";
import Login from "../authentication/login";
import Register from "../authentication/register";

function LoggedInActions() {
  function handleLogOut() {
    // TODO: clear session and redirect to login
  }

  return (
    <>
      <Link to="/ai-scan" className="tw:d-btn tw:d-btn-sm tw:d-btn-primary">
        <FaRobot />
        AI Scan
      </Link>

      <Link to="/appointments" className="tw:d-btn tw:d-btn-sm tw:d-btn-ghost">
        <FaCalendarAlt />
        Appointments
      </Link>

      <Link to="/profile" className="tw:d-btn tw:d-btn-sm tw:d-btn-ghost">
        <FaUserCircle />
        Profile
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
    document.getElementById("login-modal").showModal();
  }

  function handleRegister() {
    document.getElementById("register-modal").showModal();
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
      <Login />
      <Register />
    </>
  );
}

export function Navbar({ isLoggedIn = false }) {
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
          className="tw:d-input tw:d-input-accent tw:d-input-sm tw:w-xl tw:bg-base-200 tw:text-base-content tw:placeholder-base-content/50"
        />
        <button
          onClick={handleSearch}
          className="tw:d-btn tw:d-btn-sm tw:d-btn-accent"
        >
          <FaSearch />
          Search
        </button>
      </div>
      <div className="tw:d-navbar-end tw:gap-4">
        {isLoggedIn ? <LoggedInActions /> : <LoggedOutActions />}
      </div>
    </div>
  );
}
