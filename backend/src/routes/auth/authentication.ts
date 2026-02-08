import { Router } from 'express';
import { asyncHandler } from '../../core/asyncHandler';
import { AuthFailureError, AccessTokenError } from '../../core/ApiError';
import JWT, { AccessTokenPayload } from '../../core/jwtUtils';
import { getAccessToken, validateAccessToken } from '../../core/authUtils';
import * as UserRepo from '../../database/repository/user.repo';
import * as KeystoreRepo from '../../database/repository/keystore.repo';
import { TokenExpiredError } from 'jsonwebtoken';
import { ProtectedRequest } from '../../types/app-requests';
import { AuthHeaderSchema } from './schema';
import { validateRequest } from '../../middleware/validateRequest';

const router = Router();

export default router.use(
  validateRequest(AuthHeaderSchema, 'headers'),
  asyncHandler(async (req: ProtectedRequest, _res, next) => {
    const accessToken = getAccessToken(req);

    try {
      const payload = await JWT.validate(accessToken);
      validateAccessToken(payload as AccessTokenPayload);
      
      const userId = Number(payload.sub);
      if (isNaN(userId)) {
        throw new AuthFailureError('Invalid user id in token');
      }
      
      const user = await UserRepo.findById(userId);
      if (!user) {
        throw new AuthFailureError('User not registered');
      }
     
      const keystore = await KeystoreRepo.find(
        user.id,
        payload.prm,
      );

      if (!keystore) {
        throw new AuthFailureError('Invalid access token');
      }

      req.user = user;
      req.keystore = keystore;
      return next();
    } catch (e) {
      if (e instanceof TokenExpiredError) {
        throw new AccessTokenError('Access token expired');
      }
      throw e;
    }
  }),
);
