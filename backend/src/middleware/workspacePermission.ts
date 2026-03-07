import { BadRequestError, ForbiddenError, NotFoundError } from "../core/ApiError";
import { asyncHandler } from "../core/asyncHandler";
import { prisma } from "../database";
import { ProtectedRequest } from "../types/app-requests";

export const isWorkspaceMember = asyncHandler(async (req: ProtectedRequest, res, next) => {
    const workspaceId = Number(req.params.workspaceId);
    const userId = req.user.id;

    if (isNaN(workspaceId)) {
        throw new BadRequestError("Invalid Workspace ID in request");
    }

    // const workspace = await prisma.workspace.findUnique({
    //     where: { id: workspaceId }
    // });

    // if (!workspace) {
    //     throw new NotFoundError("This workspace no longer exists");
    // }

    const membership = await prisma.workspaceMember.findUnique({
        where: {
            workspaceId_userId: {
                workspaceId: workspaceId,
                userId
            }
        }
    });

    if (!membership) throw new ForbiddenError("You do not belong to this workspace");
    req.workspaceId = workspaceId;
    req.userRole = membership.role;
    next();
})