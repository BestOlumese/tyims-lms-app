import { NextRequest, NextResponse } from "next/server";
import { paystack } from "@/lib/paystack";
import { inngest } from "@/lib/inngest/client";
import { db } from "@/lib/db";
import { payments, subscriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("x-paystack-signature") ?? "";

  // CRITICAL: Always verify the webhook signature before processing
  if (!paystack.verifyWebhookSignature(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(body) as {
    event: string;
    data: Record<string, unknown>;
  };

  try {
    switch (event.event) {
      case "charge.success": {
        const txData = event.data as {
          reference: string;
          amount: number;
          status: string;
        };

        // Verify with Paystack directly — never trust webhook data alone
        const verified = await paystack.verifyTransaction(txData.reference);

        if (verified.status !== "success") break;

        // Update payment record to succeeded
        const [payment] = await db
          .update(payments)
          .set({ status: "success", paystackTxId: String(verified.customer.id) })
          .where(eq(payments.paystackReference, txData.reference))
          .returning();

        if (!payment) break;

        // Fire Inngest event to handle enrollment + earnings + email
        await inngest.send({
          name: "payment/succeeded",
          data: {
            paymentId: payment.id,
            userId: payment.userId,
            courseId: payment.courseId ?? null,
            amount: payment.amount,
            type: payment.type,
          },
        });
        break;
      }

      case "subscription.create": {
        // Paystack subscription activated — update subscription status
        const subData = event.data as {
          subscription_code: string;
          email_token: string;
          next_payment_date: string;
        };

        await db
          .update(subscriptions)
          .set({
            status: "active",
            paystackSubscriptionCode: subData.subscription_code,
            paystackEmailToken: subData.email_token,
          })
          .where(
            eq(
              subscriptions.paystackSubscriptionCode,
              subData.subscription_code
            )
          );
        break;
      }

      case "subscription.disable": {
        const subData = event.data as { subscription_code: string };
        await db
          .update(subscriptions)
          .set({ status: "cancelled", cancelledAt: new Date() })
          .where(
            eq(
              subscriptions.paystackSubscriptionCode,
              subData.subscription_code
            )
          );
        break;
      }

      case "transfer.success": {
        // Payout transfer confirmed — handled by Inngest function
        break;
      }

      case "transfer.failed": {
        const transferData = event.data as {
          reference: string;
          reason: string;
        };
        console.error(
          `Paystack transfer failed for reference ${transferData.reference}: ${transferData.reason}`
        );
        break;
      }

      default:
        // Unhandled event type — log and ignore
        break;
    }
  } catch (error) {
    console.error("Paystack webhook processing error:", error);
    // Return 200 so Paystack doesn't retry — log the error for investigation
    return NextResponse.json({ received: true }, { status: 200 });
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
