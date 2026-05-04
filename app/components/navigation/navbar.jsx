import { useState } from "react";
import {
  FaBell,
  FaCalendarAlt,
  FaMedkit,
  FaSearch,
  FaSignInAlt,
  FaSignOutAlt,
  FaStethoscope,
  FaUserCircle,
  FaUserPlus,
} from "react-icons/fa";
import { Link } from "react-router";
import Login from "../authentication/login";
import Logout from "../authentication/logout";
import Register from "../authentication/register";

function PatientActions() {
  return (
    <>
      <Link to="/ai-scan" className="btn btn-sm btn-primary">
        AI Scan
      </Link>

      <Link to="/notifications" className="btn btn-sm btn-ghost">
        <FaBell />
        Notifications
      </Link>

      <Link to="/appointments" className="btn btn-sm btn-ghost">
        <FaCalendarAlt />
        Appointments
      </Link>

      <Link to="/profile" className="btn btn-sm btn-ghost">
        <FaUserCircle />
        Profile
      </Link>
    </>
  );
}

function DoctorActions() {
  return (
    <>
      <Link to="/doctor/appointments" className="btn btn-sm btn-primary">
        <FaStethoscope />
        My Appointments
      </Link>
    </>
  );
}

function LoggedInActions({ user }) {
  function handleLogOut() {
    document.getElementById("logout-modal").showModal();
  }

  return (
    <>
      {user?.role === "doctor" ? <DoctorActions /> : <PatientActions />}

      <div className="bg-neutral-content/30 h-6 w-px" />

      <button onClick={handleLogOut} className="btn btn-sm btn-error">
        <FaSignOutAlt />
        Log Out
      </button>
      <Logout />
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
      <button onClick={handleLogin} className="btn btn-sm btn-ghost">
        <FaSignInAlt />
        Login
      </button>

      <button onClick={handleRegister} className="btn btn-sm btn-primary">
        <FaUserPlus />
        Register
      </button>
      <Login />
      <Register />
    </>
  );
}

export function Navbar({ user = null }) {
  const [searchValue, setSearchValue] = useState("");
  const isLoggedIn = Boolean(user);

  function handleSearch() {
    // TODO: implement search logic
  }

  return (
    <div className="navbar bg-neutral text-neutral-content px-9">
      <div className="navbar-start gap-2">
        <Link to="/" className="flex items-center gap-2">
          <FaMedkit className="text-3xl" />
          <div className="text-2xl font-semibold">Dizertatie IE 2026</div>
        </Link>
      </div>
      <div className="navbar-center flex gap-2">
        <input
          type="text"
          placeholder="Search..."
          className="input input-accent input-sm bg-base-200 text-base-content placeholder-base-content/50 w-xl"
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
        />
        <button onClick={handleSearch} className="btn btn-sm btn-accent">
          <FaSearch />
          Search
        </button>
      </div>
      <div className="navbar-end gap-4">
        {isLoggedIn ? <LoggedInActions user={user} /> : <LoggedOutActions />}
      </div>
    </div>
  );
}
