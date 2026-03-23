import { index, prefix, route } from "@react-router/dev/routes";

export default [
  index("routes/index.jsx"),

  /* Authentication */
  ...prefix("/auth", [
    route("/login", "routes/auth/login.jsx"),
    route("/register", "routes/auth/register.jsx"),
  ]),

  /* Basic functionality */
  route("/dashboard", "routes/dashboard.jsx"),

  /* A logged in user can access only their own profile and appointments */
  ...prefix("/profile", [
    index("routes/profile/profile.jsx"),
    route("/edit", "routes/profile/profile-edit.jsx"),
  ]),
  ...prefix("/appointments", [
    index("routes/appointments/appointments.jsx"),
    route("/create", "routes/appointments/appointment-create.jsx"),
    route("/:uuid", "routes/appointments/appointment.jsx"),
    route("/:uuid/edit", "routes/appointments/appointment-edit.jsx"),
  ]),
];
