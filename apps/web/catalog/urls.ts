import type { Monument } from "./repository";

export function canonicalMonumentPath(monument: Pick<Monument, "slug">): string {
  return `/catalog/${encodeURIComponent(monument.slug)}`;
}

export function canonicalCatalogPath(): string {
  return "/catalog";
}

export function createUniqueSlug(name: string, existingSlugs: Iterable<string>): string {
  const base = slugify(name);
  const used = new Set(existingSlugs);
  if (!used.has(base)) return base;

  let suffix = 2;
  while (used.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

export function assertPublishedSlugChangeRequiresAlias(input: {
  isPublished: boolean;
  currentSlug: string;
  nextSlug: string;
  hasAlias: boolean;
}): void {
  if (input.isPublished && input.currentSlug !== input.nextSlug && !input.hasAlias) {
    throw new Error("Published slug changes require an alias or redirect");
  }
}

function slugify(value: string): string {
  const normalized = value
    .trim()
    .normalize("NFKD")
    .replace(/[łŁ]/g, "l")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "monument";
}
