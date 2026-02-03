import { Router } from 'express';
import { asyncHandler } from '../../core/asyncHandler';
import { AuthFailureError } from '../../core/ApiError';
import { SuccessResponse } from '../../core/ApiResponse';

import JWT from '../../core/jwtUtils';
import { createTokens } from '../../core/authUtils';

import * as KeystoreRepo from '../../database/repository/keystoreRepo';
import { RefreshTokenPayload } from '../../core/jwtUtils';

const router = Router();

router.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AuthFailureError('Refresh token missing');
    }
  
    const payload = (await JWT.validate(refreshToken)) as RefreshTokenPayload;

    const userId = Number(payload.sub);
    if (isNaN(userId)) {
      throw new AuthFailureError('Invalid refresh token');
    }

    const keystore = await KeystoreRepo.find(
      userId,
      payload.prm, 
    );

    if (!keystore) {
      throw new AuthFailureError('Refresh token revoked');
    }
 
    await KeystoreRepo.remove(keystore.id);
    const tokens = await createTokens(userId);

    new SuccessResponse('Token refreshed', tokens).send(res);
  }),
);

export default router;
