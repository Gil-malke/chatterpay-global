import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable, assignmentsTable } from "@workspace/db";
import { eq, and, count } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../lib/auth";
import { CreateForeignClientBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/foreign-clients", requireAdmin, async (req, res): Promise<void> => {
  const clients = await db.select().from(usersTable).where(eq(usersTable.role, "foreign_client"));

  const result = await Promise.all(clients.map(async (client) => {
    const usersCount = await db.select({ count: count() }).from(assignmentsTable)
      .where(eq(assignmentsTable.foreignClientId, client.id));

    return {
      id: client.id,
      username: client.username,
      usdtBalance: client.usdtBalance,
      country: client.country,
      isOnline: client.isOnline,
      createdAt: client.createdAt,
      assignedUsersCount: usersCount[0]?.count ?? 0,
    };
  }));

  res.json(result);
});

router.post("/foreign-clients", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateForeignClientBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation error", message: parsed.error.message });
    return;
  }

  const { username, password, usdtBalance, country } = parsed.data;

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.username, username));
  if (existing) {
    res.status(400).json({ error: "Conflict", message: "Username already taken" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const [client] = await db.insert(usersTable).values({
    username,
    passwordHash,
    role: "foreign_client",
    kshBalance: 0,
    usdtBalance: usdtBalance ?? 0,
    country,
  }).returning();

  res.status(201).json({
    id: client.id,
    username: client.username,
    usdtBalance: client.usdtBalance,
    country: client.country,
    isOnline: client.isOnline,
    createdAt: client.createdAt,
    assignedUsersCount: 0,
  });
});

router.get("/foreign-clients/:clientId", requireAuth, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.clientId) ? req.params.clientId[0] : req.params.clientId;
  const clientId = parseInt(rawId, 10);

  const [client] = await db.select().from(usersTable)
    .where(and(eq(usersTable.id, clientId), eq(usersTable.role, "foreign_client")));

  if (!client) {
    res.status(404).json({ error: "Foreign client not found" });
    return;
  }

  const usersCount = await db.select({ count: count() }).from(assignmentsTable)
    .where(eq(assignmentsTable.foreignClientId, clientId));

  res.json({
    id: client.id,
    username: client.username,
    usdtBalance: client.usdtBalance,
    country: client.country,
    isOnline: client.isOnline,
    createdAt: client.createdAt,
    assignedUsersCount: usersCount[0]?.count ?? 0,
  });
});

export default router;
