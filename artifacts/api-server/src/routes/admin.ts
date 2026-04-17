import { Router, type IRouter } from "express";
import { db, usersTable, contractsTable, transactionsTable, messagesTable, withdrawalsTable } from "@workspace/db";
import { eq, count, sum, and, gt } from "drizzle-orm";
import { requireAdmin } from "../lib/auth";

const router: IRouter = Router();

router.get("/admin/dashboard", requireAdmin, async (req, res): Promise<void> => {
  const now = new Date();

  const totalUsersResult = await db.select({ count: count() }).from(usersTable).where(eq(usersTable.role, "user"));
  const totalFCResult = await db.select({ count: count() }).from(usersTable).where(eq(usersTable.role, "foreign_client"));
  const activeContractsResult = await db.select({ count: count() }).from(contractsTable)
    .where(and(eq(contractsTable.isActive, true), gt(contractsTable.expiresAt, now)));
  const totalDepositsResult = await db.select({ total: sum(transactionsTable.amount) }).from(transactionsTable)
    .where(eq(transactionsTable.type, "deposit"));
  const totalEarningsResult = await db.select({ total: sum(transactionsTable.amount) }).from(transactionsTable)
    .where(eq(transactionsTable.type, "earning"));
  const pendingWithdrawalsResult = await db.select({ count: count() }).from(withdrawalsTable)
    .where(eq(withdrawalsTable.status, "pending"));
  const totalMessagesResult = await db.select({ count: count() }).from(messagesTable);

  const recentUsersRaw = await db.select().from(usersTable)
    .where(eq(usersTable.role, "user"))
    .orderBy(usersTable.createdAt)
    .limit(5);

  const recentUsers = recentUsersRaw.map(u => ({
    id: u.id,
    username: u.username,
    email: u.email,
    phone: u.phone,
    kshBalance: u.kshBalance,
    usdtBalance: u.usdtBalance,
    isBanned: u.isBanned,
    createdAt: u.createdAt,
    assignedClientsCount: 0,
    hasActiveContract: false,
  }));

  res.json({
    totalUsers: totalUsersResult[0]?.count ?? 0,
    totalForeignClients: totalFCResult[0]?.count ?? 0,
    activeContracts: activeContractsResult[0]?.count ?? 0,
    totalDepositsKsh: Number(totalDepositsResult[0]?.total ?? 0),
    totalEarningsUsdt: Number(totalEarningsResult[0]?.total ?? 0),
    pendingWithdrawals: pendingWithdrawalsResult[0]?.count ?? 0,
    totalMessages: totalMessagesResult[0]?.count ?? 0,
    recentUsers,
  });
});

router.get("/admin/chat-logs", requireAdmin, async (req, res): Promise<void> => {
  const messages = await db.select().from(messagesTable)
    .orderBy(messagesTable.createdAt);
  res.json(messages);
});

export default router;
