import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Convert kobo to Naira string. e.g. 500000 → "₦5,000" */
export function formatNaira(kobo: number): string {
  const naira = kobo / 100;
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(naira);
}

/** Convert seconds to readable duration. e.g. 3750 → "1h 2m" */
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

/** Convert rating stored as integer (450 = 4.5) to display string */
export function formatRating(ratingInt: number): string {
  return (ratingInt / 100).toFixed(1);
}

/** Generate a URL-safe slug from a string */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Generate a unique Paystack reference */
export function generatePaystackReference(prefix = "TYIMS"): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

/** Check if a user has access to a course (enrolled or subscribed) */
export function hasAccess(params: {
  isFree: boolean;
  isEnrolled: boolean;
  hasActiveSubscription: boolean;
}): boolean {
  return params.isFree || params.isEnrolled || params.hasActiveSubscription;
}
