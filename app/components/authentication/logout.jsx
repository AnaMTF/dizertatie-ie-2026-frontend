import { FaSignOutAlt } from "react-icons/fa";

export default function Logout() {
  function handleLogOut() {
    // TODO: clear session and redirect to login
  }

  return (
    <dialog id="logout-modal" className="modal">
      <div className="modal-box bg-base-100 text-base-content">
        <h2 className="flex items-center gap-2 text-xl font-bold">
          <FaSignOutAlt className="text-error" />
          Log out
        </h2>
        <p className="py-4">Are you sure you want to log out?</p>
        <div className="modal-action">
          <form method="dialog">
            <button className="btn btn-ghost">Cancel</button>
          </form>
          <button className="btn btn-error" onClick={handleLogOut}>
            <FaSignOutAlt />
            Log Out
          </button>
        </div>
      </div>
    </dialog>
  );
}
