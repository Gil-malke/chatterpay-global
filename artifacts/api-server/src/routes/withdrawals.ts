import { Router, type IRouter } from "express";
import { db, withdrawalsTable, usersTable, notificationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../lib/auth";
import { RequestWithdrawalBody, ApproveWithdrawalParams, RejectWithdrawalParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/withdrawals", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;

  let withdrawals;
  if (user.role === "admin") {
    const rawWithdrawals = await db.select().from(withdrawalsTable).orderBy(withdrawalsTable.createdAt);
    const result = await Promise.all(rawWithdrawals.map(async (w) => {
      const [u] = await db.select().from(usersTable).where(eq(usersTable.id, w.userId));
      return { ...w, username: u?.username };
    }));
    withdrawals = result;
  } else {
    const rawWithdrawals = await db.select().from(withdrawalsTable)
      .where(eq(withdrawalsTable.userId, user.id))
      .orderBy(withdrawalsTable.createdAt);
    withdrawals = rawWithdrawals.map(w => ({ ...w, username: user.username }));
  }

  res.json(withdrawals);
});

router.post("/withdrawals", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;

  const parsed = RequestWithdrawalBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation error", message: parsed.error.message });
    return;
  }

  const { amount, currency, phone } = parsed.data;

  if (currency === "KSH" && user.kshBalance < amount) {
    res.status(400).json({ error: "Insufficient balance", message: `KSh balance insufficient. Available: KSh ${user.kshBalance}` });
    return;
  }

  if (currency === "USDT" && user.usdtBalance < amount) {
    res.status(400).json({ error: "Insufficient balance", message: `USDT balance insufficient. Available: ${user.usdtBalance} USDT` });
    return;
  }

  if (currency === "KSH") {
    await db.update(usersTable)
      .set({ kshBalance: user.kshBalance - amount })
      .where(eq(usersTable.id, user.id));
  } else {
    await db.update(usersTable)
      .set({ usdtBalance: user.usdtBalance - amount })
      .where(eq(usersTable.id, user.id));
  }

  const [withdrawal] = await db.insert(withdrawalsTable).values({
    userId: user.id,
    amount,
    currency,
    phone,
    status: "pending",
  }).returning();

  res.status(201).json({ ...withdrawal, username: user.username });
});

router.post("/withdrawals/:withdrawalId/approve", requireAdmin, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.withdrawalId) ? req.params.withdrawalId[0] : req.params.withdrawalId;
  const withdrawalId = parseInt(rawId, 10);

  const params = ApproveWithdrawalParams.safeParse({ withdrawalId });
  if (!params.success) {
    res.status(400).json({ error: "Invalid withdrawal ID" });
    return;
  }

  const [withdrawal] = await db.update(withdrawalsTable)
    .set({ status: "approved" })
    .where(eq(withdrawalsTable.id, withdrawalId))
    .returning();

  if (!withdrawal) {
    res.status(404).json({ error: "Withdrawal not found" });
    return;
  }

  await db.insert(notificationsTable).values({
    userId: withdrawal.userId,
    type: "withdrawal_approved",
    message: `Your withdrawal of ${withdrawal.amount} ${withdrawal.currency} has been approved.`,
  });

  const [u] = await db.select().from(usersTable).where(eq(usersTable.id, withdrawal.userId));
  res.json({ ...withdrawal, username: u?.username });
});

router.post("/withdrawals/:withdrawalId/reject", requireAdmin, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.withdrawalId) ? req.params.withdrawalId[0] : req.params.withdrawalId;
  const withdrawalId = parseInt(rawId, 10);

  const params = RejectWithdrawalParams.safeParse({ withdrawalId });
  if (!params.success) {
    res.status(400).json({ error: "Invalid withdrawal ID" });
    return;
  }

  const [withdrawal] = await db.update(withdrawalsTable)
    .set({ status: "rejected" })
    .where(eq(withdrawalsTable.id, withdrawalId))
    .returning();

  if (!withdrawal) {
    res.status(404).json({ error: "Withdrawal not found" });
    return;
  }

  const [u] = await db.select().from(usersTable).where(eq(usersTable.id, withdrawal.userId));
  if (u) {
    if (withdrawal.currency === "KSH") {
      await db.update(usersTable)
        .set({ kshBalance: u.kshBalance + withdrawal.amount })
        .where(eq(usersTable.id, u.id));
    } else {
      await db.update(usersTable)
        .set({ usdtBalance: u.usdtBalance + withdrawal.amount })
        .where(eq(usersTable.id, u.id));
    }

    await db.insert(notificationsTable).values({
      userId: withdrawal.userId,
      type: "withdrawal_rejected",
      message: `Your withdrawal of ${withdrawal.amount} ${withdrawal.currency} was rejected. The amount has been returned to your wallet.`,
    });
  }

  res.json({ ...withdrawal, username: u?.username });
});

export default router;
