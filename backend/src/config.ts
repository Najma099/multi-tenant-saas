import dotenv from 'dotenv'
import { CookieOptions } from 'express';

dotenv.config();

export const originalUrl = process.env.ORIGINAL_URL;
export const isProduction = process.env.NODE_ENV === 'production';

export const tokenInfo = {
  accessTokenValidity: parseInt(process.env.ACCESS_TOKEN_VALIDITY_SEC || '0'),
  refreshTokenValidity: parseInt(
      process.env.REFRESH_TOKEN_VALIDITY_SEC || '0',
  ),
  issuer: process.env.TOKEN_ISSUER || '',
  audience: process.env.TOKEN_AUDIENCE || '',
  jwtPrivateKey: process.env.JWT_PRIVATE_KEY || '',
  jwtPublicKey: process.env.JWT_PUBLIC_KEY || ''
};
