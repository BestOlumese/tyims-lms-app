// Shared type aliases used across the app

export type UserRole = "student" | "instructor" | "admin";

export type CourseLevel = "beginner" | "intermediate" | "advanced";
export type CourseStatus = "draft" | "pending" | "published" | "archived";
export type LessonType = "video" | "text" | "quiz";
export type LessonStatus = "processing" | "ready";

export type PaymentStatus = "pending" | "success" | "failed" | "refunded";
export type PaymentType = "course" | "subscription";
export type EarningStatus = "pending" | "paid";
export type PayoutStatus = "pending" | "approved" | "completed" | "failed";

export type SubscriptionPlan = "basic" | "pro";
export type SubscriptionStatus =
  | "active"
  | "cancelled"
  | "expired"
  | "past_due";

export type LiveClassStatus = "scheduled" | "live" | "ended" | "cancelled";

// Enriched types used in UI
export type CourseWithInstructor = {
  id: string;
  title: string;
  slug: string;
  shortDescription: string | null;
  thumbnail: string | null;
  price: number;
  isFree: boolean;
  level: CourseLevel;
  totalLessons: number;
  totalDuration: number;
  totalStudents: number;
  averageRating: number;
  totalReviews: number;
  instructor: {
    id: string;
    name: string;
    image: string | null;
    headline: string | null;
  };
  category: {
    id: string;
    name: string;
    slug: string;
  } | null;
};

export type LessonWithProgress = {
  id: string;
  title: string;
  type: LessonType;
  duration: number;
  isPreview: boolean;
  order: number;
  status: LessonStatus;
  isCompleted: boolean;
  watchedSeconds: number;
};

export type PageProps<
  TParams extends Record<string, string> = Record<string, string>,
  TSearchParams extends Record<string, string | string[]> = Record<
    string,
    string | string[]
  >
> = {
  params: Promise<TParams>;
  searchParams: Promise<TSearchParams>;
};
