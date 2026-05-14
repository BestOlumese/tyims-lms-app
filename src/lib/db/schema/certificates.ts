import { pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";
import { users } from "./users";
import { courses } from "./courses";

export const certificates = pgTable(
  "certificates",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    // Public-facing unique ID for verification page (e.g. TYIMS-2024-ABC123)
    certificateNumber: text("certificate_number").notNull().unique(),
    issuedAt: timestamp("issued_at").notNull().defaultNow(),
    pdfUrl: text("pdf_url"),
  },
  (t) => [unique("unique_certificate").on(t.userId, t.courseId)]
);

export type Certificate = typeof certificates.$inferSelect;
