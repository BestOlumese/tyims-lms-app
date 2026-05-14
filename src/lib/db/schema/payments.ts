import {
  pgTable,
  pgEnum,
  text,
  timestamp,
  integer,
  jsonb,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { courses } from "./courses";

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "success",
  "failed",
  "refunded",
]);

export const paymentTypeEnum = pgEnum("payment_type", [
  "course",
  "subscription",
]);

export const earningStatusEnum = pgEnum("earning_status", [
  "pending",
  "paid",
]);

export const payoutStatusEnum = pgEnum("payout_status", [
  "pending",
  "approved",
  "completed",
  "failed",
]);

export const payments = pgTable("payments", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  courseId: text("course_id").references(() => courses.id),
  // All amounts in kobo (NGN × 100) — never use floats for money
  amount: integer("amount").notNull(),
  paystackReference: text("paystack_reference").notNull().unique(),
  paystackTxId: text("paystack_tx_id"),
  status: paymentStatusEnum("status").notNull().default("pending"),
  type: paymentTypeEnum("type").notNull().default("course"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const instructorEarnings = pgTable("instructor_earnings", {
  id: text("id").primaryKey(),
  instructorId: text("instructor_id")
    .notNull()
    .references(() => users.id),
  paymentId: text("payment_id")
    .notNull()
    .references(() => payments.id),
  grossAmount: integer("gross_amount").notNull(), // kobo
  platformFee: integer("platform_fee").notNull(), // kobo — 30% default
  netAmount: integer("net_amount").notNull(), // kobo — 70% to instructor
  status: earningStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const payoutRequests = pgTable("payout_requests", {
  id: text("id").primaryKey(),
  instructorId: text("instructor_id")
    .notNull()
    .references(() => users.id),
  amount: integer("amount").notNull(), // kobo
  paystackTransferCode: text("paystack_transfer_code"),
  paystackRecipientCode: text("paystack_recipient_code"),
  status: payoutStatusEnum("status").notNull().default("pending"),
  failureReason: text("failure_reason"),
  initiatedAt: timestamp("initiated_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
export type InstructorEarning = typeof instructorEarnings.$inferSelect;
export type PayoutRequest = typeof payoutRequests.$inferSelect;
