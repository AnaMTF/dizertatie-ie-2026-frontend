import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { posts } from "../posts/index.js";
import { API_BASE } from "../utils/auth.js";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const PAGE_SIZE_OPTIONS = [10, 20, 50];

function toPositiveInt(value, fallback) {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
}

export default function Blog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q")?.trim() ?? "";
  const page = toPositiveInt(searchParams.get("page"), DEFAULT_PAGE);
  const limit = toPositiveInt(searchParams.get("limit"), DEFAULT_LIMIT);

  const [results, setResults] = useState([]);
  const [searchPagination, setSearchPagination] = useState({
    page: DEFAULT_PAGE,
    limit: DEFAULT_LIMIT,
    totalItems: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const previousQueryRef = useRef(query);

  const setPaginationParams = useCallback(
    (updates) => {
      const next = new URLSearchParams(searchParams);

      if (updates.page == null || updates.page <= DEFAULT_PAGE) {
        next.delete("page");
      } else {
        next.set("page", String(updates.page));
      }

      if (updates.limit == null || updates.limit === DEFAULT_LIMIT) {
        next.delete("limit");
      } else {
        next.set("limit", String(updates.limit));
      }

      setSearchParams(next);
    },
    [searchParams, setSearchParams],
  );

  useEffect(() => {
    if (previousQueryRef.current !== query) {
      previousQueryRef.current = query;

      if (page !== DEFAULT_PAGE) {
        setPaginationParams({ page: DEFAULT_PAGE, limit });
      }
    }
  }, [limit, page, query, setPaginationParams]);

  useEffect(() => {
    if (!query) {
      setResults([]);
      setSearchPagination((current) => ({
        ...current,
        page,
        limit,
      }));
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const controller = new AbortController();

    fetch(
      `${API_BASE}/blog/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`,
      {
        signal: controller.signal,
      },
    )
      .then((res) => {
        if (!res.ok) throw new Error("Search failed.");
        return res.json();
      })
      .then((data) => {
        const pagination = data.meta?.pagination || {
          page,
          limit,
          totalItems: Array.isArray(data.data) ? data.data.length : 0,
          totalPages: 1,
        };

        setSearchPagination(pagination);
        setResults(Array.isArray(data.data) ? data.data : []);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setError(err.message);
          setResults([]);
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [limit, page, query]);

  const staticPagination = useMemo(() => {
    const totalItems = posts.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / limit));
    const activePage = Math.min(Math.max(DEFAULT_PAGE, page), totalPages);

    return {
      page: activePage,
      limit,
      totalItems,
      totalPages,
    };
  }, [limit, page]);

  const activePagination = query
    ? {
        page: Math.max(DEFAULT_PAGE, searchPagination.page || page),
        limit: searchPagination.limit || limit,
        totalItems: searchPagination.totalItems || 0,
        totalPages: Math.max(1, searchPagination.totalPages || 1),
      }
    : staticPagination;

  useEffect(() => {
    if (page <= activePagination.totalPages) {
      return;
    }

    setPaginationParams({ page: activePagination.totalPages, limit });
  }, [activePagination.totalPages, limit, page, setPaginationParams]);

  const displayPosts = results
    ? results
        .map(({ slug }) => posts.find((p) => p.meta.slug === slug))
        .filter(Boolean)
    : [];

  const defaultPosts = useMemo(() => {
    const start = (staticPagination.page - 1) * staticPagination.limit;
    const end = start + staticPagination.limit;

    return posts.slice(start, end);
  }, [staticPagination.limit, staticPagination.page]);

  const visiblePosts = query ? displayPosts : defaultPosts;

  function handlePreviousPage() {
    setPaginationParams({
      page: Math.max(DEFAULT_PAGE, activePagination.page - 1),
      limit: activePagination.limit,
    });
  }

  function handleNextPage() {
    setPaginationParams({
      page: Math.min(activePagination.totalPages, activePagination.page + 1),
      limit: activePagination.limit,
    });
  }

  function handleLimitChange(event) {
    const nextLimit = toPositiveInt(event.target.value, DEFAULT_LIMIT);
    setPaginationParams({ page: DEFAULT_PAGE, limit: nextLimit });
  }

  const paginationControls = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="text-base-content/70 flex min-w-max items-center gap-2 text-sm">
        <span className="whitespace-nowrap">Posts per page</span>
        <select
          className="select select-bordered select-sm"
          value={activePagination.limit}
          onChange={handleLimitChange}
          disabled={loading}
        >
          {PAGE_SIZE_OPTIONS.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={handlePreviousPage}
          disabled={loading || activePagination.page <= DEFAULT_PAGE}
        >
          Previous
        </button>
        <span className="text-base-content/70 text-sm">
          Page {activePagination.page} / {activePagination.totalPages}
        </span>
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={handleNextPage}
          disabled={
            loading || activePagination.page >= activePagination.totalPages
          }
        >
          Next
        </button>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-2 text-4xl font-bold">Blog</h1>

      {query && (
        <p className="text-base-content/60 mb-8">
          {loading ? "Searching..." : error ? error : `Results for "${query}"`}
        </p>
      )}

      {!query && <p className="text-base-content/60 mb-8">Latest posts</p>}

      {!loading && visiblePosts.length === 0 && (
        <p className="text-base-content/50">No posts found.</p>
      )}

      <div className="mb-6">{paginationControls}</div>

      <div className="flex flex-col gap-6">
        {visiblePosts.map((post) => (
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

      <div className="mt-8">{paginationControls}</div>
    </div>
  );
}
