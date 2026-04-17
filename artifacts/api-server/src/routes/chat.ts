import { Router, type IRouter } from "express";
import { db, messagesTable, chatRoomsTable, assignmentsTable, usersTable, contractsTable, notificationsTable } from "@workspace/db";
import { eq, and, gt, desc } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { SendMessageBody } from "@workspace/api-zod";

const router: IRouter = Router();

const EARNING_PER_MESSAGE_USDT = 0.1;

router.get("/chat/rooms", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;

  let assignments;
  if (user.role === "foreign_client") {
    assignments = await db.select().from(assignmentsTable)
      .where(eq(assignmentsTable.foreignClientId, user.id));
  } else {
    assignments = await db.select().from(assignmentsTable)
      .where(eq(assignmentsTable.userId, user.id));
  }

  const result = await Promise.all(assignments.map(async (a) => {
    if (!a.chatRoomId) return null;

    const [room] = await db.select().from(chatRoomsTable).where(eq(chatRoomsTable.id, a.chatRoomId));
    if (!room) return null;

    const participantId = user.role === "foreign_client" ? a.userId : a.foreignClientId;
    const [participant] = await db.select().from(usersTable).where(eq(usersTable.id, participantId));

    return {
      id: room.id,
      assignmentId: a.id,
      lastMessage: room.lastMessage,
      lastMessageAt: room.lastMessageAt,
      unreadCount: 0,
      participant: participant ? {
        id: participant.id,
        username: participant.username,
        isOnline: participant.isOnline,
      } : { id: participantId, username: "Unknown", isOnline: false },
    };
  }));

  res.json(result.filter(Boolean));
});

router.get("/chat/rooms/:roomId/messages", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const rawId = Array.isArray(req.params.roomId) ? req.params.roomId[0] : req.params.roomId;
  const roomId = parseInt(rawId, 10);

  const [room] = await db.select().from(chatRoomsTable).where(eq(chatRoomsTable.id, roomId));
  if (!room) {
    res.status(404).json({ error: "Chat room not found" });
    return;
  }

  const [assignment] = await db.select().from(assignmentsTable).where(eq(assignmentsTable.id, room.assignmentId));
  if (!assignment) {
    res.status(404).json({ error: "Assignment not found" });
    return;
  }

  if (user.role !== "admin" && assignment.userId !== user.id && assignment.foreignClientId !== user.id) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  const messages = await db.select().from(messagesTable)
    .where(eq(messagesTable.roomId, roomId))
    .orderBy(messagesTable.createdAt);

  res.json(messages);
});

router.post("/chat/rooms/:roomId/messages", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const rawId = Array.isArray(req.params.roomId) ? req.params.roomId[0] : req.params.roomId;
  const roomId = parseInt(rawId, 10);

  const parsed = SendMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation error", message: parsed.error.message });
    return;
  }

  const [room] = await db.select().from(chatRoomsTable).where(eq(chatRoomsTable.id, roomId));
  if (!room) {
    res.status(404).json({ error: "Chat room not found" });
    return;
  }

  const [assignment] = await db.select().from(assignmentsTable).where(eq(assignmentsTable.id, room.assignmentId));
  if (!assignment) {
    res.status(404).json({ error: "Assignment not found" });
    return;
  }

  if (assignment.userId !== user.id && assignment.foreignClientId !== user.id) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  if (user.role === "user") {
    const now = new Date();
    const [activeContract] = await db.select().from(contractsTable)
      .where(and(
        eq(contractsTable.userId, user.id),
        eq(contractsTable.isActive, true),
        gt(contractsTable.expiresAt, now)
      ));

    if (!activeContract) {
      res.status(403).json({ error: "No active contract", message: "You need an active contract to chat" });
      return;
    }
  }

  const [message] = await db.insert(messagesTable).values({
    roomId,
    senderId: user.id,
    senderRole: user.role as "user" | "foreign_client",
    senderUsername: user.username,
    content: parsed.data.content,
  }).returning();

  await db.update(chatRoomsTable).set({
    lastMessage: parsed.data.content,
    lastMessageAt: new Date(),
  }).where(eq(chatRoomsTable.id, roomId));

  if (user.role === "user") {
    const currentUser = await db.select().from(usersTable).where(eq(usersTable.id, user.id));
    if (currentUser[0]) {
      await db.update(usersTable)
        .set({ usdtBalance: currentUser[0].usdtBalance + EARNING_PER_MESSAGE_USDT })
        .where(eq(usersTable.id, user.id));
    }
  }

  res.status(201).json(message);
});

export default router;
