import { index, route } from "@react-router/dev/routes";

export default [
  index("routes/index.jsx"),

  /* Authentication */
  route("/login", "routes/login.jsx"),
  route("/register", "routes/register.jsx"),

  /* Functionality */
  route("/dashboard", "routes/dashboard.jsx"),
  route("/appointments", "routes/appointments.jsx"),
  route("/profile", "routes/profile.jsx"),
];
