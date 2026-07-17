import { Router, type Response } from "express";
import { z } from "zod";
import { prisma } from "../shared/prisma.js";
import { requireAuth, requireRole, type AuthedRequest } from "../shared/auth.js";

export const categoryRouter = Router();

categoryRouter.get("/api/categories/salon/:id", async (req: AuthedRequest, res: Response) => {
  const salonId = Number(req.params.id);
  const categories = await prisma.category.findMany({ where: { salonId } });
  res.json(categories);
});

categoryRouter.get("/api/categories/:id", async (req: AuthedRequest, res: Response) => {
  const id = Number(req.params.id);
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) {
    return res.status(404).json({ message: "Category is null" });
  }
  res.json(category);
});

const saveCategorySchema = z.object({
  name: z.string().min(1),
  image: z.string().optional().nullable(),
  salonId: z.number().int().positive()
});

categoryRouter.post(
  "/api/categories/salon-owner",
  requireAuth,
  requireRole(["SALON_OWNER", "ADMIN"]),
  async (req: AuthedRequest, res: Response) => {
    const parsed = saveCategorySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid category payload" });
    }

    const category = await prisma.category.create({ data: parsed.data });
    res.status(201).json(category);
  }
);

categoryRouter.delete(
  "/api/categories/salon-owner/:id",
  requireAuth,
  requireRole(["SALON_OWNER", "ADMIN"]),
  async (req: AuthedRequest, res: Response) => {
    const id = Number(req.params.id);
    const salonId = Number(req.query.salonId);

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: "Category is null" });
    }

    if (existing.salonId !== salonId) {
      return res.status(403).json({ message: "Permission denied to delete this repository.." });
    }

    await prisma.category.delete({ where: { id } });
    res.json({ message: "Category deleted" });
  }
);
