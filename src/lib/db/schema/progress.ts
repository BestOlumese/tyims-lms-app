import {
  pgTable,
  text,
  boolean,
  timestamp,
  integer,
  unique,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { lessons, courses } from "./courses";

export const lessonProgress = pgTable(
  "lesson_progress",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    lessonId: text("lesson_id")
      .notNull()
      .references(() => lessons.id, { onDelete: "cascade" }),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    isCompleted: boolean("is_completed").notNull().default(false),
    watchedSeconds: integer("watched_seconds").notNull().default(0),
    lastWatchedAt: timestamp("last_watched_at").notNull().defaultNow(),
  },
  (t) => [unique("unique_lesson_progress").on(t.userId, t.lessonId)]
);

export type LessonProgress = typeof lessonProgress.$inferSelect;
