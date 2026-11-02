import { Router, type Response } from "express";
import * as z from "zod";
import { prisma } from "../prisma.js";
import { formatSuccess } from "../middleware/format-result.js";
import authenticate from "../middleware/authenticate.js";
import authorize from "../middleware/authorize.js";
import { createProfileInputSchema } from "../schemas/users.schema.js";
import type { RequestWithAuth } from "../types.js";

export const usersRouter = Router();

usersRouter.get(
  "/",
  authenticate,
  authorize("read:account"),
  async (request: RequestWithAuth, response: Response) => {
    const page = Number(request.query["page"]) || 1;
    const limit = Number(request.query["limit"]) || 10;

    const [total, accounts] = await Promise.all([
      prisma.account.count(),
      prisma.account.findMany({
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
          profile: {
            select: {
              bio: true,
              avatar: true,
            },
          },
        },
      }),
    ]);

    const meta = {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit) || 1,
    };

    formatSuccess(response, { accounts, meta }, "200");
  },
);

usersRouter.get(
  "/me",
  authenticate,
  async (request: RequestWithAuth, response: Response) => {
    const userId = request.user!.id;

    const user = await prisma.account.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        profile: true,
        products: true,
      },
    });

    if (!user) {
      throw new Error("Пользователь не найден");
    }

    formatSuccess(response, user, "200");
  },
);

usersRouter.post(
  "/:id/profile",
  authenticate,
  async (request: RequestWithAuth, response: Response) => {
    const targetUserId = Number(request.params["id"]);
    const currentUserId = request.user!.id;
    const role = request.user!.role;

    if (targetUserId !== currentUserId && role !== "moderator") {
      const error = new Error("Недостаточно прав");
      // @ts-expect-error
      error.code = "403";
      throw error;
    }

    const body = z.parse(createProfileInputSchema, request.body);

    const profile = await prisma.profile.upsert({
      where: { accountId: targetUserId },
      update: {
        bio: body.bio,
        avatar: body.avatar ?? null,
      },
      create: {
        accountId: targetUserId,
        bio: body.bio,
        avatar: body.avatar ?? null,
      },
    });

    formatSuccess(response, profile, "200");
  },
);
