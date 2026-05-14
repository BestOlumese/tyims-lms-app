import { inngest } from "../client";
import { db } from "@/lib/db";
import { lessons } from "@/lib/db/schema/courses";
import { users } from "@/lib/db/schema/users";
import { sendEmail, emailTemplates } from "@/lib/email";
import { eq } from "drizzle-orm";

export const onVideoProcessed = inngest.createFunction(
  {
    id: "on-video-processed",
    name: "Handle Video Processed",
    triggers: [{ event: "video/processed" as const }],
  },
  async ({ event, step }) => {
    const { videoId, lessonId, duration, instructorId } = event.data as {
      videoId: string;
      lessonId: string;
      courseId: string;
      instructorId: string;
      duration: number;
    };

    const updatedLesson = await step.run("update-lesson-status", async () => {
      const [lesson] = await db
        .update(lessons)
        .set({ status: "ready", duration })
        .where(eq(lessons.id, lessonId))
        .returning();
      return lesson;
    });

    await step.run("notify-instructor", async () => {
      const [instructor] = await db
        .select({ name: users.name, email: users.email })
        .from(users)
        .where(eq(users.id, instructorId));

      if (!instructor) return;

      const template = emailTemplates.videoProcessed({
        instructorName: instructor.name,
        lessonTitle: updatedLesson?.title ?? "Your lesson",
        courseUrl: `${process.env.NEXT_PUBLIC_APP_URL}/instructor/courses/${(event.data as { courseId: string }).courseId}/curriculum`,
      });

      await sendEmail({ to: instructor.email, ...template });
    });

    return { lessonId, status: "ready" };
  }
);
