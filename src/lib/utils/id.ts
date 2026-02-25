import { nanoid } from "nanoid";

/** Generate a short, URL-safe unique ID (12 chars) */
export function createId(): string {
  return nanoid(12);
}

/** Generate a slug from a string */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 100);
}
