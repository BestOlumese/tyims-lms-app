import { inngest } from "../client";
import { db } from "@/lib/db";
import { payoutRequests } from "@/lib/db/schema/payments";
import { instructorProfiles } from "@/lib/db/schema/users";
import { users } from "@/lib/db/schema/users";
import { paystack } from "@/lib/paystack";
import { sendEmail, emailTemplates } from "@/lib/email";
import { eq } from "drizzle-orm";

export const onPayoutRequested = inngest.createFunction(
  {
    id: "on-payout-requested",
    name: "Process Instructor Payout",
    // Retry up to 3 times with exponential backoff on failure
    retries: 3,
  },
  { event: "payout/requested" },
  async ({ event, step }) => {
    const { payoutRequestId, instructorId, amount } = event.data;

    // Fetch recipient code from instructor profile
    const profile = await step.run("fetch-instructor-profile", async () => {
      const [p] = await db
        .select()
        .from(instructorProfiles)
        .where(eq(instructorProfiles.userId, instructorId));
      return p;
    });

    if (!profile?.paystackRecipientCode) {
      await db
        .update(payoutRequests)
        .set({
          status: "failed",
          failureReason: "Instructor has no Paystack recipient code set up",
        })
        .where(eq(payoutRequests.id, payoutRequestId));
      return { error: "No recipient code" };
    }

    // Initiate the Paystack transfer
    const transfer = await step.run("initiate-transfer", async () => {
      return paystack.initiateTransfer({
        amountKobo: amount,
        recipientCode: profile.paystackRecipientCode!,
        reason: "TYIMS Instructor Earnings Payout",
        reference: payoutRequestId,
      });
    });

    // Update the payout request with transfer details
    await step.run("update-payout-record", async () => {
      await db
        .update(payoutRequests)
        .set({
          status: "completed",
          paystackTransferCode: transfer.transfer_code,
          completedAt: new Date(),
        })
        .where(eq(payoutRequests.id, payoutRequestId));
    });

    // Notify instructor by email
    await step.run("notify-instructor", async () => {
      const [instructor] = await db
        .select({ name: users.name, email: users.email })
        .from(users)
        .where(eq(users.id, instructorId));

      if (!instructor) return;

      const template = emailTemplates.payoutProcessed({
        instructorName: instructor.name,
        amountNGN: Math.round(amount / 100),
      });

      await sendEmail({ to: instructor.email, ...template });
    });

    return { transferCode: transfer.transfer_code };
  }
);
