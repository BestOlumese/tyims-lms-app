import crypto from "crypto";

const PAYSTACK_BASE = "https://api.paystack.co";
const SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!;

async function paystackFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${PAYSTACK_BASE}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${SECRET_KEY}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(
      `Paystack API error [${res.status}]: ${error.message ?? "Unknown error"}`
    );
  }

  const data = await res.json();
  return data.data as T;
}

export type PaystackTransaction = {
  authorization_url: string;
  access_code: string;
  reference: string;
};

export type PaystackVerification = {
  status: string;
  reference: string;
  amount: number;
  metadata: Record<string, unknown>;
  customer: { email: string; id: number };
};

export type PaystackRecipient = {
  recipient_code: string;
  id: number;
};

export type PaystackTransfer = {
  transfer_code: string;
  id: number;
  status: string;
};

export const paystack = {
  /**
   * Initialize a payment transaction.
   * @param email - Customer email
   * @param amountKobo - Amount in kobo (NGN × 100)
   * @param reference - Unique transaction reference
   * @param metadata - Extra data (courseId, userId, etc.)
   * @param callbackUrl - Where to redirect after payment
   */
  async initializeTransaction(params: {
    email: string;
    amountKobo: number;
    reference: string;
    metadata?: Record<string, unknown>;
    callbackUrl?: string;
    planCode?: string;
  }): Promise<PaystackTransaction> {
    return paystackFetch("/transaction/initialize", {
      method: "POST",
      body: JSON.stringify({
        email: params.email,
        amount: params.amountKobo,
        reference: params.reference,
        metadata: params.metadata,
        callback_url:
          params.callbackUrl ??
          `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/paystack/callback`,
        plan: params.planCode,
      }),
    });
  },

  /** Verify a transaction by reference. Always verify webhooks server-side. */
  async verifyTransaction(reference: string): Promise<PaystackVerification> {
    return paystackFetch(`/transaction/verify/${encodeURIComponent(reference)}`);
  },

  /** Create a transfer recipient for instructor payouts (bank account). */
  async createRecipient(params: {
    name: string;
    accountNumber: string;
    bankCode: string;
  }): Promise<PaystackRecipient> {
    return paystackFetch("/transferrecipient", {
      method: "POST",
      body: JSON.stringify({
        type: "nuban",
        name: params.name,
        account_number: params.accountNumber,
        bank_code: params.bankCode,
        currency: "NGN",
      }),
    });
  },

  /** Initiate an NGN transfer to an instructor's bank account. */
  async initiateTransfer(params: {
    amountKobo: number;
    recipientCode: string;
    reason: string;
    reference: string;
  }): Promise<PaystackTransfer> {
    return paystackFetch("/transfer", {
      method: "POST",
      body: JSON.stringify({
        source: "balance",
        amount: params.amountKobo,
        recipient: params.recipientCode,
        reason: params.reason,
        reference: params.reference,
      }),
    });
  },

  /** Get list of Nigerian banks with their codes. */
  async getBanks(): Promise<Array<{ name: string; code: string }>> {
    return paystackFetch("/bank?currency=NGN&perPage=100");
  },

  /**
   * Verify a Paystack webhook signature.
   * CRITICAL — always call this before processing any webhook.
   */
  verifyWebhookSignature(body: string, signature: string): boolean {
    const hash = crypto
      .createHmac("sha512", SECRET_KEY)
      .update(body)
      .digest("hex");
    return hash === signature;
  },
};
