import { Router, type IRouter } from "express";
import { db, assignmentsTable, usersTable, contractsTable, chatRoomsTable, notificationsTable } from "@workspace/db";
import { eq, and, gt, count } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../lib/auth";
import { CreateAssignmentBody, DeleteAssignmentParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/assignments", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;

  let assignments;
  if (user.role === "admin") {
    assignments = await db.select().from(assignmentsTable);
  } else if (user.role === "foreign_client") {
    assignments = await db.select().from(assignmentsTable)
      .where(eq(assignmentsTable.foreignClientId, user.id));
  } else {
    assignments = await db.select().from(assignmentsTable)
      .where(eq(assignmentsTable.userId, user.id));
  }

  const result = await Promise.all(assignments.map(async (a) => {
    const [u] = await db.select().from(usersTable).where(eq(usersTable.id, a.userId));
    const [fc] = await db.select().from(usersTable).where(eq(usersTable.id, a.foreignClientId));

    const now = new Date();
    const [activeContract] = await db.select().from(contractsTable)
      .where(and(eq(contractsTable.userId, a.userId), eq(contractsTable.isActive, true), gt(contractsTable.expiresAt, now)));

    const [room] = a.chatRoomId ? await db.select().from(chatRoomsTable).where(eq(chatRoomsTable.id, a.chatRoomId)) : [undefined];

    const fcUsersCount = await db.select({ count: count() }).from(assignmentsTable).where(eq(assignmentsTable.foreignClientId, a.foreignClientId));
    const uClientsCount = await db.select({ count: count() }).from(assignmentsTable).where(eq(assignmentsTable.userId, a.userId));

    return {
      id: a.id,
      userId: a.userId,
      foreignClientId: a.foreignClientId,
      assignedAt: a.assignedAt,
      chatRoomId: a.chatRoomId,
      user: u ? {
        id: u.id,
        username: u.username,
        email: u.email,
        phone: u.phone,
        kshBalance: u.kshBalance,
        usdtBalance: u.usdtBalance,
        isBanned: u.isBanned,
        createdAt: u.createdAt,
        assignedClientsCount: uClientsCount[0]?.count ?? 0,
        hasActiveContract: !!activeContract,
      } : undefined,
      foreignClient: fc ? {
        id: fc.id,
        username: fc.username,
        usdtBalance: fc.usdtBalance,
        country: fc.country,
        isOnline: fc.isOnline,
        createdAt: fc.createdAt,
        assignedUsersCount: fcUsersCount[0]?.count ?? 0,
      } : undefined,
    };
  }));

  res.json(result);
});

router.post("/assignments", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateAssignmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation error", message: parsed.error.message });
    return;
  }

  const { userId, foreignClientId } = parsed.data;

  const existing = await db.select({ count: count() }).from(assignmentsTable)
    .where(and(eq(assignmentsTable.userId, userId), eq(assignmentsTable.foreignClientId, foreignClientId)));

  if ((existing[0]?.count ?? 0) > 0) {
    res.status(400).json({ error: "Already assigned", message: "This client is already assigned to this user" });
    return;
  }

  const userClientsCount = await db.select({ count: count() }).from(assignmentsTable)
    .where(eq(assignmentsTable.userId, userId));

  if ((userClientsCount[0]?.count ?? 0) >= 5) {
    res.status(400).json({ error: "Limit reached", message: "User already has the maximum of 5 assigned foreign clients" });
    return;
  }

  const [assignment] = await db.insert(assignmentsTable).values({
    userId,
    foreignClientId,
  }).returning();

  const [room] = await db.insert(chatRoomsTable).values({
    assignmentId: assignment.id,
  }).returning();

  await db.update(assignmentsTable)
    .set({ chatRoomId: room.id })
    .where(eq(assignmentsTable.id, assignment.id));

  await db.insert(notificationsTable).values({
    userId,
    type: "client_assigned",
    message: "A new international client has been assigned to you. You can now start chatting!",
  });

  const [u] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  const [fc] = await db.select().from(usersTable).where(eq(usersTable.id, foreignClientId));

  const now = new Date();
  const [activeContract] = await db.select().from(contractsTable)
    .where(and(eq(contractsTable.userId, userId), eq(contractsTable.isActive, true), gt(contractsTable.expiresAt, now)));

  const fcUsersCount = await db.select({ count: count() }).from(assignmentsTable).where(eq(assignmentsTable.foreignClientId, foreignClientId));
  const uClientsCount = await db.select({ count: count() }).from(assignmentsTable).where(eq(assignmentsTable.userId, userId));

  res.status(201).json({
    id: assignment.id,
    userId: assignment.userId,
    foreignClientId: assignment.foreignClientId,
    assignedAt: assignment.assignedAt,
    chatRoomId: room.id,
    user: u ? {
      id: u.id,
      username: u.username,
      email: u.email,
      phone: u.phone,
      kshBalance: u.kshBalance,
      usdtBalance: u.usdtBalance,
      isBanned: u.isBanned,
      createdAt: u.createdAt,
      assignedClientsCount: uClientsCount[0]?.count ?? 0,
      hasActiveContract: !!activeContract,
    } : undefined,
    foreignClient: fc ? {
      id: fc.id,
      username: fc.username,
      usdtBalance: fc.usdtBalance,
      country: fc.country,
      isOnline: fc.isOnline,
      createdAt: fc.createdAt,
      assignedUsersCount: fcUsersCount[0]?.count ?? 0,
    } : undefined,
  });
});

router.delete("/assignments/:assignmentId", requireAdmin, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.assignmentId) ? req.params.assignmentId[0] : req.params.assignmentId;
  const assignmentId = parseInt(rawId, 10);

  const params = DeleteAssignmentParams.safeParse({ assignmentId });
  if (!params.success) {
    res.status(400).json({ error: "Invalid assignment ID" });
    return;
  }

  const [assignment] = await db.delete(assignmentsTable)
    .where(eq(assignmentsTable.id, assignmentId))
    .returning();

  if (!assignment) {
    res.status(404).json({ error: "Assignment not found" });
    return;
  }

  if (assignment.chatRoomId) {
    await db.delete(chatRoomsTable).where(eq(chatRoomsTable.id, assignment.chatRoomId));
  }

  res.json({ message: "Assignment removed" });
});

export default router;
