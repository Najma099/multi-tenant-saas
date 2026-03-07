import { Response } from "express";
import crypto from "crypto";
import { asyncHandler } from "../core/asyncHandler";
import { ProtectedRequest } from "../types/app-requests";
import { createWorkspaceInvite } from "../database/repository/workspaceInvite";
import { getWorkpsaceByWorkspaceId } from "../database/repository/workspace.repo";
import { sendWorkspaceInviteEmail } from "../services/email.service";
import { BadRequestError } from "../core/ApiError";
import { RoleType } from "@prisma/client";

export const sendInvite = asyncHandler(
  async (req: ProtectedRequest, res: Response) => {
    const { email, role } = req.body;
    const workspaceId = Number(req.workspaceId);

    if (!email || !role) {
      throw new BadRequestError("Email and role are required");
    }

    const workspace = await getWorkpsaceByWorkspaceId(workspaceId);
    if (!workspace) {
      throw new BadRequestError("Workspace not found");
    }

    const token = crypto.randomBytes(32).toString("hex");

    const expiresAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    );

    await createWorkspaceInvite(
      workspaceId,
      email,
      role as RoleType,
      req.user.id,
      token,
      expiresAt
    );

    const inviteLink = `${process.env.ORIGIN_URL}/invite/${token}`;

    await sendWorkspaceInviteEmail(
      email,
      inviteLink,
      workspace.name
    );

    res.status(200).json({
      message: "Invite sent successfully",
    });
  }
);
