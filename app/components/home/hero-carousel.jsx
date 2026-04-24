import { useState } from "react";
import { FaCalendarAlt, FaRobot, FaUserMd } from "react-icons/fa";
import { Link } from "react-router";

const slides = [
  {
    id: "slide1",
    icon: <FaRobot className="size-14" />,
    title: "AI-Powered Scan",
    description:
      "Upload a medical image and let our AI assistant analyze it instantly. Get preliminary insights before your next doctor visit.",
    loggedInLink: "/ai-scan",
    loggedInLabel: "Try AI Scan",
  },
  {
    id: "slide2",
    icon: <FaCalendarAlt className="size-14" />,
    title: "Easy Appointments",
    description:
      "Browse available time slots and book appointments with your preferred doctor in just a few clicks — no phone calls needed.",
    loggedInLink: "/appointments",
    loggedInLabel: "Book an appointment",
  },
  {
    id: "slide3",
    icon: <FaUserMd className="size-14" />,
    title: "Your Health Profile",
    description:
      "Keep all your medical history, prescriptions, and clinic visits in one secure place, always accessible when you need it.",
    loggedInLink: "/profile",
    loggedInLabel: "View your profile",
  },
];

export default function HeroCarousel({ isLoggedIn }) {
  const [current, setCurrent] = useState(0);

  return (
    <div className="bg-base-200 relative min-h-[70vh] w-full overflow-hidden">
      <div
        className="flex transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {slides.map((slide) => (
          <div
            key={slide.id}
            className="flex min-h-[70vh] w-full shrink-0 items-center justify-center"
          >
            <div className="max-w-xl px-4 text-center">
              <div className="text-primary mb-4 flex justify-center">
                {slide.icon}
              </div>
              <h1 className="text-5xl font-bold">{slide.title}</h1>
              <p className="py-6 text-lg">{slide.description}</p>
              {isLoggedIn ? (
                <Link
                  to={slide.loggedInLink}
                  className="btn btn-primary btn-lg"
                >
                  {slide.loggedInLabel}
                </Link>
              ) : (
                <button
                  className="btn btn-primary btn-lg"
                  onClick={() =>
                    document.getElementById("register-modal").showModal()
                  }
                >
                  Get started for free
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="absolute top-1/2 right-4 left-4 flex -translate-y-1/2 justify-between">
        {current > 0 ? (
          <button
            className="btn btn-circle"
            onClick={() => setCurrent(current - 1)}
          >
            ❮
          </button>
        ) : (
          <div />
        )}
        {current < slides.length - 1 ? (
          <button
            className="btn btn-circle"
            onClick={() => setCurrent(current + 1)}
          >
            ❯
          </button>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}
