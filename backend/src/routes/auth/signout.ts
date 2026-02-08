import { Router } from 'express';
import { asyncHandler } from '../../core/asyncHandler';
import { AuthFailureError } from '../../core/ApiError';
import JWT from '../../core/jwtUtils';
import * as KeystoreRepo from '../../database/repository/keystore.repo';
import { getAccessToken } from '../../core/authUtils';
import { SuccessMsgResponse } from '../../core/ApiResponse';
import { ProtectedRequest } from '../../types/app-requests';

const router = Router();

router.post(
  '/',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const accessToken = getAccessToken(req);

    if (!accessToken) throw new AuthFailureError('Access token missing');
    const payload = await JWT.validate(accessToken);

    const userId = Number(payload.sub);
    const primaryKey = payload.prm;

    if (isNaN(userId)) throw new AuthFailureError('Invalid token');

    const keystore = await KeystoreRepo.find(userId, primaryKey);
    if (!keystore) throw new AuthFailureError('Session already invalidated');

    await KeystoreRepo.remove(keystore.id);

    new SuccessMsgResponse('Signed out successfully').send(res);
  }),
);

export default router;
