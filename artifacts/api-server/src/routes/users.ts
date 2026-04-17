import { Router, type IRouter } from "express";
import { db, usersTable, contractsTable, assignmentsTable } from "@workspace/db";
import { eq, count, and, gt } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../lib/auth";
import { BanUserBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/users", requireAdmin, async (req, res): Promise<void> => {
  const users = await db.select().from(usersTable).where(eq(usersTable.role, "user"));

  const now = new Date();
  const result = await Promise.all(users.map(async (user) => {
    const [activeContract] = await db.select().from(contractsTable)
      .where(and(eq(contractsTable.userId, user.id), eq(contractsTable.isActive, true), gt(contractsTable.expiresAt, now)));

    const clientsCount = await db.select({ count: count() }).from(assignmentsTable)
      .where(eq(assignmentsTable.userId, user.id));

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      kshBalance: user.kshBalance,
      usdtBalance: user.usdtBalance,
      isBanned: user.isBanned,
      createdAt: user.createdAt,
      assignedClientsCount: clientsCount[0]?.count ?? 0,
      hasActiveContract: !!activeContract,
    };
  }));

  res.json(result);
});

router.get("/users/:userId", requireAuth, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
  const userId = parseInt(rawId, 10);

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const now = new Date();
  const [activeContract] = await db.select().from(contractsTable)
    .where(and(eq(contractsTable.userId, userId), eq(contractsTable.isActive, true), gt(contractsTable.expiresAt, now)));

  const clientsCount = await db.select({ count: count() }).from(assignmentsTable)
    .where(eq(assignmentsTable.userId, userId));

  res.json({
    id: user.id,
    username: user.username,
    email: user.email,
    phone: user.phone,
    kshBalance: user.kshBalance,
    usdtBalance: user.usdtBalance,
    isBanned: user.isBanned,
    createdAt: user.createdAt,
    assignedClientsCount: clientsCount[0]?.count ?? 0,
    hasActiveContract: !!activeContract,
  });
});

router.post("/users/:userId/ban", requireAdmin, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
  const userId = parseInt(rawId, 10);

  const parsed = BanUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation error", message: parsed.error.message });
    return;
  }

  const [user] = await db.update(usersTable)
    .set({ isBanned: parsed.data.banned })
    .where(eq(usersTable.id, userId))
    .returning();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const now = new Date();
  const [activeContract] = await db.select().from(contractsTable)
    .where(and(eq(contractsTable.userId, userId), eq(contractsTable.isActive, true), gt(contractsTable.expiresAt, now)));

  const clientsCount = await db.select({ count: count() }).from(assignmentsTable)
    .where(eq(assignmentsTable.userId, userId));

  res.json({
    id: user.id,
    username: user.username,
    email: user.email,
    phone: user.phone,
    kshBalance: user.kshBalance,
    usdtBalance: user.usdtBalance,
    isBanned: user.isBanned,
    createdAt: user.createdAt,
    assignedClientsCount: clientsCount[0]?.count ?? 0,
    hasActiveContract: !!activeContract,
  });
});

export default router;
