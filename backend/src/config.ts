import dotenv from 'dotenv'
dotenv.config();

export const originUrl = process.env.ORIGIN_URL;
export const isProduction = process.env.NODE_ENV === 'production';
export const port = process.env.PORT;

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
