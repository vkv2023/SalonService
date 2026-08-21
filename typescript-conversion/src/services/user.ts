import { Router, type Response } from "express";
import { z } from "zod";
import { prisma } from "../shared/prisma.js";
import { requireAuth, requireRole, verifyClerkTokenFromRequest } from "../shared/auth.js";
import type { AuthedRequest } from "../shared/auth.js";

export const userRouter = Router();

const roleEnum = z.enum(["CUSTOMER", "ADMIN", "SALON_OWNER"]);
const approvalStatusEnum = z.enum(["PENDING", "APPROVED", "REJECTED"]);

const userSchema = z.object({
  fullName: z.string().optional(),
  username: z.string().min(1),
  fname: z.string().min(1),
  lname: z.string().optional(),
  email: z.string().email(),
  phone: z.string().optional(),
  role: roleEnum,
  approvalStatus: approvalStatusEnum.optional(),
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

const authMode = (process.env.AUTH_MODE ?? "clerk").toLowerCase();

function parseLegacyAuth(req: AuthedRequest): { userId: number; role: z.infer<typeof roleEnum> } | null {
  const userId = Number(req.header("x-user-id"));
  const roleHeader = req.header("x-user-role");

  if (!Number.isFinite(userId) || !roleHeader) {
    return null;
  }

  const role = roleHeader.toUpperCase();
  if (!roleEnum.safeParse(role).success) {
    return null;
  }

  return {
    userId,
    role: role as z.infer<typeof roleEnum>
  };
}

async function resolveAuthContext(req: AuthedRequest): Promise<
  | { mode: "legacy"; userId: number; role: z.infer<typeof roleEnum> }
  | { mode: "clerk"; clerkId: string; email?: string }
  | null
> {
  if (authMode === "legacy" || authMode === "hybrid") {
    const legacyAuth = parseLegacyAuth(req);
    if (legacyAuth) {
      return {
        mode: "legacy",
        userId: legacyAuth.userId,
        role: legacyAuth.role
      };
    }

    if (authMode === "legacy") {
      return null;
    }
  }

  const clerkSession = await verifyClerkTokenFromRequest(req).catch(() => null);
  if (!clerkSession) {
    return null;
  }

  return {
    mode: "clerk",
    clerkId: clerkSession.clerkId,
    email: clerkSession.email
  };
}

userRouter.post("/api/auth/signup", async (req: AuthedRequest, res: Response) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid signup payload" });
  }

  const authContext = await resolveAuthContext(req);
  if (!authContext) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const fullName = `${parsed.data.firstName} ${parsed.data.lastName}`;
  const nextRole = parsed.data.role;
  const nextApprovalStatus = nextRole === "SALON_OWNER" ? "PENDING" : "APPROVED";

  let user =
    authContext.mode === "clerk"
      ? await prisma.user.findUnique({ where: { clerkId: authContext.clerkId } })
      : await prisma.user.findUnique({ where: { id: authContext.userId } });

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
        clerkId: authContext.mode === "clerk" ? authContext.clerkId : user.clerkId,
        fullName,
        username: parsed.data.username,
        fname: parsed.data.firstName,
        lname: parsed.data.lastName,
        email: parsed.data.email,
        phone: parsed.data.phone,
        role: nextRole,
        approvalStatus: nextApprovalStatus,
        password: null
      }
    });
  } else {
    user = await prisma.user.create({
      data: {
        clerkId: authContext.mode === "clerk" ? authContext.clerkId : undefined,
        username: parsed.data.username,
        email: parsed.data.email,
        role: nextRole,
        approvalStatus: nextApprovalStatus,
        fullName,
        fname: parsed.data.firstName,
        lname: parsed.data.lastName,
        phone: parsed.data.phone,
        password: null
      }
    });
  }

  res.json({
    message:
      nextRole === "SALON_OWNER"
        ? "Owner registration submitted for admin approval."
        : "User registered Successfully!",
    userRole: user.role,
    approvalStatus: user.approvalStatus,
    userId: user.id,
    clerkId: user.clerkId
  });
});

userRouter.post("/api/auth/login", async (req: AuthedRequest, res: Response) => {
  const authContext = await resolveAuthContext(req);
  if (!authContext) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  let user =
    authContext.mode === "clerk"
      ? await prisma.user.findUnique({ where: { clerkId: authContext.clerkId } })
      : await prisma.user.findUnique({ where: { id: authContext.userId } });

  if (!user && authContext.mode === "clerk" && authContext.email) {
    const existingByEmail = await prisma.user.findUnique({ where: { email: authContext.email } });
    if (existingByEmail) {
      user = await prisma.user.update({
        where: { id: existingByEmail.id },
        data: {
          clerkId: authContext.clerkId,
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

  if (user.role === "SALON_OWNER" && user.approvalStatus !== "APPROVED") {
    return res.status(403).json({
      message: "Your salon owner account is pending admin approval."
    });
  }

  res.json({
    message: "Login Success!",
    userRole: user.role,
    approvalStatus: user.approvalStatus,
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

userRouter.get(
  "/api/admin/owner-requests",
  requireAuth,
  requireRole(["ADMIN"]),
  async (_req: AuthedRequest, res: Response) => {
    const pendingOwners = await prisma.user.findMany({
      where: {
        role: "SALON_OWNER",
        approvalStatus: "PENDING"
      }
    });

    res.json(pendingOwners);
  }
);

userRouter.patch(
  "/api/admin/users/:id/approve",
  requireAuth,
  requireRole(["ADMIN"]),
  async (req: AuthedRequest, res: Response) => {
    const id = Number(req.params.id);
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: `User not found with id:${id}` });
    }
    if (existing.role !== "SALON_OWNER") {
      return res.status(400).json({ message: "Only salon owner accounts can be approved." });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { approvalStatus: "APPROVED" }
    });

    res.json({ message: "Owner approved successfully.", user });
  }
);

userRouter.patch(
  "/api/admin/users/:id/reject",
  requireAuth,
  requireRole(["ADMIN"]),
  async (req: AuthedRequest, res: Response) => {
    const id = Number(req.params.id);
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: `User not found with id:${id}` });
    }
    if (existing.role !== "SALON_OWNER") {
      return res.status(400).json({ message: "Only salon owner accounts can be rejected." });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { approvalStatus: "REJECTED" }
    });

    res.json({ message: "Owner rejected successfully.", user });
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
