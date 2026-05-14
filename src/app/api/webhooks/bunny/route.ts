import { NextRequest, NextResponse } from "next/server";
import { inngest } from "@/lib/inngest/client";
import { db } from "@/lib/db";
import { lessons } from "@/lib/db/schema/courses";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  // Bunny.net sends a notification when video processing is complete.
  // Optionally verify a shared secret header if you configure one in Bunny dashboard.
  const body = await request.json() as {
    VideoGuid: string;
    Status: number; // 4 = finished, 5 = error
    Length: number;  // seconds
  };

  if (body.Status !== 4) {
    // Not finished (could be still processing or errored)
    return NextResponse.json({ received: true });
  }

  // Find the lesson that references this Bunny video ID
  const [lesson] = await db
    .select({ id: lessons.id, courseId: lessons.courseId, sectionId: lessons.sectionId })
    .from(lessons)
    .where(eq(lessons.bunnyVideoId, body.VideoGuid));

  if (!lesson) {
    // May arrive before our DB is updated — safe to ignore
    return NextResponse.json({ received: true });
  }

  // Fetch the course to get the instructorId
  const { courses } = await import("@/lib/db/schema/courses");
  const [course] = await db
    .select({ instructorId: courses.instructorId })
    .from(courses)
    .where(eq(courses.id, lesson.courseId));

  // Fire Inngest event — updates lesson status and notifies instructor
  await inngest.send({
    name: "video/processed",
    data: {
      videoId: body.VideoGuid,
      lessonId: lesson.id,
      courseId: lesson.courseId,
      instructorId: course?.instructorId ?? "",
      duration: body.Length,
    },
  });

  return NextResponse.json({ received: true });
}
