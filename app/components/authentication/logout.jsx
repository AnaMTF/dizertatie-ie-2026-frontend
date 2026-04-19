import { FaSignOutAlt } from "react-icons/fa";

export default function Logout() {
  function handleLogOut() {
    // TODO: clear session and redirect to login
  }

  return (
    <dialog id="logout-modal" className="tw:d-modal">
      <div className="tw:d-modal-box tw:bg-base-100 tw:text-base-content">
        <h2 className="tw:text-xl tw:font-bold tw:flex tw:items-center tw:gap-2">
          <FaSignOutAlt className="tw:text-error" />
          Log out
        </h2>
        <p className="tw:py-4">Are you sure you want to log out?</p>
        <div className="tw:d-modal-action">
          <form method="dialog">
            <button className="tw:d-btn tw:d-btn-ghost">Cancel</button>
          </form>
          <button className="tw:d-btn tw:d-btn-error" onClick={handleLogOut}>
            <FaSignOutAlt />
            Log Out
          </button>
        </div>
      </div>
    </dialog>
  );
}
