import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { signToken, requireAuth } from "../lib/auth";
import { RegisterBody, LoginBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation error", message: parsed.error.message });
    return;
  }

  const { username, email, password, phone } = parsed.data;

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.username, username));
  if (existing) {
    res.status(400).json({ error: "Conflict", message: "Username already taken" });
    return;
  }

  if (email) {
    const [existingEmail] = await db.select().from(usersTable).where(eq(usersTable.email, email));
    if (existingEmail) {
      res.status(400).json({ error: "Conflict", message: "Email already registered" });
      return;
    }
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const [user] = await db.insert(usersTable).values({
    username,
    email,
    passwordHash,
    phone,
    role: "user",
    kshBalance: 0,
    usdtBalance: 0,
  }).returning();

  const token = signToken(user.id);

  res.status(201).json({
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      kshBalance: user.kshBalance,
      usdtBalance: user.usdtBalance,
      isBanned: user.isBanned,
    },
  });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation error", message: parsed.error.message });
    return;
  }

  const { username, password } = parsed.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.username, username));
  if (!user) {
    res.status(401).json({ error: "Unauthorized", message: "Invalid username or password" });
    return;
  }

  if (user.isBanned) {
    res.status(403).json({ error: "Forbidden", message: "Your account has been banned" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Unauthorized", message: "Invalid username or password" });
    return;
  }

  await db.update(usersTable).set({ isOnline: true }).where(eq(usersTable.id, user.id));

  const token = signToken(user.id);

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      kshBalance: user.kshBalance,
      usdtBalance: user.usdtBalance,
      isBanned: user.isBanned,
    },
  });
});

router.post("/auth/logout", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;
  await db.update(usersTable).set({ isOnline: false }).where(eq(usersTable.id, user.id));
  res.json({ message: "Logged out successfully" });
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;
  res.json({
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    kshBalance: user.kshBalance,
    usdtBalance: user.usdtBalance,
    isBanned: user.isBanned,
  });
});

export default router;
