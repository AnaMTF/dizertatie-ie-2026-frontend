import { index, route } from "@react-router/dev/routes";

export default [
  index("pages/index.jsx"),

  /* Blog */
  route("/blog", "pages/blog.jsx"),
  route("/blog/:slug", "pages/blog-post.jsx"),

  /* Only a logged in user can access thiese routes */
  route("/profile", "pages/profile.jsx"),
  route("/appointments", "pages/appointments.jsx"),
  route("/ai-scan", "pages/ai-scan.jsx"),
  route("/notifications", "pages/notifications.jsx"),

  /* Doctor-specific routes */
  route("/doctor/profile", "pages/doctor-profile.jsx"),
  route("/doctor/appointments", "pages/doctor-appointments.jsx"),
  route("/doctor/scan-review-queue", "pages/doctor-scan-review-queue.jsx"),
  route("/doctor/notifications", "pages/doctor-notifications.jsx"),
];
