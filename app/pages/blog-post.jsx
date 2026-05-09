import { Link, useParams } from "react-router";
import { postsBySlug } from "../posts/index.js";

export default function BlogPost() {
  const { slug } = useParams();
  const post = postsBySlug[slug];

  if (!post) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-12">
        <h1 className="mb-4 text-3xl font-bold">Post not found</h1>
        <Link to="/blog" className="link link-primary">
          Back to Blog
        </Link>
      </div>
    );
  }

  const PostContent = post.default;

  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <Link to="/blog" className="link link-primary mb-6 block text-sm">
        ← Back to Blog
      </Link>

      <h1 className="mb-2 text-4xl font-bold">{post.meta.title}</h1>
      <p className="text-base-content/50 mb-8 text-sm">
        {new Date(post.meta.publishedAt).toLocaleDateString("en-GB", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </p>

      <div className="prose max-w-none">
        <PostContent />
      </div>
    </div>
  );
}
