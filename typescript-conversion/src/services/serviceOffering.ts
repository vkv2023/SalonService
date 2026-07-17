import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { prisma } from "../shared/prisma.js";
import { requireAuth, requireRole } from "../shared/auth.js";
import type { AuthedRequest } from "../shared/auth.js";

export const serviceOfferingRouter = Router();

const serviceSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  image: z.string().optional().nullable(),
  price: z.number().int().nonnegative(),
  duration: z.number().int().positive(),
  categoryId: z.number().int().positive(),
  salonId: z.number().int().positive()
});

serviceOfferingRouter.get("/api/service_offering/salon/:salonId", async (req: Request, res: Response) => {
  const salonId = Number(req.params.salonId);
  const categoryId = req.query.categoryId ? Number(req.query.categoryId) : undefined;

  const items = await prisma.serviceOffering.findMany({
    where: {
      salonId,
      ...(categoryId ? { categoryId } : {})
    }
  });

  res.json(items);
});

serviceOfferingRouter.get("/api/service_offering/:serviceId", async (req: Request, res: Response) => {
  const serviceId = Number(req.params.serviceId);
  const item = await prisma.serviceOffering.findUnique({ where: { id: serviceId } });
  if (!item) {
    return res.status(404).json({ message: `Service doesn't exist with id:${serviceId}` });
  }
  res.json(item);
});

serviceOfferingRouter.get("/api/service_offering/list/:serviceIds", async (req: Request, res: Response) => {
  const serviceIds = String(req.params.serviceIds)
    .split(",")
    .map((id) => Number(id))
    .filter((id) => Number.isFinite(id));

  const items = await prisma.serviceOffering.findMany({ where: { id: { in: serviceIds } } });
  res.json(items);
});

serviceOfferingRouter.post(
  "/api/service-offering/salon-owner",
  requireAuth,
  requireRole(["SALON_OWNER", "ADMIN"]),
  async (req: AuthedRequest, res: Response) => {
    const parsed = serviceSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid service payload" });
    }

    const created = await prisma.serviceOffering.create({ data: parsed.data });
    res.status(201).json(created);
  }
);

serviceOfferingRouter.post(
  "/api/service-offering/salon-owner/:id",
  requireAuth,
  requireRole(["SALON_OWNER", "ADMIN"]),
  async (req: AuthedRequest, res: Response) => {
    const id = Number(req.params.id);
    const parsed = serviceSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid service payload" });
    }

    const existing = await prisma.serviceOffering.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: `Service doesn't exist with id:${id}` });
    }

    const updated = await prisma.serviceOffering.update({ where: { id }, data: parsed.data });
    res.json(updated);
  }
);
