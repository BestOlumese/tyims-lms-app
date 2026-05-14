import {
  pgTable,
  pgEnum,
  text,
  timestamp,
  integer,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { courses } from "./courses";

export const liveClassStatusEnum = pgEnum("live_class_status", [
  "scheduled",
  "live",
  "ended",
  "cancelled",
]);

export const liveClasses = pgTable("live_classes", {
  id: text("id").primaryKey(),
  courseId: text("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  instructorId: text("instructor_id")
    .notNull()
    .references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  scheduledAt: timestamp("scheduled_at").notNull(),
  // Daily.co room identifiers
  dailyRoomName: text("daily_room_name"),
  dailyRoomUrl: text("daily_room_url"),
  status: liveClassStatusEnum("status").notNull().default("scheduled"),
  recordingUrl: text("recording_url"),
  maxParticipants: integer("max_participants").default(100),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type LiveClass = typeof liveClasses.$inferSelect;
export type NewLiveClass = typeof liveClasses.$inferInsert;
