import {
  FaBell,
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
import Logout from "../authentication/logout";
import Register from "../authentication/register";

// const API_BASE = "http://localhost:9000/api/v1";

// function getAuthToken() {
//   return localStorage.getItem("token");
// }

function LoggedInActions() {
  // const [unreadCount, setUnreadCount] = useState(0);

  // useEffect(() => {
  //   async function fetchUnread() {
  //     try {
  //       const res = await fetch(`${API_BASE}/scan/unread-count`, {
  //         headers: { Authorization: `Bearer ${getAuthToken()}` },
  //       });
  //       const json = await res.json();
  //       if (res.ok) setUnreadCount(json.data?.count ?? 0);
  //     } catch {
  //       // silently fail
  //     }
  //   }
  //   fetchUnread();
  //   const id = setInterval(fetchUnread, 30_000);
  //   return () => clearInterval(id);
  // }, []);

  const unreadCount = 3; // TODO: replace with real unread count from API

  function handleLogOut() {
    document.getElementById("logout-modal").showModal();
  }

  return (
    <>
      <Link to="/ai-scan" className="btn btn-sm btn-primary">
        <FaRobot />
        AI Scan
      </Link>

      <Link to="/ai-scan" className="btn btn-sm btn-ghost indicator">
        {unreadCount > 0 && (
          <span className="badge badge-error badge-xs indicator-item">
            {unreadCount}
          </span>
        )}
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

export function Navbar({ isLoggedIn = true }) {
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
        />
        <button onClick={handleSearch} className="btn btn-sm btn-accent">
          <FaSearch />
          Search
        </button>
      </div>
      <div className="navbar-end gap-4">
        {isLoggedIn ? <LoggedInActions /> : <LoggedOutActions />}
      </div>
    </div>
  );
}
