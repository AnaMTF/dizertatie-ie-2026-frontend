import { index, route } from "@react-router/dev/routes";

export default [
  index("pages/index.jsx"),

  /* Only a logged in user can access thiese routes */
  route("/profile", "pages/profile.jsx"),
  route("/appointments", "pages/appointments.jsx"),
  route("/ai-scan", "pages/ai-scan.jsx"),
  route("/notifications", "pages/notifications.jsx"),

  /* Doctor-specific routes */
  route("/doctor/appointments", "pages/doctor-appointments.jsx"),
];
