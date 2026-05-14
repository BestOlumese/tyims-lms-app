import { pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";
import { users } from "./users";
import { courses } from "./courses";

export const wishlists = pgTable(
  "wishlists",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [unique("unique_wishlist").on(t.userId, t.courseId)]
);

export type Wishlist = typeof wishlists.$inferSelect;
