import { Router, type IRouter } from "express";
import { db, notificationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { MarkNotificationReadParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/notifications", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const notifications = await db.select().from(notificationsTable)
    .where(eq(notificationsTable.userId, user.id))
    .orderBy(notificationsTable.createdAt);
  res.json(notifications);
});

router.post("/notifications/:notifId/read", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const rawId = Array.isArray(req.params.notifId) ? req.params.notifId[0] : req.params.notifId;
  const notifId = parseInt(rawId, 10);

  const params = MarkNotificationReadParams.safeParse({ notifId });
  if (!params.success) {
    res.status(400).json({ error: "Invalid notification ID" });
    return;
  }

  const [notification] = await db.update(notificationsTable)
    .set({ isRead: true })
    .where(eq(notificationsTable.id, notifId))
    .returning();

  if (!notification || notification.userId !== user.id) {
    res.status(404).json({ error: "Notification not found" });
    return;
  }

  res.json(notification);
});

export default router;
