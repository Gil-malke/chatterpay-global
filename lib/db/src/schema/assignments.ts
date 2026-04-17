import { pgTable, serial, integer, timestamp, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const assignmentsTable = pgTable("assignments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  foreignClientId: integer("foreign_client_id").notNull().references(() => usersTable.id),
  chatRoomId: integer("chat_room_id"),
  assignedAt: timestamp("assigned_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniquePair: unique().on(t.userId, t.foreignClientId),
}));

export const insertAssignmentSchema = createInsertSchema(assignmentsTable).omit({ id: true, assignedAt: true });
export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;
export type Assignment = typeof assignmentsTable.$inferSelect;
