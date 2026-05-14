import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import {
  onVideoProcessed,
  onPaymentSucceeded,
  onCourseCompleted,
  onPayoutRequested,
} from "@/lib/inngest";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    onVideoProcessed,
    onPaymentSucceeded,
    onCourseCompleted,
    onPayoutRequested,
  ],
});
