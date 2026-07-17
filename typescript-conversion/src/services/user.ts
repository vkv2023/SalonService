import { Router, type Response } from "express";
import { z } from "zod";
import { prisma } from "../shared/prisma.js";
import { requireAuth, requireRole, verifyClerkTokenFromRequest } from "../shared/auth.js";
import type { AuthedRequest } from "../shared/auth.js";

export const userRouter = Router();

const roleEnum = z.enum(["CUSTOMER", "ADMIN", "SALON_OWNER"]);

const userSchema = z.object({
  fullName: z.string().optional(),
  username: z.string().min(1),
  fname: z.string().min(1),
  lname: z.string().optional(),
  email: z.string().email(),
  phone: z.string().optional(),
  role: roleEnum,
  password: z.string().optional(),
  clerkId: z.string().optional()
});

const signupSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  username: z.string().min(1),
  role: roleEnum.default("CUSTOMER"),
  phone: z.string().optional()
});

userRouter.post("/api/auth/signup", async (req: AuthedRequest, res: Response) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid signup payload" });
  }

  const clerkSession = await verifyClerkTokenFromRequest(req).catch(() => null);
  if (!clerkSession) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const fullName = `${parsed.data.firstName} ${parsed.data.lastName}`;

  let user = await prisma.user.findUnique({ where: { clerkId: clerkSession.clerkId } });

  if (!user) {
    user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  }

  if (!user) {
    user = await prisma.user.findUnique({ where: { username: parsed.data.username } });
  }

  if (user) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        clerkId: user.clerkId ?? clerkSession.clerkId,
        fullName,
        username: parsed.data.username,
        fname: parsed.data.firstName,
        lname: parsed.data.lastName,
        email: parsed.data.email,
        phone: parsed.data.phone,
        role: parsed.data.role,
        password: null
      }
    });
  } else {
    user = await prisma.user.create({
      data: {
        clerkId: clerkSession.clerkId,
        username: parsed.data.username,
        email: parsed.data.email,
        role: parsed.data.role,
        fullName,
        fname: parsed.data.firstName,
        lname: parsed.data.lastName,
        phone: parsed.data.phone,
        password: null
      }
    });
  }

  res.json({
    message: "User registered Successfully!",
    userRole: user.role,
    userId: user.id,
    clerkId: user.clerkId
  });
});

userRouter.post("/api/auth/login", async (req: AuthedRequest, res: Response) => {
  const clerkSession = await verifyClerkTokenFromRequest(req).catch(() => null);
  if (!clerkSession) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  let user = await prisma.user.findUnique({ where: { clerkId: clerkSession.clerkId } });

  if (!user && clerkSession.email) {
    const existingByEmail = await prisma.user.findUnique({ where: { email: clerkSession.email } });
    if (existingByEmail) {
      user = await prisma.user.update({
        where: { id: existingByEmail.id },
        data: {
          clerkId: clerkSession.clerkId,
          password: null
        }
      });
    }
  }

  if (!user) {
    return res.status(404).json({
      message: "User profile not found. Complete signup first."
    });
  }

  res.json({
    message: "Login Success!",
    userRole: user.role,
    userId: user.id,
    clerkId: user.clerkId
  });
});

userRouter.get(
  "/api/auth/access-token/refresh-token/:refreshToken",
  async (_req: AuthedRequest, res: Response) => {
  res.status(410).json({
    message: "Refresh tokens are managed by Clerk SDK. This endpoint is deprecated."
  });
  }
);

userRouter.post(
  "/api/users",
  requireAuth,
  requireRole(["ADMIN"]),
  async (req: AuthedRequest, res: Response) => {
  const parsed = userSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid user payload" });
  }
  const created = await prisma.user.create({ data: parsed.data });
  res.status(201).json(created);
  }
);

userRouter.get(
  "/api/users",
  requireAuth,
  requireRole(["ADMIN"]),
  async (_req: AuthedRequest, res: Response) => {
  const users = await prisma.user.findMany();
  res.json(users);
  }
);

userRouter.get("/api/users/:userid", requireAuth, async (req: AuthedRequest, res: Response) => {
  const id = Number(req.params.userid);
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return res.status(404).json({ message: "user not found.." });
  }
  res.json(user);
});

userRouter.put("/api/users/:id", requireAuth, async (req: AuthedRequest, res: Response) => {
  const id = Number(req.params.id);
  const parsed = userSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid user payload" });
  }

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    return res.status(404).json({ message: `user with ${id} is not available` });
  }

  const updated = await prisma.user.update({ where: { id }, data: parsed.data });
  res.status(202).json(updated);
});

userRouter.delete(
  "/api/users/:userId",
  requireAuth,
  requireRole(["ADMIN"]),
  async (req: AuthedRequest, res: Response) => {
  const id = Number(req.params.userId);
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    return res.status(404).json({ message: `User not available with id:${id}` });
  }

  await prisma.user.delete({ where: { id } });
  res.status(202).json({ message: "User Deleted" });
  }
);
