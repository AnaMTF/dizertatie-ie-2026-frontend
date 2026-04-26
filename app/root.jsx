import { useEffect, useState } from "react";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "react-router";
import { Navbar } from "./components/navigation/navbar";
import { AUTH_CHANGED_EVENT, getUser } from "./utils/auth";

import "./app.css";

export function clientLoader() {
  return { user: getUser() };
}

export function Layout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="flex h-screen flex-col">
        <main className="flex-1 overflow-y-auto">{children}</main>
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

  return (
    <>
      <Navbar user={currentUser} />
      <Outlet context={{ user: currentUser }} />
    </>
  );
}
