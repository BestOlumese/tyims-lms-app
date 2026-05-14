import { inngest } from "../client";
import { db } from "@/lib/db";
import { certificates } from "@/lib/db/schema/certificates";
import { courses } from "@/lib/db/schema/courses";
import { users } from "@/lib/db/schema/users";
import { sendEmail, emailTemplates } from "@/lib/email";
import { eq } from "drizzle-orm";

function generateCertificateNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TYIMS-${year}-${random}`;
}

export const onCourseCompleted = inngest.createFunction(
  {
    id: "on-course-completed",
    name: "Issue Certificate on Course Completion",
    triggers: [{ event: "course/completed" as const }],
  },
  async ({ event, step }) => {
    const { userId, courseId } = event.data as {
      userId: string;
      courseId: string;
      enrollmentId: string;
    };

    const certificate = await step.run("create-certificate-record", async () => {
      const id = crypto.randomUUID();
      const certificateNumber = generateCertificateNumber();

      const [cert] = await db
        .insert(certificates)
        .values({ id, userId, courseId, certificateNumber })
        .onConflictDoNothing()
        .returning();

      return cert;
    });

    if (!certificate) {
      return { skipped: true };
    }

    // TODO: Generate PDF with @react-pdf/renderer and upload to Bunny.net CDN
    // const pdfBuffer = await step.run("generate-pdf", () => generateCertificatePdf(...));
    // const pdfUrl = await step.run("upload-pdf", () => bunny.uploadToStorage(...));

    await step.run("send-certificate-email", async () => {
      const [user] = await db
        .select({ name: users.name, email: users.email })
        .from(users)
        .where(eq(users.id, userId));

      const [course] = await db
        .select({ title: courses.title })
        .from(courses)
        .where(eq(courses.id, courseId));

      if (!user || !course) return;

      const certUrl = `${process.env.NEXT_PUBLIC_APP_URL}/certificate/verify/${certificate.certificateNumber}`;

      const template = emailTemplates.certificateIssued({
        userName: user.name,
        courseTitle: course.title,
        certificateUrl: certUrl,
      });

      await sendEmail({ to: user.email, ...template });
    });

    return { certificateNumber: certificate.certificateNumber };
  }
);
