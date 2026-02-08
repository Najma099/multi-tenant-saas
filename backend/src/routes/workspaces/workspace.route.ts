import { Router } from 'express';
import authentication from '../auth/authentication';
import { asyncHandler } from '../../core/asyncHandler';
import { ProtectedRequest } from '../../types/app-requests';
import * as WorkspaceRepo from '../../database/repository/workspace.repo';
import { SuccessResponse } from '../../core/ApiResponse';
import { validateRequest } from '../../middleware/validateRequest';
import { CreateWorkspaceSchema } from './schema';
import { CreateWorkspaceRequest } from '../../types/workspace';
const router = Router();

router.get(
  '/',
  authentication,
  asyncHandler(async (req: ProtectedRequest, res) => {
    const userId = req.user.id;

    const workspaces =
      await WorkspaceRepo.getOrCreateDefaultWorkspace(userId);

    new SuccessResponse(
      'Workspaces fetched successfully',
      workspaces,
    ).send(res);
  }),
);


router.post(
    '/',
    authentication,
    validateRequest(CreateWorkspaceSchema),
    asyncHandler(async(req: ProtectedRequest, res) => {
        const userId = req.user.id;
        const { name } = req.body as CreateWorkspaceRequest;
        const workspace = await WorkspaceRepo.create(userId, name);
        new SuccessResponse(
            'Workspace created successfully',
            workspace
        ).send(res);
    })
)

export default router;
