import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "tyims-lms",
  name: "TYIMS LMS",
  eventKey: process.env.INNGEST_EVENT_KEY,
});

// Typed event map — add a new type here when you add a new event
export type Events = {
  "video/processed": {
    data: {
      videoId: string;
      lessonId: string;
      courseId: string;
      instructorId: string;
      duration: number;
    };
  };
  "payment/succeeded": {
    data: {
      paymentId: string;
      userId: string;
      courseId: string | null;
      amount: number;
      type: "course" | "subscription";
    };
  };
  "course/completed": {
    data: {
      userId: string;
      courseId: string;
      enrollmentId: string;
    };
  };
  "payout/requested": {
    data: {
      payoutRequestId: string;
      instructorId: string;
      amount: number;
    };
  };
  "subscription/created": {
    data: {
      subscriptionId: string;
      userId: string;
      planId: string;
    };
  };
  "subscription/cancelled": {
    data: {
      subscriptionId: string;
      userId: string;
    };
  };
};
