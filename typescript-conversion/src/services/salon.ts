import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { prisma } from "../shared/prisma.js";
import { requireApprovedOwner, requireAuth, requireRole, type AuthedRequest } from "../shared/auth.js";

export const salonRouter = Router();

const salonSchema = z.object({
  name: z.string().min(1),
  images: z.array(z.string()).optional(),
  address: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email(),
  city: z.string().min(1),
  openTime: z.string().min(1),
  closeTime: z.string().min(1)
});

salonRouter.post(
  "/api/salons",
  requireAuth,
  requireRole(["SALON_OWNER", "ADMIN"]),
  requireApprovedOwner,
  async (req: AuthedRequest, res: Response) => {
  const parsed = salonSchema.safeParse(req.body);
  if (!parsed.success || !req.authUser) {
    return res.status(400).json({ message: "Invalid salon payload" });
  }

  const salon = await prisma.salon.create({
    data: {
      ...parsed.data,
      ownerId: req.authUser.userId,
      images: parsed.data.images ?? []
    }
  });
  res.status(201).json(salon);
  }
);

salonRouter.get("/api/salons", async (_req: Request, res: Response) => {
  const salons = await prisma.salon.findMany();
  res.json(salons);
});

salonRouter.patch(
  "/api/salons/:salonId",
  requireAuth,
  requireRole(["SALON_OWNER", "ADMIN"]),
  requireApprovedOwner,
  async (req: AuthedRequest, res: Response) => {
  const salonId = Number(req.params.salonId);
  const existing = await prisma.salon.findUnique({ where: { id: salonId } });
  if (!existing) {
    return res.status(404).json({ message: "Salon doesn't exist!" });
  }
  if (!req.authUser || existing.ownerId !== req.authUser.userId) {
    return res.status(403).json({ message: "Salon doesn't exist!" });
  }

  const parsed = salonSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid salon payload" });
  }

  const updated = await prisma.salon.update({ where: { id: salonId }, data: parsed.data });
  res.json(updated);
  }
);

salonRouter.get("/api/salons/:salonId", async (req: Request, res: Response) => {
  const id = Number(req.params.salonId);
  const salon = await prisma.salon.findUnique({ where: { id } });
  if (!salon) {
    return res.status(404).json({ message: `Salon doesn't exist with id ${id}` });
  }
  res.json(salon);
});

salonRouter.get("/api/salons/search", async (req: Request, res: Response) => {
  const cityName = String(req.query.cityName ?? "");
  const salons = await prisma.salon.findMany({
    where: {
      OR: [
        { city: { contains: cityName, mode: "insensitive" } },
        { name: { contains: cityName, mode: "insensitive" } },
        { address: { contains: cityName, mode: "insensitive" } }
      ]
    }
  });
  res.json(salons);
});

salonRouter.get("/api/salons/owner/:ownerId", async (req: Request, res: Response) => {
  const ownerId = Number(req.params.ownerId);
  const salon = await prisma.salon.findFirst({ where: { ownerId } });
  if (!salon) {
    return res.status(404).json({ message: `Salon doesn't exist with id ${ownerId}` });
  }
  res.json(salon);
});
