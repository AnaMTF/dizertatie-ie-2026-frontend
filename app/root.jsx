import { useEffect, useState } from "react";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "react-router";
import { Footer } from "./components/common/footer";
import { Navbar } from "./components/navigation/navbar";
import { AUTH_CHANGED_EVENT, getUser } from "./utils/auth";
import {
  APP_DATA_REFRESH_EVENT,
  NOTIFICATIONS_UNREAD_CHANGED_EVENT,
} from "./utils/notifications";
import { enablePushNotifications } from "./utils/push";
import { THEME_CHANGED_EVENT, getActiveTheme } from "./utils/theme";

import "./app.css";

export function clientLoader() {
  return { user: getUser() };
}

export function Layout({ children }) {
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

  return (
    <html lang="en" data-theme={theme}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Medvision</title>
        <meta
          name="description"
          content="Medvision is a medical platform for appointments, scans, and patient care."
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function () {
  try {
    var stored = localStorage.getItem("theme");
    var hasStored = stored === "light" || stored === "dark";
    var prefersDark =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.dataset.theme = hasStored
      ? stored
      : prefersDark
        ? "dark"
        : "light";
  } catch (error) {
    var prefersDark =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.dataset.theme = prefersDark ? "dark" : "light";
  }
})();`,
          }}
        />
        <Meta />
        <Links />
      </head>
      <body className="min-h-screen">
        <main>{children}</main>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const { user } = useLoaderData();
  const [currentUser, setCurrentUser] = useState(user);

  useEffect(() => {
    setCurrentUser(user);
  }, [user]);

  useEffect(() => {
    function handleAuthChanged() {
      setCurrentUser(getUser());
    }

    window.addEventListener(AUTH_CHANGED_EVENT, handleAuthChanged);
    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, handleAuthChanged);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.warn("Service worker registration failed", error);
    });
  }, []);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      !currentUser ||
      currentUser.role === "doctor"
    ) {
      return;
    }

    enablePushNotifications().catch(() => {
      // Silently fail: user may have denied permissions or push not supported
    });
  }, [currentUser]);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      !currentUser
    ) {
      return;
    }

    function handleSWMessage(event) {
      if (event.data?.type === "push-notification-received") {
        window.dispatchEvent(new Event(NOTIFICATIONS_UNREAD_CHANGED_EVENT));
        window.dispatchEvent(new Event(APP_DATA_REFRESH_EVENT));
      }
    }

    navigator.serviceWorker.addEventListener("message", handleSWMessage);

    return () => {
      navigator.serviceWorker.removeEventListener("message", handleSWMessage);
    };
  }, [currentUser]);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar user={currentUser} />
      <div className="flex-1">
        <Outlet context={{ user: currentUser }} />
      </div>
      <Footer />
    </div>
  );
}
