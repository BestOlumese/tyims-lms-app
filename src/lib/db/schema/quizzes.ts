import {
  pgTable,
  pgEnum,
  text,
  boolean,
  timestamp,
  integer,
  jsonb,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { courses, lessons } from "./courses";

export const questionTypeEnum = pgEnum("question_type", [
  "mcq",
  "true_false",
  "text",
]);

export const quizzes = pgTable("quizzes", {
  id: text("id").primaryKey(),
  courseId: text("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  lessonId: text("lesson_id").references(() => lessons.id, {
    onDelete: "cascade",
  }),
  title: text("title").notNull(),
  description: text("description"),
  passingScore: integer("passing_score").notNull().default(70), // percentage
  timeLimit: integer("time_limit"), // minutes — null means no limit
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const quizQuestions = pgTable("quiz_questions", {
  id: text("id").primaryKey(),
  quizId: text("quiz_id")
    .notNull()
    .references(() => quizzes.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
  type: questionTypeEnum("type").notNull().default("mcq"),
  options: jsonb("options").$type<string[]>(),
  correctAnswer: text("correct_answer").notNull(),
  explanation: text("explanation"),
  order: integer("order").notNull().default(0),
});

export const quizAttempts = pgTable("quiz_attempts", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  quizId: text("quiz_id")
    .notNull()
    .references(() => quizzes.id, { onDelete: "cascade" }),
  answers: jsonb("answers")
    .notNull()
    .$type<Record<string, string>>(),
  score: integer("score").notNull().default(0), // percentage
  isPassed: boolean("is_passed").notNull().default(false),
  completedAt: timestamp("completed_at").notNull().defaultNow(),
});

export type Quiz = typeof quizzes.$inferSelect;
export type QuizQuestion = typeof quizQuestions.$inferSelect;
export type QuizAttempt = typeof quizAttempts.$inferSelect;
