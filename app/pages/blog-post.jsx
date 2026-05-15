import { useEffect } from "react";
import { Link, useParams } from "react-router";
import { postsBySlug } from "../posts/index.js";

const SPECIALTY_LABELS = {
  general: "General Medicine",
  cardiology: "Cardiology",
  dermatology: "Dermatology",
  endocrinology: "Endocrinology",
  gastroenterology: "Gastroenterology",
  gynecology: "Gynecology",
  neurology: "Neurology",
  oncology: "Oncology",
  ophthalmology: "Ophthalmology",
  orthopedics: "Orthopedics",
  otolaryngology: "Otolaryngology",
  psychiatry: "Psychiatry",
  pulmonology: "Pulmonology",
  urology: "Urology",
};

function BlogPostAppointmentCta({ relatedSpecialties }) {
  const primarySpecialty = relatedSpecialties?.[0] || "";
  const specialtyLabel =
    SPECIALTY_LABELS[primarySpecialty] || "the right specialty";
  const appointmentUrl = primarySpecialty
    ? `/appointments?create=true&specialty=${encodeURIComponent(primarySpecialty)}`
    : "/appointments?create=true";

  return (
    <div className="card bg-base-200 mt-10">
      <div className="card-body">
        <h2 className="card-title">Feeling worried about these symptoms?</h2>
        <p className="text-base-content/70">
          Talk to a doctor and get a professional opinion. We can prefill the
          booking form with {specialtyLabel}.
        </p>
        <div className="card-actions mt-2">
          <Link to={appointmentUrl} className="btn btn-primary">
            Book an appointment
          </Link>
          <Link to="/appointments" className="btn btn-ghost">
            View appointments
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function BlogPost() {
  const { slug } = useParams();
  const post = postsBySlug[slug];

  useEffect(() => {
    const scrollContainer = document.querySelector("main");

    if (scrollContainer) {
      scrollContainer.scrollTo({ top: 0 });
      return;
    }

    window.scrollTo({ top: 0 });
  }, [slug]);

  if (!post) {
    return (
      <div className="px-9 pt-6 pb-10">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
          <div>
            <h1 className="mb-4 text-3xl font-bold">Post not found</h1>
            <Link to="/blog" className="link link-primary">
              Back to Blog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const PostContent = post.default;

  return (
    <div className="px-9 pt-6 pb-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div>
          <Link to="/blog" className="link link-primary mb-6 block text-sm">
            ← Back to Blog
          </Link>

          <h1 className="mb-2 text-4xl font-bold">{post.meta.title}</h1>
          <p className="text-base-content/50 text-sm">
            {new Date(post.meta.publishedAt).toLocaleDateString("en-GB", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        <div className="prose max-w-none">
          <PostContent />
        </div>

        <BlogPostAppointmentCta relatedSpecialties={post.relatedSpecialties} />
      </div>
    </div>
  );
}
