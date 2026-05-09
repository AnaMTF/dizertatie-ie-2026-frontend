import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { posts } from "../posts/index.js";
import { API_BASE } from "../utils/auth.js";

export default function Blog() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q")?.trim() ?? "";

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!query) {
      setResults(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    fetch(`${API_BASE}/blog/search?q=${encodeURIComponent(query)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Search failed.");
        return res.json();
      })
      .then((data) => setResults(data.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [query]);

  const displayPosts = results
    ? results
        .map(({ slug }) => posts.find((p) => p.meta.slug === slug))
        .filter(Boolean)
    : posts;

  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-2 text-4xl font-bold">Blog</h1>

      {query && (
        <p className="text-base-content/60 mb-8">
          {loading ? "Searching..." : error ? error : `Results for "${query}"`}
        </p>
      )}

      {!query && <p className="text-base-content/60 mb-8">Latest posts</p>}

      {!loading && displayPosts.length === 0 && (
        <p className="text-base-content/50">No posts found.</p>
      )}

      <div className="flex flex-col gap-6">
        {displayPosts.map((post) => (
          <Link
            key={post.meta.slug}
            to={`/blog/${post.meta.slug}`}
            className="card bg-base-200 hover:bg-base-300 transition-colors"
          >
            <div className="card-body">
              <h2 className="card-title">{post.meta.title}</h2>
              <p className="text-base-content/70">{post.meta.summary}</p>
              <p className="text-base-content/50 mt-1 text-sm">
                {new Date(post.meta.publishedAt).toLocaleDateString("en-GB", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
