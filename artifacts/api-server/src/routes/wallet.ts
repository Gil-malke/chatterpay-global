import { Router, type IRouter } from "express";
import { db, usersTable, transactionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.get("/wallet", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;
  res.json({
    kshBalance: user.kshBalance,
    usdtBalance: user.usdtBalance,
    userId: user.id,
  });
});

router.get("/wallet/transactions", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const transactions = await db.select().from(transactionsTable)
    .where(eq(transactionsTable.userId, user.id))
    .orderBy(transactionsTable.createdAt);
  res.json(transactions);
});

export default router;
