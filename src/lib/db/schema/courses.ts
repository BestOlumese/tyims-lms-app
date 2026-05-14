import {
  pgTable,
  pgEnum,
  text,
  boolean,
  timestamp,
  integer,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const levelEnum = pgEnum("level", [
  "beginner",
  "intermediate",
  "advanced",
]);

export const courseStatusEnum = pgEnum("course_status", [
  "draft",
  "pending",
  "published",
  "archived",
]);

export const lessonTypeEnum = pgEnum("lesson_type", ["video", "text", "quiz"]);

export const lessonStatusEnum = pgEnum("lesson_status", [
  "processing",
  "ready",
]);

export const categories = pgTable("categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  icon: text("icon"),
  parentId: text("parent_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const courses = pgTable("courses", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  shortDescription: text("short_description"),
  whatYouLearn: text("what_you_learn").array(),
  requirements: text("requirements").array(),
  thumbnail: text("thumbnail"),
  promoVideoUrl: text("promo_video_url"),
  // Price stored in kobo (NGN × 100) — avoids floating-point issues
  price: integer("price").notNull().default(0),
  isFree: boolean("is_free").notNull().default(false),
  level: levelEnum("level").notNull().default("beginner"),
  language: text("language").notNull().default("English"),
  status: courseStatusEnum("status").notNull().default("draft"),
  instructorId: text("instructor_id")
    .notNull()
    .references(() => users.id),
  categoryId: text("category_id").references(() => categories.id),
  totalLessons: integer("total_lessons").notNull().default(0),
  totalDuration: integer("total_duration").notNull().default(0), // seconds
  totalStudents: integer("total_students").notNull().default(0),
  // Rating stored as integer × 100 (e.g. 4.5 → 450) to avoid floats
  averageRating: integer("average_rating").notNull().default(0),
  totalReviews: integer("total_reviews").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const courseSections = pgTable("course_sections", {
  id: text("id").primaryKey(),
  courseId: text("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const lessons = pgTable("lessons", {
  id: text("id").primaryKey(),
  sectionId: text("section_id")
    .notNull()
    .references(() => courseSections.id, { onDelete: "cascade" }),
  courseId: text("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  type: lessonTypeEnum("type").notNull().default("video"),
  content: text("content"),
  bunnyVideoId: text("bunny_video_id"),
  bunnyPlaybackUrl: text("bunny_playback_url"),
  duration: integer("duration").notNull().default(0), // seconds
  isPreview: boolean("is_preview").notNull().default(false),
  order: integer("order").notNull().default(0),
  status: lessonStatusEnum("status").notNull().default("ready"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Category = typeof categories.$inferSelect;
export type Course = typeof courses.$inferSelect;
export type NewCourse = typeof courses.$inferInsert;
export type CourseSection = typeof courseSections.$inferSelect;
export type Lesson = typeof lessons.$inferSelect;
export type NewLesson = typeof lessons.$inferInsert;
