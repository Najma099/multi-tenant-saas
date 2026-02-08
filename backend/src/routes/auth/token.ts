import { Router } from 'express';
import { asyncHandler } from '../../core/asyncHandler';
import { AuthFailureError } from '../../core/ApiError';
import { SuccessResponse } from '../../core/ApiResponse';

import JWT from '../../core/jwtUtils';
import { createTokens } from '../../core/authUtils';
import * as KeystoreRepo from '../../database/repository/keystore.repo';
import { RefreshTokenPayload } from '../../core/jwtUtils';
import { getAccessToken, validateRefreshToken } from "../../core/authUtils";
import * as UserRepo from "../../database/repository/user.repo";

const router = Router();

router.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const accessToken = getAccessToken(req);
    const { refreshToken } = req.body;
  
    const accessTokenPayload = await JWT.decode(accessToken);
    validateRefreshToken(accessTokenPayload as RefreshTokenPayload);

    if (!accessTokenPayload.sub)
      throw new AuthFailureError('Invalid token');

    const userId = parseInt(accessTokenPayload.sub, 10);
    if (isNaN(userId)) throw new AuthFailureError('Invalid user ID in token');

    const user = await UserRepo.findById(userId);


    if (!refreshToken) {
      throw new AuthFailureError('Refresh token missing');
    }
  
    const refreshTokenpayload = (await JWT.validate(refreshToken)) as RefreshTokenPayload;

    const keystore = await KeystoreRepo.find(
      userId,
      accessTokenPayload.prm, 
      refreshTokenpayload.prm,
    );

    console.log(keystore);

    if (!keystore) {
      throw new AuthFailureError('Refresh token revoked');
    }
 
    await KeystoreRepo.remove(keystore.id);
    const tokens = await createTokens(userId);
    console.log(tokens);

    new SuccessResponse('Token refreshed', tokens).send(res);
  }),
);

export default router;
