const modules = import.meta.glob("./*.jsx", { eager: true });

export const posts = Object.values(modules)
  .map((module) => ({
    default: module.default,
    meta: module.meta,
    relatedSpecialties: Array.isArray(module.relatedSpecialties)
      ? module.relatedSpecialties
      : [],
  }))
  .filter((post) => post.default && post.meta?.slug)
  .sort((a, b) => new Date(b.meta.publishedAt) - new Date(a.meta.publishedAt));

export const postsBySlug = Object.fromEntries(
  posts.map((post) => [post.meta.slug, post]),
);
