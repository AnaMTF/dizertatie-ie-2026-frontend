import { DayPicker } from "react-day-picker";
import CreateAppointment from "../components/appointments/create-appointment";

function TopBar() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Appointments</h1>
        <p className="text-base-content/50 text-sm">
          Manage and track your medical appointments
        </p>
      </div>
      <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:flex-nowrap">
        <button className="btn btn-secondary">Filter</button>
        <button
          className="btn btn-primary"
          onClick={() =>
            document.getElementById("create-appointment-modal").showModal()
          }
        >
          Create Appointment
        </button>
      </div>
    </div>
  );
}

function AppointmentsTable() {
  return (
    <div className="card bg-base-100 flex-1 shadow">
      <div className="card-body overflow-auto p-0">
        <table className="table-zebra [&_th]:text-base-content [&_td]:text-base-content table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Doctor</th>
              <th>Date &amp; Time</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={5} className="text-base-content/40 text-center">
                No appointments yet.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Sidebar() {
  return (
    <div className="flex w-full shrink-0 flex-col gap-4 lg:w-auto">
      <DayPicker className="react-day-picker bg-base-200 rounded-box mx-auto p-4 shadow" />
      <div className="card bg-base-200 shadow">
        <div className="card-body">
          <h2 className="card-title text-sm">Info</h2>
          {/* contextual info goes here */}
        </div>
      </div>
    </div>
  );
}

export default function Appointments() {
  return (
    <div className="flex h-full flex-col gap-4 px-9 pt-6">
      <TopBar />
      <div className="flex min-h-0 flex-1 flex-col items-stretch gap-6 lg:flex-row">
        <AppointmentsTable />
        <Sidebar />
      </div>
      <CreateAppointment />
    </div>
  );
}
