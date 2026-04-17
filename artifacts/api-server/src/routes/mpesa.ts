import { Router, type IRouter } from "express";
import { db, usersTable, transactionsTable, notificationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { InitiateDepositBody } from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.post("/mpesa/deposit", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;

  const parsed = InitiateDepositBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation error", message: parsed.error.message });
    return;
  }

  const { phone, amount } = parsed.data;

  const consumerKey = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
  const shortcode = process.env.MPESA_SHORTCODE || "174379";
  const passkey = process.env.MPESA_PASSKEY;
  const callbackUrl = process.env.MPESA_CALLBACK_URL || `${process.env.APP_URL || "https://chatterpay.replit.app"}/api/mpesa/callback`;

  if (!consumerKey || !consumerSecret || !passkey) {
    logger.warn("M-Pesa credentials not configured — simulating deposit");

    await db.update(usersTable)
      .set({ kshBalance: user.kshBalance + amount })
      .where(eq(usersTable.id, user.id));

    await db.insert(transactionsTable).values({
      userId: user.id,
      type: "deposit",
      amount,
      currency: "KSH",
      description: `M-Pesa deposit from ${phone} (simulated)`,
    });

    await db.insert(notificationsTable).values({
      userId: user.id,
      type: "payment_success",
      message: `Your wallet has been topped up with KSh ${amount}.`,
    });

    res.json({
      message: "Deposit successful (simulated — configure M-Pesa credentials for real payments)",
      responseDescription: "Simulated",
    });
    return;
  }

  try {
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, "").slice(0, 14);
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");

    const authRes = await fetch(
      `https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64")}`,
        },
      }
    );
    const authData = await authRes.json() as { access_token: string };

    const stkRes = await fetch(
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authData.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          BusinessShortCode: shortcode,
          Password: password,
          Timestamp: timestamp,
          TransactionType: "CustomerPayBillOnline",
          Amount: Math.round(amount),
          PartyA: phone,
          PartyB: shortcode,
          PhoneNumber: phone,
          CallBackURL: callbackUrl,
          AccountReference: `CP-${user.id}`,
          TransactionDesc: "ChatterPay Deposit",
        }),
      }
    );

    const stkData = await stkRes.json() as {
      CheckoutRequestID?: string;
      MerchantRequestID?: string;
      ResponseDescription?: string;
      ResponseCode?: string;
    };

    if (stkData.ResponseCode !== "0") {
      res.status(400).json({ error: "M-Pesa error", message: stkData.ResponseDescription || "STK push failed" });
      return;
    }

    await db.insert(transactionsTable).values({
      userId: user.id,
      type: "deposit",
      amount,
      currency: "KSH",
      description: `M-Pesa STK push - ${phone}`,
      mpesaCheckoutId: stkData.CheckoutRequestID,
    });

    res.json({
      checkoutRequestId: stkData.CheckoutRequestID,
      merchantRequestId: stkData.MerchantRequestID,
      responseDescription: stkData.ResponseDescription,
      message: "STK Push sent to your phone. Please complete the payment.",
    });
  } catch (err) {
    logger.error({ err }, "M-Pesa STK push error");
    res.status(500).json({ error: "M-Pesa request failed", message: "Could not initiate payment" });
  }
});

router.post("/mpesa/callback", async (req, res): Promise<void> => {
  try {
    const body = req.body;
    const stkCallback = body?.Body?.stkCallback;

    if (!stkCallback) {
      res.json({ message: "OK" });
      return;
    }

    const resultCode = stkCallback.ResultCode;
    const checkoutRequestId = stkCallback.CheckoutRequestID;

    if (resultCode === 0) {
      const metadata = stkCallback.CallbackMetadata?.Item || [];
      const amountItem = metadata.find((i: any) => i.Name === "Amount");
      const amount = amountItem?.Value || 0;

      const [tx] = await db.select().from(transactionsTable)
        .where(eq(transactionsTable.mpesaCheckoutId, checkoutRequestId));

      if (tx) {
        const [user] = await db.select().from(usersTable).where(eq(usersTable.id, tx.userId));
        if (user) {
          await db.update(usersTable)
            .set({ kshBalance: user.kshBalance + amount })
            .where(eq(usersTable.id, user.id));

          await db.insert(notificationsTable).values({
            userId: user.id,
            type: "payment_success",
            message: `Your M-Pesa payment of KSh ${amount} was successful. Wallet updated.`,
          });
        }
      }
    }
  } catch (err) {
    logger.error({ err }, "M-Pesa callback error");
  }

  res.json({ message: "OK" });
});

export default router;
