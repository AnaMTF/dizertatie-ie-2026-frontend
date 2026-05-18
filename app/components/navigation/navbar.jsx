import { useCallback, useEffect, useState } from "react";
import {
  FaBell,
  FaCalendarAlt,
  FaMedkit,
  FaMoon,
  FaNewspaper,
  FaSearch,
  FaSignInAlt,
  FaSignOutAlt,
  FaStethoscope,
  FaSun,
  FaUserCircle,
  FaUserPlus,
} from "react-icons/fa";
import { Link, useNavigate } from "react-router";
import {
  NOTIFICATIONS_UNREAD_CHANGED_EVENT,
  getUnreadNotificationCount,
} from "../../utils/notifications";
import {
  THEME_CHANGED_EVENT,
  getActiveTheme,
  toggleTheme,
} from "../../utils/theme";
import Login from "../authentication/login";
import Logout from "../authentication/logout";
import Register from "../authentication/register";

function ThemeToggle() {
  const [theme, setTheme] = useState(() => getActiveTheme());

  useEffect(() => {
    function handleThemeChanged() {
      setTheme(getActiveTheme());
    }

    window.addEventListener(THEME_CHANGED_EVENT, handleThemeChanged);
    return () => {
      window.removeEventListener(THEME_CHANGED_EVENT, handleThemeChanged);
    };
  }, []);

  function handleThemeToggle() {
    const nextTheme = toggleTheme();
    setTheme(nextTheme);
  }

  return (
    <label className="label cursor-pointer gap-2 py-0">
      <FaSun className="text-sm" />
      <input
        type="checkbox"
        className="toggle toggle-sm"
        checked={theme === "dark"}
        onChange={handleThemeToggle}
        aria-label="Toggle light and dark mode"
      />
      <FaMoon className="text-sm" />
    </label>
  );
}

function PatientActions() {
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = useCallback(async () => {
    try {
      const count = await getUnreadNotificationCount();
      setUnreadCount(count);
    } catch {
      // swallow; badge simply stays at last known value
    }
  }, []);

  useEffect(() => {
    refreshUnreadCount();

    window.addEventListener(
      NOTIFICATIONS_UNREAD_CHANGED_EVENT,
      refreshUnreadCount,
    );

    return () => {
      window.removeEventListener(
        NOTIFICATIONS_UNREAD_CHANGED_EVENT,
        refreshUnreadCount,
      );
    };
  }, [refreshUnreadCount]);

  return (
    <>
      <Link to="/ai-scan" className="btn btn-sm btn-primary">
        AI Scan
      </Link>

      <Link to="/blog" className="btn btn-sm btn-ghost">
        <FaNewspaper />
        Blog
      </Link>

      <Link to="/notifications" className="indicator btn btn-sm btn-ghost">
        <FaBell />
        Notifications
        {unreadCount > 0 && (
          <span className="badge badge-info badge-xs indicator-item">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
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
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = useCallback(async () => {
    try {
      const count = await getUnreadNotificationCount();
      setUnreadCount(count);
    } catch {
      // swallow; badge simply stays at last known value
    }
  }, []);

  useEffect(() => {
    refreshUnreadCount();

    window.addEventListener(
      NOTIFICATIONS_UNREAD_CHANGED_EVENT,
      refreshUnreadCount,
    );

    return () => {
      window.removeEventListener(
        NOTIFICATIONS_UNREAD_CHANGED_EVENT,
        refreshUnreadCount,
      );
    };
  }, [refreshUnreadCount]);

  return (
    <>
      <Link to="/doctor/appointments" className="btn btn-sm btn-primary">
        <FaStethoscope />
        My Appointments
      </Link>

      <Link
        to="/doctor/notifications"
        className="indicator btn btn-sm btn-ghost"
      >
        <FaBell />
        Notifications
        {unreadCount > 0 && (
          <span className="badge badge-info badge-xs indicator-item">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Link>

      <Link to="/blog" className="btn btn-sm btn-ghost">
        <FaNewspaper />
        Blog
      </Link>

      <Link to="/doctor/profile" className="btn btn-sm btn-ghost">
        <FaUserCircle />
        Profile
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
      <Link to="/blog" className="btn btn-sm btn-ghost">
        <FaNewspaper />
        Blog
      </Link>

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
  const navigate = useNavigate();

  function handleSearch() {
    const q = searchValue.trim();
    if (!q) return;
    navigate(`/blog?q=${encodeURIComponent(q)}`);
  }

  function handleSearchKeyDown(event) {
    if (event.key === "Enter") handleSearch();
  }

  return (
    <div className="navbar bg-neutral text-neutral-content gap-4 px-9">
      <div className="navbar-start w-auto flex-none gap-2">
        <Link to="/" className="flex items-center gap-2">
          <FaMedkit className="text-3xl" />
          <div className="text-2xl font-semibold">Medvision</div>
        </Link>
      </div>
      <div className="navbar-center flex flex-1 justify-center px-2">
        <div className="flex w-full max-w-xl items-center gap-2">
          <input
            type="text"
            placeholder="Search..."
            className="input input-accent input-sm bg-base-200 text-base-content placeholder-base-content/50 min-w-0 flex-1"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            onKeyDown={handleSearchKeyDown}
          />
          <button onClick={handleSearch} className="btn btn-sm btn-accent">
            <FaSearch />
            Search
          </button>
        </div>
      </div>
      <div className="navbar-end w-auto flex-none gap-4">
        <ThemeToggle />
        {isLoggedIn ? <LoggedInActions user={user} /> : <LoggedOutActions />}
      </div>
    </div>
  );
}
