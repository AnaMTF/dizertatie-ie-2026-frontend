import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FaHeart } from "react-icons/fa";
import { Link, useSearchParams } from "react-router";
import { posts } from "../posts/index.js";
import { API_BASE } from "../utils/auth.js";
import {
  addFavoritePost,
  canManageFavorites,
  getFavoritePosts,
  removeFavoritePost,
} from "../utils/blog-favorites.js";
import {
  BLOG_IMAGE_FALLBACK_PATH,
  getBlogImagePathForSlug,
} from "../utils/blog-image-paths.js";

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
  const favoritesOnly = searchParams.get("favorites") === "1";
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
  const [favoriteSlugs, setFavoriteSlugs] = useState(() => new Set());
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [favoriteError, setFavoriteError] = useState(null);
  const [pendingFavoriteSlug, setPendingFavoriteSlug] = useState(null);
  const previousQueryRef = useRef(query);
  const canFavorite = canManageFavorites();

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
    if (!canFavorite) {
      setFavoriteSlugs(new Set());
      setFavoritesLoading(false);
      setFavoriteError(null);
      return;
    }

    let isMounted = true;
    setFavoritesLoading(true);
    setFavoriteError(null);

    getFavoritePosts({ page: 1, limit: 50 })
      .then((result) => {
        if (!isMounted) {
          return;
        }

        if (result.error) {
          setFavoriteError(result.error);
          return;
        }

        setFavoriteSlugs(new Set(result.data.map((item) => item.postSlug)));
      })
      .finally(() => {
        if (isMounted) {
          setFavoritesLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [canFavorite]);

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

  const sourcePosts = useMemo(() => {
    if (favoritesOnly) {
      return posts.filter((post) => favoriteSlugs.has(post.meta.slug));
    }

    return posts;
  }, [favoriteSlugs, favoritesOnly]);

  const staticPagination = useMemo(() => {
    const totalItems = sourcePosts.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / limit));
    const activePage = Math.min(Math.max(DEFAULT_PAGE, page), totalPages);

    return {
      page: activePage,
      limit,
      totalItems,
      totalPages,
    };
  }, [limit, page, sourcePosts.length]);

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
        .map(({ slug, imagePath }) => {
          const post = posts.find((item) => item.meta.slug === slug);

          if (!post) {
            return null;
          }

          return {
            post,
            imagePath:
              typeof imagePath === "string" && imagePath.trim()
                ? imagePath
                : BLOG_IMAGE_FALLBACK_PATH,
          };
        })
        .filter(Boolean)
    : [];

  const defaultPosts = useMemo(() => {
    const start = (staticPagination.page - 1) * staticPagination.limit;
    const end = start + staticPagination.limit;

    return sourcePosts.slice(start, end).map((post) => ({
      post,
      imagePath:
        getBlogImagePathForSlug(post.meta.slug) || BLOG_IMAGE_FALLBACK_PATH,
    }));
  }, [sourcePosts, staticPagination.limit, staticPagination.page]);

  const visiblePosts = query ? displayPosts : defaultPosts;

  const favoritesLabel = useMemo(() => {
    if (!favoritesOnly) {
      return null;
    }

    if (!canFavorite) {
      return "Login required to view favorite posts.";
    }

    if (favoritesLoading) {
      return "Loading favorite posts...";
    }

    if (favoriteError) {
      return favoriteError;
    }

    return "Your saved favorite posts";
  }, [canFavorite, favoriteError, favoritesLoading, favoritesOnly]);

  async function handleToggleFavorite(slug) {
    if (!canFavorite || pendingFavoriteSlug) {
      return;
    }

    const currentlyFavorited = favoriteSlugs.has(slug);

    setPendingFavoriteSlug(slug);
    setFavoriteError(null);

    setFavoriteSlugs((current) => {
      const next = new Set(current);

      if (currentlyFavorited) {
        next.delete(slug);
      } else {
        next.add(slug);
      }

      return next;
    });

    const result = currentlyFavorited
      ? await removeFavoritePost(slug)
      : await addFavoritePost(slug);

    if (result.error) {
      setFavoriteError(result.error);
      setFavoriteSlugs((current) => {
        const next = new Set(current);

        if (currentlyFavorited) {
          next.add(slug);
        } else {
          next.delete(slug);
        }

        return next;
      });
    }

    setPendingFavoriteSlug(null);
  }

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
    <div className="px-9 pt-6 pb-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div>
          <h1 className="mb-2 text-4xl font-bold">Blog</h1>

          {query && (
            <p className="text-base-content/60">
              {loading
                ? "Searching..."
                : error
                  ? error
                  : `Results for "${query}"`}
            </p>
          )}

          {!query && (
            <p className="text-base-content/60">
              {favoritesOnly
                ? favoritesLabel || "Favorite posts"
                : "Latest posts"}
            </p>
          )}
        </div>

        {!loading && visiblePosts.length === 0 && (
          <p className="text-base-content/50">No posts found.</p>
        )}

        <div>{paginationControls}</div>

        <div className="flex flex-col gap-6">
          {visiblePosts.map(({ post, imagePath }) => (
            <div
              key={post.meta.slug}
              className="card bg-base-200 hover:bg-base-300 transition-colors"
            >
              <div className="card-body p-0">
                <div className="bg-base-100 p-6 md:flex md:flex-row md:items-start md:justify-between md:gap-6">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <Link
                        to={`/blog/${post.meta.slug}`}
                        className="card-title link-hover link"
                      >
                        {post.meta.title}
                      </Link>
                      {canFavorite && (
                        <button
                          type="button"
                          className={`btn btn-ghost btn-sm btn-circle ${favoriteSlugs.has(post.meta.slug) ? "text-error" : "text-base-content/60"}`}
                          onClick={() => handleToggleFavorite(post.meta.slug)}
                          disabled={pendingFavoriteSlug === post.meta.slug}
                          title={
                            favoriteSlugs.has(post.meta.slug)
                              ? "Remove from favorites"
                              : "Add to favorites"
                          }
                        >
                          <FaHeart />
                        </button>
                      )}
                    </div>
                    <p className="text-base-content/70">{post.meta.summary}</p>
                    <p className="text-base-content/50 mt-1 text-sm">
                      {new Date(post.meta.publishedAt).toLocaleDateString(
                        "en-GB",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        },
                      )}
                    </p>
                  </div>

                  <img
                    src={imagePath}
                    alt={`Image for ${post.meta.title}`}
                    className="mt-2 h-28 w-full rounded-xl object-cover md:mt-0 md:w-48"
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = BLOG_IMAGE_FALLBACK_PATH;
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div>{paginationControls}</div>
      </div>
    </div>
  );
}
