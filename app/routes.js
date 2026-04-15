import { index, prefix, route } from "@react-router/dev/routes";

export default [
  index("pages/index.jsx"),

  /* Basic functionality */
  route("/dashboard", "pages/dashboard.jsx"),

  /* A logged in user can access only their own profile and appointments */
  route("/profile", "pages/profile.jsx"),
  route("/appointments", "pages/appointments.jsx"),
  route("/ai-scan", "pages/ai-scan.jsx"),
];
