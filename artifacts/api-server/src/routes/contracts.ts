import { Router, type IRouter } from "express";
import { db, contractsTable, usersTable, transactionsTable, notificationsTable } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { CreateContractBody } from "@workspace/api-zod";

const router: IRouter = Router();

const CONTRACT_COST_KSH = 200;
const CONTRACT_DURATION_HOURS = 24;
const CONTRACT_MAX_CLIENTS = 5;

router.get("/contracts", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const contracts = await db.select().from(contractsTable)
    .where(eq(contractsTable.userId, user.id))
    .orderBy(contractsTable.createdAt);
  res.json(contracts);
});

router.get("/contracts/active", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const now = new Date();

  const [active] = await db.select().from(contractsTable)
    .where(and(
      eq(contractsTable.userId, user.id),
      eq(contractsTable.isActive, true),
      gt(contractsTable.expiresAt, now)
    ));

  if (!active) {
    res.status(404).json({ error: "No active contract" });
    return;
  }

  res.json(active);
});

router.post("/contracts", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;

  const parsed = CreateContractBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation error", message: parsed.error.message });
    return;
  }

  if (user.kshBalance < CONTRACT_COST_KSH) {
    res.status(400).json({ error: "Insufficient balance", message: `You need KSh ${CONTRACT_COST_KSH} to buy a contract. Current balance: KSh ${user.kshBalance}` });
    return;
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + CONTRACT_DURATION_HOURS * 60 * 60 * 1000);

  await db.update(contractsTable)
    .set({ isActive: false })
    .where(and(eq(contractsTable.userId, user.id), eq(contractsTable.isActive, true)));

  const [contract] = await db.insert(contractsTable).values({
    userId: user.id,
    plan: "24h",
    costKsh: CONTRACT_COST_KSH,
    maxClients: CONTRACT_MAX_CLIENTS,
    isActive: true,
    expiresAt,
  }).returning();

  await db.update(usersTable)
    .set({ kshBalance: user.kshBalance - CONTRACT_COST_KSH })
    .where(eq(usersTable.id, user.id));

  await db.insert(transactionsTable).values({
    userId: user.id,
    type: "contract_purchase",
    amount: CONTRACT_COST_KSH,
    currency: "KSH",
    description: "24-hour chat contract",
  });

  await db.insert(notificationsTable).values({
    userId: user.id,
    type: "contract_activated",
    message: `Your 24-hour contract has been activated. You can now chat with up to ${CONTRACT_MAX_CLIENTS} foreign clients.`,
  });

  res.status(201).json(contract);
});

export default router;
