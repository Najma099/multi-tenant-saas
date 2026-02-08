import { AuthFailureError, InternalError } from './ApiError';
import JWT, { AccessTokenPayload, RefreshTokenPayload } from './jwtUtils';
import { tokenInfo } from './../config';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import * as KeystoreRepo from '../database/repository/keystore.repo';

// Get access token from Authorization header only
export const getAccessToken = (req: { headers: { authorization?: string } }): string => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }
  throw new AuthFailureError('Access Token Missing');
};

// For now, refresh token is optional; can remove cookie checks
export const getRefreshedToken = (req: { body?: { refreshToken?: string } }): string => {
  if (req.body?.refreshToken) {
    return req.body.refreshToken;
  }
  throw new AuthFailureError('Refresh Token is missing');
};

// Validate access token payload
export const validateAccessToken = (payload: AccessTokenPayload): boolean => {
  if (
    !payload ||
    !payload.prm ||
    !payload.sub ||
    payload.iss !== tokenInfo.issuer ||
    payload.aud !== tokenInfo.audience ||
    !/^\d+$/.test(payload.sub)
  ) {
    throw new AuthFailureError('Invalid Access Token');
  }
  return true;
};

// Validate refresh token payload
export const validateRefreshToken = (payload: RefreshTokenPayload): boolean => {
  if (
    !payload ||
    !payload.prm ||
    !payload.sub ||
    payload.iss !== tokenInfo.issuer ||
    payload.aud !== tokenInfo.audience ||
    !/^\d+$/.test(payload.sub)
  ) {
    throw new AuthFailureError('Invalid Refresh Token');
  }
  return true;
};

// Create JWT tokens (access + refresh)
export const createTokens = async (userId: number) => {
  const accessTokenKey = crypto.randomBytes(64).toString('hex');
  const refreshTokenKey = crypto.randomBytes(64).toString('hex');

  await KeystoreRepo.create(userId, accessTokenKey, refreshTokenKey);

  const accessToken = await JWT.encode({
    ...new AccessTokenPayload(
      tokenInfo.issuer,
      tokenInfo.audience,
      userId,
      accessTokenKey,
      tokenInfo.accessTokenValidity
    )
  });

  const refreshToken = await JWT.encode({
    ...new RefreshTokenPayload(
      tokenInfo.issuer,
      tokenInfo.audience,
      userId,
      refreshTokenKey,
      tokenInfo.refreshTokenValidity
    )
  });

  return { accessToken, refreshToken };
};


// Verify password
export const isPasswordCorrect = async (userPassword: string, hashedPassword: string) => {
  return await bcrypt.compare(userPassword, hashedPassword);
};
