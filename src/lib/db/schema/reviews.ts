import {
  pgTable,
  text,
  boolean,
  timestamp,
  integer,
  unique,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { courses } from "./courses";

export const reviews = pgTable(
  "reviews",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(), // 1–5
    comment: text("comment"),
    isApproved: boolean("is_approved").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [unique("unique_review").on(t.userId, t.courseId)]
);

export type Review = typeof reviews.$inferSelect;
