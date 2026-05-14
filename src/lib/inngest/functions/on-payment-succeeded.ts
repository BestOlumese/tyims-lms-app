import { inngest } from "../client";
import { db } from "@/lib/db";
import { enrollments } from "@/lib/db/schema/enrollments";
import { instructorEarnings } from "@/lib/db/schema/payments";
import { courses } from "@/lib/db/schema/courses";
import { users } from "@/lib/db/schema/users";
import { sendEmail, emailTemplates } from "@/lib/email";
import { eq } from "drizzle-orm";

const PLATFORM_FEE_PERCENT = 30;

export const onPaymentSucceeded = inngest.createFunction(
  {
    id: "on-payment-succeeded",
    name: "Handle Payment Succeeded",
    triggers: [{ event: "payment/succeeded" as const }],
  },
  async ({ event, step }) => {
    const { paymentId, userId, courseId, amount, type } = event.data as {
      paymentId: string;
      userId: string;
      courseId: string | null;
      amount: number;
      type: "course" | "subscription";
    };

    if (type !== "course" || !courseId) return;

    const enrollment = await step.run("create-enrollment", async () => {
      const id = crypto.randomUUID();
      const [record] = await db
        .insert(enrollments)
        .values({ id, userId, courseId })
        .onConflictDoNothing()
        .returning();
      return record;
    });

    await step.run("record-instructor-earnings", async () => {
      const [course] = await db
        .select({ instructorId: courses.instructorId })
        .from(courses)
        .where(eq(courses.id, courseId));

      if (!course) return;

      const platformFee = Math.round((amount * PLATFORM_FEE_PERCENT) / 100);
      const netAmount = amount - platformFee;

      await db.insert(instructorEarnings).values({
        id: crypto.randomUUID(),
        instructorId: course.instructorId,
        paymentId,
        grossAmount: amount,
        platformFee,
        netAmount,
      });
    });

    await step.run("send-confirmation-email", async () => {
      const [user] = await db
        .select({ name: users.name, email: users.email })
        .from(users)
        .where(eq(users.id, userId));

      const [course] = await db
        .select({ title: courses.title })
        .from(courses)
        .where(eq(courses.id, courseId));

      if (!user || !course) return;

      const template = emailTemplates.enrollmentConfirmation({
        userName: user.name,
        courseTitle: course.title,
        courseUrl: `${process.env.NEXT_PUBLIC_APP_URL}/learn/${courseId}`,
      });

      await sendEmail({ to: user.email, ...template });
    });

    return { enrollmentId: enrollment?.id };
  }
);
