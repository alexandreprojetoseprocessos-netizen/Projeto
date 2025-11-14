import { Router } from "express";
import { prisma } from "@gestao/database";
import { authMiddleware } from "../middleware/auth";

export const meRouter = Router();

meRouter.use(authMiddleware);

meRouter.get("/", async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "User not authenticated" });
  }

  const memberships = await prisma.organizationMembership.findMany({
    where: { userId: req.user.id },
    include: {
      organization: true
    }
  });

  return res.json({
    user: req.user,
    organizations: memberships.map((membership) => ({
      id: membership.organizationId,
      name: membership.organization.name,
      role: membership.role
    }))
  });
});
